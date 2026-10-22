import { compensationRates, smcRates, colaHistory, champvaData, chapter35Data, chapter31Data, vaHealthcareData, fundingFeeData, dicData, additionalBenefits, stateBenefits } from './data/benefits-data.js';
import { stateTaxData } from './data/state-tax-data.js';

// --- DOM Elements ---
const currentRatingSelect = document.getElementById('current-rating');
const veteranAgeInput = document.getElementById('veteran-age');
const stateSelect = document.getElementById('state-select');
const isRetireeSelect = document.getElementById('is-retiree');
const maritalStatusSelect = document.getElementById('marital-status');
const numChildrenInput = document.getElementById('num-children');
const numCollegeChildrenInput = document.getElementById('num-college-children');
const dependentParentsSelect = document.getElementById('dependent-parents');
const homeValueInput = document.getElementById('home-value');
const ownsHomeSelect = document.getElementById('owns-home');
const vaLoanAmountInput = document.getElementById('va-loan-amount');
const hasStudentLoansSelect = document.getElementById('has-student-loans');
const studentLoanBalanceInput = document.getElementById('student-loan-balance');
const studentLoanWrapper = document.getElementById('student-loan-amount-wrapper');
const otherIncomeInput = document.getElementById('other-income');
const projectionSlider = document.getElementById('projection-years');
const projectionValueSpan = document.getElementById('projection-value');
const includeColaCheckbox = document.getElementById('include-cola');
const smcLevelSelect = document.getElementById('smc-level');
const smckCountSelect = document.getElementById('smck-count');
const smcWrapper = document.getElementById('smc-wrapper');
const smcDescription = document.getElementById('smc-description');

const totalValueCard = document.getElementById('total-value-card');
const totalValueNote = document.getElementById('total-value-note');
const champvaSection = document.getElementById('champva-section');
const champvaScenariosDiv = document.getElementById('champva-scenarios');
const champvaCustomDiv = document.getElementById('champva-custom');
const champvaDetailsDiv = document.getElementById('champva-details');
const ratingComparison = document.getElementById('rating-comparison');
const stateBenefitsDiv = document.getElementById('state-benefits');
const overlookedBenefitsDiv = document.getElementById('overlooked-benefits');
const survivorBenefitsDiv = document.getElementById('survivor-benefits');
const emailResultsForm = document.getElementById('email-results-form');
const emailInput = document.getElementById('email-input');
const emailSubmitBtn = document.getElementById('email-submit-btn');
const emailStatus = document.getElementById('email-status');

// --- View state ---
let currentView = 'monthly'; // 'monthly', 'annual', 'lifetime'
let lastCalcResults = null;

// --- Formatting Helpers ---
function fmtInt(value) {
    return '$' + Math.round(value).toLocaleString('en-US');
}

function fmtDec(value) {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Populate State Dropdown ---
function populateStates() {
    const territoryCodes = new Set(['PR', 'GU', 'VI', 'AS']);
    const entries = Object.entries(stateTaxData);
    const states = entries.filter(([code]) => !territoryCodes.has(code)).sort((a, b) => a[1].name.localeCompare(b[1].name));
    for (const [code, data] of states) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = data.name;
        if (code === 'FL') option.selected = true;
        stateSelect.appendChild(option);
    }
}

// --- Populate SMC Dropdown ---
function populateSMC() {
    for (const [key, data] of Object.entries(smcRates)) {
        if (key === 'K') continue; // K stacks via its own control below
        const option = document.createElement('option');
        option.value = key;
        option.textContent = data.label;
        smcLevelSelect.appendChild(option);
    }
    smcLevelSelect.addEventListener('change', () => {
        const level = smcLevelSelect.value;
        const data = smcRates[level];
        smcDescription.textContent = (level !== 'none' && data.description) ? data.description : '';
    });
}

// --- Show/hide SMC based on rating ---
function updateSMCVisibility() {
    const ratingValue = currentRatingSelect.value;
    const show = ratingValue === '100pt' || ratingValue === '100';
    smcWrapper.style.display = show ? 'block' : 'none';
    if (!show) { smcLevelSelect.value = 'none'; if (smckCountSelect) smckCountSelect.value = '0'; }
}

// --- Compute Monthly Compensation (exact 2026 rates) ---
function getMonthlyCompensation(rating, hasSpouse, numChildren, numParents) {
    const rates = compensationRates[rating];
    if (!rates || rating === 0) return 0;

    // For ratings below 30, no dependent additions
    if (rating < 30) return rates.veteran;

    // Build the base from the right column
    let monthly;
    if (hasSpouse && numChildren > 0) {
        monthly = rates.withSpouseAnd1Child;
        if (numChildren > 1) monthly += rates.additionalChildUnder18 * (numChildren - 1);
    } else if (hasSpouse) {
        monthly = rates.withSpouse;
    } else if (numChildren > 0) {
        monthly = rates.with1Child;
        if (numChildren > 1) monthly += rates.additionalChildUnder18 * (numChildren - 1);
    } else {
        monthly = rates.veteran;
    }

    // Add parent additions
    if (numParents === 1) {
        monthly += (rates.with1Parent - rates.veteran);
    } else if (numParents === 2) {
        monthly += (rates.with2Parents - rates.veteran);
    }

    return monthly;
}

// --- COLA projection: total over N years with annual increases ---
function projectWithCola(annualAmount, years, colaRate) {
    let total = 0;
    let current = annualAmount;
    for (let i = 0; i < years; i++) {
        total += current;
        current *= (1 + colaRate / 100);
    }
    return total;
}

// --- Compute Property Tax Savings ---
function resolveExemption(stateData, disabilityRating, hasPT) {
    if (!stateData || !stateData.veteranExemption || !stateData.veteranExemption.tiers) {
        return { type: "none", value: 0, description: "No exemption data available" };
    }
    for (const tier of stateData.veteranExemption.tiers) {
        if (disabilityRating >= tier.minRating) {
            if (tier.requiresPT && !hasPT) continue;
            return tier;
        }
    }
    return { type: "none", value: 0, description: stateData.veteranExemption.defaultDescription || "No exemption at this rating" };
}

/**
 * Convert a fixed exemption amount into its MARKET-VALUE equivalent.
 *
 * avgPropertyTaxRate is an *effective* rate (tax paid ÷ market value), so the
 * whole engine works in market-value terms. But state exemptions are written
 * against three different bases: market/appraised value (OH, MN, NC), assessed
 * value (most states), and taxable value (UT) — and "assessed" can be a small
 * fraction of market. Wyoming assesses residential at 9.5%, so its $6,000
 * "off assessed value" is worth ~$63,000 of market value; treating it as a
 * flat $6,000 understated the benefit by ~10x.
 *
 * basis "assessed" or "taxable" → divide by the state's assessmentRatio to get
 * market terms. Both need the conversion: UT is written against taxable value
 * (0.55), NM against taxable (0.3333), ND against taxable valuation (0.045).
 * basis "market" (or missing) → use as-is. Missing ratio defaults to 1.0, so an
 * unmigrated state entry behaves exactly as it did before this change.
 *
 * Written as an explicit market check rather than "!== assessed" so that a new
 * basis value added later fails safe into the conversion path instead of
 * silently skipping it.
 */
function toMarketEquivalent(amount, tier, stateData) {
    if (!amount) return 0;
    if ((tier.basis || "market") === "market") return amount;
    const ratio = stateData && stateData.assessmentRatio;
    if (!ratio || ratio <= 0 || ratio > 1) return amount;
    return amount / ratio;
}

function calculatePropertyTax(homePrice, taxRate, exemption, disabilityRating, stateData) {
    let taxableValue = homePrice;
    switch (exemption.type) {
        case "full":
            taxableValue = 0;
            break;
        case "fixed_amount": {
            let exemptAmount = exemption.value || 0;
            if (exemption.prorated) exemptAmount = exemptAmount * (disabilityRating / 100);
            exemptAmount = toMarketEquivalent(exemptAmount, exemption, stateData);
            taxableValue = Math.max(0, homePrice - exemptAmount);
            break;
        }
        case "percentage": {
            let pct = exemption.value || 0;
            if (exemption.prorated) pct = pct * (disabilityRating / 100);
            taxableValue = homePrice * (1 - pct);
            break;
        }
        case "fixed_tax_credit":
            break;
        case "none":
        default:
            break;
    }
    let annualTax = taxableValue * taxRate;
    if (exemption.type === "fixed_tax_credit") {
        let credit = exemption.value || 0;
        if (exemption.prorated) credit = credit * (disabilityRating / 100);
        annualTax = Math.max(0, annualTax - credit);
    }
    return annualTax;
}

// --- Estimate tax advantage ---
function estimateTaxAdvantage(annualComp, otherIncome) {
    // Approximate marginal federal + state tax rate based on other income
    let marginalRate;
    if (otherIncome <= 0) marginalRate = 0;
    else if (otherIncome <= 23200) marginalRate = 0.10;  // 10% bracket (MFJ)
    else if (otherIncome <= 94300) marginalRate = 0.17;   // ~12% federal + ~5% state
    else if (otherIncome <= 201050) marginalRate = 0.27;  // ~22% federal + ~5% state
    else if (otherIncome <= 383900) marginalRate = 0.29;  // ~24% federal + ~5% state
    else marginalRate = 0.37;
    return annualComp * marginalRate;
}

// --- Main Calculate Function ---
/**
 * Which COLA assumption the projection uses.
 *
 * "conservative" (2.6%) is roughly the 20-year average and is the default —
 * under-promising is the safer posture for a tool quoting lifetime dollars.
 * "recent" (3.1%) is the average of the last ten COLAs, which is what the
 * last decade actually looked like. The user picks; we don't pick for them.
 */
function getSelectedColaRate() {
    const sel = document.getElementById('cola-basis');
    return (sel && sel.value === 'recent')
        ? colaHistory.recentDecade
        : colaHistory.conservative;
}

/**
 * A family-adjusted monthly rate for any SMC level (spouse / children /
 * parent additions per the verified Dec 2025 table).
 */
function familySmcRate(levelKey, hasSpouse, numChildren, numParents) {
    const d = smcRates[levelKey];
    if (!d) return 0;
    let base;
    if (hasSpouse && numChildren > 0 && d.withSpouseAnd1Child) {
        base = d.withSpouseAnd1Child;
        if (numChildren > 1) base += d.additionalChildUnder18 * (numChildren - 1);
    } else if (hasSpouse && d.withSpouse) {
        base = d.withSpouse;
    } else if (numChildren > 0 && d.with1Child) {
        base = d.with1Child;
        if (numChildren > 1) base += d.additionalChildUnder18 * (numChildren - 1);
    } else {
        base = d.veteran;
    }
    if (numParents === 1 && d.with1Parent) base += (d.with1Parent - d.veteran);
    else if (numParents === 2 && d.with2Parents) base += (d.with2Parents - d.veteran);
    return base;
}

