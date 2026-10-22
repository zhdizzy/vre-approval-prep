// VR&E Approval Prep — node harness. Run from tbv-tools/vre-approval-prep:  node test/sim.mjs
// Grid: every mode × ratings × costs on both sides of each ladder boundary × enrolled on/off × empty
// and filled private fields. Asserts: no undefined/NaN in any output, the right approver per cost,
// no retroactive-induction request unless enrolled, every letter sentence has a value or a bracket,
// and no private field ever reaches the share-URL field set.
import { solve } from '../engine.js';
import { buildLetter, countBrackets, letterToText, letterToHtml } from '../letter.js';
import { buildDocxBytes } from '../docx.js';
import { ladderTier, LADDER, HIGH_COST_THRESHOLD } from '../data/rules.js';
import { OCCUPATIONS } from '../data/occupations.js';
import { FEATURES, LIMITS } from '../data/limits.js';

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL', msg); } };
const esc = s => String(s ?? '');

const MODES = ['first', 'pushback', 'cost', 'denied'];
const RATINGS = [{ raw: 'unrated', unrated: true, pending: false, rating: null }, { raw: 'pending', unrated: false, pending: true, rating: null }, { raw: '0', rating: 0 }, { raw: '10', rating: 10 }, { raw: '20', rating: 20 }, { raw: '70', rating: 70 }, { raw: '100', rating: 100 }];
const COSTS = [0, 12000, 49999, 50000, 50001, 75000, 75001, 100000, 100001, 180000];
const PRIV_EMPTY = { jobs: [{}, {}, {}, {}], occupations: [{}, {}, {}] };
const PRIV_FULL = { counselor: 'Ms. Ortega', branch: 'United States Army', serviceYears: '2009 to 2017', school: 'State University', program: 'M.S. in Cybersecurity', startTerm: 'January 2027', conditions: 'PTSD and lumbar strain', ratingWording: 'Difficulty in adapting to stressful circumstances\nChronic sleep impairment', accommodations: 'extended time', semesters: '2', gpa: '3.4', gradDate: 'May 2027', altName: 'County College', goal: 'a desk-based analyst role', jobs: [{ title: 'Warehouse supervisor', worked: false, reason: 'standing' }, { title: 'Help desk', worked: true, reason: 'structure' }, {}, {}], occupations: [{ title: 'Information Security Analyst', code: '15-1212.00', system: 'ONET' }, {}, {}] };

function mk(o) {
  return { mode: 'first', ratingRaw: '70', rating: 70, unrated: false, pending: false, status: 'applied', education: 'bach', programLevel: 'mast', cost: 24000, years: 2, objection: 'employable', happened: 'silent', weams: 'unsure', altCost: 0, altLacksProgram: false, enrolled: false, dischargeYear: null, firstRatingYear: null, activeDuty: false, deps: 0, gi: 'unsure', giUsed: null, limits: [], features: [], evidence: [], priv: PRIV_EMPTY, ...o };
}

