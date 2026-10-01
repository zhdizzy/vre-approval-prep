// VR&E Approval Prep — the rules the tool cites. Every entry carries its cite, a link, a verified
// date, and where it matters the exact text (`quote`). Plain-English lines are ours; quotes are VA's.
//
// Sources pulled 9/30/26 (workspace: vre-approval-prep-sources-2026-09.md and -sources-b-2026-09.md):
//   M28C.IV.C.2 (KnowVA 554400000252369, last modified 6/18/26), M28C.V.B.1 (554400000149945, 6/18/26),
//   M28C.V.B.6 (554400000143066), M28C.IV.B.1 (554400000144554), M28C.IV.A.1 (554400000144548),
//   M28C.III.C.2 (554400000142507); eCFR 38 CFR Part 21 Subpart A at point-in-time 2026-09-28;
//   38 U.S.C. 3103 (LII); benefits.va.gov FY2027 subsistence page (updated 8/27/26).
// Refresh calendar: Oct 1 (subsistence rates, via /gi-bill-vre/data/vre-rates.js); quarterly re-pull of
// M28C.IV.C.2 and M28C.V.B.1 (both edited 6/18/26 and can change again).

export const DATA_STAMP = 'September 30, 2026';
export const VERIFIED = '9/30/26';

const KV = id => `https://www.knowva.ebenefits.va.gov/system/templates/selfservice/va_ssnew/help/customer/locale/en-US/portal/554400000001018/content/${id}`;
export const KNOWVA = { facility: KV('554400000252369'), approvals: KV('554400000149945'), retro: KV('554400000143066'), evaluation: KV('554400000144554'), application: KV('554400000144548'), reviews: KV('554400000142507') };
export const ECFR = s => `https://www.ecfr.gov/current/title-38/chapter-I/part-21/subpart-A/section-21.${s}`;
export const COMPARISON_TOOL = 'https://www.va.gov/education/gi-bill-comparison-tool/';
export const APPLY_URL = 'https://www.va.gov/careers-employment/vocational-rehabilitation/apply-vre-form-28-1900/';
export const RATES_URL = 'https://www.benefits.va.gov/vocrehab/vrerates27.asp';

/* ─── Approval ladder (M28C.V.B.1.02.b; VR&E Officer and RO Director tiers changed 6/18/26) ────
   The VRC threshold is $50,000 "annually"; a memo is required when costs EXCEED it, so exactly $50,000
   stays with the counselor. Each band's upper bound is read as inclusive from the manual's wording
   ("$50,000 to $75,000"; "$75,000-$100,000"; "exceed $100,000"). */
export const HIGH_COST_THRESHOLD = 50000;
export const LADDER = [
  { min: 0,      max: 50000,    approver: 'your VR&E counselor (VRC)',                 short: 'VR&E counselor',     memo: false },
  { min: 50000,  max: 75000,    approver: 'the VR&E Officer at your regional office',  short: 'VR&E Officer',       memo: true },
  { min: 75000,  max: 100000,   approver: 'the Regional Office Director',              short: 'RO Director',        memo: true },
  { min: 100000, max: Infinity, approver: 'the Executive Director, VR&E Service',      short: 'Executive Director', memo: true },
];
export function ladderTier(annualCost) {
  const c = Number(annualCost) || 0;
  let i = LADDER.findIndex(t => c <= t.max);
  if (i < 0) i = LADDER.length - 1;
  return { index: i, ...LADDER[i] };
}

/* ─── The four justification questions (M28C.IV.C.2.03.a, change date 10/7/22), verbatim ───── */
export const FOUR_QUESTIONS = [
  { n: 1, text: 'Are there differences in support services that will ensure the Veteran’s successful completion of training?', lead: true },
  { n: 2, text: 'Are there special programs of assistance for students with disabilities that will be utilized by the Veteran in the course of his or her program?', lead: true },
  { n: 3, text: 'Are there significant differences in the availability of placement services and placement records?', lead: false },
  { n: 4, text: 'If a shorter commute from the Veteran’s home to the training facility is the reason for selecting a higher-cost facility, will the Veteran complete his or her training program in a shorter amount of time?', lead: false },
];

