/**
 * VA Benefits Data for 100% P&T Calculator
 *
 * Sources:
 *   - VA Compensation Rates (2026, effective Dec 1 2025, 2.8% COLA):
 *     https://www.va.gov/disability/compensation-rates/veteran-rates/
 *   - CHAMPVA: https://www.va.gov/family-and-caregiver-benefits/health-and-disability/champva/
 *   - Chapter 35 DEA: https://www.va.gov/family-and-caregiver-benefits/education-and-careers/dependents-education-assistance/rates/
 *   - Chapter 31 VR&E: https://www.benefits.va.gov/vocrehab/vrerates27.asp
 *   - VA Funding Fee: https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/
 *   - DIC Rates: https://www.va.gov/family-and-caregiver-benefits/survivor-compensation/dependency-indemnity-compensation/survivor-rates/
 *   - State benefits: Compiled from state VA websites, VA Claims Insider, Veterans United
 *   - Civilian insurance costs: KFF 2025 Employer Health Benefits Survey
 *
 * Last verified: March 2026
 */

// --- VA Disability Compensation Monthly Rates (2026) ---
// Exact rates from VA rate tables, effective December 1, 2025 (2.8% COLA)
// Structure: compensationRates[rating] = { veteran, withSpouse, with1Child, withSpouseAnd1Child, ... }
export const compensationRates = {
    0:   { veteran: 0, withSpouse: 0, with1Child: 0, withSpouseAnd1Child: 0, additionalChildUnder18: 0, additionalChildOver18: 0, with1Parent: 0, with2Parents: 0, spouseAA: 0 },
    10:  { veteran: 180.42, withSpouse: 180.42, with1Child: 180.42, withSpouseAnd1Child: 180.42, additionalChildUnder18: 0, additionalChildOver18: 0, with1Parent: 180.42, with2Parents: 180.42, spouseAA: 0 },
    20:  { veteran: 356.66, withSpouse: 356.66, with1Child: 356.66, withSpouseAnd1Child: 356.66, additionalChildUnder18: 0, additionalChildOver18: 0, with1Parent: 356.66, with2Parents: 356.66, spouseAA: 0 },
    30:  { veteran: 552.47, withSpouse: 617.47, with1Child: 596.47, withSpouseAnd1Child: 666.47, additionalChildUnder18: 32, additionalChildOver18: 105, with1Parent: 604.47, with2Parents: 656.47, spouseAA: 61 },
    40:  { veteran: 795.84, withSpouse: 882.84, with1Child: 853.84, withSpouseAnd1Child: 947.84, additionalChildUnder18: 43, additionalChildOver18: 140, with1Parent: 865.84, with2Parents: 935.84, spouseAA: 81 },
    50:  { veteran: 1132.90, withSpouse: 1241.90, with1Child: 1205.90, withSpouseAnd1Child: 1322.90, additionalChildUnder18: 54, additionalChildOver18: 176, with1Parent: 1220.90, with2Parents: 1308.90, spouseAA: 101 },
    60:  { veteran: 1435.02, withSpouse: 1566.02, with1Child: 1523.02, withSpouseAnd1Child: 1663.02, additionalChildUnder18: 65, additionalChildOver18: 211, with1Parent: 1540.02, with2Parents: 1645.02, spouseAA: 121 },
    70:  { veteran: 1808.45, withSpouse: 1961.45, with1Child: 1910.45, withSpouseAnd1Child: 2074.45, additionalChildUnder18: 76, additionalChildOver18: 246, with1Parent: 1931.45, with2Parents: 2054.45, spouseAA: 141 },
    80:  { veteran: 2102.15, withSpouse: 2277.15, with1Child: 2219.15, withSpouseAnd1Child: 2406.15, additionalChildUnder18: 87, additionalChildOver18: 281, with1Parent: 2242.15, with2Parents: 2382.15, spouseAA: 161 },
    90:  { veteran: 2362.30, withSpouse: 2559.30, with1Child: 2494.30, withSpouseAnd1Child: 2704.30, additionalChildUnder18: 98, additionalChildOver18: 317, with1Parent: 2520.30, with2Parents: 2678.30, spouseAA: 181 },
    100: { veteran: 3938.58, withSpouse: 4158.17, with1Child: 4085.43, withSpouseAnd1Child: 4318.99, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 4114.82, with2Parents: 4291.06, spouseAA: 201.41 }
};

