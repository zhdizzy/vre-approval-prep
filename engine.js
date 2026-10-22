// VR&E Approval Prep — the scoring engine, shared by the page (script.js) and the node harness
// (test/sim.mjs). No DOM in here. Rules, not weights: each of the seven readiness elements resolves
// to 'doc' (documented), 'thin', or 'miss' from the input shape built by script.js.

import { HIGH_COST_THRESHOLD, ladderTier, ENTITLEMENT_CAP_MONTHS, MONTHS_PER_ACADEMIC_YEAR } from './data/rules.js';
import { FEATURE_BY_ID } from './data/limits.js';
import { CHECKLIST } from './data/checklist.js';
import { buildLetter, PROGRAM_NAMES, LEVEL_RANK } from './letter.js';

export const VRE_NO_LIMIT_DISCHARGE_YEAR = 2013;
export const VRE_WINDOW_YEARS = 12;
export const DEFAULT_YEARS = { cert: 1, trade: 1, assoc: 2, bach: 4, mast: 2, prof: 3 };
const fmtUSD = n => '$' + Math.round(n).toLocaleString('en-US');

export function eligibility(s, now = new Date().getFullYear()) {
  if (s.activeDuty) {
    if (s.rating != null && s.rating >= 20) return { st: 'doc', why: `A ${s.rating}% rating (or memorandum rating) at 20% or more opens VR&E to a service member within six months of discharge. Your period of eligibility starts the day you are discharged.`, act: '' };
    return { st: 'thin', why: 'Still serving: you can apply within six months of discharge with a memorandum rating. VA Form 28-0588 goes to the Veterans Service Center, which sets an anticipated rating from your service treatment records, usually within three business days. It has to come back at 20% or more.', act: 'File VA Form 28-0588 (or use your IDES proposed rating) before you apply on VA Form 28-1900.', link: ['https://www.va.gov/careers-employment/vocational-rehabilitation/eligibility/', 'VA eligibility page'] };
  }
  if (s.unrated) return { st: 'miss', why: 'VR&E needs a service-connected rating of 10% or more. There is no evaluation without one.', act: 'File the claim first. An Intent to File locks your effective date while you build it.', link: ['/va-combined/', 'Estimate your rating'] };
  if (s.pending) return { st: 'thin', why: 'Your claim is pending. You can prepare everything now and apply the day it posts.', act: 'Keep building the packet; add the rating when it arrives.' };
  if (s.rating === 0) return { st: 'miss', why: 'A 0% rating does not open VR&E; the program needs 10% or more.', act: 'If the conditions have worsened, an increase claim is the first step.', link: ['/va-combined/', 'Check the criteria'] };
  let win = { st: 'doc' };
  if (s.dischargeYear && s.dischargeYear < VRE_NO_LIMIT_DISCHARGE_YEAR) {
    if (!s.firstRatingYear) win = { st: 'thin', why: `Discharged ${s.dischargeYear}, so a 12-year window applies, running from the later of discharge or your first rating notice.`, act: 'Enter the year of your first VA rating in the drawer to check the window.' };
    else {
      const anchor = Math.max(s.dischargeYear, s.firstRatingYear);
      const open = (now - anchor) <= VRE_WINDOW_YEARS;
      win = open ? { st: 'doc' } : { st: 'miss', why: `Discharged ${s.dischargeYear}, first rated ${s.firstRatingYear}: the 12-year window has passed. A serious employment handicap finding can extend it.`, act: 'Ask the counselor about an extension before assuming it is closed; put the request in writing.' };
    }
  }
  if (win.st !== 'doc') return win;
  if (s.rating === 10) return { st: 'thin', why: 'At 10%, entitlement requires a serious employment handicap finding, not just an employment handicap. The bar is higher.', act: 'Make the severity case in section 2 of the letter: how the conditions limit work, with VA’s own findings quoted.' };
  const windowNote = s.dischargeYear && s.dischargeYear < VRE_NO_LIMIT_DISCHARGE_YEAR ? ', inside the 12-year window' : s.dischargeYear ? ', no time limit for discharges in 2013 or later' : '';
  return { st: 'doc', why: `Rated ${s.rating}%${windowNote}. The rating gets you the evaluation; the employment handicap finding is what opens the program.`, act: '' };
}