/* ─── Rules the cards cite ──────────────────────────────────────────────── */
export const RULES = {
  entry: {
    id: 'entry', cite: '38 CFR 21.72(a)(2)', url: ECFR('72'), verified: VERIFIED,
    title: 'Train to the level needed for entry',
    plain: 'VR&E trains a veteran to the level generally recognized as necessary for entry into a suitable occupation. If the job you are aiming at requires the degree, the degree is the training. The regulation’s own example is a master’s in social work.',
    quote: 'Train the veteran to the level generally recognized as necessary for entry into employment in a suitable occupational objective. Where a particular degree, diploma, or certificate is generally necessary for entry into the occupation, e.g., an MSW for social work, the veteran shall be trained to that level.',
  },
  costFactor: {
    id: 'costFactor', cite: '38 CFR 21.120(c)', url: ECFR('120'), verified: VERIFIED,
    title: 'When cost is a factor',
    plain: 'Cost counts when more than one approvable facility in your area can deliver your plan within reasonable commuting distance, or when you want to train somewhere else while a suitable local facility exists. The comparison is the whole test: a cheaper school only wins if it meets your needs.',
    quote: 'The cost of education and training services will be one of the factors considered in selecting a facility when: (1) There is more than one facility in the area in which the veteran resides which: (i) Meets requirements for approval under §§ 21.292 through 21.298; (ii) Can provide the education and training services, and other supportive services specified in the veteran’s plan; and (iii) Is within reasonable commuting distance; or (2) The veteran wishes to train at a suitable facility in another area, even though training can be provided at a suitable facility in the area in which the veteran resides.',
  },
  preference: {
    id: 'preference', cite: 'M28C.IV.C.2.03.a', url: KNOWVA.facility, verified: VERIFIED,
    title: 'Your preference counts; the counselor decides; the justification is written down',
    plain: 'The counselor must consider your preference. Cost is one factor. The counselor has final responsibility for the facility. Where two facilities differ significantly in cost, the counselor must document the justification for the higher-cost one, by answering the four questions, on VA Form 28-1902n, before writing the plan. The manual’s own example is a $12,000 state program against a $22,000 private one, well under the memo line, so the four questions and the high-cost memo are two separate gates.',
    quote: 'The VRC must consider the Veteran’s preference for a particular training or rehabilitation facility. However, the cost of education and training services is one of the factors to consider when selecting a facility, as outlined in 38 CFR § 21.120. In accordance with 38 CFR § 21.294, the VRC has final responsibility for the selection of the facility. … If more than one facility has been identified but there is a significant difference in cost, the VRC must document the justification for choosing the higher-cost facility before developing a plan that lists the higher-cost facility as a service provider.',
  },
  facilityFinal: {
    id: 'facilityFinal', cite: '38 CFR 21.294(i)', url: ECFR('294'), verified: VERIFIED,
    title: 'VA selects the facility',
    plain: 'The case manager considers your preference, but VA has the final say. That is why the case has to be made before the plan is signed, inside the counselor’s own framework.',
    quote: 'The case manager will consider the veteran’s preference for a particular training or rehabilitation facility but VA has final responsibility for selection of the facility.',
  },
  highCost: {
    id: 'highCost', cite: 'M28C.IV.C.2.03.b', url: KNOWVA.facility, verified: VERIFIED,
    title: 'The $50,000 line',
    plain: 'Program costs above $50,000 a year require a high program costs memo, requested before the plan is signed. Program costs are tuition, fees, books, and supplies; subsistence is excluded. One thing to know: chapter IV.C.2 measures the year as the 12 months from the first term after the plan is written, while chapter V.B.1 speaks of a calendar year. The manual is inconsistent, so ask your office which it uses if you are near the line.',
    quote: 'The VRC’s program costs approval threshold is $50,000 annually. If the estimated annual program costs exceed the VRC’s approval threshold, a request for approval using a high program costs memo must be developed to ensure an appropriate level of authority for program costs. … Program costs include tuition, fees, books, and supplies provided to the Veteran. Subsistence allowance is not included in estimating a Veteran’s annual program costs. Approval for the high program costs must be requested prior to the signing of the rehabilitation plan by the VRC and the Veteran.',
  },
  ladder: {
    id: 'ladder', cite: 'M28C.V.B.1.02', url: KNOWVA.approvals, verified: VERIFIED,
    title: 'Who approves what, and for how long',
    plain: 'Counselor up to $50,000 a year; VR&E Officer for $50,000 to $75,000 (and every retroactive induction, which cannot be delegated); Regional Office Director for $75,000 to $100,000; Executive Director of VR&E Service above $100,000. The memo covers the whole training period once approved, unless the school or the goal changes, and the plan cannot be signed until every approval is in. Costs are reviewed again at each annual plan review.',
    quote: 'The high program costs memo must include the estimated annual program costs for the Veteran’s entire training period. … If approved, the high program costs memo covers the entire training period indicated in the plan, assuming there is no change in the Veteran’s training facility or vocational goal during that period. The rehabilitation plan must not be signed by either the VRC or the Veteran until all required approvals are obtained.',
  },
  weams: {
    id: 'weams', cite: 'M28C.IV.C.2.03.a; 38 U.S.C. 3104(b)', url: COMPARISON_TOOL, verified: VERIFIED,
    title: 'The school and the program both have to be approved',
    plain: 'The counselor must verify in WEAMS that the facility is approved and that the specific program is approved, before writing the plan. The public WEAMS search now redirects to the GI Bill Comparison Tool, so check there and bring the printout. If a program shows as withdrawn, the counselor has to confirm with the State Approving Agency.',
    quote: 'The VRC must verify in Web Enabled Approval Management System (WEAMS) that: The Facility is approved, and The program of training or course is approved. The VRC must complete the verification in WEAMS prior to developing or redeveloping a rehabilitation plan and authorizing the Veteran’s attendance.',
  },
  p911sa: {
    id: 'p911sa', cite: '38 CFR 21.260(c), 21.264(b)', url: ECFR('264'), verified: VERIFIED,
    title: 'The Post-9/11 subsistence election',
    plain: 'If you have remaining Post-9/11 GI Bill entitlement, you can elect the Post-9/11 subsistence allowance instead of the flat Chapter 31 rate. It pays the housing allowance for an E-5 with dependents at your school’s ZIP code (half the national average for fully online training), it is not adjusted for your dependents, and your GI Bill percentage tier does not reduce it. You choose it on the plan, and you can switch back only between terms. VA’s own page says that in most cases the GI Bill rate is higher.',
    quote: 'A veteran who applies and is eligible for training or education under chapter 31 may elect to receive payment of the Post-9/11 subsistence allowance under § 21.260(c) in lieu of a subsistence allowance under § 21.260(b), provided the veteran has remaining eligibility for, and entitlement to, educational assistance under chapter 33, Post-9/11 GI Bill.',
  },
  retro: {
    id: 'retro', cite: '38 CFR 21.282; M28C.V.B.6', url: KNOWVA.retro, verified: VERIFIED,
    title: 'Retroactive induction',
    plain: 'If you were eligible and entitled to Chapter 31 during terms you already completed, VA can retroactively induct you for those terms: tuition, fees, books, and subsistence for that period, and for terms paid by the Post-9/11 GI Bill, the months moved back to the GI Bill. The VR&E Officer approves it and cannot delegate it. Only completed past terms count; the term you are in when the plan is written is not retroactive. Ask for it in writing; it is not automatic.',
    quote: 'A retroactive induction is an authorization of payment for tuition, fees, and other verifiable expenses paid by the claimant or by another VA educational program. The authorized benefits in a retroactive induction may include tuition and fees; books and supplies; and subsistence allowance. … A retroactive induction plan is only developed for past enrollment periods that have been completed.',
  },
  window: {
    id: 'window', cite: '38 U.S.C. 3103(a), (g); 38 CFR 21.41', url: 'https://www.law.cornell.edu/uscode/text/38/3103', verified: VERIFIED,
    title: 'The 12-year window and the 2013 change',
    plain: 'For discharges before January 1, 2013, the basic period of eligibility runs 12 years from the later of discharge or the first notice of a service-connected rating, and a serious employment handicap finding can extend it. For discharges on or after January 1, 2013, there is no time limit. The carve-out is in the statute (P.L. 116-315 § 1025); the regulation at 21.41 still reads the old way, so cite the statute.',
    quote: 'Subsection (a) shall not apply to a veteran who was discharged or released from active military, naval, or air service on or after January 1, 2013.',
  },
  entitlement: {
    id: 'entitlement', cite: '38 CFR 21.40(a), (b)', url: ECFR('40'), verified: VERIFIED,
    title: 'Basic entitlement',
    plain: 'Rated 20% or more with an employment handicap, or rated under 20% (in practice 10%) with a serious employment handicap. A 10% rating gets you the evaluation; entitlement needs the counselor’s finding. The rating opens the door; the employment handicap finding is what opens the program.',
    quote: '(a) Veterans with at least 20 percent disability. … (3) Is determined by VA to be in need of rehabilitation because of an employment handicap. (b) Veterans with 10 percent disability. … (1) Has a service-connected disability or combination of disabilities rated less than 20 percent … (3) Is determined by VA to be in need of rehabilitation because of a serious employment handicap.',
  },
  activeDuty: {
    id: 'activeDuty', cite: '38 CFR 21.40(c); M28C.IV.A.1.03', url: KNOWVA.application, verified: VERIFIED,
    title: 'Applying before discharge',
    plain: 'A service member can apply within six months before discharge (and up to 12 months after) with a memorandum rating: VA Form 28-0588 goes to the Veterans Service Center, which sets an anticipated rating from the service treatment records, usually within three business days. It has to come back at 20% or more; under 20% the claim is disallowed until a real rating posts. An IDES proposed rating can stand in for the memo rating.',
    quote: 'A memorandum rating (memo rating) is established for a Service member who applies for Chapter 31 benefits within six months prior to his or her discharge and 12 months after his or her discharge from active military service. … These ratings are established based on the Service members’ available Service Treatment Records (STR) and must be compensable at least 20 percent or more for eligibility to VR&E services.',
  },
  suitable: {
    id: 'suitable', cite: '38 CFR 21.35(a), (h)', url: ECFR('35'), verified: VERIFIED,
    title: 'Employment handicap and vocational goal, as VA defines them',
    plain: 'An employment handicap is an impairment of your ability to prepare for, get, or keep employment consistent with your abilities, aptitudes, and interests. A serious employment handicap is a significant one. The vocational goal is gainful employment consistent with those same three things. VA’s own eligibility page adds the plain version: suitable employment is a job that does not make your disability worse, is stable, and matches your abilities, aptitudes, and interests. A job you can technically hold but that your conditions make unsustainable is not the standard the program is written to.',
    quote: 'Employment handicap. This term means an impairment of a veteran’s ability to prepare for, obtain, or retain employment consistent with such veteran’s abilities, aptitudes, and interests. … Serious employment handicap. This term means a significant impairment of a veteran’s ability to prepare for, obtain, or retain employment consistent with such veteran’s abilities, aptitudes, and interests.',
  },
  feasibility: {
    id: 'feasibility', cite: '38 CFR 21.53(c), (d)', url: ECFR('53'), verified: VERIFIED,
    title: 'Feasibility, and the benefit of the doubt',
    plain: 'A goal is reasonably feasible when it has been identified, your conditions permit training to begin within a reasonable period, and you either have the educational background to pursue it or VA will provide it as part of the program. And the regulation says any reasonable doubt is resolved in favor of feasibility.',
    quote: 'Any reasonable doubt shall be resolved in favor of a finding of feasibility.',
  },
  review: {
    id: 'review', cite: '38 CFR 21.416; M28C.III.C.2', url: KNOWVA.reviews, verified: VERIFIED,
    title: 'One year, three lanes, one at a time',
    plain: 'Within one year of the decision notice you can choose a Supplemental Claim (new and relevant evidence; VA Form 20-0995 to your regional office; 125-day target), a Higher-Level Review (no new evidence, a senior reviewer looks at the existing record; VA Form 20-0996 to the VR&E Intake Center, P.O. Box 5210, Janesville, WI 53547-5210, or VREHLR@va.gov; one informal conference per issue; 90-day target), or a Board appeal (VA Form 10182 straight to the Board). One lane per issue at a time. If one lane fails you have a year from that outcome to try another without losing your original filing date.',
    quote: 'Within one year from the date on which VA issues notice of a decision on an issue contained within a claim, a claimant may elect one of the following administrative review options: (1) Supplemental Claim … (2) Appeal to the Board of Veterans’ Appeals … (3) Higher-level Review.',
  },
  dueProcess: {
    id: 'dueProcess', cite: '38 CFR 21.420(d); 21.198(b)(7)', url: ECFR('420'), verified: VERIFIED,
    title: 'Thirty days before an adverse action',
    plain: 'Before VA denies, reduces, or ends Chapter 31 benefits it owes you at least 30 days to meet informally with a VA representative, review the basis for the decision, and submit anything relevant. If you are rated 50% or more, the VR&E Officer must personally review any proposed discontinuance. If either did not happen, say so in writing.',
    quote: 'VA shall give the veteran a period of at least 30 days to review, prior to its promulgation, an adverse action … During that period, the veteran shall be given the opportunity to: (1) Meet informally with a representative of VA; (2) Review the basis for VA decision, including any relevant written documents or material; and (3) Submit to VA any material which he or she may have relevant to the decision.',
  },
  noShow: {
    id: 'noShow', cite: 'M28C.IV.B.1.02.b; 38 CFR 21.362', url: KNOWVA.evaluation, verified: VERIFIED,
    title: 'What a missed first appointment actually triggers',
    plain: 'Cooperation includes attending the Chapter 31 orientation. If you miss the initial evaluation, the counselor sends the VR-15 ten-day letter, and the claim is discontinued if you do not respond within 10 calendar days. That is the rule: one no-show plus ten days of silence, not a count of missed orientations.',
    quote: 'If the claimant fails to report for the initial evaluation, the VRC must send Vocational Rehabilitation (VR) letter VR-15, Missed Appointment-10-day Letter, and discontinue the claim if a response is not received after 10 calendar days.',
  },
};