/**
 * Total monthly compensation at 100% with an SMC level plus stacked SMC-K
 * awards, honoring the 38 CFR 3.350(a) caps:
 *   - K on a schedular rating or SMC-S: combined total capped at the L rate
 *   - K on L through N-1/2: combined total capped at the O rate
 *   - at O/P and R levels K adds nothing (the cap is already met)
 * Multiple K awards are legitimate — one per qualifying anatomical loss.
 */
function computeCompWithSmc(hasSpouse, numChildren, numParents, level, numK) {
    const base100 = getMonthlyCompensation(100, hasSpouse, numChildren, numParents);
    const kRate = smcRates['K'].veteran;

    const base = (level === 'none' || !smcRates[level] || smcRates[level].isAddOn)
        ? base100
        : familySmcRate(level, hasSpouse, numChildren, numParents);
    const levelDelta = base - base100;

    const noKLevels = ['O/P', 'R.1', 'R.2'];
    if (noKLevels.includes(level) || numK <= 0) {
        return { total: base, base100, levelDelta, kApplied: 0, kMonthly: 0, capped: numK > 0 && noKLevels.includes(level) };
    }

    const capKey = (level === 'none' || level === 'S') ? 'L' : 'O/P';
    const cap = familySmcRate(capKey, hasSpouse, numChildren, numParents);
    const uncapped = base + numK * kRate;
    const total = Math.min(uncapped, cap);
    return { total, base100, levelDelta, kApplied: numK, kMonthly: total - base, capped: uncapped > cap };
}

function calculate() {
    const ratingValue = currentRatingSelect.value;
    const currentRating = ratingValue === 'none' ? 0 : ratingValue === '100pt' ? 100 : parseInt(ratingValue);
    const currentIsPT = ratingValue === '100pt';
    const age = parseInt(veteranAgeInput.value) || 35;
    const stateCode = stateSelect.value;
    const stateData = stateTaxData[stateCode];
    const isRetiree = isRetireeSelect.value === 'yes';
    const hasSpouse = maritalStatusSelect.value === 'married';
    const numChildren = parseInt(numChildrenInput.value) || 0;
    const numCollegeChildren = Math.min(parseInt(numCollegeChildrenInput.value) || 0, numChildren);
    const numParents = parseInt(dependentParentsSelect.value) || 0;
    const homeValue = parseFloat(homeValueInput.value) || 0;
    const ownsHome = ownsHomeSelect.value === 'yes';
    const vaLoanAmount = parseFloat(vaLoanAmountInput.value) || 0;
    const hasStudentLoans = hasStudentLoansSelect.value === 'yes';
    const studentLoanBalance = hasStudentLoans ? (parseFloat(studentLoanBalanceInput.value) || 0) : 0;
    const otherIncome = parseFloat(otherIncomeInput.value) || 0;
    const projectionYears = parseInt(projectionSlider.value);
    const includeCola = includeColaCheckbox.checked;
    const colaRate = includeCola ? getSelectedColaRate() : 0;

    const smcLevel = smcLevelSelect.value;
    const numK = smckCountSelect ? (parseInt(smckCountSelect.value) || 0) : 0;
    const hasDependents = hasSpouse || numChildren > 0;

    // --- Calculate each benefit at 100% P&T ---

    // 1. Tax-free disability compensation, with SMC level + stacked SMC-K awards
    const smcCalc = computeCompWithSmc(hasSpouse, numChildren, numParents, smcLevel, numK);
    let monthlyComp100 = smcCalc.total;
    const smcMonthly = smcCalc.levelDelta;
    const kMonthly = smcCalc.kMonthly;
    const kApplied = smcCalc.kApplied;
    const kCapped = smcCalc.capped;

    const annualComp100 = monthlyComp100 * 12;
    const lifetimeComp = includeCola ? projectWithCola(annualComp100, projectionYears, colaRate) : annualComp100 * projectionYears;

    // 2. Tax advantage (equivalent pre-tax value of tax-free income)
    const annualTaxAdvantage = estimateTaxAdvantage(annualComp100, otherIncome);
    const lifetimeTaxAdvantage = includeCola ? projectWithCola(annualTaxAdvantage, projectionYears, colaRate) : annualTaxAdvantage * projectionYears;

    // 3. CHAMPVA savings
    const annualCivilianCost = hasDependents ? champvaData.civilianFamilyAnnualCost : 0;
    const annualCHAMPVACost = hasDependents ? champvaData.annualCatastrophicCap : 0;
    const annualCHAMPVASavings = Math.max(0, annualCivilianCost - annualCHAMPVACost);
    const lifetimeCHAMPVA = annualCHAMPVASavings * projectionYears;

    // 4. Property tax savings
    let annualPropTaxSavings = 0;
    if (ownsHome && homeValue > 0) {
        const exemption100PT = resolveExemption(stateData, 100, true);
        const taxNoExemption = homeValue * stateData.avgPropertyTaxRate;
        const taxWithExemption = calculatePropertyTax(homeValue, stateData.avgPropertyTaxRate, exemption100PT, 100, stateData);
        annualPropTaxSavings = taxNoExemption - taxWithExemption;
    }
    const lifetimePropTax = annualPropTaxSavings * projectionYears;

    // 5. Chapter 35 DEA
    const ch35Total = numCollegeChildren * chapter35Data.fullTime * chapter35Data.maxMonths;

    // 6. VA Healthcare + Dental
    const annualVAHealthcare = vaHealthcareData.annualValue;
    const lifetimeVAHealthcare = annualVAHealthcare * projectionYears;
    const annualDental = vaHealthcareData.dentalAnnualValue;
    const lifetimeDental = annualDental * projectionYears;

    // 7. VA Loan Funding Fee Waiver (one-time)
    const fundingFeeSaved = ownsHome && vaLoanAmount > 0 ? vaLoanAmount * (fundingFeeData.firstUse.zeroDown / 100) : 0;

    // 8. Student Loan Forgiveness (one-time)
    const studentLoanSaved = studentLoanBalance;

    // 9. State extras (vehicle reg, etc.)
    const stateExtras = stateBenefits[stateCode];
    let annualStateExtras = 0;
    if (stateExtras && stateExtras.vehicleReg && stateExtras.vehicleReg.exempt) {
        annualStateExtras += stateExtras.vehicleReg.savings;
    }
    const lifetimeStateExtras = annualStateExtras * projectionYears;

    // 10. Commissary/Exchange savings
    const annualCommissary = additionalBenefits.commissaryExchange.annualSavings;
    const lifetimeCommissary = annualCommissary * projectionYears;

    // 11. DIC (Survivor Benefits) — estimated lifetime value for surviving spouse
    const annualDIC = dicData.baseSurvivorSpouse * 12;
    const dicEstimatedYears = 20;
    const lifetimeDIC = hasSpouse ? annualDIC * dicEstimatedYears : 0;

    // --- Grand Total ---
    const grandTotal = lifetimeComp + lifetimeTaxAdvantage + lifetimeCHAMPVA + lifetimePropTax +
        ch35Total + lifetimeVAHealthcare + lifetimeDental + fundingFeeSaved + studentLoanSaved +
        lifetimeStateExtras + lifetimeCommissary + lifetimeDIC;

    // Store results for view toggling
    lastCalcResults = {
        monthlyComp100, annualComp100, lifetimeComp,
        annualTaxAdvantage, lifetimeTaxAdvantage,
        annualCHAMPVASavings, lifetimeCHAMPVA, hasDependents,
        annualPropTaxSavings, lifetimePropTax, ownsHome,
        ch35Total, numCollegeChildren,
        annualVAHealthcare, lifetimeVAHealthcare,
        annualDental, lifetimeDental,
        fundingFeeSaved, vaLoanAmount,
        studentLoanSaved, hasStudentLoans,
        annualStateExtras, lifetimeStateExtras,
        annualCommissary, lifetimeCommissary,
        projectionYears, grandTotal,
        currentRating, currentIsPT, ratingValue,
        hasSpouse, numChildren, numParents, numCollegeChildren,
        stateCode, stateData, homeValue,
        annualDIC, lifetimeDIC, dicEstimatedYears,
        isRetiree, otherIncome, includeCola, colaRate,
        smcLevel, smcMonthly, numK: kApplied, kMonthly, kCapped
    };

    // --- Render Everything ---
    renderHeroCard(grandTotal, projectionYears, includeCola);
    renderBenefitBreakdown();
    renderRatingComparison();
    renderCHAMPVA();
    renderStateBenefits();
    renderOverlookedBenefits();
    renderSurvivorBenefits();
}

// --- Render Functions ---

let costOfWaitingInterval = null;

function renderHeroCard(total, years, withCola) {
    const r = lastCalcResults;

    // Equivalent salary: based on recurring annual benefits only (not one-time or survivor benefits)
    const recurringAnnual = r ? (r.annualComp100 + r.annualTaxAdvantage + r.annualCHAMPVASavings +
        r.annualPropTaxSavings + r.annualVAHealthcare + r.annualDental + r.annualCommissary + r.annualStateExtras) : total / years;
    const effectiveTaxRate = r && r.otherIncome > 0 ? 0.25 : 0.22;
    const equivalentSalary = recurringAnnual / (1 - effectiveTaxRate);

    // Cost of waiting — per second loss rate based on gap between current rating and 100% P&T
    const showCostOfWaiting = r && r.ratingValue !== '100pt';
    let costPerSecond = 0;
    if (showCostOfWaiting) {
        const currentMonthly = r.currentRating > 0 ? getMonthlyCompensation(r.currentRating, r.hasSpouse, r.numChildren, r.numParents) : 0;
        const monthlyGap = r.monthlyComp100 - currentMonthly;
        costPerSecond = (monthlyGap * 12) / (365.25 * 24 * 60 * 60);
    }

    totalValueCard.innerHTML = `
        <div class="hero-value-card">
            <p class="hero-label">Estimated Lifetime Value of 100% P&T</p>
            <p class="hero-amount">${fmtInt(total)}</p>
            <p class="hero-detail">Over ${years} years, tax-free</p>
            <p class="hero-detail">Civilian equivalent: a <strong>${fmtInt(equivalentSalary)}/year salary</strong> to match these benefits after taxes</p>
            ${showCostOfWaiting ? `<p class="hero-ticker" id="cost-of-waiting-ticker"></p>` : ''}
        </div>
    `;

    // Start the live ticker
    if (costOfWaitingInterval) clearInterval(costOfWaitingInterval);
    if (showCostOfWaiting && costPerSecond > 0) {
        let lost = 0;
        const tickerEl = document.getElementById('cost-of-waiting-ticker');
        if (tickerEl) {
            tickerEl.textContent = `Since you opened this page, you've missed out on: $0.00`;
            costOfWaitingInterval = setInterval(() => {
                lost += costPerSecond;
                tickerEl.textContent = `Since you opened this page, you've missed out on: $${lost.toFixed(2)}`;
            }, 1000);
        }
    }

    if (withCola) {
        const rate = getSelectedColaRate();
        const basis = rate === colaHistory.recentDecade
            ? 'the average of the last ten COLAs'
            : 'roughly the 20-year average, deliberately conservative';
        totalValueNote.textContent = `Includes an estimated ${rate}% annual COLA on compensation — ${basis}. VA applies a COLA each year based on inflation.`;
    } else {
        totalValueNote.textContent = `Conservative estimate using today's rates. Turn on COLA adjustments above to project forward with annual inflation increases (${colaHistory.conservative}% or ${colaHistory.recentDecade}%, your choice).`;
    }
}