export function monthsNeeded(s) { return Math.round((s.years || 0) * MONTHS_PER_ACADEMIC_YEAR); }
export function monthsCheck(s) {
  const need = monthsNeeded(s), used = s.giUsed, cap = ENTITLEMENT_CAP_MONTHS;
  if (used == null) return { st: 'thin', need, used: null, total: null, why: 'Months you already used under the GI Bill or another VA education program count toward a combined 48. Tell us how many and we will check whether your program fits or needs an extension.', act: 'Enter your GI Bill months used in \u201cAdjust the details\u201d (0 if none). Your Statement of Benefits on VA.gov shows it.' };
  if (!need) return { st: 'thin', need, used, total: null, why: `You have used ${used} month${used === 1 ? '' : 's'} of other VA education benefits. Pick a program so we can estimate the months it needs.`, act: 'Choose what you want to train for in Start here.' };
  const total = used + need;
  if (need > cap) return { st: 'miss', need, used, total, why: `The program needs about ${need} months of Chapter 31 by itself, past the 48-month cap. Only a serious employment handicap finding lets Chapter 31 run longer (38 CFR 21.78(c)).`, act: 'Make the serious employment handicap case in the letter, and ask for the extension with the VR&E Officer\u2019s concurrence.' };
  if (total <= cap) return { st: 'doc', need, used, total, why: `About ${need} months needed plus ${used} already used is ${total}, inside the 48-month combined ceiling. No extension required.`, act: '' };
  return { st: 'thin', need, used, total, why: `About ${need} months needed plus ${used} already used is ${total}, past the 48-month combined ceiling. That is not a dead end: when the months are needed to become employable, they may be authorized (38 CFR 21.78(b)(3)), since Chapter 31 by itself stays under 48. It takes the counselor\u2019s approval and the VR&E Officer\u2019s concurrence.`, act: 'Ask for the extension by name. The letter now includes the request; expect this to be the counselor\u2019s first question on a second degree.' };
}

export function pairedFeatures(s) {
  return (s.features || []).map(id => FEATURE_BY_ID[id]).filter(f => f && f.pairsWith.some(l => (s.limits || []).includes(l)));
}

