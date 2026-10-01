// VR&E Approval Prep — the letter engine.
// buildLetter(state) returns sections of blocks; each block is a list of "parts" where a part is
// { t: 'text' } (known) or { b: 'INSTRUCTION' } (a bracket the veteran fills in). Whole sentences carry
// showIf logic inline so the continuity paragraph, the retroactive request, and the cost lines appear
// only when they apply. Structure follows the seven-section statement TBV uses with 1:1 clients:
// background, employment handicap, vocational goal, facility, degree, feasibility, request.
// No client facts live here. Everything is template + the veteran's own entries.

import { ladderTier, HIGH_COST_THRESHOLD, TRACK_LONG_TERM, ENTITLEMENT_CAP_MONTHS, MONTHS_PER_ACADEMIC_YEAR } from './data/rules.js';
import { LIMIT_BY_ID, FIT_BY_ID, FEATURE_BY_ID } from './data/limits.js';
import { CHECKLIST } from './data/checklist.js';

export const PROGRAM_NAMES = { cert: 'certificate program', trade: 'trade or technical program', assoc: 'associate degree', bach: 'bachelor’s degree', mast: 'master’s degree', prof: 'professional or doctoral degree' };
export const EDUCATION_NAMES = { hs: 'a high school diploma or GED', some: 'some college coursework', assoc: 'an associate degree', bach: 'a bachelor’s degree', mast: 'a master’s degree' };
export const LEVEL_RANK = { hs: 0, some: 1, cert: 1, trade: 1, assoc: 2, bach: 3, mast: 4, prof: 5 };

const T = t => ({ t });
const B = b => ({ b });
const V = (value, bracket) => (value && String(value).trim()) ? T(String(value).trim()) : B(bracket);
const P = (...parts) => ({ type: 'p', items: [parts.flat()] });
const UL = items => ({ type: 'ul', items: items.map(i => [i].flat()) });
const OL = items => ({ type: 'ol', items: items.map(i => [i].flat()) });
const fmtUSD = n => '$' + Math.round(n).toLocaleString('en-US');