// --- Special Monthly Compensation (SMC) Rates (2026) ---
// Rates effective December 1, 2025 (2.8% COLA)
// Source: https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/
// SMC is paid INSTEAD of the standard 100% rate (except SMC-K which is added on top)
export const smcRates = {
    "none":  { label: "None (standard 100%)", veteran: 0, isAddOn: false },
    "K":     { label: "SMC-K (loss of use)", veteran: 139.87, isAddOn: true, description: "Added to any rate. For loss of use of one hand, one foot, both buttocks, one or both eyes, or reproductive organ." },
    "S":     { label: "SMC-S (Housebound)", veteran: 4408.53, withSpouse: 4628.12, with1Child: 4555.38, withSpouseAnd1Child: 4788.94, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 4584.77, with2Parents: 4761.01, isAddOn: false, description: "100% schedular + 60% or more for separate disability, OR permanently housebound." },
    "L":     { label: "SMC-L (Aid & Attendance)", veteran: 4900.83, withSpouse: 5120.42, with1Child: 5047.68, withSpouseAnd1Child: 5281.24, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 5077.07, with2Parents: 5253.31, isAddOn: false, description: "Need regular aid and attendance of another person due to service-connected disability." },
    "L-1/2": { label: "SMC-L 1/2", veteran: 5154.00, withSpouse: 5373.59, with1Child: 5300.85, withSpouseAnd1Child: 5534.41, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 5330.24, with2Parents: 5506.48, isAddOn: false, description: "Between L and M levels." },
    "M":     { label: "SMC-M", veteran: 5408.55, withSpouse: 5628.14, with1Child: 5555.40, withSpouseAnd1Child: 5788.96, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 5584.79, with2Parents: 5761.03, isAddOn: false, description: "Loss of use of both hands, both legs, one hand and one leg, blindness in both eyes with 5/200 or less, or permanently bedridden." },
    "M-1/2": { label: "SMC-M 1/2", veteran: 5780.00, withSpouse: 5999.59, with1Child: 5926.85, withSpouseAnd1Child: 6160.41, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 5956.24, with2Parents: 6132.48, isAddOn: false, description: "Between M and N levels." },
    "N":     { label: "SMC-N", veteran: 6152.64, withSpouse: 6372.23, with1Child: 6299.49, withSpouseAnd1Child: 6533.05, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 6328.88, with2Parents: 6505.12, isAddOn: false, description: "Loss of use of both hands and one foot, both legs and one hand, blindness and loss of use of one hand, or blindness and loss of one foot." },
    "N-1/2": { label: "SMC-N 1/2", veteran: 6514.00, withSpouse: 6733.59, with1Child: 6660.85, withSpouseAnd1Child: 6894.41, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 6690.24, with2Parents: 6866.48, isAddOn: false, description: "Between N and O levels." },
    "O/P":   { label: "SMC-O/P", veteran: 6877.12, withSpouse: 7096.71, with1Child: 7023.97, withSpouseAnd1Child: 7257.53, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 7053.36, with2Parents: 7229.60, isAddOn: false, description: "Conditions requiring highest level of aid and attendance beyond N." },
    "R.1":   { label: "SMC-R.1 (Higher A&A)", veteran: 9826.88, withSpouse: 10046.47, with1Child: 9973.73, withSpouseAnd1Child: 10207.29, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 10003.12, with2Parents: 10179.36, isAddOn: false, description: "Need higher level of aid and attendance, such as nursing home level care." },
    "R.2":   { label: "SMC-R.2 (A&A + Housebound)", veteran: 11271.67, withSpouse: 11491.26, with1Child: 11418.52, withSpouseAnd1Child: 11652.08, additionalChildUnder18: 109.11, additionalChildOver18: 352.45, with1Parent: 11447.91, with2Parents: 11624.15, isAddOn: false, description: "Entitled to R.1 AND is housebound." }
};

// --- COLA History (for projection calculations) ---
// Keyed by the year the COLA takes EFFECT. VA COLAs are effective Dec 1 of the
// keyed year and first appear in the payment issued the following month.
// Verified against published VA/SSA COLAs 2026-08-03 — do NOT re-key these to
// the "year the checks were paid"; the effective-December convention is right,
// and re-keying would shift every value by one year.
export const colaHistory = {
    2017: 2.0, 2018: 2.8, 2019: 1.6, 2020: 1.3, 2021: 5.9,
    2022: 8.7, 2023: 3.2, 2024: 2.5, 2025: 2.8,

    // Two projection assumptions the user chooses between in the UI.
    // The table above averages 3.42% over 2017-2025; the last ten COLAs
    // (2016-2025, including 2016's 0.3%) average 3.11%. 2.6% is approximately
    // the 20-year average and is the deliberately conservative default.
    conservative: 2.6,
    recentDecade: 3.1,

    // Legacy alias — kept so old share links that assumed a single rate still
    // resolve. Points at the conservative figure.
    historicalAverage: 2.6
};