function renderBenefitBreakdown() {
    const r = lastCalcResults;
    if (!r) return;
    const years = r.projectionYears;

    const benefits = [];

    // Compensation — base rate, then the SMC level, then stacked K awards,
    // each as its own card so the stacking is legible.
    const hasSmcParts = (r.smcLevel !== 'none' && r.smcMonthly !== 0) || r.kMonthly > 0;
    if (hasSmcParts) {
        const baseMonthly = r.monthlyComp100 - r.smcMonthly - r.kMonthly;
        benefits.push({
            group: "cash", title: "Tax-Free Disability Compensation",
            monthly: baseMonthly,
            annual: baseMonthly * 12,
            lifetime: baseMonthly * 12 * r.projectionYears,
            desc: `Base 100% P&T compensation. Tax-free — no federal, state, or local income tax.`
        });
        if (r.smcLevel !== 'none' && r.smcMonthly !== 0) {
            benefits.push({
                group: "cash", title: `Special Monthly Compensation (${r.smcLevel})`,
                monthly: r.smcMonthly,
                annual: r.smcMonthly * 12,
                lifetime: r.smcMonthly * 12 * r.projectionYears,
                desc: `${smcRates[r.smcLevel].label} — additional compensation above the standard 100% rate. Also tax-free.`
            });
        }
        if (r.kMonthly > 0) {
            benefits.push({
                group: "cash", title: `SMC-K${r.numK > 1 ? ' × ' + r.numK : ''} (loss of use)`,
                monthly: r.kMonthly,
                annual: r.kMonthly * 12,
                lifetime: r.kMonthly * 12 * r.projectionYears,
                desc: r.numK > 1
                    ? `${r.numK} stacked SMC-K awards at ${fmtDec(smcRates['K'].veteran)}/month each, paid on top of your other compensation — one per qualifying anatomical loss.${r.kCapped ? ' Partially limited by the statutory cap (38 CFR 3.350).' : ''}`
                    : `Paid on top of your other compensation for a qualifying loss of use.${r.kCapped ? ' Limited by the statutory cap (38 CFR 3.350).' : ''}`
            });
        }
    } else {
        benefits.push({
            group: "cash", title: "Tax-Free Disability Compensation",
            monthly: r.monthlyComp100,
            annual: r.annualComp100,
            lifetime: r.lifetimeComp,
            desc: `Monthly compensation from the VA. 100% tax-free — no federal, state, or local income tax. Current rate: ${fmtDec(r.monthlyComp100)}/month.`
        });
    }

    // Tax advantage
    if (r.annualTaxAdvantage > 0) {
        benefits.push({
            group: "cash", title: "Tax-Free Advantage",
            monthly: r.annualTaxAdvantage / 12,
            annual: r.annualTaxAdvantage,
            lifetime: r.lifetimeTaxAdvantage,
            // Not a deposit — money the veteran doesn't pay, flagged as such
            // so it can't be misread as part of the monthly check.
            flag: 'Savings — not cash deposited',
            labelSuffix: " you don't pay in tax",
            desc: `This is NOT extra money in your account — it's the tax you don't pay. Because VA comp is tax-free, a civilian would need to earn ${fmtInt(r.annualComp100 + r.annualTaxAdvantage)}/year in taxable income to take home what your compensation gives you.`
        });
    }

    // CHAMPVA
    if (r.hasDependents) {
        benefits.push({
            group: "health", title: "CHAMPVA (Dependent Healthcare)",
            monthly: r.annualCHAMPVASavings / 12,
            annual: r.annualCHAMPVASavings,
            lifetime: r.lifetimeCHAMPVA,
            desc: `Healthcare for your spouse and children. $0 premiums, $3,000/year max out-of-pocket vs. ~${fmtInt(champvaData.civilianFamilyAnnualCost)}/year for civilian family coverage.`
        });
    }

    // Property tax
    if (r.ownsHome && r.annualPropTaxSavings > 0) {
        benefits.push({
            group: "home", title: "Property Tax Exemption",
            monthly: r.annualPropTaxSavings / 12,
            annual: r.annualPropTaxSavings,
            lifetime: r.lifetimePropTax,
            desc: `State-specific property tax exemption on your ${fmtInt(r.homeValue)} home in ${r.stateData.name}. Based on statewide average tax rates — your actual savings depend on your county and assessed value.`
        });
    }

    // VA Healthcare
    benefits.push({
        group: "health", title: "Free VA Healthcare (For You)",
        monthly: r.annualVAHealthcare / 12,
        annual: r.annualVAHealthcare,
        lifetime: r.lifetimeVAHealthcare,
        desc: "Priority Group 1 comprehensive care: prescriptions, mental health, specialty care, vision, hearing aids — all at $0 copay."
    });

    // Dental
    benefits.push({
        group: "health", title: "Comprehensive Dental (Class IV)",
        monthly: r.annualDental / 12,
        annual: r.annualDental,
        lifetime: r.lifetimeDental,
        desc: "Full dental coverage: cleanings, fillings, crowns, implants, dentures, orthodontics — all free through VA dental clinics."
    });

    // Beneficiary travel — a fixed rate, so the card shows the rate itself
    // rather than an annual total built on mileage we'd have to invent.
    benefits.push({
        group: "health", title: "VA Travel Reimbursement",
        customValue: '41.5¢',
        customLabel: '/mile, every VA appointment',
        desc: `VA pays ${vaHealthcareData.travelReimbursementPerMile * 100}¢ per mile for approved health-related travel, both ways. A small per-trip deductible applies, capped at $${vaHealthcareData.travelDeductibleMonthlyCap}/month — after that, travel pays in full for the rest of the month. File in the BTSSS portal within 30 days.`
    });

    // Chapter 35
    if (r.numCollegeChildren > 0) {
        benefits.push({
            group: "edu", title: `Chapter 35 DEA (${r.numCollegeChildren} dependent${r.numCollegeChildren > 1 ? 's' : ''})`,
            monthly: chapter35Data.fullTime * r.numCollegeChildren,
            annual: chapter35Data.fullTime * 12 * r.numCollegeChildren,
            lifetime: r.ch35Total,
            desc: `Up to 36 months of education benefits per dependent at ${fmtDec(chapter35Data.fullTime)}/month full-time. Total: ${fmtInt(chapter35Data.totalPerDependent)} per child.`,
            isOneTime: false
        });
    }

    // Chapter 35 — the spouse is eligible too, which almost nobody knows.
    // Shown as "available", NOT added to the lifetime total: unlike the
    // children count above, we never asked whether the spouse plans to study.
    if (r.hasSpouse) {
        benefits.push({
            group: "edu", title: "Chapter 35 DEA (Your Spouse)",
            monthly: 0,
            annual: 0,
            lifetime: chapter35Data.totalPerDependent,
            desc: `Your spouse qualifies for the same 36 months at ${fmtDec(chapter35Data.fullTime)}/month — a degree, certification, or apprenticeship of their own. Most families only ever use it for the kids. Not added to your total above; it's there if your spouse wants it.`,
            isOneTime: true,
            availableOnly: true
        });
    }

    // VR&E (Chapter 31) — a second education benefit for the VETERAN, separate
    // from the GI Bill. 100% P&T trivially meets the eligibility bar. Shown as
    // "available", not added to the total (usage is unknowable).
    benefits.push({
        group: "edu", title: "VR&E (Chapter 31) for You",
        monthly: 0,
        annual: 0,
        lifetime: chapter31Data.estimatedDegreeValue,
        desc: `Full tuition with no cap at public or private schools — separate from your GI Bill — plus a monthly stipend of ${fmtDec(chapter31Data.subsistence.fullTime.noDeps)} to ${fmtDec(chapter31Data.subsistence.fullTime.twoDeps)}+ while you train. Your counselor has to approve the program. Estimated at ${fmtInt(chapter31Data.estimatedDegreeValue)} for a 4-year degree; not added to your total.`,
        isOneTime: true,
        availableOnly: true
    });

    // Funding fee waiver
    if (r.fundingFeeSaved > 0) {
        benefits.push({
            group: "home", title: "VA Loan Funding Fee Waiver",
            monthly: 0,
            annual: 0,
            lifetime: r.fundingFeeSaved,
            desc: `${fundingFeeData.firstUse.zeroDown}% funding fee waived on your ${fmtInt(r.vaLoanAmount)} VA loan. Applies every time you use a VA loan.`,
            isOneTime: true
        });
    }

    // Commissary
    benefits.push({
        group: "home", title: "Commissary & Exchange Savings",
        monthly: r.annualCommissary / 12,
        annual: r.annualCommissary,
        lifetime: r.lifetimeCommissary,
        desc: "Full commissary, exchange, and MWR privileges. The Defense Commissary Agency puts average savings at 23.7% versus commercial grocery stores."
    });

    // State extras
    if (r.annualStateExtras > 0) {
        benefits.push({
            group: "home", title: "Vehicle Registration & State Extras",
            monthly: r.annualStateExtras / 12,
            annual: r.annualStateExtras,
            lifetime: r.lifetimeStateExtras,
            desc: `Vehicle registration exemption and other state-specific benefits in ${r.stateData.name}.`
        });
    }

    // Student loan forgiveness (show card even if user said no — show what's available)
    if (r.hasStudentLoans && r.studentLoanSaved > 0) {
        benefits.push({
            group: "edu", title: "Student Loan Forgiveness",
            monthly: 0,
            annual: 0,
            lifetime: r.studentLoanSaved,
            desc: "100% of federal student loans forgiven through TPD discharge, and the forgiven balance is permanently free of federal income tax. Automatic — the Dept. of Education runs a quarterly data match with VA and discharges you without an application. Parent PLUS loans count.",
            isOneTime: true
        });
    }

    // VALife — guaranteed-issue life insurance. Verified vs VA.gov 8/9/26:
    // up to $40,000, any SC rating 0-100%, age 80 and under, no exam, premiums
    // locked at enrollment, 2-year waiting period before full coverage.
    benefits.push({
        group: "family", title: "VALife Guaranteed Life Insurance",
        monthly: 0,
        annual: 0,
        lifetime: 40000,
        desc: "Up to $40,000 of whole life coverage with guaranteed acceptance — no health exam, no health questions, and your premium locks in at enrollment. If your disabilities make you expensive or impossible to insure on the civilian market, this is the workaround. Two-year waiting period before full coverage; apply at any age up to 80.",
        isOneTime: true,
        availableOnly: true
    });

    // DIC (Survivor Benefits)
    if (r.hasSpouse) {
        benefits.push({
            group: "family", title: "Survivor Benefits (DIC)",
            monthly: dicData.baseSurvivorSpouse,
            annual: r.annualDIC,
            lifetime: r.lifetimeDIC,
            desc: `Tax-free monthly payments to your surviving spouse — estimated over ${r.dicEstimatedYears} years. Spouse also keeps CHAMPVA and may retain property tax exemptions.`
        });
    }

    // Render cards into their category panels. Every card must carry a
    // `group`; anything unassigned lands in 'cash' so it can't silently vanish.
    const groups = { cash: '', health: '', edu: '', home: '', family: '' };
    for (const b of benefits) {
        let displayValue, displayLabel;
        if (b.customValue) {
            // Rate-style benefits (e.g. mileage) where an annual total would
            // require invented assumptions — show the rate itself.
            displayValue = b.customValue;
            displayLabel = b.customLabel || '';
        } else if (b.availableOnly) {
            // A benefit that exists for this user but whose usage we can't
            // assume — labelled as available, never summed into the total.
            displayValue = 'Up to ' + fmtInt(b.lifetime);
            displayLabel = 'available';
        } else if (b.isOneTime) {
            displayValue = fmtInt(b.lifetime);
            displayLabel = 'one-time savings';
        } else if (currentView === 'monthly') {
            displayValue = fmtInt(b.monthly);
            displayLabel = '/month';
        } else if (currentView === 'annual') {
            displayValue = fmtInt(b.annual);
            displayLabel = '/year';
        } else {
            displayValue = fmtInt(b.lifetime);
            displayLabel = `over ${years} yrs`;
        }

        // Time-based labels get the suffix; one-time/available/custom keep theirs.
        if (b.labelSuffix && !b.isOneTime && !b.availableOnly && !b.customValue) {
            displayLabel += b.labelSuffix;
        }
        const g = groups[b.group] !== undefined ? b.group : 'cash';
        groups[g] += `
            <div class="benefit-card${b.flag ? ' benefit-card--savings' : ''}">
                <h3>${b.title}${b.flag ? `<span class="benefit-flag">${b.flag}</span>` : ''}</h3>
                <p class="benefit-amount">${displayValue}<span class="benefit-period">${displayLabel}</span></p>
                <p class="benefit-desc">${b.desc}</p>
            </div>
        `;
    }

    for (const [g, html] of Object.entries(groups)) {
        const el = document.getElementById('grid-' + g);
        if (el) el.innerHTML = html;
    }

    renderGlanceAndChips();
}