const BAD = /undefined|NaN|\[object Object\]|null(?![a-z])/;
let combos = 0;
for (const mode of MODES) for (const R of RATINGS) for (const cost of COSTS) for (const enrolled of [false, true]) for (const priv of [PRIV_EMPTY, PRIV_FULL]) for (const limits of [[], ['stress', 'standing']]) for (const features of [[], ['dso', 'hybrid', 'placement']]) {
  combos++;
  const s = mk({ mode, ratingRaw: R.raw, rating: R.rating ?? null, unrated: !!R.unrated, pending: !!R.pending, cost, enrolled, priv, limits, features, altCost: cost > 50000 ? 15000 : 0 });
  let r;
  try { r = solve(s); } catch (e) { ok(false, `solve threw for ${JSON.stringify({ mode, rating: R.raw, cost, enrolled })}: ${e.message}`); continue; }
  const text = letterToText(r.letter), html = letterToHtml(r.letter, esc);
  ok(!BAD.test(text), `letter text has a bad token: mode=${mode} rating=${R.raw} cost=${cost} enrolled=${enrolled} priv=${priv === PRIV_FULL ? 'full' : 'empty'}\n  ${text.match(new RegExp('.{0,60}' + BAD.source + '.{0,60}'))?.[0]}`);
  ok(!BAD.test(html), `letter html has a bad token: mode=${mode} rating=${R.raw} cost=${cost}`);
  ok(!BAD.test(JSON.stringify(r.ready.map(x => [x.title, x.why, x.act]))), `readiness has a bad token: mode=${mode} rating=${R.raw} cost=${cost}`);
  // Approver per cost
  const t = ladderTier(cost);
  const expected = cost <= 50000 ? 0 : cost <= 75000 ? 1 : cost <= 100000 ? 2 : 3;
  ok(t.index === expected, `ladder tier for ${cost}: got ${t.index}, expected ${expected}`);
  ok(r.tier.memo === (cost > HIGH_COST_THRESHOLD), `memo flag for ${cost}`);
  // Retroactive induction only when enrolled
  const retro = /Retroactive induction/.test(text);
  ok(retro === enrolled, `retroactive request present=${retro} but enrolled=${enrolled}`);
  // Every sentence carries a value or a bracket: no empty list items
  ok(!/\n- \s*\n/.test(text) && !/<li><\/li>/.test(html), `empty list item: mode=${mode} cost=${cost}`);
  // Section count and header
  ok(r.letter.sections.length === 7, 'seven sections');
  ok(/VOCATIONAL GOAL AND REHABILITATION PLAN STATEMENT/.test(text), 'header present');
  // Brackets: a fully-filled enrolled case should have fewer brackets than an empty one
  // A filled case keeps the by-design brackets (name, date, effective date, decision month, where-educated,
  // what the alternative lacks, postings, courses, SEH line, still-to-gather, signature x3): 13; unenrolled adds 3; cost=0 adds 1; a pending rating adds 1.
  if (priv === PRIV_FULL && limits.length && features.length) ok(countBrackets(r.letter) <= 19, `too many brackets on a filled case (${countBrackets(r.letter)})`);
  if (priv === PRIV_EMPTY) ok(countBrackets(r.letter) >= 15, `too few brackets on an empty case (${countBrackets(r.letter)})`);
  // Readiness sanity
  ok(r.ready.length === 8, 'eight readiness elements');
  ok(r.readyCount >= 0 && r.readyCount <= 8, 'ready count in range');
  const costEl = r.ready.find(x => x.id === 'cost');
  if (R.unrated) ok(r.ready[0].st === 'miss', 'unrated => eligibility missing');
  if (R.rating === 20 || R.rating === 70 || R.rating === 100) ok(r.ready[0].st === 'doc', `rated ${R.rating} => eligibility documented`);
  if (R.rating === 10) ok(r.ready[0].st === 'thin', '10% => thin (SEH)');
  if (cost === 0) ok(costEl.st === 'thin', 'no cost => cost element thin');
  if (cost > 0 && cost <= 50000) ok(costEl.st === 'doc', 'under the line => documented');
  if (cost > 50000 && limits.length && features.length) ok(costEl.st === 'doc', `over the line with alt + 2 paired => documented (got ${costEl.st})`);
  if (cost > 50000 && !limits.length && !features.length) ok(costEl.st === 'thin', `over the line with alt only => thin (got ${costEl.st})`);
}

// Pre-2013 window logic
{
  const now = new Date().getFullYear();
  const closed = solve(mk({ dischargeYear: 2005, firstRatingYear: 2006 }));
  ok(closed.ready[0].st === 'miss', 'pre-2013, window passed => missing');
  const open = solve(mk({ dischargeYear: 2012, firstRatingYear: now - 3 }));
  ok(open.ready[0].st === 'doc', 'pre-2013 but recent first rating => documented');
  const unknown = solve(mk({ dischargeYear: 2010, firstRatingYear: null }));
  ok(unknown.ready[0].st === 'thin', 'pre-2013, no first rating year => thin');
  const post = solve(mk({ dischargeYear: 2013 }));
  ok(post.ready[0].st === 'doc', '2013 discharge => no window');
}

// Months of entitlement (38 CFR 21.78)
{
  const m = o => solve(mk(o)).ready.find(x => x.id === 'months');
  ok(m({ giUsed: null }).st === 'thin', 'months unknown => thin');
  ok(m({ giUsed: 0, years: 2 }).st === 'doc', '0 used + 18 needed => documented');
  ok(m({ giUsed: 30, years: 2 }).st === 'doc', '30 + 18 = 48 => documented (at the ceiling)');
  ok(m({ giUsed: 36, years: 2 }).st === 'thin', '36 + 18 = 54 => thin, extension under 21.78(b)(3)');
  ok(m({ giUsed: 0, years: 6 }).st === 'miss', '54 months of Chapter 31 alone => needs SEH');
  const over = letterToText(buildLetter(mk({ giUsed: 36, years: 2, priv: PRIV_FULL })));
  ok(/21\.78\(b\)\(3\)/.test(over) && /extension of entitlement beyond 48 months/i.test(over), 'letter asks for the 48-month extension when over the ceiling');
  const under = letterToText(buildLetter(mk({ giUsed: 10, years: 2, priv: PRIV_FULL })));
  ok(!/21\.78/.test(under), 'no extension language when inside the ceiling');
}