export function readiness(s) {
  const p = s.priv || {};
  const out = [];
  out.push({ id: 'elig', title: 'Basic eligibility', ...eligibility(s) });

  const hasLimits = (s.limits || []).length > 0, hasWording = !!(p.ratingWording || '').trim();
  out.push({ id: 'handicap', title: 'Employment handicap, in VA’s words',
    st: hasLimits && hasWording ? 'doc' : hasLimits || hasWording ? 'thin' : 'miss',
    why: hasLimits && hasWording ? 'You have named the limits and quoted the findings from your rating decision. That is the anchor of the whole letter.' : hasLimits ? 'You have named the limits. The letter is stronger when it quotes VA’s own findings from your rating decision.' : hasWording ? 'You quoted the decision. Check the limits in the drawer so the school supports can be matched to them.' : 'The employment handicap is what opens the program, and nothing here describes it yet.',
    act: hasLimits && hasWording ? '' : hasLimits ? 'Open your rating decision, find the findings under each condition, and paste them in the letter’s fill-in section.' : 'Check the limits in “Adjust the details,” then paste the findings from your rating decision in the letter.' });

  const hasGoal = !!(p.goal || '').trim(), occs = (p.occupations || []).filter(o => o && o.title && o.title.trim());
  out.push({ id: 'goal', title: 'A defined job goal',
    st: hasGoal && occs.length ? 'doc' : hasGoal || occs.length ? 'thin' : 'miss',
    why: hasGoal && occs.length ? `Goal stated and ${occs.length} target occupation${occs.length === 1 ? '' : 's'} named. The counselor writes the plan to an occupation code; you have given them one.` : hasGoal ? 'You have the goal in one line. Name the target occupations with their codes so the plan is written to the right ones.' : occs.length ? 'You named target occupations. Add the one-line goal so the letter opens with it.' : 'A vocational goal is the thing the plan is written to. Without one there is nothing to approve.',
    act: hasGoal && occs.length ? '' : 'Fill in the job line in the form and the target occupations in the letter’s fill-in section.' });

  let st4, why4, act4 = '';
  if (!s.programLevel || !s.education) { st4 = 'thin'; why4 = 'Tell us your current education and the program you want so we can check the level.'; act4 = 'Fill in both fields in Start here.'; }
  else {
    const d = LEVEL_RANK[s.programLevel] - LEVEL_RANK[s.education];
    if (d > 0) { st4 = 'doc'; why4 = `A ${PROGRAM_NAMES[s.programLevel]} is above what you hold. Under 38 CFR 21.72 the question is whether it is the level needed for entry into the goal; the job postings answer that.`; }
    else if (d === 0) { st4 = 'thin'; why4 = 'The program is at the same level as your current education. The counselor will ask why more training at this level is necessary for entry.'; act4 = 'Be ready to show a required license, a credential your current degree lacks, or a field change your conditions require.'; }
    else { st4 = 'miss'; why4 = 'The program is below your current education level. Expect the “already employable” objection.'; act4 = 'Explain why this specific training is necessary for entry into a suitable goal, or reconsider the goal.'; }
  }
  out.push({ id: 'level', title: 'Training level matches the goal (38 CFR 21.72)', st: st4, why: why4, act: act4 });

  out.push({ id: 'months', title: 'Months of entitlement (the 48-month ceiling)', ...monthsCheck(s) });

  out.push({ id: 'weams', title: 'School and program approved (WEAMS)',
    st: s.weams === 'yes' ? 'doc' : s.weams === 'no' ? 'miss' : 'thin',
    why: s.weams === 'yes' ? 'Both show as approved. Bring the printout.' : s.weams === 'no' ? 'A plan cannot be written to a program that is not approved. This has to be solved before anything else.' : 'The counselor has to verify in WEAMS that the school AND the specific program are approved before writing the plan. Check it yourself first.',
    act: s.weams === 'yes' ? '' : 'Look the school up in the GI Bill Comparison Tool (the public WEAMS search now redirects there) and confirm the program is listed under it.', link: ['https://www.va.gov/education/gi-bill-comparison-tool/', 'GI Bill Comparison Tool'] });

  const tier = ladderTier(s.cost);
  const altNamed = s.altCost > 0 || !!(p.altName || '').trim();
  const paired = pairedFeatures(s);
  let st6, why6, act6 = '';
  if (!s.cost) { st6 = 'thin'; why6 = 'Enter the annual cost. It decides who has to approve the plan and whether a memo is needed.'; act6 = 'Add tuition, fees, books, and supplies for one year.'; }
  else if (s.cost <= HIGH_COST_THRESHOLD) { st6 = 'doc'; why6 = `At ${fmtUSD(s.cost)} a year your counselor can approve the plan on their own authority. No memo.`; }
  else {
    // Over the line the case has two legs: (1) the cheaper school cannot deliver the plan's training
    // (38 CFR 21.120(c)(1)(ii)), and (2) school supports matched to the veteran's limits (the four questions).
    const legProgram = !!s.altLacksProgram, legSupport = paired.length >= 2;
    const legs = (legProgram ? 1 : 0) + (legSupport ? 1 : 0);
    const head = `Over ${fmtUSD(HIGH_COST_THRESHOLD)}: a memo goes to ${tier.approver}. `;
    if (altNamed && legs >= 1) { st6 = 'doc'; why6 = head + (legProgram && legSupport ? `You have named the alternative, shown it cannot deliver the training your goal requires, and matched ${paired.length} school supports to your limits. That is both arguments.` : legProgram ? 'You have named the alternative and said it cannot deliver the training your goal requires. Under 38 CFR 21.120(c) that takes it out of the comparison. Add the school supports that match your limits to make the second argument too.' : `You have named the alternative and matched ${paired.length} school supports to your limits, which is what the four questions ask for.`); }
    else if (altNamed || legs >= 1 || paired.length >= 1) { st6 = 'thin'; why6 = head + (altNamed ? 'The alternative is named. Now make at least one argument: it cannot deliver the training your goal requires, or this school\u2019s supports match your limits (two or more).' : 'You have an argument started. Now name the cheaper alternative the counselor will compare against.'); act6 = altNamed ? 'In the school card: tick \u201cdoesn\u2019t offer the program my goal requires\u201d if that is true, and check the supports that pair with your limits.' : 'Enter the alternative\u2019s name and annual cost in the school card.'; }
    else { st6 = 'miss'; why6 = head + 'The justification has to compare your school to the cheaper one: can it deliver the training your goal requires, and does it support your disability the same way. Nothing here makes that case yet.'; act6 = 'Name the alternative, then say what it lacks: the program itself, or the supports that pair with your limits.'; }
  }
  out.push({ id: 'cost', title: 'Cost: under the line, or justified', st: st6, why: why6, act: act6 });

  const visible = CHECKLIST.filter(c => c.showIf(s)), have = visible.filter(c => (s.evidence || []).includes(c.id)).length;
  out.push({ id: 'evidence', title: 'Evidence in hand', st: have >= 5 ? 'doc' : have >= 2 ? 'thin' : 'miss', why: `${have} of ${visible.length} items gathered.${have >= 5 ? ' Enough to walk in with.' : ' The rating decision, three job postings, and the school’s support letter carry the most weight.'}`, act: have >= 5 ? '' : 'Tick items in the evidence checklist card as you gather them.' });
  return out;
}

export function solve(s) {
  const ready = readiness(s);
  const tier = ladderTier(s.cost);
  const stake = (s.cost || 0) * (s.years || 0);
  const readyCount = ready.filter(r => r.st === 'doc').length;
  const gaps = ready.filter(r => r.st !== 'doc');
  const paired = pairedFeatures(s);
  const answered = new Set(paired.map(f => f.question)); if ((s.features || []).includes('placement')) answered.add(3);
  return { s, ready, readyCount, gaps, tier, stake, paired, answered, letter: buildLetter(s) };
}