/**
 * The at-a-glance tiles and panel chips — the "map" layer. Each shows the
 * category's headline figure in its most natural unit (monthly for recurring,
 * "up to" for available education money), independent of the card view toggle.
 */
function renderGlanceAndChips() {
    const r = lastCalcResults;
    if (!r) return;

    // The cash figure is the DEPOSIT — the number a veteran can check against
    // their own bank account. The tax advantage is a saving, not cash, and
    // mixing them into one "tax-free" total misreads as a bigger check.
    const cashMonthly = r.monthlyComp100;
    const taxSavingMonthly = r.annualTaxAdvantage / 12;
    const healthMonthly = (r.hasDependents ? r.annualCHAMPVASavings : 0) / 12
        + r.annualVAHealthcare / 12 + r.annualDental / 12;
    const eduUpTo = r.ch35Total
        + (r.hasSpouse ? chapter35Data.totalPerDependent : 0)
        + chapter31Data.estimatedDegreeValue
        + (r.hasStudentLoans ? r.studentLoanSaved : 0);
    const homeMonthly = (r.ownsHome ? r.annualPropTaxSavings : 0) / 12
        + r.annualStateExtras / 12 + r.annualCommissary / 12;
    const familyMonthly = r.annualDIC / 12;

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('tile-cash', fmtInt(cashMonthly) + '/mo');
    set('chip-cash', fmtInt(cashMonthly) + '/mo deposited'
        + (taxSavingMonthly > 0 ? ' + ' + fmtInt(taxSavingMonthly) + '/mo tax saved' : ''));
    set('tile-health', fmtInt(healthMonthly) + '/mo');
    set('chip-health', fmtInt(healthMonthly) + '/mo in coverage value');
    set('tile-edu', 'up to ' + fmtInt(eduUpTo));
    set('chip-edu', 'up to ' + fmtInt(eduUpTo) + ' on the table');
    set('tile-home', fmtInt(homeMonthly) + '/mo');
    set('chip-home', fmtInt(homeMonthly) + '/mo' + (r.fundingFeeSaved > 0 ? ' + ' + fmtInt(r.fundingFeeSaved) + ' one-time' : ''));
    set('tile-family', fmtInt(familyMonthly) + '/mo');
    set('chip-family', fmtInt(familyMonthly) + '/mo DIC to your survivor');

    // The comparison panel's chip: what the gap costs per year, when below 100.
    const cmpChip = document.getElementById('chip-compare');
    if (cmpChip) cmpChip.textContent = r.currentIsPT ? 'you’re at the top' : 'the gap, priced';

    // TPD spotlight banner — shown only when the user actually carries loans.
    const tpd = document.getElementById('tpd-banner');
    const tpdLine = document.getElementById('tpd-line');
    if (tpd && tpdLine) {
        const show = r.hasStudentLoans && r.studentLoanSaved > 0;
        tpd.style.display = show ? '' : 'none';
        if (show) tpdLine.textContent = `Your ${fmtInt(r.studentLoanSaved)} in federal student loans doesn't survive 100% P&T — the full balance qualifies for discharge.`;
    }
}

function renderRatingComparison() {
    const r = lastCalcResults;
    if (!r) return;

    if (r.currentRating === 100 && r.currentIsPT) {
        ratingComparison.innerHTML = `<p class="already-pt">You're at 100% P&T — you have access to the full suite of benefits above. Make sure you're using them all.</p>`;
        return;
    }

    const currentMonthly = getMonthlyCompensation(r.currentRating, r.hasSpouse, r.numChildren, r.numParents);
    const targetMonthly = r.monthlyComp100;
    const monthlyDiff = targetMonthly - currentMonthly;
    const annualDiff = monthlyDiff * 12;

    const currentLabel = r.currentRating === 0 ? "No Rating" : `${r.currentRating}%`;

    // Benefits unlocked only at 100% P&T
    const ptOnlyBenefits = [
        { label: "CHAMPVA for dependents", current: r.currentRating === 100 && r.currentIsPT, value: r.hasDependents ? `${fmtInt(r.annualCHAMPVASavings)}/yr saved` : 'N/A (no dependents)' },
        { label: "Chapter 35 DEA education", current: false, value: r.numCollegeChildren > 0 ? `${fmtInt(r.ch35Total)} total` : 'N/A (no children)' },
        { label: "Comprehensive dental", current: r.currentRating === 100, value: `${fmtInt(r.annualDental)}/yr value` },
        { label: "Full property tax exemption", current: false, value: r.ownsHome ? `${fmtInt(r.annualPropTaxSavings)}/yr saved` : 'N/A' }
    ];

    let ptRows = '';
    for (const b of ptOnlyBenefits) {
        ptRows += `
            <div class="comparison-row">
                <span class="comp-label">${b.label}</span>
                <span class="comp-current">${b.current ? 'Yes' : 'No'}</span>
                <span class="comp-target">${b.value}</span>
            </div>
        `;
    }

    ratingComparison.innerHTML = `
        <div class="comparison-table">
            <div class="comparison-header">
                <span></span>
                <span class="comp-current-header">${currentLabel}</span>
                <span class="comp-target-header">100% P&T</span>
            </div>
            <div class="comparison-row">
                <span class="comp-label">Monthly compensation</span>
                <span class="comp-current">${fmtInt(currentMonthly)}/mo</span>
                <span class="comp-target">${fmtInt(targetMonthly)}/mo</span>
            </div>
            <div class="comparison-row">
                <span class="comp-label">Annual compensation</span>
                <span class="comp-current">${fmtInt(currentMonthly * 12)}/yr</span>
                <span class="comp-target">${fmtInt(targetMonthly * 12)}/yr</span>
            </div>
            ${ptRows}
        </div>
        <div class="difference-card">
            <p class="diff-label">Every month you don't file, you're leaving on the table:</p>
            <p class="diff-amount">${fmtInt(monthlyDiff)}/month</p>
            <p class="diff-detail">That's ${fmtInt(annualDiff)}/year in compensation alone — plus CHAMPVA, education, dental, and property tax benefits not shown in this number</p>
        </div>
    `;
}