// --- CHAMPVA Data ---
export const champvaData = {
    annualCatastrophicCap: 3000,
    costSharePercent: 25,          // 25% cost share for outpatient
    annualDeductibleIndividual: 50,
    annualDeductibleFamily: 100,
    inpatientDeductible: 0,
    medsByMailCost: 0,             // $0 for Meds by Mail prescriptions
    retailPharmacyCostShare: 25,   // 25% at OptumRx retail

    // Civilian insurance costs (KFF 2025 Employer Health Benefits Survey).
    // Verified against the KFF 2025 EHBS Summary of Findings 2026-08-03.
    // Next survey publishes ~Oct 2026 — refresh then.
    civilianFamilyPremiumTotal: 26993,    // Total annual family premium
    civilianFamilyPremiumWorker: 6850,    // Worker's annual share
    civilianSinglePremiumWorker: 1440,    // Worker's annual share (~$120/mo)
    civilianFamilyPremiumMonthly: 571,    // Worker's monthly share (~$6,850/12)
    civilianSinglePremiumMonthly: 120,
    civilianAverageDeductible: 1886,      // Average single deductible
    civilianAverageOOPMax: 12000,         // Typical employer family OOP max (matches champva tool)

    // For calculator: simplified annual civilian cost (worker premiums + average OOP)
    civilianFamilyAnnualCost: 10850,      // $6,850 premiums + ~$4,000 OOP
    civilianSingleAnnualCost: 2940,       // $1,440 premiums + ~$1,500 OOP

    // Equivalent market value (what you'd pay without employer subsidy)
    civilianFamilyFullPremiumMonthly: 2250, // Full unsubsidized family plan (~$27K/yr)
    civilianSingleFullPremiumMonthly: 750,

    // ACA marketplace comparison
    acaFamilyPremiumMonthly: 1800,   // Before subsidies
    // 2026 ACA maximum out-of-pocket limits (HHS final rule; revised upward
    // from the proposed $10,150/$20,300). Refresh each spring.
    acaOOPMaxIndividual: 10600,
    acaOOPMaxFamily: 21200,

    // Real scenarios for impact display.
    //
    // Two rules these numbers follow, both corrected 2026-08-03:
    //  1. CHAMPVA's 25% applies to the VA ALLOWABLE amount (Medicare-like
    //     rates), not the billed charge — that is why the CHAMPVA column is
    //     far below 25% of totalBill. Descriptions say so, because otherwise
    //     a reader who multiplies gets a different number and assumes an error.
    //  2. Civilian columns are bounded by real out-of-pocket maximums. A
    //     typical employer family OOP max is ~$12,000 and the 2026 ACA family
    //     cap is $21,200, so no single plan year can legally cost $50K-$100K
    //     in network. Multi-year events (a NICU stay spanning two plan years)
    //     hit the max twice, which is modeled explicitly.
    scenarios: [
        {
            label: "ER Visit — Broken Arm",
            totalBill: 7500,
            champvaCost: 500,
            civilianCost: 3500,
            description: "Emergency room visit, X-rays, cast, and follow-up. CHAMPVA pays 75% of the VA allowable amount — you pay 25% of that allowable, not 25% of the billed charge, after the $50 deductible."
        },
        {
            label: "ACL Surgery + Rehab",
            totalBill: 35000,
            champvaCost: 1200,
            civilianCost: 8000,
            description: "Knee surgery plus 3 months of physical therapy. CHAMPVA cost share stays well under the $3,000 annual cap."
        },
        {
            label: "Emergency Appendectomy",
            totalBill: 35000,
            champvaCost: 800,
            civilianCost: 4000,
            description: "Emergency surgery with a short hospital stay. CHAMPVA's inpatient cost share is the lesser of a per-day amount or 25% of the billed charge — for a one-to-two-night stay that lands in the low hundreds, capped by the $3,000 annual maximum. A commercial plan typically runs you through your deductible plus coinsurance."
        },
        {
            label: "Childbirth (Uncomplicated)",
            totalBill: 18000,
            champvaCost: 600,
            civilianCost: 4500,
            description: "Hospital delivery, prenatal care, and postnatal follow-up. CHAMPVA covers maternity comprehensively."
        },
        {
            label: "Emergency C-Section + Hospital Stay",
            totalBill: 203000,
            champvaCost: 3000,
            civilianCost: 12000,
            description: "Month-long hospital stay with emergency c-section. CHAMPVA's catastrophic cap limits your total annual cost to $3,000. A typical employer family plan runs you to its full out-of-pocket maximum instead — around $12,000, and up to $21,200 on a marketplace plan."
        },
        {
            label: "Cancer Treatment (1 Year)",
            totalBill: 150000,
            champvaCost: 3000,
            civilianCost: 12000,
            description: "Chemotherapy, radiation, surgery, and follow-up care for a full year. The $3,000 cap means predictable costs; a commercial plan means paying your full out-of-pocket maximum, roughly $12,000."
        },
        {
            label: "Weekly Therapy (1 Year)",
            totalBill: 10000,
            champvaCost: 750,
            civilianCost: 4000,
            description: "52 sessions of mental health therapy. CHAMPVA covers mental health with standard 25% cost share."
        },
        {
            label: "A Year of Prescriptions",
            totalBill: 4800,
            champvaCost: 0,
            civilianCost: 600,
            description: "Chronic maintenance medications for the family, filled through Meds by Mail: no cost share, no deductible, $0 — as long as the beneficiary has no other prescription coverage. Retail pharmacy through OptumRx would be a 25% cost share; a commercial plan charges per-fill copays all year."
        },
        {
            label: "NICU Stay (30+ Days)",
            totalBill: 1200000,
            champvaCost: 3000,
            civilianCost: 24000,
            description: "Extended NICU care for a newborn. Even against a seven-figure bill, your maximum is $3,000 for the year. A long NICU stay usually crosses a plan-year boundary, so a commercial plan can charge its full out-of-pocket maximum twice — roughly $24,000."
        },
        {
            label: "Any Catastrophic Event",
            totalBill: 500000,
            champvaCost: 3000,
            civilianCost: 12000,
            description: "However catastrophic the event, your family's maximum is $3,000 a year. A commercial plan caps you at its out-of-pocket maximum instead, around $12,000 in network — and denied or out-of-network claims are not capped at all."
        }
    ]
};

