/**
 * 100-pt data-integrity test — the permanent home of the checks built during
 * the August 2026 audit (see workspace pt-benefits-audit-2026-08.md).
 *
 *   node 100-pt/test/data-integrity.mjs        # from tbv-tools/
 *
 * Guards three classes of bug that all shipped at some point:
 *  1. Assessment-basis errors — a "fixed_amount off assessed value" treated as
 *     market value understated WY by ~10x.
 *  2. Narrow-tier capture — resolveExemption returns the FIRST tier a rating
 *     matches, so a tier whose real eligibility is narrower than its rating
 *     gate (SAH grants, paraplegia) silently overpays everyone (NH, RI, MA, ME).
 *  3. Rate rot — mixed-vintage effective tax rates, ~15 states high.
 */
import { stateTaxData } from '../data/state-tax-data.js';
import process from 'node:process';

let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL  ' + msg); };

// Mirror of script.js resolveExemption/calculatePropertyTax core (those live
// behind DOM refs and can't be imported headless — keep in sync by hand).
function resolveExemption(sd, rating, hasPT) {
    for (const tier of (sd.veteranExemption?.tiers || [])) {
        if (rating >= tier.minRating) {
            if (tier.requiresPT && !hasPT) continue;
            return tier;
        }
    }
    return { type: 'none', value: 0 };
}
function toMarketEquivalent(amount, tier, sd) {
    if (!amount) return 0;
    if ((tier.basis || 'market') !== 'assessed') return amount;
    const ratio = sd.assessmentRatio;
    if (!ratio || ratio <= 0 || ratio > 1) return amount;
    return amount / ratio;
}

const NARROW = /specially adapted|adapted housing|paraplegi|blind|loss of (use of )?(a |one |two |both )?(limb|foot|hand|eye)|amputee|38 U.S.C. 2101|Medal of Honor|POW|prisoner of war/i;
// Phrases that mark the narrow condition as an ADDITIONAL path rather than a
// restriction (MI: "...TDIU, or holding a VA certificate..."; TN: "Four
// qualifying paths"). If a description matches NARROW but none of these, the
// tier is presumed to be silently over-capturing and the test fails.
const EXPLAINED = /separate|not tied to|requires|only to|limited to|also qualifies|or service-connected|at any rating|or holding|qualifying path|TDIU/i;
const VALID_TYPES = new Set(['full', 'fixed_amount', 'fixed_tax_credit', 'percentage', 'none']);

let checked = 0;
for (const [code, sd] of Object.entries(stateTaxData)) {
    checked++;
    if (sd.unverified) continue; // territories: flagged, excluded from checks

    // Rate sanity: effective rates live between 0.10% and 2.5% nationwide.
    if (!(sd.avgPropertyTaxRate >= 0.001 && sd.avgPropertyTaxRate <= 0.025)) {
        fail(`${code}: avgPropertyTaxRate ${sd.avgPropertyTaxRate} outside sane band`);
    }
    if (!(sd.assessmentRatio > 0 && sd.assessmentRatio <= 1.1)) {
        fail(`${code}: assessmentRatio ${sd.assessmentRatio} missing or absurd`);
    }

    for (const t of (sd.veteranExemption?.tiers || [])) {
        if (!VALID_TYPES.has(t.type)) fail(`${code}: unknown tier type ${t.type}`);
        if (t.type === 'fixed_amount' && !(t.value > 0) && !t.prorated) {
            fail(`${code}: fixed_amount tier without a positive value`);
        }
    }

    // Narrow-tier capture scan: what does a plain 100% P&T veteran resolve to?
    const tier = resolveExemption(sd, 100, true);
    const desc = tier.description || '';
    if (NARROW.test(desc) && !EXPLAINED.test(desc)) {
        fail(`${code}: 100% P&T resolves to a narrow-condition tier with no broader-path language: "${desc.slice(0, 90)}"`);
    }
}

// Engine spot checks against hand-computed values (verified Aug 2026):
// WY: $6,000 off ASSESSED value at 9.5% ratio => ~$63,158 market equivalent.
{
    const wy = stateTaxData['WY'];
    const t = resolveExemption(wy, 100, true);
    const mkt = toMarketEquivalent(t.value, t, wy);
    if (!(mkt > 60000 && mkt < 66000)) fail(`WY: market equivalent ${Math.round(mkt)} — basis conversion broken`);
}
// TX: full exemption at 100 => tier type full.
{
    const tx = resolveExemption(stateTaxData['TX'], 100, false);
    if (tx.type !== 'full') fail(`TX: expected full exemption at 100, got ${tx.type}`);
}
// ME: 100% P&T must resolve to the $6,000 tier, NOT the $50,000 SAH-grant tier.
{
    const me = resolveExemption(stateTaxData['ME'], 100, true);
    if (me.value !== 6000) fail(`ME: expected $6,000 default tier, got ${me.value}`);
}
// MA: default must be the $1,000 Clause 22E credit, not the $1,500 SAH clause.
{
    const ma = resolveExemption(stateTaxData['MA'], 100, true);
    if (ma.value !== 1000) fail(`MA: expected $1,000 Clause 22E default, got ${ma.value}`);
}

console.log(`${checked} jurisdictions checked.`);
console.log(failures ? `${failures} FAILURE(S)` : 'All data-integrity checks passed.');
process.exit(failures ? 1 : 0);