function renderCHAMPVA() {
    const r = lastCalcResults;
    if (!r) return;

    if (!r.hasDependents) {
        champvaSection.innerHTML = `<p class="champva-intro">CHAMPVA provides healthcare coverage for dependents of 100% P&T veterans. Add a spouse or children above to see the full impact.</p>`;
        champvaScenariosDiv.innerHTML = '';
        champvaCustomDiv.innerHTML = '';
        champvaDetailsDiv.innerHTML = '';
        return;
    }

    champvaSection.innerHTML = `
        <div class="champva-intro">
            <p>CHAMPVA covers your spouse and children with <strong>$0 monthly premiums</strong> and a <strong>$3,000 annual catastrophic cap</strong>. No matter what happens — emergency surgery, NICU stays, cancer treatment — your family's maximum out-of-pocket cost for the entire year is $3,000.</p>
            <p>The average American family pays <strong>${fmtInt(champvaData.civilianFamilyAnnualCost)}/year</strong> in health insurance premiums and out-of-pocket costs. Your CHAMPVA cost: up to $3,000.</p>
        </div>
    `;

    // Scenario cards
    let scenarioCards = '';
    for (const s of champvaData.scenarios) {
        scenarioCards += `
            <div class="scenario-card">
                <p class="scenario-label">${s.label}</p>
                <div class="scenario-numbers">
                    <div class="scenario-col">
                        <span class="scenario-col-label">Total Bill</span>
                        <span class="scenario-bill">${fmtInt(s.totalBill)}</span>
                    </div>
                    <div class="scenario-col">
                        <span class="scenario-col-label">You Pay (CHAMPVA)</span>
                        <span class="scenario-you-pay">${fmtInt(s.champvaCost)}</span>
                    </div>
                    <div class="scenario-col">
                        <span class="scenario-col-label">You Save</span>
                        <span class="scenario-saved">${fmtInt(s.totalBill - s.champvaCost)}</span>
                    </div>
                </div>
                <p class="scenario-desc">${s.description}</p>
            </div>
        `;
    }
    champvaScenariosDiv.innerHTML = `
        <h3 class="scenario-heading">See CHAMPVA in Action</h3>
        <div class="champva-scenario-grid">${scenarioCards}</div>
    `;

    // Custom scenario input
    champvaCustomDiv.innerHTML = `
        <div class="custom-scenario">
            <label for="custom-bill">Enter any medical bill amount:</label>
            <div class="custom-input-row">
                <span class="custom-dollar">$</span>
                <input type="number" id="custom-bill" value="" placeholder="e.g. 80000" min="0" step="1000">
                <span id="custom-result"></span>
            </div>
            <p class="custom-note">Under CHAMPVA, your max out-of-pocket is $3,000/year — regardless of the bill.</p>
        </div>
    `;

    // Attach custom scenario listener
    const customBillInput = document.getElementById('custom-bill');
    const customResult = document.getElementById('custom-result');
    customBillInput.addEventListener('input', () => {
        const bill = parseFloat(customBillInput.value) || 0;
        if (bill > 0) {
            const youPay = Math.min(bill * 0.25 + 100, 3000); // 25% cost share, capped at $3K
            customResult.innerHTML = `You'd pay: <strong>${fmtInt(youPay)}</strong> | You save: <strong>${fmtInt(bill - youPay)}</strong>`;
        } else {
            customResult.innerHTML = '';
        }
    });

    // CHAMPVA details (expandable)
    champvaDetailsDiv.innerHTML = `
        <button class="expand-btn" data-target="champva-detail-content">CHAMPVA Coverage Details</button>
        <div class="expandable-content" id="champva-detail-content">
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Monthly Premium</span><span class="detail-value highlight-green">$0</span></div>
                <div class="detail-item"><span class="detail-label">Annual Deductible (Individual)</span><span class="detail-value highlight-green">$50</span></div>
                <div class="detail-item"><span class="detail-label">Annual Deductible (Family)</span><span class="detail-value highlight-green">$100</span></div>
                <div class="detail-item"><span class="detail-label">Cost Share</span><span class="detail-value highlight-green">25% of allowable amount</span></div>
                <div class="detail-item"><span class="detail-label">Annual Catastrophic Cap</span><span class="detail-value highlight-green">$3,000/family</span></div>
                <div class="detail-item"><span class="detail-label">Prescriptions (Meds by Mail)</span><span class="detail-value highlight-green">$0</span></div>
                <div class="detail-item"><span class="detail-label">Preventive Care</span><span class="detail-value highlight-green">$0 cost share</span></div>
                <div class="detail-item"><span class="detail-label">Inpatient Deductible</span><span class="detail-value highlight-green">$0</span></div>
                <div class="detail-item"><span class="detail-label">Network</span><span class="detail-value highlight-green">Any willing provider (no network)</span></div>
                <div class="detail-item"><span class="detail-label">At Age 65</span><span class="detail-value highlight-green">Must enroll in Medicare A+B to keep CHAMPVA</span></div>
            </div>
            <p class="detail-note">CHAMPVA covers: inpatient, outpatient, mental health, prescriptions, maternity/childbirth, emergency care, and preventive care. Dental is NOT covered (available separately through VADIP at $9-$53/month).</p>
        </div>
    `;
}

function renderStateBenefits() {
    const r = lastCalcResults;
    if (!r) return;

    const extras = stateBenefits[r.stateCode];
    let cards = '';

    // Property tax
    if (r.ownsHome && r.homeValue > 0) {
        const exemption = resolveExemption(r.stateData, 100, true);
        cards += `
            <div class="state-benefit-card">
                <h4>Property Tax</h4>
                <p class="state-val">${r.annualPropTaxSavings > 0 ? fmtInt(r.annualPropTaxSavings) + '/yr saved' : 'See details'}</p>
                <p class="state-desc">${exemption.description || 'Contact your state VA office for details'}</p>
            </div>
        `;
    }

    if (extras) {
        if (extras.vehicleReg) {
            cards += `
                <div class="state-benefit-card">
                    <h4>Vehicle Registration</h4>
                    <p class="state-val">${extras.vehicleReg.exempt ? fmtInt(extras.vehicleReg.savings) + '/yr saved' : 'Not exempt'}</p>
                    <p class="state-desc">${extras.vehicleReg.description}</p>
                </div>
            `;
        }
        if (extras.plates) {
            cards += `
                <div class="state-benefit-card">
                    <h4>License Plates</h4>
                    <p class="state-val">${extras.plates.free ? 'Free' : 'Available'}</p>
                    <p class="state-desc">${extras.plates.description}</p>
                </div>
            `;
        }
        if (extras.huntingFishing) {
            cards += `
                <div class="state-benefit-card">
                    <h4>Hunting & Fishing</h4>
                    <p class="state-val">${extras.huntingFishing.free ? 'Free' : 'Reduced'}</p>
                    <p class="state-desc">${extras.huntingFishing.description}</p>
                </div>
            `;
        }
        if (extras.education) {
            cards += `
                <div class="state-benefit-card">
                    <h4>State Education Benefits</h4>
                    <p class="state-val">${extras.education.available ? 'Available' : 'None'}</p>
                    <p class="state-desc">${extras.education.description}</p>
                </div>
            `;
        }
        if (extras.incomeTax) {
            cards += `
                <div class="state-benefit-card">
                    <h4>Military Retirement Income Tax</h4>
                    <p class="state-val">${extras.incomeTax.militaryRetirementExempt ? 'Exempt' : 'Taxed'}</p>
                    <p class="state-desc">${extras.incomeTax.description}</p>
                </div>
            `;
        }
        if (extras.other && extras.other.length > 0) {
            for (const item of extras.other) {
                cards += `
                    <div class="state-benefit-card">
                        <h4>${item.name}</h4>
                        <p class="state-val">Included</p>
                        <p class="state-desc">${item.description}</p>
                    </div>
                `;
            }
        }
    }

    if (!cards) {
        cards = `<p class="no-data">Detailed state benefit data for ${r.stateData.name} is coming soon. Property tax exemption data is shown in the breakdown above.</p>`;
    }

    stateBenefitsDiv.innerHTML = `
        <div class="state-benefit-grid">${cards}</div>
        <p class="source-note">
            Sources: Compiled from state VA offices, <a href="https://www.veteransunited.com/futurehomeowners/veteran-property-tax-exemptions-by-state/" target="_blank" rel="noopener noreferrer">Veterans United</a>, and <a href="https://www.va.gov/statedva.htm" target="_blank" rel="noopener noreferrer">VA.gov State Directory</a>. Benefits vary by eligibility — verify details with your state VA office.
        </p>
    `;
}