/* ─── Months of entitlement (38 CFR 21.70(c), 21.78, 21.4020(b)) ─────────── */
export const ENTITLEMENT_CAP_MONTHS = 48;
export const MONTHS_PER_ACADEMIC_YEAR = 9; // estimate: entitlement is charged day-for-day while enrolled (38 CFR 21.79)
Object.assign(RULES, {
  months: {
    id: 'months', cite: '38 CFR 21.78(a), (b)(3), (c), (d); 21.4020(b)', url: ECFR('78'), verified: '10/1/26',
    title: 'The 48-month ceiling, and the way past it',
    plain: 'A VR&E program is capped at 48 months, and months you already used under the GI Bill or another VA education program count toward a combined 48. That is often the real reason a counselor balks at a second degree. The regulation has an answer: if you have an employment handicap and the months you need to become employable would push the combined total past 48, the months needed to finish may be authorized, as long as Chapter 31 by itself stays within 48. With a serious employment handicap, Chapter 31 itself can run past 48 to complete the program. Either way it takes the counselor\u2019s approval and the VR&E Officer\u2019s concurrence, so ask for it by name.',
    quote: 'The veteran previously used education benefit entitlement under other programs administered by VA, and the additional period of assistance to be provided under Chapter 31 which the veteran needs to become employable will result in more than 48 months being used under all VA education programs, under these conditions the number of months necessary to complete the program may be authorized under Chapter 31, provided that the length of the extension will not result in authorization of more than 48 months under Chapter 31 alone.',
  },
  inState: {
    id: 'inState', cite: 'M28C.IV.C.2.03.c; P.L. 115-251 \u00a7 301', url: KNOWVA.facility, verified: VERIFIED,
    title: 'Public schools owe you the in-state rate',
    plain: 'A public college has to charge a Chapter 31 veteran who lives in the state the resident rate, even if you have not lived there long enough to meet the state\u2019s own residency rule. Since August 2021 you no longer have to be within three years of discharge. If your bill shows out-of-state tuition at a public school in the state where you live, that is the first thing to fix: it can drop the annual cost, sometimes below the $50,000 line, and the memo with it. It does not apply if you live in one state and attend in another.',
    quote: 'public institutions of higher learning (IHL) must comply with the requirement that Veterans who reside in the state, are within 3 years of discharge at the time of enrollment, and are using educational assistance under 38 U.S.C. Chapter 31, must be charged the resident rate regardless of Veteran meeting the state\u2019s residency requirements. \u2026 Note: Effective for quarters, semesters, or terms starting on or after August 1, 2021, the Veteran is no longer required to be within three years of discharge to qualify for the provision.',
  },
  sehLevel: {
    id: 'sehLevel', cite: '38 CFR 21.72(b)(2)', url: ECFR('72'), verified: VERIFIED,
    title: 'A serious employment handicap unlocks a higher level',
    plain: 'With a serious employment handicap finding, VA will train you to a higher level than the occupation usually requires when the extra training offsets a competitive disadvantage against non-disabled applicants, when the occupations feasible for you are restricted, or when the openings within them are. This is the strongest answer to \u201ca lower degree is enough,\u201d and it is why the letter asks for the serious employment handicap determination by name.',
    quote: 'The Department of Veterans Affairs will assist a veteran with a serious employment handicap to train to a higher level than is usually required to qualify in a particular occupation, when one of the following conditions exist: (i) The veteran is preparing for a type of work in which he or she will be at a definite disadvantage in competing with nondisabled persons for jobs or business, and the additional training will help to offset the competitive disadvantage; (ii) The number of feasible occupations are restricted, and additional training will enhance the veteran\u2019s employability in one of those occupations; (iii) The number of employment opportunities within feasible occupations are restricted.',
  },
});