// --- Chapter 35 DEA (Dependents' Educational Assistance) ---
// Rates effective October 1, 2026 - September 30, 2027 (FY2027; updated 10/7/26. FY2026 was 1,574 / 1,244 / 912.)
// Source: va.gov/education/benefit-rates/chapter-35-rates/ — turns over every October 1.
export const chapter35Data = {
    fullTime: 1621.00,
    threeQuarter: 1281.00,
    halfTime: 939.00,
    maxMonths: 36,
    // Age eligibility: no upper limit if eligible after Aug 1, 2023
    // Legacy: ages 18-26 (or 23 if not in school)
    childAgeLimitLegacy: 26,
    // 10 years from the eligibility date. Extends to 20 years if VA rated the
    // veteran P&T with an effective date WITHIN 3 years of discharge, or for
    // spouses of service members who died on active duty. (The old comment had
    // this inverted as "3+ years after discharge" — corrected 2026-08-03.)
    spouseDurationYears: 10,
    spouseDurationYearsExtended: 20,
    totalPerDependent: 1621.00 * 36, // $58,356 at full-time
    description: "Up to 36 months of education benefits for eligible dependents. Covers tuition and provides a monthly stipend."
};

// --- Chapter 31 VR&E (Veteran Readiness & Employment) ---
// Rates effective October 1, 2026 - September 30, 2027 (FY2027, 3% CPI; updated 9/30/26)
export const chapter31Data = {
    subsistence: {
        fullTime: { noDeps: 837.23, oneDep: 1038.49, twoDeps: 1223.79, additionalDep: 89.18 },
        threeQuarter: { noDeps: 629.08, oneDep: 780.00, twoDeps: 914.97, additionalDep: 68.60 },
        halfTime: { noDeps: 420.92, oneDep: 521.51, twoDeps: 613.01, additionalDep: 45.75 }
    },
    coversFullTuition: true,  // No cap, unlike GI Bill
    coversBooksSupplies: true,
    coversEquipment: true,    // Laptops, software, tools
    estimatedDegreeValue: 100000, // Conservative estimate for 4-year degree
    description: "Covers 100% of tuition with no annual cap at public or private schools — unlike the Post-9/11 GI Bill — plus books, supplies, equipment, and a monthly subsistence allowance. The catch is that your counselor has to approve the school and program as part of your rehabilitation plan, so 'no cap' isn't 'any school you want.'"
};

// --- VA Healthcare Value ---
export const vaHealthcareData = {
    // Conservative against VA's own per-patient spending for priority groups
    // 1-4 (~$13,500/yr in the most recent published analysis). Excludes dental,
    // which is carried as a separate line below.
    annualValue: 12000,
    // Class IV comprehensive dental. Reduced from $3,000 on 2026-08-03: typical
    // commercial dental plans cap annual payouts at $1,000-$2,000, so $3,000/yr
    // recurring exceeded what any civilian plan would even pay out. $1,800 is
    // roughly a top-tier plan's full annual maximum — and VA has no maximum.
    dentalAnnualValue: 1800,
    // $0.415/mile. Beneficiary travel carries a $3 one-way / $6 round-trip
    // deductible capped at $18/month, which this figure does not net out.
    travelReimbursementPerMile: 0.415,
    travelDeductibleMonthlyCap: 18,
    description: "Free comprehensive VA healthcare: prescriptions, mental health, dental (Class IV), vision, hearing aids, specialty care. Priority Group 1 — highest priority."
};

// --- VA Home Loan Funding Fee ---
export const fundingFeeData = {
    // Fee percentages waived for service-connected disabled veterans
    firstUse: { zeroDown: 2.15, fiveDown: 1.50, tenDown: 1.25 },
    subsequentUse: { zeroDown: 3.30, fiveDown: 1.50, tenDown: 1.25 },
    cashOutRefi: { firstUse: 2.15, subsequentUse: 3.30 },
    irrrl: 0.50,
    // Waiver applies to veterans RECEIVING VA disability compensation (or
    // entitled to it but drawing retirement/active-duty pay instead), DIC
    // spouses, and pre-discharge memorandum ratings. A 0% non-compensable
    // rating with no compensation entitlement does not exempt — irrelevant for
    // this tool's audience, but the precise wording matters.
    description: "The VA loan funding fee is completely waived for veterans receiving VA disability compensation — every time you use the benefit, with no limit on uses."
};