function renderOverlookedBenefits() {
    const r = lastCalcResults;
    if (!r) return;

    const items = [
        {
            title: "Federal Student Loan Forgiveness",
            value: r.hasStudentLoans ? fmtInt(r.studentLoanSaved) + " forgiven" : "If applicable",
            desc: "100% of federal student loans forgiven through TPD discharge. The Department of Education automatically identifies eligible veterans. Includes Parent PLUS loans. Tax-free.",
            url: "https://studentaid.gov/tpd-discharge/",
            show: true
        },
        {
            title: "Chapter 31 Vocational Rehabilitation",
            value: "Up to " + fmtInt(chapter31Data.estimatedDegreeValue) + "+",
            desc: "Covers 100% of tuition (no cap, unlike GI Bill), books, supplies, equipment, and pays a monthly subsistence allowance. Often more valuable than the Post-9/11 GI Bill.",
            url: "https://www.va.gov/careers-employment/vocational-rehabilitation/",
            show: true
        },
        {
            title: "National Parks Lifetime Pass",
            value: "Free + amenity discounts",
            desc: "Free lifetime Interagency Access Pass to all 2,000+ national parks, wildlife refuges, and federal recreational lands — plus roughly 50% off camping and other amenity fees. Every honorably discharged veteran gets free park entry now, so the amenity discounts are what your rating adds.",
            url: "https://www.nps.gov/subjects/accessibility/interagency-access-pass.htm",
            show: true
        },
        {
            title: "Space-A Military Flights",
            value: "Free domestic flights",
            desc: "Space-Available flights within the US, plus direct travel to Alaska, Hawaii, Puerto Rico, USVI, Guam and American Samoa, as Category VI. Your spouse and dependent children can fly when they're traveling with you. Must have a DoD ID card.",
            url: "https://www.amc.af.mil/AMC-Travel-Site/",
            show: true
        },
        {
            title: "10-Point Federal Hiring Preference",
            value: "Career advantage",
            desc: "10-point hiring preference for all federal government jobs. Plus Schedule A non-competitive hiring authority — agencies can hire you directly.",
            url: "https://www.opm.gov/policy-data-oversight/veterans-services/vet-guide-for-hr-professionals/",
            show: true
        },
        {
            title: "Travel Reimbursement",
            value: "$0.415/mile",
            desc: "Reimbursed for travel to and from VA medical appointments. $3 deductible each way, capped at $18/month in deductibles.",
            url: "https://www.va.gov/health-care/get-reimbursed-for-travel-pay/",
            show: true
        },
        {
            title: "Clothing Allowance",
            value: fmtInt(additionalBenefits.clothingAllowance.annual2026) + "/year",
            desc: "Annual payment if prosthetic devices or skin medications damage your clothing. Apply by August 1 each year.",
            url: "https://www.va.gov/disability/eligibility/special-claims/clothing-allowance/",
            show: true
        },
        {
            title: "COLA: Automatic Annual Raises",
            value: "~2.6%/year average",
            desc: "VA compensation increases automatically every year with Social Security COLA. No action needed. The 2026 increase was 2.8%. Over time, this significantly increases your benefits.",
            url: "https://www.va.gov/disability/compensation-rates/veteran-rates/",
            show: true
        },
        {
            title: "Concurrent Retirement & Disability Pay (CRDP)",
            value: "Full retirement + full VA disability",
            desc: "Military retirees with 50%+ VA disability receive both full military retirement pay AND full VA disability compensation — no offset. Automatic enrollment.",
            url: "https://www.dfas.mil/retiredmilitary/disability/crdp/",
            show: r.isRetiree
        },
        {
            title: "Combat-Related Special Compensation (CRSC)",
            value: "Tax-free combat pay",
            desc: "Military retirees with combat-related disabilities (including training injuries, airborne ops, and hazardous duty) can receive tax-free CRSC payments instead of taxable retirement pay. Requires a separate application to your branch — process varies by service. You receive whichever is higher: CRDP or CRSC.",
            url: "https://www.dfas.mil/retiredmilitary/disability/crsc/",
            show: r.isRetiree
        },
        {
            title: "$0 VA Healthcare — What It Really Means",
            value: "$0 copays across the board",
            desc: "Priority Group 1 = zero copays for everything: ER visits ($2,200 avg civilian cost), ambulance ($1,200), surgeries, mental health ($200/session), prescriptions ($150/mo avg), and preventive care. All through VA facilities or VA-authorized community care.",
            url: "https://www.va.gov/health-care/about-va-health-benefits/",
            show: true
        },
        {
            title: "VA Life Insurance (VALife)",
            value: "Up to $40,000 coverage",
            desc: "Guaranteed-issue whole life insurance — no health exam, no health questions. Available to veterans with any service-connected disability. Critical if your disabilities make you uninsurable on the civilian market. Premiums based on age, not health.",
            url: "https://www.va.gov/life-insurance/options-eligibility/valife/",
            show: true
        },
        {
            title: "Service Dog — Free Veterinary Care",
            value: "Free care for your service dog",
            desc: "The VA provides service dogs for qualifying veterans with PTSD, mobility impairments, and other conditions. Once enrolled, the VA covers all veterinary care, equipment, and training for your service dog.",
            url: "https://www.prosthetics.va.gov/ServiceAndGuideDogs.asp",
            show: true
        },
        {
            title: "Veterans Treatment Courts",
            value: "Legal protection",
            desc: "Over 600 Veterans Treatment Courts nationwide offer an alternative to traditional criminal courts. Eligible veterans get treatment-focused programs instead of incarceration, with access to VA services, mentors, and case dismissal upon completion. Free legal help is also available through VA-accredited attorneys and legal clinics.",
            url: "https://www.va.gov/homeless/vjo.asp",
            show: true
        },
        {
            title: "ABLE Accounts — Tax-Free Savings",
            value: "Up to $20,000/yr tax-free",
            desc: "Tax-advantaged savings accounts for veterans with disabilities. Contributions up to $20,000/year (the 2026 limit, IRS Rev. Proc. 2025-32) grow tax-free, withdrawals for qualified expenses are tax-free, and the balance doesn't count against VA pension or SSI asset limits. Available in every state — many run through Fidelity or Vanguard.",
            url: "https://www.ablenrc.org/what-is-able/",
            show: true
        },
        {
            title: "SMC Add-Ons Above Your 100%",
            value: "$139.87+/mo extra",
            desc: `Special Monthly Compensation stacks ON TOP of a 100% rating. SMC-K pays ${fmtDec(smcRates['K'].veteran)}/month for loss of use — including ED secondary to medication, which is rated 0% but still unlocks it, and almost nobody claims it. SMC-S (Housebound) pays above the 100% rate if you have a separate 60% disability or are housebound. Check your rating letter; our free Secondary Conditions tool maps the paths.`,
            url: "/secondary-conditions/?source=pt-benefits",
            show: true
        },
        {
            title: "Caregiver Program (PCAFC)",
            value: "Monthly stipend + CHAMPVA",
            desc: "If you need help with daily personal care, the Program of Comprehensive Assistance for Family Caregivers pays your spouse or family member a monthly stipend keyed to the GS-4 federal pay rate for your area — at two levels based on your care needs. The caregiver also gets CHAMPVA health coverage if not otherwise insured, plus at least 30 days of respite care a year.",
            url: "https://www.va.gov/family-and-caregiver-benefits/health-and-disability/comprehensive-assistance-for-family-caregivers/",
            show: true
        }
    ];

    let html = '<div class="overlooked-grid">';
    for (const item of items) {
        if (!item.show) continue;
        html += `
            <div class="overlooked-card">
                <div class="overlooked-header">
                    <h4>${item.title}</h4>
                    <span class="overlooked-value">${item.value}</span>
                </div>
                <p class="overlooked-desc">${item.desc}</p>
                ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="overlooked-link">Learn more</a>` : ''}
            </div>
        `;
    }
    html += '</div>';
    overlookedBenefitsDiv.innerHTML = html;
}

function renderSurvivorBenefits() {
    const r = lastCalcResults;
    if (!r) return;

    let monthlyDIC = dicData.baseSurvivorSpouse;
    let details = [`Base DIC: ${fmtDec(dicData.baseSurvivorSpouse)}/mo`];

    details.push(`+ ${fmtDec(dicData.add8YearBonus)}/mo if you were 100% for 8+ continuous years`);

    if (r.numChildren > 0) {
        const childAdd = dicData.addPerChildUnder18 * r.numChildren;
        monthlyDIC += childAdd;
        details.push(`+ ${fmtDec(childAdd)}/mo for ${r.numChildren} child${r.numChildren > 1 ? 'ren' : ''}`);
    }

    survivorBenefitsDiv.innerHTML = `
        <div class="survivor-content">
            <p class="survivor-intro">When a 100% P&T veteran passes, their surviving spouse and dependents may receive Dependency and Indemnity Compensation (DIC) — tax-free monthly payments.</p>
            <div class="survivor-amount">
                <span class="survivor-label">Estimated Monthly DIC</span>
                <span class="survivor-value">${fmtDec(monthlyDIC)}/mo</span>
                <span class="survivor-annual">(${fmtInt(monthlyDIC * 12)}/year, tax-free)</span>
            </div>
            <div class="survivor-details">
                ${details.map(d => `<p>${d}</p>`).join('')}
            </div>
            <div class="survivor-also">
                <h4>Your survivors also keep:</h4>
                <ul>
                    <li>CHAMPVA healthcare eligibility</li>
                    <li>Chapter 35 DEA education benefits for dependents</li>
                    <li>Property tax exemption (in many states)</li>
                    <li>Commissary and exchange access</li>
                </ul>
                <p class="survivor-note">If the surviving spouse remarries before age ${dicData.remarriageAgeThreshold}, DIC ends — though it can resume if that marriage ends. Remarry at ${dicData.remarriageAgeThreshold} or older and DIC continues, along with CHAMPVA and home-loan eligibility. (Congress lowered this age from 57 to ${dicData.remarriageAgeThreshold} in 2021; a lot of guidance online still says 57.)</p>
            </div>
        </div>
    `;
}


// --- Slider Fill ---
function updateSliderFill() {
    const pct = ((projectionSlider.value - projectionSlider.min) / (projectionSlider.max - projectionSlider.min)) * 100;
    projectionSlider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, #ddd ${pct}%, #ddd 100%)`;
}

// --- Collapsible Input Groups ---
// --- Expandable Detail Sections ---
function setupExpandables() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('expand-btn')) {
            const targetId = e.target.dataset.target;
            const content = document.getElementById(targetId);
            if (content) {
                content.classList.toggle('expanded');
                e.target.classList.toggle('active');
            }
        }
    });
}

// --- View Toggle (monthly/annual/lifetime) ---
function setupViewToggle() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderBenefitBreakdown();
        });
    });
}

// --- Student Loan Toggle ---
function setupStudentLoanToggle() {
    hasStudentLoansSelect.addEventListener('change', () => {
        studentLoanWrapper.style.display = hasStudentLoansSelect.value === 'yes' ? 'block' : 'none';
    });
}

// --- URL Sharing ---
function buildShareUrl() {
    const params = new URLSearchParams();
    params.set('r', currentRatingSelect.value);
    params.set('a', veteranAgeInput.value);
    params.set('s', stateSelect.value);
    params.set('ret', isRetireeSelect.value);
    params.set('m', maritalStatusSelect.value);
    params.set('c', numChildrenInput.value);
    params.set('cc', numCollegeChildrenInput.value);
    params.set('dp', dependentParentsSelect.value);
    params.set('hv', homeValueInput.value);
    params.set('oh', ownsHomeSelect.value);
    params.set('va', vaLoanAmountInput.value);
    params.set('sl', hasStudentLoansSelect.value);
    if (hasStudentLoansSelect.value === 'yes') params.set('slb', studentLoanBalanceInput.value);
    params.set('oi', otherIncomeInput.value);
    params.set('py', projectionSlider.value);
    if (includeColaCheckbox.checked) params.set('cola', '1');
    if (colaBasisSelect && colaBasisSelect.value === 'recent') params.set('colab', 'recent');
    // Preserve the sender's mode so a shared link opens on the same framing
    // they were looking at, not the default.
    if (typeof currentMode === 'string' && currentMode !== 'rated') params.set('mode', currentMode);
    if (smcLevelSelect.value !== 'none') params.set('smc', smcLevelSelect.value);
    if (smckCountSelect && smckCountSelect.value !== '0') params.set('smck', smckCountSelect.value);
    return window.location.origin + window.location.pathname + '?' + params.toString();
}

function loadFromUrl() {
    const p = new URLSearchParams(window.location.search);
    // NOT p.size — URLSearchParams.size is unsupported in Safari < 17, where it
    // reads undefined and every share link silently fails to restore.
    if ([...p.keys()].length === 0) return;
    if (p.has('r')) currentRatingSelect.value = p.get('r');
    if (p.has('a')) veteranAgeInput.value = p.get('a');
    if (p.has('s')) stateSelect.value = p.get('s');
    if (p.has('ret')) isRetireeSelect.value = p.get('ret');
    if (p.has('m')) maritalStatusSelect.value = p.get('m');
    if (p.has('c')) numChildrenInput.value = p.get('c');
    if (p.has('cc')) numCollegeChildrenInput.value = p.get('cc');
    if (p.has('dp')) dependentParentsSelect.value = p.get('dp');
    if (p.has('hv')) homeValueInput.value = p.get('hv');
    if (p.has('oh')) ownsHomeSelect.value = p.get('oh');
    if (p.has('va')) vaLoanAmountInput.value = p.get('va');
    if (p.has('sl')) {
        hasStudentLoansSelect.value = p.get('sl');
        studentLoanWrapper.style.display = p.get('sl') === 'yes' ? 'block' : 'none';
    }
    if (p.has('slb')) studentLoanBalanceInput.value = p.get('slb');
    if (p.has('oi')) otherIncomeInput.value = p.get('oi');
    if (p.has('py')) { projectionSlider.value = p.get('py'); projectionValueSpan.textContent = p.get('py') + ' years'; }
    if (p.get('cola') === '1') includeColaCheckbox.checked = true;
    if (p.has('colab') && colaBasisSelect) colaBasisSelect.value = p.get('colab');
    if (p.has('smc')) {
        // Legacy links stored K as a level; it's now a count of stacked awards.
        if (p.get('smc') === 'K') { if (smckCountSelect) smckCountSelect.value = '1'; }
        else smcLevelSelect.value = p.get('smc');
    }
    if (p.has('smck') && smckCountSelect) smckCountSelect.value = p.get('smck');
}