Object.assign(RULES, {
  memoMust: {
    id: 'memoMust', cite: 'M28C.V.B.1.02 and 1.02.a; M28C.IV.C.2.03.b', url: KNOWVA.approvals, verified: VERIFIED,
    title: '$50,000 is a signature line, not a limit',
    plain: 'The $50,000 figure is the amount a counselor can approve alone. It is not a cap on what VR&E pays and it is not a rule that you must pick a program under it. When a plan runs over, the manual says the counselor must complete the high program costs memo and submit it to the VR&E Officer, and the same chapter says program costs should not restrict the services a veteran gets. Nothing in either chapter says the memo is reserved for cases with no cheaper option. What the counselor does decide is the facility: if they find a cheaper school meets your needs and can deliver your plan, that is the decision to challenge, and it has to be put in writing with its reasons.',
    quote: 'The program costs approval threshold for a Vocational Rehabilitation Counselor (VRC) is $50,000 annually. If the program costs exceed the VRC\u2019s approval level, the VRC must complete and submit the high program costs memo to the VR&E Officer. \u2026 Note: Program costs should not restrict the types of services provided to any Veteran, since services are based on the identified needs and corresponding services outlined in the Veteran\u2019s rehabilitation plan.',
  },
  planServices: {
    id: 'planServices', cite: '38 CFR 21.120(c)(1)(ii)', url: ECFR('120'), verified: VERIFIED,
    title: 'First test: can the cheaper school deliver your plan at all?',
    plain: 'Cost only becomes a factor among facilities that can provide the education and training services your plan calls for. If the cheaper school does not offer the program, specialization, or credential your vocational goal requires, it is not a real alternative, and the comparison never reaches cost. Say exactly what it lacks: the degree, the concentration, the required coursework, the license preparation.',
    quote: 'Can provide the education and training services, and other supportive services specified in the veteran\u2019s plan',
  },
});
export const REGION_NOTE = 'Reported by veterans, not confirmed as policy: changing your address may not move your case. A case being handled virtually can stay with the original regional office after you move. If you relocate to be near your school, ask in writing for in-person meetings at the office that serves your new address, and confirm which office holds your case.';

