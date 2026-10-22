// VR&E Approval Prep — counselor objections and the rule that answers each.
// `counselorSays` is the likely wording, `response` is a short reply in the veteran's voice,
// `ruleId` points at RULES in rules.js for the cite and link. Written fresh from the CFR and the manual.

export const OBJECTIONS = [
  {
    id: 'employable',
    label: 'You’re already employable',
    counselorSays: '“You already have a degree and work history. You’re employable as you are.”',
    plain: 'The program’s standard is suitable employment, not any employment. Work that your service-connected conditions make unsustainable is not suitable, and 38 CFR 21.72 trains to the level needed for entry into the suitable goal, not the nearest job.',
    response: 'I can get a job. The question is whether I can keep one that does not aggravate my rated conditions. My work history shows the pattern: the roles I could hold were the ones that made my disabilities worse. My goal is suitable employment as VA defines it, and the training I am asking for is what that goal requires.',
    ruleIds: ['suitable', 'entry'],
    modes: ['pushback', 'first'],
  },
  {
    id: 'lower',
    label: 'A lower degree or a shorter program is enough',
    counselorSays: '“A certificate would get you into the field. We don’t need to fund a master’s for this.”',
    plain: '38 CFR 21.72 sets the training level at what is generally recognized as necessary for entry into the occupational objective. If the postings for the target role require the degree, the degree is the entry requirement. The evidence is the job postings and the O*NET education profile, not an opinion. And if your limitations are severe, a serious employment handicap finding lets VA train you above the usual level when it offsets a competitive disadvantage or your feasible occupations are restricted (38 CFR 21.72(b)(2)).',
    response: 'I looked at what employers in this occupation actually require. The three postings I brought all list this degree as required or preferred, and O*NET shows it as the typical education for entry. A shorter program would not get me into the role that fits my limitations, so it would not reach the goal.',
    ruleIds: ['entry', 'sehLevel'],
    modes: ['pushback', 'first'],
  },
  {
    id: 'cheaper',
    label: 'Go to the cheaper school',
    counselorSays: '“The state school offers the same program for a third of the price. Transfer there.”',
    plain: 'Under 38 CFR 21.120(c) cost decides only when more than one facility meets the veteran’s needs. The manual requires the counselor to consider your preference and, where costs differ significantly, to answer four questions in writing before the plan is written. Two of the four are about support services and disability programs you will use. Answer them for the counselor. And do not lead with prestige, rankings, or outcomes; that argument no longer carries. Lead with what this school\u2019s disability office does for your conditions that the cheaper one\u2019s cannot. Before any of that, check the first test: if the cheaper school does not offer the program or specialization your goal requires, it is not a real alternative under 38 CFR 21.120(c), and you should say exactly what it lacks.',
    response: 'I understand cost is a factor when two schools meet my needs equally. Here they do not. At this school my accommodations are in place and tied to the limits in my rating decision; the alternative has a disability office but no plan for me and would restart that process. I have written up the four questions in the manual with my answers so the comparison is on paper.',
    ruleIds: ['planServices', 'costFactor', 'preference', 'highCost'],
    modes: ['pushback', 'cost'],
  },
  {
    id: 'memo',
    label: 'I can\u2019t approve anything over $50,000',
    counselorSays: '\u201cI can\u2019t approve a program over $50,000 a year. The high-cost memo is only for when there are no other options. Apply to programs within the limit, or I\u2019ll have to deny the facility and close your case for not participating.\u201d',
    plain: 'Three things in that statement are not in the manual. $50,000 is the amount a counselor can sign alone, not a limit on you. When a plan runs over it, the counselor must complete and submit the memo to the VR&E Officer. And the manual says program costs should not restrict the services a veteran gets. The counselor does have the final say on the facility, so the real question is whether a cheaper school can deliver your plan and meet your needs. Make them answer that in writing. And a disagreement over which school is not a refusal to participate: before any case is closed you are owed at least 30 days to meet, see the basis, and respond.',
    response: 'I understand $50,000 is your approval threshold. The manual says that above it the memo goes to the VR&E Officer, so I am asking you to submit it, or to give me your decision on the facility in writing with the reasons, including which program you believe meets my needs and delivers the training in my plan. I am participating: I am here, I have brought the documentation, and I will keep every appointment. If the answer is no, I need it as a written decision so I can ask for a review.',
    ruleIds: ['memoMust', 'costFactor', 'dueProcess'],
    modes: ['pushback', 'cost'],
  },
  {
    id: 'goal',
    label: 'That job goal doesn’t fit',
    counselorSays: '“That’s not a realistic goal for your profile,” or the plan gets written to a different occupation code than the one you meant.',
    plain: 'The vocational goal has to be reasonably feasible and suitable. Feasibility is shown with evidence (enrollment, grades, a defined plan with an end date). Suitability is shown by tying the role to your limits. And check the occupation code the counselor writes into the plan: a code for the wrong occupation quietly changes what training is “necessary for entry.”',
    response: 'My goal is specific: these titles, these codes. Each one avoids the conditions that made my past jobs unworkable, and each one is reachable with this program. I have the postings, the O*NET pages, and my enrollment record. If the plan lists a different occupation than the one we discussed, I would like it corrected before I sign.',
    ruleIds: ['suitable', 'entry'],
    modes: ['pushback', 'first'],
  },
];

export const OBJECTION_BY_ID = Object.fromEntries(OBJECTIONS.map(o => [o.id, o]));