// --- Email Results ---
/**
 * Wire an email-capture form. Two of these exist: the result-moment capture
 * that appears the instant the answer lands (converts far better) and the
 * bottom-of-page one. `placement` is passed to GA4 so we can tell them apart.
 *
 * Validation is done here rather than with the `required` attribute — native
 * validation on a submit-gated form fails silently on mobile.
 */
function wireCapture({ form, input, btn, status, label, placement }) {
    if (!form || !input || !btn || !status) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = input.value.trim();
        status.className = 'email-status';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            status.textContent = 'Please enter a valid email address.';
            status.classList.add('email-error');
            input.focus();
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Sending...';
        status.textContent = '';

        try {
            const res = await fetch('/api/email-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, resultsUrl: buildShareUrl(), source: 'pt-benefits' }),
            });
            const data = await res.json();

            if (res.ok) {
                status.textContent = 'Check your inbox — your results link is on the way.';
                status.classList.add('email-success');
                input.value = '';
                if (typeof gtag === 'function') gtag('event', 'email_capture', { tool: '100-pt', placement });
            } else {
                status.textContent = data.error || 'Something went wrong. Please try again.';
                status.classList.add('email-error');
            }
        } catch {
            status.textContent = 'Network error. Please check your connection and try again.';
            status.classList.add('email-error');
        }

        btn.disabled = false;
        btn.textContent = label;
    });
}

function setupEmailResults() {
    wireCapture({
        form: emailResultsForm, input: emailInput, btn: emailSubmitBtn,
        status: emailStatus, label: 'Send My Results', placement: 'bottom'
    });
    wireCapture({
        form: document.getElementById('hero-capture-form'),
        input: document.getElementById('hero-email-input'),
        btn: document.getElementById('hero-email-btn'),
        status: document.getElementById('hero-email-status'),
        label: 'Email My Results', placement: 'hero'
    });
}

// --- Print ---
function setupPrint() {
    document.getElementById('print-btn').addEventListener('click', () => window.print());
    document.getElementById('share-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(buildShareUrl()).then(() => {
            const btn = document.getElementById('share-btn');
            btn.textContent = 'Link Copied!';
            setTimeout(() => { btn.textContent = 'Copy Link to Share'; }, 2000);
        });
    });
}

// --- Event Listeners ---
const colaBasisSelect = document.getElementById('cola-basis');

const allInputs = [
    currentRatingSelect, veteranAgeInput, stateSelect, isRetireeSelect, smcLevelSelect,
    maritalStatusSelect, numChildrenInput, numCollegeChildrenInput, dependentParentsSelect,
    homeValueInput, ownsHomeSelect, vaLoanAmountInput, hasStudentLoansSelect,
    studentLoanBalanceInput, otherIncomeInput, projectionSlider, includeColaCheckbox,
    colaBasisSelect, smckCountSelect
].filter(Boolean);

// Results are GATED behind the submit button (house standard, 7/18/26): there
// has to BE a result moment, because that moment is when the email capture
// converts. Typing updates the live running total only; the full breakdown
// re-renders on input ONLY once results are already on screen.
let resultsRevealed = false;

allInputs.forEach(input => {
    input.addEventListener('input', onInputChanged);
    input.addEventListener('change', onInputChanged);
});

function onInputChanged() {
    updateLiveTotal();
    if (resultsRevealed) calculate();
}

projectionSlider.addEventListener('input', () => {
    projectionValueSpan.textContent = projectionSlider.value + ' years';
    updateSliderFill();
});

currentRatingSelect.addEventListener('change', updateSMCVisibility);

// --- Initialize ---
populateStates();
populateSMC();
updateSMCVisibility();
setupExpandables();
setupViewToggle();
setupStudentLoanToggle();
setupPrint();
setupEmailResults();
loadFromUrl();
updateSliderFill();

/* ===================================================================
   VFI-funnel: mode pills, live total, submit gate, guided tour
   =================================================================== */

const resultsGate = document.getElementById('results-gate');
const liveTotalValue = document.getElementById('live-total-value');
const liveTotalSub = document.getElementById('live-total-sub');
const submitBtnEl = document.getElementById('submit-btn');
const ptFormEl = document.getElementById('pt-form');
const heroHeading = document.getElementById('hero-heading');
const modeBriefing = document.getElementById('mode-briefing');

/**
 * The number that accrues on screen while you type, before you submit.
 * Deliberately just the tax-free compensation — it's the figure a veteran can
 * check against their own deposit, so it builds trust in everything after it.
 */
function updateLiveTotal() {
    const hasSpouse = maritalStatusSelect.value === 'married';
    const kids = parseInt(numChildrenInput.value) || 0;
    const parents = parseInt(dependentParentsSelect.value) || 0;
    const liveK = smckCountSelect ? (parseInt(smckCountSelect.value) || 0) : 0;
    const monthly = computeCompWithSmc(hasSpouse, kids, parents, smcLevelSelect.value, liveK).total;

    liveTotalValue.textContent = fmtDec(monthly) + '/mo';
    liveTotalSub.textContent = `${fmtInt(monthly * 12)} a year, tax-free — before CHAMPVA, education, and state benefits.`;
}

/** Reveal results. `scroll` is false for share-link arrivals so we don't yank
 *  a returning visitor down the page before they've seen the header. */
function revealResults(scroll = true) {
    const first = !resultsRevealed;
    resultsRevealed = true;
    // Always flex-column: mode pills promote sections via CSS `order`, which
    // only applies in a flex container. Revealing as plain block made the
    // pill reordering silently do nothing on share-link arrivals.
    resultsGate.style.display = 'flex';
    resultsGate.style.flexDirection = 'column';
    calculate();
    if (first && typeof gtag === 'function') {
        gtag('event', 'show_results', { tool: '100-pt', mode: currentMode });
    }
    // The tour owns the viewport while it's running.
    if (scroll && !isTourActive()) {
        document.getElementById('hero-verdict').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Results walkthrough: once per visitor, only on a real button-press
    // reveal (scroll=true) — never for share-link arrivals, which land with
    // results already open and no orientation needed... they were sent here.
    if (first && scroll) {
        let seen = false;
        try { seen = localStorage.getItem('pt-results-tour-seen') === '1'; } catch { seen = true; }
        if (!seen) setTimeout(startResultsTour, 1000);
    }
}

ptFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    revealResults(true);
});

// --- Mode pills -----------------------------------------------------------
// Each pill has to visibly RESHAPE the tool, not just scroll: a gold briefing
// banner naming what changed, plus emphasis on the sections that mode cares
// about. Presets a mode applies are undone on leaving it; a choice the user
// made themselves always wins.
let currentMode = 'rated';
let ratingPresetByMode = false;

const MODE_COPY = {
    rated: {
        brief: '',
        heading: 'Your 100% P&T Lifetime Value'
    },
    notyet: {
        brief: 'Showing what the gap costs you. Set your current rating below and the "What You\'re Leaving on the Table" section prices out every month you stay short of 100% P&T — including the benefits that have no partial version, like CHAMPVA and Chapter 35.',
        heading: 'What Reaching 100% P&T Would Be Worth'
    },
    family: {
        brief: 'Showing the family side. CHAMPVA caps your household\'s medical costs at $3,000 a year, Chapter 35 pays each dependent up to $58,356 for school, and DIC continues for your spouse after you pass. Those three sections are expanded below.',
        heading: 'What Your Family Gets From Your 100% P&T'
    }
};

function setMode(m) {
    currentMode = m;
    document.querySelectorAll('.mode-pill').forEach(p => p.classList.toggle('active', p.dataset.mode === m));

    const copy = MODE_COPY[m] || MODE_COPY.rated;
    modeBriefing.textContent = copy.brief;
    modeBriefing.classList.toggle('show', !!copy.brief);
    if (heroHeading) heroHeading.textContent = copy.heading;

    // "Not there yet" only makes sense below 100% — nudge the rating down once,
    // and undo it if they leave the mode without having chosen for themselves.
    if (m === 'notyet' && currentRatingSelect.value === '100pt') {
        currentRatingSelect.value = '70';
        ratingPresetByMode = true;
        updateSMCVisibility();
    } else if (m !== 'notyet' && ratingPresetByMode) {
        currentRatingSelect.value = '100pt';
        ratingPresetByMode = false;
        updateSMCVisibility();
    }

    // Reshape: promote and OPEN the panels this mode is about. Never touch a
    // panel the user opened themselves — only the ones a mode promotes.
    const promote = { notyet: ['panel-compare'], family: ['panel-health', 'panel-family'] };
    const promoted = new Set(promote[m] || []);
    ['panel-compare', 'panel-health', 'panel-family'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.order = promoted.has(id) ? '-1' : '';
        if (promoted.has(id)) el.open = true;
    });
    resultsGate.style.display = resultsRevealed ? 'flex' : 'none';
    resultsGate.style.flexDirection = 'column';

    updateLiveTotal();
    if (resultsRevealed) calculate();
}

document.querySelectorAll('.mode-pill').forEach(p => {
    // No auto-scroll on pill click (Zak) — the reshape is the feedback.
    p.addEventListener('click', () => setMode(p.dataset.mode));
});