/* ─── Track names as va.gov lists them (tracks page updated 6/15/26) ────── */
export const TRACK_LONG_TERM = 'Employment Through Long-Term Services';

/* ─── Stalled or denied: steps by situation (verified 9/30/26 against M28C.III.C.2, IV.B.1, 38 CFR 21.416, 21.420) ─── */
export const ESCALATION = {
  silent: {
    title: 'No response from the counselor',
    steps: [
      ['Put it in writing', 'Email your counselor a dated request for a decision or a next appointment. Keep it short and keep a copy. A written record is what every later step relies on.'],
      ['Go to the VR&E Officer', 'The VR&E Officer at your regional office supervises the counselors and signs off on adverse actions. Write to them with the dates of your unanswered requests and what you are asking for.'],
      ['Congressional casework', 'Your U.S. Representative and both Senators have caseworkers whose job is VA inquiries. A congressional inquiry gets a written response on a clock.'],
      ['White House VA Hotline', 'For unresolved problems after the steps above (1-855-948-2311, 24/7). Have your dates and copies ready.'],
    ],
  },
  denied: {
    title: 'Denied in writing',
    steps: [
      ['Read the decision for the element that failed', 'The letter has to name the elements not satisfied (38 CFR 21.420(b)(5)) and come with VA Form 20-0998, your review rights. Your response answers that element, not a general one: no employment handicap found, goal not feasible, training not needed for entry, facility. If you were only told no in a meeting or an email, ask for the written decision; the review clock and your rights attach to the letter.'],
      ['Pick one review lane inside one year', 'Supplemental Claim if you have new and relevant evidence (an accommodation letter, a provider statement, job postings, proof the cheaper school lacks your program): VA Form 20-0995 to your regional office. Higher-Level Review if the error is in how the existing record was read: VA Form 20-0996 to the VR&E Intake Center in Janesville, with one informal conference. Board appeal: VA Form 10182 to the Board directly. One lane per issue at a time.'],
      ['Chase the answer', 'A Higher-Level Review is supposed to be decided within 90 days. If the date passes and nothing has arrived, call and ask for the decision by email. Letters go missing in the mail, and your next deadline runs from the date on the letter whether you have seen it or not.'],
      ['If the review upholds the denial, you are not done', 'You have one year from that outcome to move to another lane without losing your original filing date. The usual next step is a Supplemental Claim with evidence the reviewer did not have, with the Board as the backstop. This is also the point where some veterans apply again from the area where the school is, alongside the review, to get a different office looking at it.'],
      ['Restate the case in the letter', 'The letter on this page, filled in, is the statement that goes with a Supplemental Claim or that you walk a reviewer through in the informal conference.'],
      ['Get help', 'A VSO (DAV, VFW, American Legion) can represent you at no cost. Congressional casework applies here too.'],
    ],
  },
  closed: {
    title: 'Case closed or discontinued',
    steps: [
      ['Check the notice you got', 'Before a discontinuance you were owed at least 30 days to meet informally, review the basis, and submit material (38 CFR 21.420(d)). Rated 50% or more, the VR&E Officer had to review it personally (21.198(b)(7)). If either did not happen, say so in writing to the VR&E Officer.'],
      ['Ask for reinstatement in writing', 'Write to your counselor and the VR&E Officer explaining what happened and that you are ready to participate. Attach anything that shows it: enrollment, appointments kept, a provider note.'],
      ['Use the review rights on the closure', 'A written discontinuance is a decision with the same three lanes and the same one-year clock. Do not let it pass while you wait for an informal answer.'],
      ['Escalate if it stalls', 'VR&E Officer, then congressional casework, then the hotline. Same ladder as an unanswered case.'],
    ],
  },
  orientation: {
    title: 'Missed orientation or the first appointment',
    steps: [
      ['Call and reschedule today', 'A missed initial evaluation triggers the VR-15 ten-day letter. If the office gets no response in 10 calendar days, the claim is discontinued. Answer inside that window, in writing, and ask for a new date.'],
      ['Put the reason in writing', 'If a medical reason or a work conflict caused it, say so in an email and keep the copy. Cooperation under 38 CFR 21.362 includes attending orientation, and a documented reason matters if the office later treats it as non-cooperation.'],
      ['If the claim was already disallowed', 'The disallowance letter (VR-87) comes with your review rights. Ask the office in writing how to reopen, and use the review rights if they say no. The one-year clock runs from the letter.'],
    ],
  },
};
export const REAPPLY_WARNING = 'Reapplying is not a substitute for reviewing the decision you already have. A new application does not reverse that decision, and the one-year clock on it keeps running (38 CFR 21.416). Some veterans do both, and that can be the right call: keep a review lane open on the existing decision, then apply again from the area where the school is to reach a different regional office. What you never do is let the year run out while you wait on a new application.';
export const WH_HOTLINE = { label: 'White House VA Hotline', phone: '1-855-948-2311', verified: VERIFIED };