function joinList(arr) {
  if (arr.length <= 1) return arr.join('');
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
}
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export function buildLetter(s) {
  const p = s.priv || {};
  const limits = (s.limits || []).map(id => LIMIT_BY_ID[id]).filter(Boolean);
  const features = (s.features || []).map(id => FEATURE_BY_ID[id]).filter(Boolean);
  const jobs = (p.jobs || []).filter(j => j && j.title && j.title.trim());
  const occs = (p.occupations || []).filter(o => o && o.title && o.title.trim());
  const programName = PROGRAM_NAMES[s.programLevel] || 'program';
  const tier = ladderTier(s.cost);
  const overLine = s.cost > HIGH_COST_THRESHOLD;
  const enrolled = !!s.enrolled;
  const school = p.school && p.school.trim();
  const program = p.program && p.program.trim();
  const schoolRef = school ? school : null;
  const needMonths = Math.round((s.years || 0) * MONTHS_PER_ACADEMIC_YEAR);
  const overCap = s.giUsed != null && needMonths > 0 && (s.giUsed + needMonths > ENTITLEMENT_CAP_MONTHS);

  const header = [
    [T('VOCATIONAL GOAL AND REHABILITATION PLAN STATEMENT')],
    [T('Veteran Readiness and Employment (Chapter 31)')],
    [T('From: '), B('YOUR FULL NAME')],
    [T('To: '), V(p.counselor, 'COUNSELOR NAME'), T(', Vocational Rehabilitation Counselor')],
    [T('Date: '), B('DATE')],
  ];

  const howTo = [
    'Everything in [BRACKETS] needs your real information.',
    'Rewrite any sentence that does not sound like you. The counselor should hear your voice, not a template.',
    'Only include what is true and what you are comfortable having in your VR&E file.',
    'If your school costs more than the alternative: do not argue prestige, rankings, or job outcomes. Argue what this school\u2019s disability office, format, or location does for your rated conditions that the cheaper school\u2019s cannot.',
    'Delete this box before you send it.',
  ];

  const sections = [];

  /* 1. Background */
  {
    const blocks = [];
    const svc = [T('I served in the '), V(p.branch, 'BRANCH'), T(' from '), V(p.serviceYears, 'START YEAR TO END YEAR'), T('.')];
    const edu = s.education ? [T(` I hold ${EDUCATION_NAMES[s.education]} `), B('ADD WHERE, AND HOW YOU PAID FOR IT, e.g., “from X University, using the Post-9/11 GI Bill”'), T('.')] : [T(' '), B('YOUR EDUCATION SINCE SERVICE, AND HOW YOU PAID FOR IT')];
    blocks.push(P(svc, edu));
    if (enrolled) {
      blocks.push(P(T('I am currently enrolled in the '), V(program, 'EXACT PROGRAM NAME'), T(' at '), V(school, 'SCHOOL'), T(', with '), V(p.semesters, 'NUMBER'), T(' semesters remaining and an expected graduation date of '), V(p.gradDate, 'MONTH YEAR'), T('.')));
    } else {
      blocks.push(P(T('I have been admitted to the '), V(program, 'EXACT PROGRAM NAME'), T(' at '), V(school, 'SCHOOL'), T(', starting '), V(p.startTerm, 'TERM AND YEAR'), T('. '), B('IF YOU HAVE NOT APPLIED YET, SAY SO AND GIVE THE INTENDED START TERM')));
    }
    const ratingText = s.rating != null ? `${s.rating} percent` : null;
    blocks.push(P(T('VA rates my service-connected '), V(p.conditions, 'YOUR SERVICE-CONNECTED CONDITIONS'), T(' at '), V(ratingText, 'COMBINED RATING'), T(' combined, effective '), B('EFFECTIVE DATE ON YOUR DECISION'), T(`. I am requesting Chapter 31 services under the ${TRACK_LONG_TERM} track so I can complete this ${programName} and reach my vocational goal: `), V(p.goal, 'YOUR JOB GOAL, IN ONE LINE'), T('.')));
    sections.push({ n: 1, title: 'Background', blocks });
  }

  /* 2. Employment handicap */
  {
    const blocks = [];
    blocks.push(P(T('My '), B('MONTH YEAR'), T(' rating decision documents the ways my service-connected disabilities limit my ability to work. Among VA’s findings are:')));
    const findings = (p.ratingWording || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
    if (findings.length) blocks.push(UL(findings.map(f => T(`“${f.replace(/^["“]|["”]$/g, '')}”`))));
    else blocks.push(UL([B('PASTE THE EXACT FINDINGS FROM YOUR RATING DECISION, ONE PER LINE, e.g., the functional limitations VA listed under each condition')]));
    if (limits.length) blocks.push(P(T(`In day-to-day terms: ${joinList(limits.map(l => l.letterPhrase))}.`)));
    if (jobs.length) {
      blocks.push(P(T('My work history since leaving the service shows how these limitations play out in real jobs:')));
      const items = jobs.map(j => {
        if (j.worked) {
          const fit = FIT_BY_ID[j.reason];
          return [T(`${j.title.trim()}. By contrast, this role offered ${fit ? fit.phrase : ''}`), fit ? T('') : B('WHAT MADE IT WORK'), T('. That was the environment where I did my best work.')];
        }
        const lim = LIMIT_BY_ID[j.reason];
        return [T(`${j.title.trim()}. `), lim ? T(cap(lim.letterPhrase)) : B('WHY IT DID NOT WORK, TIED TO YOUR CONDITIONS'), T(', and the role was not sustainable for me.')];
      });
      blocks.push(UL(items));
      const bad = [...new Set(jobs.filter(j => !j.worked && LIMIT_BY_ID[j.reason]).map(j => LIMIT_BY_ID[j.reason].label.toLowerCase()))];
      const good = [...new Set(jobs.filter(j => j.worked && FIT_BY_ID[j.reason]).map(j => FIT_BY_ID[j.reason].phrase))];
      if (bad.length || good.length) blocks.push(P(T(`The pattern is consistent. ${bad.length ? cap(joinList(bad)) + ' aggravate' + (bad.length === 1 ? 's' : '') + ' my disability.' : ''}${good.length ? ` Work with ${joinList(good)} is where I can perform and stay well.` : ''}`)));
    } else {
      blocks.push(P(T('My work history since leaving the service shows how these limitations play out in real jobs: '), B('LIST TWO TO FOUR JOBS SINCE SERVICE. FOR EACH, SAY WHETHER IT WORKED FOR YOU AND WHY, TIED TO YOUR CONDITIONS. END WITH THE PATTERN.')));
    }
    sections.push({ n: 2, title: 'My employment handicap', blocks });
  }

  /* 3. Vocational goal */
  {
    const blocks = [];
    blocks.push(P(T('My goal is '), V(p.goal, 'DESCRIBE THE KIND OF WORK IN ONE LINE, e.g., “a structured, analytical, desk-based role in …”'), T('. Target occupations:')));
    if (occs.length) blocks.push(UL(occs.map(o => T(o.code ? `${o.title.trim()} (${o.system === 'GS' ? 'federal series ' : 'O*NET '}${o.code})` : o.title.trim()))));
    else blocks.push(UL([B('PRIMARY TARGET TITLE AND ITS O*NET OR FEDERAL SERIES CODE'), B('SECOND TARGET TITLE'), B('THIRD TARGET TITLE, IF ANY')]));
    const good = [...new Set(jobs.filter(j => j.worked && FIT_BY_ID[j.reason]).map(j => FIT_BY_ID[j.reason].phrase))];
    if (good.length) blocks.push(P(T(`These roles fit my limitations because they offer ${joinList(good)}, and they do not involve `), V(limits.length ? joinList(limits.slice(0, 3).map(l => l.label.toLowerCase())) : null, 'THE CONDITIONS THAT MADE PAST JOBS UNWORKABLE'), T('.')));
    else blocks.push(P(T('These roles fit my limitations because '), B('EXPLAIN IN ONE OR TWO SENTENCES WHY THESE ROLES AVOID WHAT MADE PAST JOBS UNWORKABLE: schedule, physical demand, pressure, pay structure'), T('.')));
    sections.push({ n: 3, title: 'My vocational goal', blocks });
  }

  /* 4. Facility */
  {
    const blocks = [];
    blocks.push(P(T('I understand VA weighs cost when more than one school can meet a veteran’s needs. '), schoolRef ? T(`${schoolRef} is the right facility for me for reasons that come from my disability, not from preference alone.`) : [B('SCHOOL'), T(' is the right facility for me for reasons that come from my disability, not from preference alone.')]));
    const paired = features.filter(f => f.pairsWith.some(id => (s.limits || []).includes(id)));
    const placement = features.find(f => f.id === 'placement');
    if (paired.length) {
      blocks.push(P(T('Each of these supports addresses a limitation documented in my rating decision:')));
      blocks.push(UL(paired.map(f => {
        const lims = f.pairsWith.filter(id => (s.limits || []).includes(id)).map(id => LIMIT_BY_ID[id].letterPhrase);
        return T(`${cap(f.letterPhrase)}: ${joinList(lims)}.`);
      })));
    } else {
      blocks.push(P(B('NAME EACH SUPPORT THE SCHOOL PROVIDES (disability services, veteran center, format, counseling, commute) AND MATCH IT TO A LIMITATION IN YOUR RATING DECISION')));
    }
    if (p.accommodations && p.accommodations.trim()) blocks.push(P(T(`My accommodations are already in place: ${p.accommodations.trim().replace(/[.\s]+$/, '')}.`)));
    else blocks.push(P(B('IF YOU HAVE AN ACCOMMODATION LETTER FROM THE SCHOOL, LIST EACH ACCOMMODATION AND THE LIMITATION IT ADDRESSES. IF NOT, DELETE THIS LINE.')));
    if (enrolled) blocks.push(P(T('Continuity is part of my plan. Transferring for my remaining terms would mean re-documenting my disability with a new office, re-establishing accommodations, and starting over with new faculty and a new cohort. For someone with my conditions, that disruption is itself a risk to finishing. Staying where my support is already built is the lower-risk path to completion.')));
    if (placement) blocks.push(P(T('The program also has placement services and a placement record in my field, which supports the plan’s employment outcome.')));
    blocks.push(P(T('The lower-cost alternative'), p.altName && p.altName.trim() ? T(`, ${p.altName.trim()}${s.altCost ? ` (about ${fmtUSD(s.altCost)} a year)` : ''},`) : [T(' '), B('NAME IT'), T(s.altCost ? ` (about ${fmtUSD(s.altCost)} a year)` : '')], T(' does not meet these needs for me: '), B('SAY SPECIFICALLY WHAT IT LACKS FOR YOU: no accommodation plan in place, no comparable format, farther from your providers, etc.'), T('. Under 38 CFR 21.120(c), cost decides only when another facility meets the veteran’s needs equally. Here it does not.')));
    if (overLine) blocks.push(P(T(`I understand that at about ${fmtUSD(s.cost)} a year my plan requires a high program costs memo approved by ${tier.approver} before the plan is signed, and I have prepared this information to support that review.`)));
    sections.push({ n: 4, title: schoolRef ? `Why ${schoolRef} is the right facility for my disability` : 'Why this school is the right facility for my disability', blocks });
  }

  /* 5. Degree */
  {
    const blocks = [];
    const eduName = s.education ? EDUCATION_NAMES[s.education] : null;
    blocks.push(P(T('Under 38 CFR 21.72, a veteran is to be trained to the level generally recognized as necessary for entry into employment in a suitable occupational objective. '), eduName ? T(`My current education, ${eduName}, does not get me there:`) : [B('YOUR CURRENT EDUCATION'), T(' does not get me there:')]));
    const items = [];
    items.push([B('ATTACH 3 CURRENT JOB POSTINGS FOR YOUR TARGET TITLES. HIGHLIGHT WHERE EACH REQUIRES OR PREFERS THIS DEGREE OR ITS COURSEWORK')]);
    if (occs.length) items.push([T(`The postings I have attached for ${joinList(occs.map(o => o.title.trim()))} list this ${programName} as required or preferred, and the O*NET education profile for the occupation shows it as the typical preparation for entry.`)]);
    else items.push([T('The O*NET education profile for my target occupation shows this level as the typical preparation for entry. '), B('ATTACH THE O*NET SUMMARY PAGE')]);
    items.push([T('My program provides the specific preparation these employers look for, including '), B('LIST 2 TO 3 RELEVANT COURSES OR CREDENTIALS FROM THE PROGRAM'), T('.')]);
    if (s.programLevel && s.education && LEVEL_RANK[s.programLevel] <= LEVEL_RANK[s.education]) items.push([B('THIS PROGRAM IS AT OR BELOW YOUR CURRENT EDUCATION LEVEL. EXPLAIN WHY IT IS STILL NECESSARY FOR ENTRY: a required license, a credential your degree does not carry, a field change your conditions require')]);
    blocks.push(UL(items));
    sections.push({ n: 5, title: 'Why this degree is required', blocks });
  }

  /* 6. Feasibility */
  {
    const blocks = [];
    blocks.push(P(T('My goal is reasonably feasible, and I can show it:')));
    const items = [];
    if (enrolled) items.push([T('I am already enrolled and in good standing, with a current GPA of '), V(p.gpa, 'GPA'), T('.')]);
    else items.push([T('I have been admitted '), B('OR: I meet the admission requirements and plan to apply for TERM'), T(', and my prior record ('), B('GPA OR RELEVANT PERFORMANCE'), T(') shows I can complete the program.')]);
    if (enrolled) items.push([T('I have '), V(p.semesters, 'NUMBER'), T(' semesters remaining, so this is a short, defined plan with a clear end date.')]);
    else items.push([T(`The program takes ${s.years || ''}${s.years ? ' year' + (s.years === 1 ? '' : 's') : ''}`), s.years ? T('') : B('LENGTH'), T(' full time, a defined plan with a clear end date.')]);
    if (s.cost > 0 && !overLine) items.push([T(`The cost of the program is under ${fmtUSD(HIGH_COST_THRESHOLD)} per year, within a counselor’s own approval authority.`)]);
    if (overLine) items.push([T(`The program cost is about ${fmtUSD(s.cost)} per year. I understand this requires approval by ${tier.approver}, and I am providing the documentation for that review.`)]);
    if (!s.cost) items.push([T('The annual cost of the program is '), B('TUITION, FEES, BOOKS, AND SUPPLIES PER YEAR'), T('.')]);
    if (overCap) items.push([T(`I have used about ${s.giUsed} months of other VA education benefits, and this program needs about ${needMonths} more, which brings my total past ${ENTITLEMENT_CAP_MONTHS} months. Under 38 CFR 21.78${needMonths > ENTITLEMENT_CAP_MONTHS ? '(c)' : '(b)(3)'}, the months necessary to complete the program may be authorized `), needMonths > ENTITLEMENT_CAP_MONTHS ? T('for a veteran with a serious employment handicap') : T('because they are what I need to become employable, and Chapter 31 by itself stays within 48 months'), T('. '), B('CONFIRM YOUR MONTHS USED ON YOUR VA.GOV STATEMENT OF BENEFITS')]);
    blocks.push(UL(items));
    if (enrolled) blocks.push(P(T('Changing schools at this point would add time and cost and would delay my entry into employment. Finishing where I am is the most direct path to my goal.')));
    sections.push({ n: 6, title: 'Feasibility', blocks });
  }

  /* 7. Request */
  {
    const blocks = [];
    blocks.push(P(T('I respectfully request:')));
    const items = [];
    items.push([T('A determination of employment handicap '), B('ADD “and serious employment handicap” IF YOUR LIMITATIONS ARE SEVERE OR YOU ARE RATED 10%'), T(' based on the evidence above.')]);
    items.push([T('Approval of my vocational goal of '), V(occs[0]?.title || p.goal, 'PRIMARY GOAL'), T('.')]);
    items.push([T(`An Individualized Written Rehabilitation Plan under the ${TRACK_LONG_TERM} track to complete my ${programName} at `), V(school, 'SCHOOL'), T('.')]);
    if (enrolled) items.push([T('Retroactive induction for the terms I have already completed and paid for under the Post-9/11 GI Bill, since I was eligible for Chapter 31 during that period.')]);
    if (overCap) items.push([T(`An extension of entitlement beyond ${ENTITLEMENT_CAP_MONTHS} months under 38 CFR 21.78, with the VR&E Officer\u2019s concurrence, for the months necessary to complete this program.`)]);
    blocks.push(OL(items));
    const visible = CHECKLIST.filter(c => c.showIf(s));
    const have = visible.filter(c => (s.evidence || []).includes(c.id)).map(c => c.letterName);
    const missing = visible.filter(c => !(s.evidence || []).includes(c.id)).map(c => c.letterName);
    blocks.push(P(T('Supporting documents: '), have.length ? T(joinList(have)) : T(''), missing.length ? [have.length ? T('; ') : T(''), B(`STILL TO GATHER: ${missing.join(', ')}`)] : T(''), T('.')));
    blocks.push(P(T('Thank you for your time and your help with my plan.')));
    sections.push({ n: 7, title: 'My request', blocks });
  }

  const closing = [[T('Respectfully,')], [B('YOUR NAME')], [B('PHONE'), T(' | '), B('EMAIL')]];

  return { header, howTo, sections, closing };
}

/* ─── Counting and serialising ───────────────────────────────────────────── */
function* allParts(letter) {
  for (const line of letter.header) yield* line;
  for (const sec of letter.sections) for (const blk of sec.blocks) for (const item of blk.items) yield* item;
  for (const line of letter.closing) yield* line;
}
export function countBrackets(letter) {
  let n = 0;
  for (const part of allParts(letter)) if (part.b) n++;
  return n;
}
const partText = part => part.b ? `[${part.b}]` : (part.t || '');
const lineText = parts => parts.map(partText).join('');

export function letterToText(letter, { includeHowTo = true } = {}) {
  const out = [];
  letter.header.forEach(l => out.push(lineText(l)));
  out.push('');
  if (includeHowTo) { out.push('HOW TO USE THIS DRAFT'); letter.howTo.forEach(h => out.push(`- ${h}`)); out.push(''); }
  for (const sec of letter.sections) {
    out.push(`${sec.n}. ${sec.title.toUpperCase()}`);
    out.push('');
    for (const blk of sec.blocks) {
      if (blk.type === 'p') out.push(lineText(blk.items[0]));
      else blk.items.forEach((it, i) => out.push(`${blk.type === 'ol' ? (i + 1) + '.' : '-'} ${lineText(it)}`));
      out.push('');
    }
  }
  letter.closing.forEach(l => out.push(lineText(l)));
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

export function letterToHtml(letter, esc) {
  const part = p => p.b ? `<span class="lb">[${esc(p.b)}]</span>` : esc(p.t || '');
  const line = parts => parts.map(part).join('');
  const h = letter.header.map((l, i) => `<p class="lh${i < 2 ? ' lh-title' : ''}">${line(l)}</p>`).join('');
  const how = `<div class="l-howto"><p class="l-howto-t">How to use this draft</p><ul>${letter.howTo.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  const secs = letter.sections.map(sec => `<h4>${sec.n}. ${esc(sec.title)}</h4>${sec.blocks.map(blk => blk.type === 'p' ? `<p>${line(blk.items[0])}</p>` : `<${blk.type}>${blk.items.map(it => `<li>${line(it)}</li>`).join('')}</${blk.type}>`).join('')}`).join('');
  const close = letter.closing.map(l => `<p class="lc">${line(l)}</p>`).join('');
  return h + how + secs + close;
}