// --- Survivor Benefits (DIC) ---
// Rates effective December 1, 2025 (2.8% COLA)
export const dicData = {
    baseSurvivorSpouse: 1699.36,          // Monthly base DIC for surviving spouse
    add8YearBonus: 360.85,               // If veteran was 100% for 8+ continuous years
    addPerChildUnder18: 421.00,
    addAidAndAttendance: 421.00,
    addHousebound: 197.22,
    transitionalBenefit: 359.00,          // First 2 years if spouse has child under 18
    // Lowered from 57 to 55 by the Johnny Isakson and David P. Roe Veterans
    // Health Care and Benefits Improvement Act of 2020, effective 2021-01-05.
    // Remarry at 55+ and the surviving spouse keeps DIC, CHAMPVA and home-loan
    // eligibility. Under 55, DIC ends but can resume if the marriage ends.
    remarriageAgeThreshold: 55,
    description: "Tax-free monthly payments to surviving spouse and dependents. Spouse keeps CHAMPVA, Chapter 35 DEA, property tax exemptions in many states."
};

// --- Additional Benefits ---
export const additionalBenefits = {
    clothingAllowance: {
        annual2026: 1053.19,
        description: "Annual payment for veterans whose prosthetic/orthopedic devices or medications damage clothing."
    },
    studentLoanForgiveness: {
        // The One Big Beautiful Bill Act made the IRC 108(f) death/disability
        // discharge exclusion PERMANENT for discharges after 2025-12-31,
        // covering federal and private education loans. The old "tax-free
        // through 2025" hedge was stale — the claim is stronger now, not
        // weaker. ARPA's broader all-discharge exclusion did expire, but TPD
        // is exactly the carve-out that survived. Claim is scoped to FEDERAL
        // tax; a few states may still tax the discharge.
        description: "100% of federal student loans forgiven through Total & Permanent Disability (TPD) discharge, and the forgiven balance is permanently free of federal income tax. The Department of Education runs a quarterly data match with VA and discharges eligible veterans automatically. Parent PLUS loans count.",
        taxFree: true,
        taxFreePermanent: true
    },
    nationalParksPass: {
        // Honest framing: since Nov 2022 EVERY honorably discharged veteran
        // gets a free lifetime Military Pass, so the disability-specific dollar
        // value here is ~$0. The Access Pass's real edge is the amenity
        // discounts, not the entry fee. Value zeroed out 2026-08-03 rather than
        // counting $80/yr the veteran would get regardless.
        annualValue: 0,
        comparisonPassPrice: 80, // America the Beautiful annual pass, for context
        description: "Free lifetime Interagency Access Pass to all 2,000+ national parks and federal recreational lands — plus roughly 50% off camping and other amenity fees, which the standard veteran pass does not include. (Every honorably discharged veteran now gets free lifetime park entry, so the entry itself isn't disability-specific.)"
    },
    spaceATravel: {
        description: "Space-Available military flights within the US (CONUS, plus direct travel to Alaska, Hawaii, Puerto Rico, USVI, Guam and American Samoa). Category VI priority. Your spouse and dependent children can fly too when they're traveling with you.",
        domesticOnly: true
    },
    commissaryExchange: {
        // DeCA's own citable figure is 23.7% average worldwide savings vs
        // commercial grocery. At ~$500/mo groceries that is ~$1,420/yr, so
        // $1,500 holds. NOTE: since Jan 2020 this is available to ALL veterans
        // with any service-connected rating — not a 100%-only benefit. Don't
        // market it as P&T-specific.
        annualSavings: 1500,
        savingsPercent: 23.7,
        description: "Full commissary, exchange (BX/PX/NEX), and MWR privileges. The Defense Commissary Agency puts average savings at 23.7% versus commercial grocery stores."
    },
    federalHiringPreference: {
        description: "10-point hiring preference for federal jobs, Schedule A non-competitive hiring, and the Veterans Recruitment Appointment. The one most veterans miss: the 30% or More Disabled Veteran authority lets an agency hire you non-competitively at ANY grade — no GS-11 ceiling like VRA."
    },
    speciallyAdaptedHousing: {
        sahGrant2026: 126526,
        shaGrant2026: 25350,
        description: "Grants up to $126,526 (SAH) or $25,350 (SHA) for home modifications. Can be used up to 6 times."
    },
    autoAllowance: {
        // FY2027 figure effective October 1, 2026 (FY2026 was $27,074.99). Source: va.gov/disability/compensation-rates/special-benefit-allowance-rates/ — turns over every October 1.
        amount2026: 27908.90,
        description: "One-time automobile allowance for veterans with qualifying severe disabilities (loss of limb, permanent vision impairment, severe burns)."
    }
};