/* ─── The line about 1:1 work (drafted for Zak’s review 9/30/26) ────────── */
export const ONE_ON_ONE = {
  url: '/work-with-me/',
  cost: 'Above $75,000 a year the memo leaves your counselor’s office and lands on a director’s desk, so the framing has to be tight. I build these with veterans one-on-one. If you want a second set of eyes before you submit:',
  pushback: 'If your counselor has already said no once, the second conversation matters more than the first. I work through these with veterans one-on-one. If you want help with yours:',
  denied: 'A denial or a stalled case has a clock on it, and the next move is easy to get wrong. This is the work I do with veterans one-on-one. If you want help with yours:',
};
/* The unwritten rule for high-cost schools, stated plainly and never attributed. Grounded in the manual: three of the four
   justification questions are about the veteran\u2019s needs, and only question 3 touches outcomes. */
export const PRESTIGE_NOTE = {
  title: 'Don\u2019t argue prestige. Argue the disability office.',
  text: 'Two arguments carry a high-cost case, and neither is the school\u2019s name. First: the cheaper school cannot deliver the training your goal requires, if that is true (say what it lacks). Second, and always: support for your disability. \u201cIt\u2019s a better school,\u201d \u201cthe ranking,\u201d \u201cgraduates earn more,\u201d \u201ceasier to get hired\u201d: these do not carry a high-cost case anymore. That is the word coming out of recent high-cost reviews, and it matches how the manual is written. What carries it is specific: what this school\u2019s disability services office, veteran center, format, or location does for your rated conditions that the cheaper school\u2019s cannot. Name the accommodation, name the limit it addresses, and say what the alternative lacks. Three of the four questions the counselor has to answer are about your needs; only one touches placement, and it is a supporting line, not the case.',
};
export const CANT_DO = 'This drafts the letter. It cannot read your rating decision or tell you whether your case is strong. That takes a person.';