// TPD banner opens the Education panel where the discharge card lives.
const tpdBannerEl = document.getElementById('tpd-banner');
if (tpdBannerEl) {
    tpdBannerEl.addEventListener('click', () => {
        const panel = document.getElementById('panel-edu');
        if (!panel) return;
        panel.open = true;
        if (!isTourActive()) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// Glance tiles: open the matching panel and take the user there.
document.querySelectorAll('.glance-tile').forEach(t => {
    t.addEventListener('click', () => {
        const panel = document.getElementById(t.dataset.panel);
        if (!panel) return;
        panel.open = true;
        if (!isTourActive()) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// --- Guided tour ----------------------------------------------------------
const tourRoot = document.getElementById('tour-root');
const tourSpotlight = document.getElementById('tour-spotlight');
const tourTooltip = document.getElementById('tour-tooltip');
const tourStepLabel = document.getElementById('tour-step-label');
const tourTitle = document.getElementById('tour-title');
const tourText = document.getElementById('tour-text');
const tourBack = document.getElementById('tour-back');
const tourNext = document.getElementById('tour-next');
const tourExit = document.getElementById('tour-exit');

function isTourActive() { return tourRoot && !tourRoot.hidden; }

const TOUR_STEPS = [
    {
        target: null,
        title: 'Welcome — 60 seconds, then it\'s all yours',
        text: 'Most veterans know what their monthly check is. Almost nobody has added up the rest: CHAMPVA, Chapter 35 for the kids, your state\'s property tax exemption, student loan discharge. This puts one number on the whole thing. Exit anytime.'
    },
    {
        target: '#mode-pills',
        title: 'Tell us why you\'re here',
        text: 'Already rated 100% P&T, still working toward it, or here to see what your family gets? Pick one and the tool reorders itself around that question.'
    },
    {
        target: '#start-here-section',
        title: 'Five quick facts',
        text: 'Your rating, age, state, marital status and number of children. That is genuinely all we need — everything else has a sensible default. Go ahead and fill these in now; the total below moves as you type.'
    },
    {
        target: '#live-total',
        title: 'Your compensation, live',
        text: 'This is just the tax-free monthly check, updating as you type. It is the piece you can check against your own bank deposit — everything else the tool adds sits on top of it.'
    },
    {
        target: '#assumptions-drawer',
        title: 'Optional: sharpen the estimate',
        text: 'Own a home? Have student loans? Rated for SMC? Open this drawer and the property tax exemption, loan discharge and SMC math all get personalized. Skip it and we use reasonable defaults.'
    },
    {
        target: '#submit-btn',
        title: 'Then one click',
        text: 'We total every benefit you qualify for, show it monthly, annually and over your lifetime, and break out exactly which ones you would lose by dropping below 100% P&T. That\'s the tour.'
    }
];
// Results walkthrough — auto-runs once, right after the FIRST button-press
// reveal (never for share-link arrivals), and walks the user through how to
// read what they're looking at. Same engine, second step set.
const RESULTS_TOUR_STEPS = [
    {
        target: '#hero-verdict',
        title: 'Your headline number',
        text: 'This is the estimated value of everything your rating entitles you to over your projection period — compensation, healthcare, education, state benefits, all of it. Every figure below feeds into it.'
    },
    {
        target: '#glance-strip',
        title: 'The map: five categories',
        text: 'Your whole answer, one screen. Monthly Cash is what actually hits your bank account. The others are coverage, entitlements, and savings. Tap any tile and it takes you to the detail.'
    },
    {
        target: '#view-row',
        title: 'Monthly, annual, or lifetime',
        text: 'Every card below can show its value three ways. Monthly is easiest to check against real life; lifetime is the number nobody ever adds up.'
    },
    {
        target: '#panel-cash',
        title: 'Open panel = the detail',
        text: 'Each card is one dollar stream. Watch for the gold dashed card — that one is marked "savings, not cash deposited" because it is tax you avoid, not money you receive. We keep those separate on purpose.'
    },
    {
        target: '#panel-health',
        title: 'Closed panels still talk',
        text: 'The green figure on each closed panel tells you what is inside before you open it. A pulsing gold badge means there is detail waiting — click anywhere on the bar to open it. Go ahead and try this one; it holds CHAMPVA.'
    },
    {
        target: '#panel-missed',
        title: 'The one most people should read',
        text: 'Fifteen benefits most veterans never claim — SMC add-ons, caregiver stipends, guaranteed life insurance. If you only open one panel today, open this one.'
    },
    {
        target: '#email-results-container',
        title: 'Save your numbers',
        text: 'These results rebuild from a single link. Email it to yourself and you can come back after your next rating decision, change one field, and see what moved. That is the whole tour — the results are yours to explore.'
    }
];
let activeSteps = TOUR_STEPS;
let activeStorageKey = 'pt-tour-seen';
let tourStep = 0;

function positionTour() {
    const step = activeSteps[tourStep];
    if (!step.target) {
        tourSpotlight.style.cssText = 'display:block; left:50vw; top:' + (window.scrollY + window.innerHeight / 2) + 'px; width:0; height:0;';
        tourTooltip.style.left = Math.max(24, (window.innerWidth - Math.min(380, window.innerWidth - 48)) / 2) + 'px';
        tourTooltip.style.top = (window.scrollY + window.innerHeight / 2 - 140) + 'px';
        return;
    }
    const el = document.querySelector(step.target);
    if (!el) { nextTourStep(); return; }
    const r = el.getBoundingClientRect();
    // Hidden or zero-size target: hold position rather than snapping to (0,0),
    // which strands the spotlight in the corner and locks the step.
    if (r.width === 0 && r.height === 0) return;
    const pad = 8;
    tourSpotlight.style.cssText = `display:block; left:${r.left + window.scrollX - pad}px; top:${r.top + window.scrollY - pad}px; width:${r.width + pad * 2}px; height:${r.height + pad * 2}px;`;
    const tipWidth = Math.min(380, window.innerWidth - 48);
    const left = Math.max(24, Math.min(r.left + window.scrollX, window.innerWidth - tipWidth - 24));
    const tipHeight = tourTooltip.offsetHeight || 220;
    let top = r.bottom + window.scrollY + 16;
    // Tall targets (an opened drawer) would push the tooltip off-screen — flip above.
    if (top + tipHeight > window.scrollY + window.innerHeight - 12) {
        top = Math.max(window.scrollY + 12, r.top + window.scrollY - tipHeight - 16);
    }
    tourTooltip.style.left = left + 'px';
    tourTooltip.style.top = top + 'px';
}

function showTourStep(i) {
    tourStep = i;
    const step = activeSteps[i];
    // Skip steps whose target isn't rendered for this profile (e.g. a panel a
    // mode has hidden) — offsetParent is null for display:none subtrees.
    if (step.target) {
        const target = document.querySelector(step.target);
        if (target && target.offsetParent === null) {
            if (i >= activeSteps.length - 1) { endTour(); } else { showTourStep(i + 1); }
            return;
        }
    }
    tourStepLabel.textContent = `Step ${i + 1} of ${activeSteps.length}`;
    tourTitle.textContent = step.title;
    tourText.textContent = step.text;
    tourBack.style.visibility = i === 0 ? 'hidden' : 'visible';
    tourNext.textContent = i === activeSteps.length - 1 ? 'Finish' : 'Next';
    // Opening the drawer step actually opens the drawer, so the user can follow along.
    if (step.target === '#assumptions-drawer') {
        const d = document.getElementById('assumptions-drawer');
        if (d) d.open = true;
    }
    if (step.target) {
        const el = document.querySelector(step.target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(positionTour, 350);
    positionTour();
}

function nextTourStep() {
    if (tourStep >= activeSteps.length - 1) { endTour(); return; }
    showTourStep(tourStep + 1);
}

let tourReposition = null;

function startTour() {
    activeSteps = TOUR_STEPS;
    activeStorageKey = 'pt-tour-seen';
    tourRoot.hidden = false;
    showTourStep(0);
    // Track the target as interaction reflows the page (drawer opening, mode change).
    clearInterval(tourReposition);
    tourReposition = setInterval(() => { if (!tourRoot.hidden) positionTour(); }, 400);
}

function startResultsTour() {
    activeSteps = RESULTS_TOUR_STEPS;
    activeStorageKey = 'pt-results-tour-seen';
    tourRoot.hidden = false;
    showTourStep(0);
    clearInterval(tourReposition);
    tourReposition = setInterval(() => { if (!tourRoot.hidden) positionTour(); }, 400);
}

function endTour() {
    tourRoot.hidden = true;
    clearInterval(tourReposition);
    try { localStorage.setItem(activeStorageKey, '1'); } catch { /* private mode */ }
}

tourNext.addEventListener('click', nextTourStep);
tourBack.addEventListener('click', () => { if (tourStep > 0) showTourStep(tourStep - 1); });
tourExit.addEventListener('click', endTour);
// Clicking the real submit button is the input tour's natural finish — end it
// so the normal scroll-to-results takes over. (The results walkthrough then
// chains automatically on the first reveal via revealResults.)
submitBtnEl.addEventListener('click', () => { if (isTourActive() && activeSteps === TOUR_STEPS) endTour(); });
// Clicking outside the spotlight exits, same as the Exit button. Skip
// keyboard-activated clicks (detail === 0 — their coordinates are meaningless)
// and clicks on the tooltip or the restart button.
document.addEventListener('click', (e) => {
    if (tourRoot.hidden || e.detail === 0) return;
    if (e.target.closest('#tour-tooltip') || e.target.closest('#tour-restart')) return;
    if (e.target.closest('#submit-btn')) return;
    const r = tourSpotlight.getBoundingClientRect();
    const inSpotlight = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inSpotlight) endTour();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !tourRoot.hidden) endTour(); });
window.addEventListener('resize', () => { if (!tourRoot.hidden) positionTour(); });
window.addEventListener('scroll', () => { if (!tourRoot.hidden) positionTour(); }, { passive: true });
// Context-aware restart: before the reveal it replays the input tour; once
// results are on screen it replays the results walkthrough instead.
document.getElementById('tour-restart').addEventListener('click', () => {
    if (resultsRevealed) startResultsTour(); else startTour();
});

// --- Print: expand accordions -------------------------------------------
// CSS can't force a closed <details> to render its content, so open them all
// for the print run and restore the user's state afterwards.
let printOpened = [];
window.addEventListener('beforeprint', () => {
    printOpened = [...document.querySelectorAll('details:not([open])')];
    printOpened.forEach(d => { d.open = true; });
});
window.addEventListener('afterprint', () => {
    printOpened.forEach(d => { d.open = false; });
    printOpened = [];
});

// --- Boot -----------------------------------------------------------------
// Restore the shared mode before anything renders, so the briefing banner and
// hero heading are right on first paint rather than flashing the default.
const arrivalMode = new URLSearchParams(window.location.search).get('mode');
setMode(MODE_COPY[arrivalMode] ? arrivalMode : 'rated');
// A mode the sender chose is the sender's choice, not one of ours to undo.
ratingPresetByMode = false;
updateLiveTotal();

// A real share link carries a full profile — show its results immediately
// rather than making the recipient press a button to see what was shared.
// Keyed on the rating param, which buildShareUrl always sets: a link carrying
// only `?mode=family` is a framing, not a result, and should still be gated.
if (new URLSearchParams(window.location.search).has('r')) {
    revealResults(false);
}

// Auto-run the tour once per visitor, never for share-link arrivals.
let ptTourSeen = false;
try { ptTourSeen = localStorage.getItem('pt-tour-seen') === '1'; } catch { ptTourSeen = true; }
if (!ptTourSeen && !window.__ptArrivalHadParams) {
    setTimeout(startTour, 600);
}