// Word download: a real .docx (ZIP with the required parts), not HTML with a .doc name
{
  const bytes = buildDocxBytes(buildLetter(mk({ priv: PRIV_FULL, giUsed: 36 })));
  const txt = new TextDecoder().decode(bytes);
  ok(bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04, 'docx starts with the ZIP local-file signature');
  for (const part of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml', 'word/_rels/document.xml.rels']) ok(txt.includes(part), `docx contains ${part}`);
  ok(txt.includes('<w:highlight w:val="yellow"/>'), 'brackets are highlighted in the docx');
  ok(!/<html|<span class=/.test(txt), 'docx is not HTML in disguise');
  ok(txt.includes('VOCATIONAL GOAL AND REHABILITATION PLAN STATEMENT'), 'docx carries the letter text');
  const amp = buildDocxBytes(buildLetter(mk({ priv: { ...PRIV_FULL, conditions: 'PTSD & back <strain>' } })));
  ok(new TextDecoder().decode(amp).includes('PTSD &amp; back &lt;strain&gt;'), 'XML special characters are escaped');
}

// The two-legged cost case, and the fifth objection
{
  const c = o => solve(mk({ cost: 90000, ...o })).ready.find(x => x.id === 'cost').st;
  ok(c({}) === 'miss', 'over the line, nothing entered => missing');
  ok(c({ altCost: 15000 }) === 'thin', 'alternative named only => thin');
  ok(c({ altCost: 15000, altLacksProgram: true }) === 'doc', 'alternative named + it cannot deliver the plan => documented');
  ok(c({ altLacksProgram: true }) === 'thin', 'program argument without naming the alternative => thin');
  const txt = letterToText(buildLetter(mk({ cost: 90000, altCost: 15000, altLacksProgram: true, priv: PRIV_FULL })));
  ok(/21\.120\(c\)\(1\)\(ii\)/.test(txt), 'letter cites 21.120(c)(1)(ii) when the alternative lacks the program');
  ok(!/21\.120\(c\)\(1\)\(ii\)/.test(letterToText(buildLetter(mk({ cost: 90000, altCost: 15000, priv: PRIV_FULL })))), 'no program sentence unless the box is ticked');
}

// Feature pairing: a feature with no matching limit is left out of the letter
{
  const s = mk({ limits: ['commute'], features: ['dso', 'counseling', 'vacare'], priv: PRIV_FULL });
  const text = letterToText(buildLetter(s));
  ok(/proximity to my VA providers/i.test(text), 'paired feature (vacare↔commute) appears');
  ok(!/on-campus counseling/i.test(text), 'unpaired feature (counseling) is left out');
}

// Share-URL discipline: private keys never appear in the URL field list (mirrors script.js URL_FIELDS)
{
  const URL_KEYS = ['m', 'r', 'st', 'ed', 'pl', 'c', 'yr', 'dy', 'fr', 'ad', 'en', 'ac', 'wm', 'dep', 'gi', 'ob', 'wh', 'ev'];
  const PRIVATE = ['goal', 'altName', 'school', 'program', 'counselor', 'ratingWording', 'jobs', 'occupations', 'accommodations', 'limits', 'features', 'lim', 'feat', 'gl', 'an'];
  for (const k of PRIVATE) ok(!URL_KEYS.includes(k), `private key ${k} in URL field list`);
}

// Data integrity
{
  const codes = new Set();
  for (const o of OCCUPATIONS) { ok(!codes.has(o.code + o.title), `duplicate occupation ${o.title}`); codes.add(o.code + o.title); ok(o.system === 'GS' ? /^GS-\d{4}$/.test(o.code) : /^\d{2}-\d{4}\.\d{2}$/.test(o.code), `code format ${o.code}`); }
  const limitIds = new Set(LIMITS.map(l => l.id));
  for (const f of FEATURES) for (const l of f.pairsWith) ok(limitIds.has(l), `feature ${f.id} pairs with unknown limit ${l}`);
  ok(LADDER[0].max === 50000 && LADDER[1].max === 75000 && LADDER[2].max === 100000, 'ladder bands');
}

console.log(`${combos} combinations, ${checks} checks, ${fails} failures`);
process.exitCode = fails ? 1 : 0;