// --- State-Specific Benefits ---
// Property tax data imported separately from state-tax-data.js
// This object holds additional state benefits beyond property tax
export const stateBenefits = {
    "AL": {
        vehicleReg: { exempt: true, savings: 100, description: "Free license plate and registration" },
        plates: { free: true, description: "Free disabled veteran plates" },
        huntingFishing: { free: true, description: "Free hunting and fishing license" },
        education: { available: true, description: "Alabama G.I. Dependent Scholarship: tuition and fees at state institutions for dependents of veterans rated at least 40% service-connected disabled." },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt from state income tax" },
        other: []
    },
    "AK": {
        vehicleReg: { exempt: true, savings: 100, description: "Free registration for 50%+ disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting and fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Alaska has no state income tax" },
        other: []
    },
    "AZ": {
        vehicleReg: { exempt: true, savings: 75, description: "Reduced registration fees for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free combination hunt/fish license for 100% disabled veterans" },
        education: { available: true, description: "Arizona offers tuition waivers at state universities and community colleges for dependents of veterans with qualifying service-connected disabilities." },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay is fully exempt, with no cap, since tax year 2021 (SB 1828). The old $3,500 cap is long gone." },
        other: [{ name: "State Parks", description: "Free annual state park pass" }]
    },
    "AR": {
        vehicleReg: { exempt: true, savings: 50, description: "Free vehicle registration for 100% disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free lifetime hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Arkansas Military Dependent Scholarship: waives tuition, fees and room/board at state institutions for dependents of veterans rated 100% permanently and totally disabled, MIA, POW, or KIA." },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "CA": {
        vehicleReg: { exempt: true, savings: 250, description: "Exempt from ALL registration and license fees on 1 vehicle" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: false, description: "Reduced-fee license for 50%+ service-connected disability" },
        education: { available: true, description: "CalVet Fee Waiver — tuition and fees waived at CA public colleges/universities for dependents", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Up to $20,000 of military retirement and SBP income is excluded for tax years 2025-2029, for AGI under $125,000 single or $250,000 joint (SB 132, signed June 2025). California was the last state to fully tax military retirement; that ended with the 2025 tax year." },
        other: [{ name: "State Parks", description: "Free or reduced-fee state park pass for disabled veterans" }]
    },
    "CO": {
        vehicleReg: { exempt: true, savings: 75, description: "One set of free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free small game and fishing license for 60%+ disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Under 55: military retirement subtraction up to $15,000. Age 55+: fully deductible beginning tax year 2026, after SB25-136 removed the pension-subtraction caps." },
        other: []
    },
    "CT": {
        vehicleReg: { exempt: true, savings: 100, description: "Free registration for 100% disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "DE": {
        vehicleReg: { exempt: true, savings: 40, description: "Free registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for 60%+ disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military pension exclusion up to $12,500 — at every age. Turning 60 does not make it fully exempt; the general pension exclusion also caps at $12,500. (A $25,000 phase-in has been introduced twice and has not been enacted.)" },
        other: []
    },
    "FL": {
        vehicleReg: { exempt: true, savings: 225, description: "Free vehicle registration and plate for 100% P&T" },
        plates: { free: true, description: "Free disabled veteran license plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for 100% P&T veterans" },
        education: { available: true, description: "Dependents get tuition waiver at FL state colleges and universities", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Florida has no state income tax" },
        other: [
            { name: "Toll Roads", description: "Free SunPass transponder" },
            { name: "State Parks", description: "Free annual state park pass for 100% P&T veterans" }
        ]
    },
    "GA": {
        vehicleReg: { exempt: true, savings: 75, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Up to $65,000 of military retirement is excludable at ANY age beginning tax year 2026, each spouse separately (HB 266, signed May 2025). Before 2026 it was age-tiered." },
        other: []
    },
    "HI": {
        vehicleReg: { exempt: true, savings: 50, description: "Free registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: false, description: "No specific disabled veteran exemption" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "ID": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates for 100% P&T" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for 100% disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "A capped deduction, not a blanket exemption: up to the Social Security maximum benefit, reduced dollar-for-dollar by any Social Security or railroad benefits you receive. 2025 amendments broadened eligibility to age 62+ (down from 65), disabled, or employed during the year." },
        other: []
    },
    "IL": {
        vehicleReg: { exempt: true, savings: 150, description: "Free DV plates + registration fee waiver" },
        plates: { free: true, description: "Free disabled veteran plates" },
        huntingFishing: { free: true, description: "No license required for 10%+ disabled veterans (any state)" },
        education: { available: true, description: "Illinois Veterans Grant — tuition-free at IL public colleges for eligible veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "IN": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting on designated days" },
        education: { available: true, description: "Remission of fees for children of disabled veterans at IN state schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay is 100% exempt with no dollar cap since tax year 2022, completing the phase-out enacted in 2019. The old $6,250 deduction no longer applies." },
        other: []
    },
    "IA": {
        vehicleReg: { exempt: true, savings: 50, description: "Free registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "War Orphans Educational Aid for children of deceased/100% disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "KS": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Kansas waives tuition and fees at state institutions for dependents of veterans who are 100% permanently and totally disabled, MIA, POW, or who died of a service-connected cause." },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "KY": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for 100% disabled veterans" },
        education: { available: true, description: "Tuition waiver for children/spouses of 100% P&T veterans at KY state schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: false, description: "Not fully exempt. Retired before 1/1/1998: fully exempt. Retired after: pension income exclusion up to $31,110, plus an additional Schedule P exclusion for the portion of the pension earned before 1/1/1998." },
        other: []
    },
    "LA": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates for 50%+ disabled" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Louisiana Dependents Educational Assistance: tuition exemption at state institutions for dependents of veterans rated 90%+ service-connected disabled, plus a monthly stipend." },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "ME": {
        vehicleReg: { exempt: true, savings: 50, description: "Free registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Tuition waiver at University of Maine for dependents of 100% P&T veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay exempt (for those receiving VA disability)" },
        other: []
    },
    "MD": {
        vehicleReg: { exempt: true, savings: 75, description: "Free registration for 100% disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Edward T. Conroy Memorial Scholarship for dependents of disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: false, description: "Not fully exempt at any age. Subtraction of up to $12,500 if you are under 55, up to $20,000 at 55 or older. The 2025 bills to expand this did not pass." },
        other: []
    },
    "MA": {
        vehicleReg: { exempt: true, savings: 75, description: "Free registration for 100% disabled veterans" },
        plates: { free: true, description: "Free DV plates with handicap designation" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Tuition waiver at MA state colleges/universities for disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay exempt (pension exclusion)" },
        other: []
    },
    "MI": {
        vehicleReg: { exempt: true, savings: 100, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for 100% disabled veterans" },
        education: { available: true, description: "Tuition assistance for dependents of 100% disabled veterans at MI state schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "MN": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Tuition waiver at MN state colleges for children of deceased/100% disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay exempt (Social Security subtraction)" },
        other: [{ name: "State Parks", description: "Free annual state park permit for disabled veterans" }]
    },
    "MS": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free lifetime hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "MO": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing permit for disabled veterans" },
        education: { available: true, description: "Wartime Veterans Survivors Grant for dependents", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "MT": {
        vehicleReg: { exempt: true, savings: 50, description: "Reduced registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for 60%+ disabled veterans" },
        education: { available: false, description: "Montana's dependent tuition waiver is survivor-only (children of veterans who died in service or from a service-connected disability), and also covers POW/MIA cases. Living disabled veterans' dependents do not qualify." },
        incomeTax: { militaryRetirementExempt: true, description: "Partially exempt: the subtraction is the lesser of your Montana-source wage income or 50% of military pension income, for up to 5 consecutive years (SB 104, 2023). Residents before 6/30/2023 may claim it through tax year 2028; the provision sunsets in 2033." },
        other: []
    },
    "NE": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing permit for disabled veterans" },
        education: { available: true, description: "Waiver of tuition at NE state colleges for dependents of 100% disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay exempt (phased in)" },
        other: []
    },
    "NV": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Nevada has no state income tax" },
        other: []
    },
    "NH": {
        vehicleReg: { exempt: true, savings: 50, description: "Free registration for 100% disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "New Hampshire provides free tuition at state institutions for children of veterans rated permanently and totally disabled from a service-connected cause." },
        incomeTax: { militaryRetirementExempt: true, description: "New Hampshire has no income tax on earned income" },
        other: []
    },
    "NJ": {
        vehicleReg: { exempt: true, savings: 100, description: "Free registration for 100% disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "NM": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Vietnam Veterans Scholarship for dependents at NM state schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Up to $30,000 of military retirement is exempt — but the statute authorizes this only through tax year 2026 (NMSA 7-2-5.13). Unless the legislature extends it, 2026 is the final year." },
        other: []
    },
    "NY": {
        vehicleReg: { exempt: true, savings: 100, description: "Registration fee exemption for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: false, description: "Reduced-fee license for 40%+ disability" },
        education: { available: true, description: "Military Enhanced Recognition Incentive and Tribute (MERIT) scholarship for dependents", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: [{ name: "State Parks", description: "Free state park access for disabled veterans" }]
    },
    "NC": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free disabled veteran plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for 100% disabled veterans" },
        education: { available: true, description: "Scholarships available for dependents of disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Full deduction of military retirement pay for any retiree with 20+ years of service or who was medically retired under 10 U.S.C. ch. 61, and for their SBP beneficiaries, since tax year 2021 (SB 105). The old 'Bailey' 5-years-before-1989 rule no longer governs." },
        other: []
    },
    "ND": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Tuition waiver for dependents of 100% disabled veterans at ND state schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay partially exempt" },
        other: []
    },
    "OH": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free fishing, hunting, fur taker, deer, turkey permits and stamps (5-year renewable)" },
        education: { available: true, description: "Ohio War Orphans Scholarship for children of disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay exempt" },
        other: []
    },
    "OK": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "Oklahoma's dependent tuition waiver is survivor-only, covering dependents of service members killed in the line of duty. Living disabled veterans' dependents do not qualify." },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "OR": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Oregon offers tuition assistance at state institutions for dependents of veterans rated 100% service-connected disabled." },
        incomeTax: { militaryRetirementExempt: false, description: "No general military-retirement exemption. You may subtract the portion of retired pay attributable to service before Oct 1, 1991, pro-rated by months of pre-1991 service. Same treatment for SBP survivors." },
        other: []
    },
    "PA": {
        vehicleReg: { exempt: true, savings: 75, description: "Free registration for 100% disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Educational Gratuity for children of deceased/100% disabled veterans at PA state schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt (PA exempts all retirement income)" },
        other: []
    },
    "RI": {
        vehicleReg: { exempt: true, savings: 50, description: "Free registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military service pensions are fully exempt with no age or income limit, for tax years beginning on or after 1/1/2023. This is a separate modification from the general pension exclusion and cannot be double-claimed." },
        other: []
    },
    "SC": {
        vehicleReg: { exempt: true, savings: 200, description: "Up to 2 vehicles exempt from property tax + free plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Free tuition at SC state colleges for dependents of certain disabled veterans", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "SD": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "South Dakota's dependent tuition program is survivor-only — it covers dependents of veterans who died in service or from a service-connected cause, not dependents of living disabled veterans." },
        incomeTax: { militaryRetirementExempt: true, description: "South Dakota has no state income tax" },
        other: []
    },
    "TN": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "Tennessee Helping Heroes and dependent programs provide tuition assistance for children of veterans rated 100% permanently and totally disabled." },
        incomeTax: { militaryRetirementExempt: true, description: "Tennessee has no state income tax" },
        other: []
    },
    "TX": {
        vehicleReg: { exempt: true, savings: 75, description: "Free vehicle registration for 100% P&T" },
        plates: { free: true, description: "Free disabled veteran license plates" },
        huntingFishing: { free: true, description: "Free Super Combo hunting/fishing license ($68 value)" },
        education: { available: true, description: "Hazelwood Act — up to 150 hours of free tuition at TX public colleges for veterans and dependents", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Texas has no state income tax" },
        other: [
            { name: "State Parks", description: "Free Texas State Parks Pass" }
        ]
    },
    "UT": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay credit available" },
        other: []
    },
    "VT": {
        vehicleReg: { exempt: true, savings: 50, description: "Free registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement and survivor benefits are fully exempt at federal AGI of $125,000 or less, phasing out between $125,000 and $175,000, with no exemption at $175,000+ (Act 71, effective tax year 2025). It can now be claimed alongside the Social Security exemption." },
        other: []
    },
    "VA": {
        vehicleReg: { exempt: true, savings: 100, description: "One vehicle registration fee waiver + free DV plates" },
        plates: { free: true, description: "Free disabled veteran plates" },
        huntingFishing: { free: true, description: "Free lifetime hunting and fishing license" },
        education: { available: true, description: "Virginia Military Survivors and Dependents Education Program — tuition waiver at VA public schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay exempt (phased in, fully exempt by 2025)" },
        other: []
    },
    "WA": {
        vehicleReg: { exempt: true, savings: 100, description: "Exempt from license fees on 1 vehicle per year" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: false, description: "Reduced fees for 30%+ service-connected disability" },
        education: { available: true, description: "Washington waives tuition and fees at state institutions for children and spouses of veterans rated 100% permanently and totally disabled, MIA, POW, or KIA." },
        incomeTax: { militaryRetirementExempt: true, description: "Washington has no state income tax" },
        other: []
    },
    "WV": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay fully exempt" },
        other: []
    },
    "WI": {
        vehicleReg: { exempt: true, savings: 75, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: true, description: "WI GI Bill Tuition Remission for dependents at UW system schools", monthlyValue: 0 },
        incomeTax: { militaryRetirementExempt: true, description: "Military retirement pay exempt" },
        other: []
    },
    "WY": {
        vehicleReg: { exempt: true, savings: 50, description: "Free DV plates" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: true, description: "Free hunting/fishing license for disabled veterans" },
        education: { available: false, description: "No state-specific education benefit" },
        incomeTax: { militaryRetirementExempt: true, description: "Wyoming has no state income tax" },
        other: []
    },
    "DC": {
        vehicleReg: { exempt: true, savings: 75, description: "Free registration for disabled veterans" },
        plates: { free: true, description: "Free DV plates" },
        huntingFishing: { free: false, description: "N/A" },
        education: { available: false, description: "No DC-specific education benefit" },
        incomeTax: { militaryRetirementExempt: false, description: "The District taxes military retirement pay as ordinary income. There is no military-specific exclusion — only the general $3,000 retirement-income deduction available to DC residents." },
        other: []
    }
};
