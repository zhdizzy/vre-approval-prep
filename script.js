// VR&E Approval Prep — UI wiring on the house template (forked from veteran-business 9/30/26).
import { DATA_STAMP, LADDER, HIGH_COST_THRESHOLD, ladderTier, FOUR_QUESTIONS, RULES, ESCALATION, REAPPLY_WARNING, WH_HOTLINE, ONE_ON_ONE, CANT_DO, PRESTIGE_NOTE, REGION_NOTE } from './data/rules.js';
import { OBJECTIONS, OBJECTION_BY_ID } from './data/objections.js';
import { LIMITS, FITS, FEATURES, LIMIT_BY_ID, FIT_BY_ID, FEATURE_BY_ID } from './data/limits.js';
import { OCCUPATIONS, occupationUrl, findOccupation } from './data/occupations.js';
import { CHECKLIST } from './data/checklist.js';
import { buildLetter, countBrackets, letterToText, letterToHtml } from './letter.js';
import { solve, DEFAULT_YEARS } from './engine.js';
import { buildDocxBytes, DOCX_MIME } from './docx.js';
import { getVreRate } from '/gi-bill-vre/data/vre-rates.js';

const $ = id => document.getElementById(id);
const fmtUSD = n => '$' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SOURCE = 'vre-approval-prep';
const DRAFT_KEY = 'vap-letter-draft';
const VRE_NO_LIMIT_DISCHARGE_YEAR = 2013;

const emptyPriv = () => ({ counselor: '', branch: '', serviceYears: '', school: '', program: '', startTerm: '', conditions: '', ratingWording: '', accommodations: '', semesters: '', gpa: '', gradDate: '', altName: '', goal: '', jobs: [{}, {}, {}, {}], occupations: [{}, {}, {}] });
const state = { mode: 'first', revealed: false, last: null, limits: new Set(), features: new Set(), evidence: new Set(), priv: emptyPriv(), sample: false };
$('data-stamp').textContent = DATA_STAMP;

/* ─── Elements ─────────────────────────────────────────────────────────── */
const ratingEl = $('rating'), statusEl = $('status'), educationEl = $('education'), programEl = $('program-level'), goalEl = $('goal'), costEl = $('cost');
const objectionEl = $('objection'), happenedEl = $('happened');
const weamsEl = $('weams'), altCostEl = $('alt-cost'), altNameEl = $('alt-name'), altLacksEl = $('alt-lacks'), enrolledEl = $('enrolled'), yearsEl = $('years');
const dischargeEl = $('discharge-year'), firstRatingEl = $('first-rating-year'), activeEl = $('active-duty'), depsEl = $('deps'), giEl = $('gi'), giUsedEl = $('gi-used');

$('limits').innerHTML = LIMITS.map(l => `<label><input type="checkbox" data-limit="${l.id}"> ${esc(l.label)}</label>`).join('');
$('features').innerHTML = FEATURES.map(f => `<label><input type="checkbox" data-feature="${f.id}"> ${esc(f.label)}</label>`).join('');
$('occ-list').innerHTML = OCCUPATIONS.map(o => `<option value="${esc(o.title)}"></option>`).join('');
document.querySelectorAll('[data-limit]').forEach(cb => cb.addEventListener('change', () => { cb.checked ? state.limits.add(cb.dataset.limit) : state.limits.delete(cb.dataset.limit); onPrivateChange(); }));
document.querySelectorAll('[data-feature]').forEach(cb => cb.addEventListener('change', () => { cb.checked ? state.features.add(cb.dataset.feature) : state.features.delete(cb.dataset.feature); onPrivateChange(); }));
goalEl.addEventListener('input', () => { state.priv.goal = goalEl.value; onPrivateChange(); });
altNameEl.addEventListener('input', () => { state.priv.altName = altNameEl.value; onPrivateChange(); });

/* ─── Mode pills (reshape the tool) ────────────────────────────────────── */
const MODE_BRIEF = {
  first: 'The first appointment decides more than people expect. We’ll check your case against the rules the counselor works from, show who has to approve a plan at your cost, and draft the letter that puts your goal, your limits, and your school on paper before you walk in.',
  pushback: 'Counselors say the same few things: you’re already employable, a lower degree is enough, go to the cheaper school. Each one has a regulation that answers it. Pick what yours said and we’ll build the response and the letter around it.',
  cost: 'Cost is a factor only when a cheaper school meets your needs equally. Above $50,000 a year a memo has to be approved above your counselor before the plan is signed. We’ll show who that is and draft your answers to the four questions the manual makes them write down. One rule up front: prestige and outcomes don\u2019t carry the case anymore; what your school\u2019s disability office does for you that the cheaper one\u2019s can\u2019t is the case.',
  denied: 'A stalled or denied case has an order of operations, and the most common mistake is filing a new application. Tell us what happened and we’ll lay out the next step, the ladder above your counselor, and the letter that restates your case.',
};
const BTN_TEXT = { first: 'Build My Prep Packet →', pushback: 'Build My Response →', cost: 'Show Who Approves My Plan →', denied: 'Show My Next Step →' };
function setMode(m, opts = {}) {
  state.mode = m;
  document.querySelectorAll('.mode-pill').forEach(p => { p.classList.toggle('active', p.dataset.mode === m); p.setAttribute('aria-pressed', p.dataset.mode === m ? 'true' : 'false'); });
  $('mode-briefing').textContent = MODE_BRIEF[m];
  $('compare-btn').textContent = BTN_TEXT[m];
  $('field-objection').hidden = m !== 'pushback';
  $('field-happened').hidden = m !== 'denied';
  // Cost mode pulls the school card up into Start here; every other mode keeps it in the drawer.
  const school = $('card-school');
  if (m === 'cost') { if (school.parentElement !== $('input-section')) $('input-section').appendChild(school); }
  else if (school.parentElement !== $('drawer-grid')) $('drawer-grid').insertBefore(school, $('card-timing'));
  if (m === 'denied' && !statusEl.value) statusEl.value = 'denied';
  if (state.revealed) reveal({ silent: true });
  updateLiveStrip();
}
document.querySelectorAll('.mode-pill').forEach(p => p.addEventListener('click', () => {
  setMode(p.dataset.mode);
  if (isTourActive() && tourState.steps[tourState.i]?.id === 'pills') showTourStep(tourState.i + 1);
}));

/* ─── Conditional fields ───────────────────────────────────────────────── */
function ratingInfo() {
  const v = ratingEl.value;
  const unrated = v === 'unrated' || v === '';
  const pending = v === 'pending';
  const num = (!unrated && !pending) ? parseInt(v, 10) : null;
  return { raw: v, unrated, pending, num, rated: num !== null };
}
function syncConditionalFields() {
  const r = ratingInfo();
  const rl = $('rating-line');
  if (r.unrated && r.raw !== '') { rl.hidden = false; rl.innerHTML = '<strong>VR&amp;E starts with a rating.</strong> You need a service-connected rating of 10% or more to be evaluated. The claim comes first; the rest of this page still shows you what the counselor will look for.'; }
  else if (r.pending) { rl.hidden = false; rl.innerHTML = '<strong>Decision pending.</strong> You can prepare now and apply the day the rating posts. We’ll bracket the rating in your letter.'; }
  else if (r.rated && r.num === 0) { rl.hidden = false; rl.innerHTML = '<strong>0% does not open VR&amp;E.</strong> The program needs 10% or more. If those conditions have worsened, an increase claim is the first step.'; }
  else if (r.rated && r.num === 10) { rl.hidden = false; rl.innerHTML = '<strong>At 10%</strong> entitlement requires a <em>serious</em> employment handicap finding. The evaluation is open to you; the letter has to make the severity case.'; }
  else if (r.rated && r.num >= 20) { rl.hidden = false; rl.innerHTML = `<strong>${r.num}% meets the basic threshold.</strong> What opens the program is the counselor’s employment handicap finding. That is what the letter is for.`; }
  else rl.hidden = true;
  const dy = parseInt(dischargeEl.value, 10);
  const pre2013 = dy && dy < VRE_NO_LIMIT_DISCHARGE_YEAR;
  $('first-rating-year-label').hidden = !pre2013; firstRatingEl.hidden = !pre2013;
  $('cost-hint').innerHTML = costEl.value && parseFloat(costEl.value) > HIGH_COST_THRESHOLD
    ? `<strong>Over ${fmtUSD(HIGH_COST_THRESHOLD)}.</strong> A high program costs memo is required, approved by ${esc(ladderTier(parseFloat(costEl.value)).approver)} before the plan is signed.`
    : 'This is what decides who has to approve your plan. Subsistence doesn’t count toward it.';
}
[ratingEl, dischargeEl, costEl].forEach(el => { el.addEventListener('change', syncConditionalFields); el.addEventListener('input', syncConditionalFields); });

/* ─── Inputs → model ───────────────────────────────────────────────────── */
function buildInput() {
  const r = ratingInfo();
  const programLevel = programEl.value || null;
  const years = parseInt(yearsEl.value, 10) || (programLevel ? DEFAULT_YEARS[programLevel] : 0);
  return {
    mode: state.mode, ratingRaw: r.raw, rating: r.num, unrated: r.unrated, pending: r.pending,
    status: statusEl.value || null, education: educationEl.value || null, programLevel,
    cost: parseFloat(costEl.value) || 0, years,
    objection: objectionEl.value, happened: happenedEl.value,
    weams: weamsEl.value, altCost: parseFloat(altCostEl.value) || 0, altLacksProgram: altLacksEl.checked,
    enrolled: enrolledEl.value === 'yes',
    dischargeYear: parseInt(dischargeEl.value, 10) || null, firstRatingYear: parseInt(firstRatingEl.value, 10) || null,
    activeDuty: activeEl.value === 'yes', deps: parseInt(depsEl.value, 10) || 0, gi: giEl.value, giUsed: giUsedEl.value === '' ? null : Math.max(0, parseInt(giUsedEl.value, 10) || 0),
    limits: [...state.limits], features: [...state.features], evidence: [...state.evidence],
    priv: state.priv,
  };
}

const run = () => solve(buildInput());

/* ─── Live strip ───────────────────────────────────────────────────────── */
let liveTimer = null;
function updateLiveStrip() {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    const el = $('live-strip');
    const s = buildInput();
    if (!s.ratingRaw || !s.status) { el.innerHTML = '<strong>Required to run:</strong> your rating and where you are in the process. Your case builds here as you answer.'; return; }
    const r = solve(s);
    const stake = r.stake > 0 ? ` · <span class="stake">${fmtUSD(r.stake)}</span> of training at stake over ${s.years} year${s.years === 1 ? '' : 's'}` : '';
    const who = s.cost > 0 ? ` · approver: <strong>${esc(r.tier.short)}</strong>${r.tier.memo ? ', memo required' : ', no memo'}` : '';
    el.innerHTML = `<span class="ready">${r.readyCount} of ${r.ready.length}</span> case elements documented${stake}${who}. Press the button for the packet and the letter.`;
  }, 150);
}
let rerenderTimer = null;
function onFormChange() {
  updateLiveStrip();
  if (!state.revealed) return;
  clearTimeout(rerenderTimer);
  rerenderTimer = setTimeout(() => reveal({ silent: true }), 250);
}
document.querySelectorAll('#calc-form input, #calc-form select').forEach(el => { el.addEventListener('input', onFormChange); el.addEventListener('change', onFormChange); });

/* ─── Validation (novalidate + JS, house rule) ─────────────────────────── */
function clearMissing() { document.querySelectorAll('.field-missing, .field-error').forEach(el => el.classList.remove('field-missing', 'field-error')); }
function validate() {
  clearMissing();
  if (!ratingEl.value) { ratingEl.closest('.fg-field').classList.add('field-missing'); ratingEl.classList.add('field-error'); return { message: 'Required: your VA rating (the red field). “Haven’t filed yet” is a fine answer.', focusEl: ratingEl }; }
  if (!statusEl.value) { statusEl.closest('.fg-field').classList.add('field-missing'); statusEl.classList.add('field-error'); return { message: 'Required: where you are in the VR&E process. It decides which card leads.', focusEl: statusEl }; }
  if (state.mode === 'cost' && !(parseFloat(costEl.value) > 0)) { costEl.closest('.fg-field').classList.add('field-missing'); costEl.classList.add('field-error'); return { message: 'For the cost question we need the annual program cost. A close estimate is fine.', focusEl: costEl }; }
  return { message: '', focusEl: null };
}
[ratingEl, statusEl, costEl].forEach(el => el.addEventListener('change', () => { if (el.value) { clearMissing(); $('form-error').textContent = ''; } }));

/* ─── Submit gate ──────────────────────────────────────────────────────── */
$('calc-form').addEventListener('submit', e => { e.preventDefault(); reveal(); });
function reveal(opts = {}) {
  const v = validate();
  if (opts.silent && v.message) { clearMissing(); return; }
  $('form-error').textContent = v.message;
  if (v.message) { if (!isTourActive()) v.focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); v.focusEl.focus({ preventScroll: true }); return; }
  const r = run();
  state.last = r;
  renderHero(r);
  renderCards(r);
  state.revealed = true;
  $('hero-verdict').style.display = 'block';
  $('hero-capture').style.display = 'block';
  $('results-container').style.display = 'block';
  $('action-bar').style.display = 'flex';
  if (opts.silent) return;
  if (typeof gtag === 'function') gtag('event', 'show_results', { mode: state.mode, rating: r.s.ratingRaw, status: r.s.status, tier: r.tier.short });
  if (isTourActive() && tourState.steps[tourState.i]?.id === 'gate') endTour();
  if (!isTourActive()) $('hero-verdict').scrollIntoView({ behavior: 'smooth', block: 'start' });
  let resultsSeen = true;
  try { resultsSeen = localStorage.getItem(RESULTS_TOUR_KEY) === '1'; } catch {}
  if (!resultsSeen && !window.__vapArrivalHadParams) setTimeout(() => startTourWith(RESULTS_TOUR, RESULTS_TOUR_KEY), 800);
}
$('retake-btn').addEventListener('click', () => {
  state.revealed = false;
  ['hero-verdict', 'hero-capture', 'results-container'].forEach(id => $(id).style.display = 'none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── Jump links: every gap points at the field that fixes it ──────────── */
const GAP_SHORT = { elig: 'eligibility', handicap: 'employment handicap', goal: 'job goal', level: 'training level', months: 'months of entitlement', weams: 'school approval', cost: 'cost', evidence: 'evidence' };
function gapTarget(key) {
  const s = buildInput();
  switch (key) {
    case 'elig': return s.dischargeYear && s.dischargeYear < VRE_NO_LIMIT_DISCHARGE_YEAR && !s.firstRatingYear ? { sel: '#first-rating-year', drawer: true } : { sel: '#rating' };
    case 'handicap': return s.limits.length ? { sel: '#fi-wording', fillin: true } : { sel: '#card-limits', drawer: true };
    case 'goal': return (s.priv.goal || '').trim() ? { sel: '[data-occ="0"]', fillin: true } : { sel: '#goal' };
    case 'level': return { sel: !s.education ? '#education' : '#program-level' };
    case 'weams': return { sel: '#weams', drawer: true };
    case 'cost': return s.cost > HIGH_COST_THRESHOLD ? ((s.altCost > 0 || (s.priv.altName || '').trim()) ? { sel: '#alt-lacks', drawer: true } : { sel: '#alt-cost', drawer: true }) : { sel: '#cost' };
    case 'months': return s.giUsed == null ? { sel: '#gi-used', drawer: true } : { sel: '#fill-in', fillin: true };
    case 'evidence': return { sel: '#card-evidence .ev-list', card: '#card-evidence' };
    case 'fillin': return { sel: '#fill-in', fillin: true };
    default: return null;
  }
}
function goTo(key) {
  const t = gapTarget(key); if (!t) return;
  if (t.drawer) $('assumptions-drawer').open = true;
  if (t.card) { const c = document.querySelector(t.card); if (c) c.open = true; }
  if (t.fillin) { const lc = $('card-letter'); if (lc) lc.open = true; const fi = $('fill-in'); if (fi) fi.open = true; }
  const el = document.querySelector(t.sel); if (!el) return;
  const box = el.closest('.fg-field, .input-card, .fi-sec, .fill-in, .stack-card') || el;
  if (!isTourActive()) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  box.classList.remove('goto-flash'); void box.offsetWidth; box.classList.add('goto-flash');
  const f = el.matches('input, select, textarea') ? el : el.querySelector('input, select, textarea');
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 450);
}
document.addEventListener('click', e => { const a = e.target.closest('[data-goto]'); if (!a) return; e.preventDefault(); goTo(a.dataset.goto); });
const gapLink = (g, text) => `<a href="#" class="gap-link" data-goto="${g.id}">${esc(text || GAP_SHORT[g.id] || g.title)}</a>`;

/* ─── Hero ─────────────────────────────────────────────────────────────── */
function renderHero(r) {
  const el = $('hero-verdict');
  const s = r.s, t = r.tier;
  const gapNames = r.gaps.slice(0, 2).map(g => `<strong>${gapLink(g)}</strong>`);
  let kicker, line;
  if (s.unrated || s.rating === 0) {
    kicker = 'Start with the rating';
    line = `VR&E starts with a service-connected rating of 10% or more. ${s.unrated ? 'File the claim first; an Intent to File locks your effective date while you build it.' : 'A 0% rating does not open the program; an increase claim is the first step.'} Everything below still shows you what the counselor will look for, so the day the rating posts you are ready.`;
  } else if (s.mode === 'pushback') {
    const o = OBJECTION_BY_ID[s.objection];
    const rule = RULES[o.ruleIds[0]];
    kicker = 'The rule that answers it';
    line = `Your counselor said <strong>“${esc(o.label.toLowerCase())}.”</strong> The rule that answers it is <strong>${esc(rule.cite)}</strong>: ${esc(rule.title.toLowerCase())}. Your response and your letter are drafted below; the letter is ready on <strong>${r.readyCount} of ${r.ready.length}</strong> points.`;
  } else if (s.mode === 'cost') {
    kicker = t.memo ? 'A memo, approved before the plan is signed' : 'Inside your counselor’s own authority';
    line = t.memo
      ? `At <strong>${fmtUSD(s.cost)}</strong> a year your plan goes to <strong>${esc(t.approver)}</strong>, and the high program costs memo has to be approved before the plan is signed. You have <strong>${r.answered.size} of 4</strong> justification questions answered${r.answered.size < 2 ? '; the two that matter most are about support for your disability' : ''}. Don\u2019t argue prestige; argue what this school\u2019s disability office does for you that the cheaper one\u2019s can\u2019t.`
      : `At <strong>${fmtUSD(s.cost)}</strong> a year your counselor can approve this plan without a memo. The case still has to be made on suitability and training level; the letter below does that.`;
  } else if (s.mode === 'denied') {
    const e = ESCALATION[s.happened];
    kicker = 'Your next step';
    line = `<strong>${esc(e.title)}.</strong> Your next move is <strong>${esc(e.steps[0][0].toLowerCase())}</strong>. Keep a review lane open on the decision you already have; the clock on it is one year. Applying again can run alongside a review, never in place of one. The full order of operations is below, and the letter restates your case for whoever reads it next.`;
  } else {
    kicker = r.gaps.length ? `Ready on ${r.readyCount} of ${r.ready.length}` : 'Ready to walk in';
    line = r.gaps.length
      ? `You’re ready on <strong>${r.readyCount} of ${r.ready.length}</strong> case elements. ${r.gaps.length === 1 ? 'One gap' : `${r.gaps.length} gaps`} to close before your appointment, starting with ${gapNames.join(' and ')}. Your letter is drafted below with brackets where it needs your details.`
      : `Every case element is documented. Fill the remaining brackets in the letter, print it, and bring the evidence list. Your counselor will have less to question than most.`;
  }
  const tiles = `<div class="three-num">
    <div class="num-card comfortable"><span class="nc-label">Case elements documented</span><span class="nc-amount">${r.readyCount} of ${r.ready.length}</span><span class="nc-sub">${r.gaps.length ? 'thin or missing: ' + r.gaps.map(g => gapLink(g)).join(' \u00b7 ') + ' (click one to fix it)' : 'nothing thin'}</span></div>
    <div class="num-card"><span class="nc-label">Who approves your plan</span><span class="nc-amount">${s.cost > 0 ? esc(t.short) : '—'}</span><span class="nc-sub">${s.cost > 0 ? (t.memo ? `memo required above ${fmtUSD(HIGH_COST_THRESHOLD)}/yr` : 'no memo at this cost') : 'enter the annual cost'}</span></div>
    <div class="num-card"><span class="nc-label">Training at stake</span><span class="nc-amount">${r.stake > 0 ? fmtUSD(r.stake) : '—'}</span><span class="nc-sub">${r.stake > 0 ? `${fmtUSD(s.cost)}/yr × ${s.years} year${s.years === 1 ? '' : 's'}, plus a monthly allowance` : 'enter cost and program length'}</span></div>
  </div>`;
  const bracketLine = `<p class="v-sub"><span class="chip chip-gold">Your letter</span> <strong>${countBrackets(r.letter)} brackets</strong> still need your real information. <a href="#" class="gap-link" data-goto="fillin">Fill them in here \u2192</a> Nothing you type there leaves this device.</p>`;
  el.innerHTML = `<p class="v-kicker">${esc(kicker)}</p><p class="v-line">${line}</p>${tiles}${bracketLine}`;
}

/* ─── Cards ────────────────────────────────────────────────────────────── */
function card(id, title, value, valueClass, body, open) {
  return `<details class="stack-card" id="card-${id}"${open ? ' open' : ''}><summary><span class="sc-title">${esc(title)}</span><span class="sc-value ${valueClass || ''}">${value}</span></summary><div class="sc-body">${body}</div></details>`;
}
function ruleBlock(id) {
  const r = RULES[id]; if (!r) return '';
  return `<div class="rule"><p class="rule-t">${esc(r.title)}</p><p>${esc(r.plain)}</p>${r.quote ? `<details class="rule-q"><summary>The exact text</summary><p><em>“${esc(r.quote)}”</em></p></details>` : ''}<p class="rule-c"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.cite)}</a>${r.verified && r.verified !== 'pending' ? ` · verified ${esc(r.verified)}` : ''}</p></div>`;
}
const oneLine = key => `<p class="one-line">${esc(ONE_ON_ONE[key])} <a href="${ONE_ON_ONE.url}">Work With Me →</a></p>`;
const stLabel = { doc: ['rs-doc', 'Documented'], thin: ['rs-thin', 'Thin'], miss: ['rs-miss', 'Missing'] };
const readyListHtml = r => r.ready.map(x => `<li><span class="rs ${stLabel[x.st][0]}">${stLabel[x.st][1]}</span><div><p class="r-t">${esc(x.title)}</p><p class="r-w">${esc(x.why)}</p>${x.act ? `<p class="r-a">${esc(x.act)}${x.link ? ` <a href="${esc(x.link[0])}"${x.link[0].startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(x.link[1])} \u2192</a>` : ''}</p>` : ''}${x.st !== 'doc' ? `<p class="r-fix"><a href="#" class="gap-link" data-goto="${x.id}">Take me there \u2192</a></p>` : ''}</div></li>`).join('');

function renderCards(r) {
  const s = r.s, t = r.tier;
  const cards = {};
  // Readiness
  cards.ready = card('ready', 'Readiness check', `${r.readyCount} of ${r.ready.length} documented`, r.gaps.length ? 'door' : '', `
    <p>Eight things a counselor looks for, scored from your answers. No percentage, no odds; just where the case is thin so you can fix it before the appointment.</p>
    <ul class="ready-list">${r.ready.map(x => `<li><span class="rs ${stLabel[x.st][0]}">${stLabel[x.st][1]}</span><div><p class="r-t">${esc(x.title)}</p><p class="r-w">${esc(x.why)}</p>${x.act ? `<p class="r-a">${esc(x.act)}${x.link ? ` <a href="${esc(x.link[0])}"${x.link[0].startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(x.link[1])} →</a>` : ''}</p>` : ''}</div></li>`).join('')}</ul>
    ${ruleBlock('entitlement')}${r.ready.find(x => x.id === 'months')?.st !== 'doc' ? ruleBlock('months') : ''}${s.dischargeYear && s.dischargeYear < VRE_NO_LIMIT_DISCHARGE_YEAR ? ruleBlock('window') : ''}${s.activeDuty ? ruleBlock('activeDuty') : ''}<p class="sc-src">38 CFR 21.35, 21.40, 21.53, 21.72, 21.120; 38 U.S.C. 3103; M28C.IV.C.2.03, M28C.V.B.1. ${esc(CANT_DO)}</p>`, false);
  // Ladder
  {
    const rows = LADDER.map((L, i) => `<tr class="${s.cost > 0 && i === t.index ? 'you-row' : ''}"><td>${L.max === Infinity ? `Over ${fmtUSD(L.min)}` : `${i === 0 ? 'Up to' : fmtUSD(L.min) + ' to'} ${fmtUSD(L.max)}`}</td><td>${esc(L.approver.replace(/^(your|the) /, '').replace(/^./, c => c.toUpperCase()))}</td><td><span class="memo-chip ${L.memo ? 'yes' : 'no'}">${L.memo ? 'Memo' : 'No memo'}</span></td></tr>`).join('');
    const lead = s.cost > 0
      ? `<p>At <strong>${fmtUSD(s.cost)}</strong> a year in program costs, ${t.memo ? `your plan needs a high program costs memo approved by <strong>${esc(t.approver)}</strong> before the plan is signed.` : `your counselor can approve the plan on their own authority. No memo.`}${r.stake > 0 ? ` Over ${s.years} year${s.years === 1 ? '' : 's'} that is <strong>${fmtUSD(r.stake)}</strong> of training.` : ''}</p>`
      : '<p>Enter your annual program cost in the form and this card shows who has to sign off.</p>';
    cards.ladder = card('ladder', 'Who approves your plan', s.cost > 0 ? esc(t.short) + (t.memo ? ' · memo' : '') : 'enter cost', s.cost > 0 && t.memo ? 'door' : '', `${lead}
      <div class="table-scroll"><table class="cmp-table ladder-table"><thead><tr><th>Annual program cost</th><th>Approver</th><th>High-cost memo</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p><strong>What counts as program cost:</strong> tuition, fees, books, and supplies over the 12 months from the first term after the plan is written. Subsistence does not count. <strong>Timing:</strong> the memo is approved before the plan is signed, and once approved covers the whole training period unless the school or the goal changes. <strong>Watch year two:</strong> costs are rechecked at every annual review, so a tuition increase can trigger a memo later.</p>
      ${ruleBlock('memoMust')}${ruleBlock('highCost')}${ruleBlock('ladder')}${ruleBlock('inState')}
      ${s.cost > 0 && t.index >= 2 ? oneLine('cost') : ''}`, false);
  }
  // Four questions
  {
    const byQ = {};
    for (const f of r.paired) (byQ[f.question] ||= []).push(f);
    if (s.features.includes('placement')) (byQ[3] ||= []).push(FEATURE_BY_ID.placement);
    const items = FOUR_QUESTIONS.map(q => {
      const fs = byQ[q.n] || [];
      const ans = fs.length ? fs.map(f => `${f.letterPhrase.charAt(0).toUpperCase() + f.letterPhrase.slice(1)}${f.pairsWith.length ? `, addressing ${f.pairsWith.filter(l => s.limits.includes(l)).map(l => LIMIT_BY_ID[l].label.toLowerCase()).join(', ')}` : ''}.`).join(' ') : null;
      return `<li class="${q.lead ? 'lead' : ''}"><p class="q-q">${esc(q.text)}${q.lead ? '<span class="q-tag">lead with this</span>' : q.n === 3 ? '<span class="q-tag">supporting line only</span>' : ''}</p><p class="q-a ${ans ? '' : 'empty'}">${ans ? esc(ans) : q.n === 4 ? 'Only if a shorter commute is your reason. Say whether it means finishing sooner.' : q.n === 3 ? 'Placement services are a real factor, but do not lead with them; the case is built on the first two.' : 'Nothing checked yet that answers this. Open “Adjust the details” and check the school supports that pair with your limits.'}</p></li>`;
    }).join('');
    cards.questions = card('questions', 'The four questions your counselor has to answer', `${r.answered.size} of 4 answered`, r.answered.size >= 2 ? '' : 'off', `
      <p>When a cheaper school exists and the cost difference is significant, VA’s manual requires the counselor to answer these four questions in writing, on VA Form 28-1902n, <em>before</em> the plan is written. Two of them are about support for your disability. Answer them for the counselor, in their own framework.</p>
      <div class="callout callout-gold"><h3>${esc(PRESTIGE_NOTE.title)}</h3><p>${esc(PRESTIGE_NOTE.text)}</p></div>
      <ol class="q-list">${items}</ol>
      ${ruleBlock('planServices')}${ruleBlock('preference')}${ruleBlock('costFactor')}`, false);
  }
  // Letter
  cards.letter = card('letter', 'Your letter to the counselor', `${countBrackets(r.letter)} brackets left`, 'door', renderLetterCard(r), true);
  // Objections
  {
    const list = s.mode === 'pushback' ? [OBJECTION_BY_ID[s.objection], ...OBJECTIONS.filter(o => o.id !== s.objection)] : s.mode === 'cost' ? [OBJECTION_BY_ID.cheaper, ...OBJECTIONS.filter(o => o.id !== 'cheaper')] : OBJECTIONS;
    const html = list.map((o, i) => `<div class="obj ${i === 0 && (s.mode === 'pushback' || s.mode === 'cost') ? 'picked' : ''}"><p class="o-says">${esc(o.counselorSays)}</p><p class="o-plain">${esc(o.plain)}</p><p class="o-resp">${esc(o.response)}</p><p class="o-cite">${o.ruleIds.map(id => `<a href="${esc(RULES[id].url)}" target="_blank" rel="noopener">${esc(RULES[id].cite)}</a>`).join(' · ')}</p></div>`).join('');
    cards.objections = card('objections', 'What counselors say, and the rule that answers it', `${OBJECTIONS.length} objections`, 'door', `<p>The likely wording, a short response in your voice, and the cite. Say it in your own words; the cite is for the file.</p>${html}${ruleBlock('suitable')}${ruleBlock('entry')}${ruleBlock('sehLevel')}${ruleBlock('feasibility')}${s.mode === 'pushback' ? oneLine('pushback') : ''}`, false);
  }
  // Evidence
  {
    const visible = CHECKLIST.filter(c => c.showIf(s));
    const have = visible.filter(c => s.evidence.includes(c.id)).length;
    cards.evidence = card('evidence', 'Evidence checklist', `${have} of ${visible.length} gathered`, have >= 5 ? '' : 'off', `
      <p>Tick items as you gather them. The count feeds the readiness check and the supporting-documents line in your letter. Print this card and bring it.</p>
      <ul class="ev-list">${visible.map(c => `<li><label><input type="checkbox" data-ev="${c.id}"${s.evidence.includes(c.id) ? ' checked' : ''}> ${esc(c.label)}</label></li>`).join('')}</ul>
      ${ruleBlock('weams')}`, false);
  }
  // Escalation
  {
    const key = s.mode === 'denied' ? s.happened : 'silent';
    const e = ESCALATION[key];
    const others = Object.entries(ESCALATION).filter(([k]) => k !== key);
    const steps = ee => `<ol class="steps-list">${ee.steps.map(([t2, w]) => `<li><div><p class="st-t">${esc(t2)}</p><p class="st-w">${esc(w)}</p></div></li>`).join('')}</ol>`;
    cards.escalation = card('escalation', 'If you’re stalled or denied', esc(e.title), s.mode === 'denied' || s.status === 'denied' ? 'door' : 'off', `
      <div class="warn-line"><strong>Review first. Reapply only alongside.</strong> ${esc(REAPPLY_WARNING)}</div>
      <p class="region-note">${esc(REGION_NOTE)}</p>
      <p><strong>${esc(e.title)}</strong></p>${steps(e)}
      ${others.map(([, ee]) => `<details class="faq-item"><summary>${esc(ee.title)}</summary><div style="padding:0 18px 12px">${steps(ee)}</div></details>`).join('')}
      ${ruleBlock('review')}${ruleBlock('dueProcess')}${key === 'orientation' ? ruleBlock('noShow') : ''}
      <p class="sc-src">${esc(WH_HOTLINE.label)}: ${esc(WH_HOTLINE.phone)}. A VSO (DAV, VFW, American Legion) represents you at no cost. Congressional caseworkers handle VA inquiries for constituents.</p>
      ${s.mode === 'denied' ? oneLine('denied') : ''}`, false);
  }
  // Money
  {
    const flat = getVreRate(s.deps, 'fullTime');
    cards.money = card('money', 'The money while you train', `${fmtUSD(flat)}/mo flat rate`, '', `
      <div class="money-grid">
        <div class="money-tile"><span class="mt-n">${fmtUSD(flat)}</span><span class="mt-l">Chapter 31 full-time subsistence, ${s.deps === 0 ? 'no dependents' : `${s.deps}${s.deps >= 4 ? '+' : ''} dependent${s.deps === 1 ? '' : 's'}`}, flat national rate</span></div>
        <div class="money-tile"><span class="mt-n">${s.gi === 'no' ? 'Not open' : 'BAH rate'}</span><span class="mt-l">${s.gi === 'no' ? 'The Post-9/11 subsistence election needs remaining Chapter 33 entitlement' : 'Post-9/11 subsistence election: E-5-with-dependents housing rate for your school’s ZIP, not reduced by your GI Bill tier'}</span></div>
      </div>
      <p>Tuition, fees, books, and supplies are paid by VR&E with no cap once the plan is approved, and none of it spends your GI Bill months. ${s.gi === 'no' ? '' : 'If you have Post-9/11 GI Bill months left, the election in 38 CFR 21.260 usually pays far more than the flat rate; it is a form, changeable between terms.'} The comparison, with your school’s ZIP, lives in the <a href="/gi-bill-vre/">GI Bill vs. VR&E tool</a>.</p>
      ${ruleBlock('p911sa')}${s.enrolled ? ruleBlock('retro') : ''}
      <p class="sc-src">Subsistence rates as published by VA for the current fiscal year (imported from the GI Bill vs. VR&E tool’s rate file). Rates change each October 1.</p>`, false);
  }
  const ORDER = {
    first: ['ready', 'letter', 'ladder', 'questions', 'objections', 'evidence', 'escalation', 'money'],
    pushback: ['objections', 'letter', 'ready', 'ladder', 'questions', 'evidence', 'escalation', 'money'],
    cost: ['ladder', 'questions', 'letter', 'ready', 'objections', 'evidence', 'escalation', 'money'],
    denied: ['escalation', 'letter', 'ready', 'ladder', 'questions', 'objections', 'evidence', 'money'],
  };
  const order = ORDER[s.mode];
  const html = order.map((id, i) => { let h = cards[id]; if (i === 0 && !h.includes(' open>')) h = h.replace('<details class="stack-card"', '<details class="stack-card" open'); return h; }).join('');
  $('cards-panel').innerHTML = html;
  wireLetterCard();
  document.querySelectorAll('[data-ev]').forEach(cb => cb.addEventListener('change', () => { cb.checked ? state.evidence.add(cb.dataset.ev) : state.evidence.delete(cb.dataset.ev); reveal({ silent: true }); }));
}

/* ─── Letter card ──────────────────────────────────────────────────────── */
const SAMPLE = {
  mode: 'first', rating: 70, unrated: false, pending: false, status: 'applied', education: 'bach', programLevel: 'mast', cost: 24000, years: 2,
  weams: 'yes', altCost: 0, enrolled: false, limits: ['stress', 'crowds', 'sleep', 'standing'], features: ['dso', 'hybrid', 'vetcenter'], evidence: ['rating', 'postings', 'onet', 'resume', 'transcripts', 'admission', 'schoolsupport', 'costsheet', 'weams'],
  priv: { counselor: 'Ms. Ortega', branch: 'United States Army', serviceYears: '2009 to 2017', school: 'State University', program: 'M.S. in Cybersecurity', startTerm: 'January 2027', conditions: 'post-traumatic stress disorder, lumbar strain, and tinnitus', ratingWording: 'Difficulty in adapting to stressful circumstances\nChronic sleep impairment\nDisturbances of motivation and mood\nForward flexion of the thoracolumbar spine limited by pain', accommodations: 'flexible attendance for medical appointments, a reduced-distraction testing setting, and extended time on timed assessments', semesters: '', gpa: '3.4', gradDate: '', altName: 'the county community college certificate', goal: 'a structured, analytical, desk-based role in information security', jobs: [{ title: 'Warehouse shift supervisor', worked: false, reason: 'standing' }, { title: 'Car sales, commission only', worked: false, reason: 'stress' }, { title: 'County IT help desk technician', worked: true, reason: 'structure' }, {}], occupations: [{ title: 'Information Security Analyst', code: '15-1212.00', system: 'ONET' }, { title: 'Information Technology Management (federal)', code: 'GS-2210', system: 'GS' }, {}] },
};
function currentLetter() { return state.sample ? buildLetter(SAMPLE) : buildLetter(buildInput()); }
function renderLetterCard(r) {
  const p = state.priv;
  const jobRow = (j, i) => `<div class="job-row"><input type="text" data-job="${i}" data-k="title" placeholder="Job ${i + 1}, e.g. warehouse supervisor" value="${esc(j.title || '')}" maxlength="80"><select data-job="${i}" data-k="worked"><option value="no"${j.worked ? '' : ' selected'}>Did not work for me</option><option value="yes"${j.worked ? ' selected' : ''}>Worked for me</option></select><select data-job="${i}" data-k="reason">${(j.worked ? FITS : LIMITS).map(x => `<option value="${x.id}"${j.reason === x.id ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>`;
  const occRow = (o, i) => `<div class="occ-row"><input type="text" list="occ-list" data-occ="${i}" placeholder="Target occupation ${i + 1}, start typing" value="${esc(o.title || '')}" maxlength="90" autocomplete="off"><span class="occ-code">${o.code ? (occupationUrl(o) ? `<a href="${esc(occupationUrl(o))}" target="_blank" rel="noopener">${esc(o.code)}</a>` : esc(o.code)) : ''}</span></div>`;
  const f = (id, label, ph, val, type = 'text') => `<div class="fg-field"><label for="fi-${id}">${label}</label><input type="${type}" id="fi-${id}" data-priv="${id}" placeholder="${esc(ph)}" value="${esc(val || '')}" maxlength="120" autocomplete="off"></div>`;
  return `
    <p>A Vocational Goal and Rehabilitation Plan Statement, addressed to your counselor, in your words. Filled in from your answers; a highlighted bracket wherever it needs your real information. ${esc(CANT_DO)}</p>
    <div class="letter-tools no-print">
      <button type="button" id="letter-copy" class="action-btn secondary">Copy letter</button>
      <button type="button" id="letter-print" class="action-btn secondary">Print letter only</button>
      <button type="button" id="letter-download" class="action-btn secondary">Download for Word</button>
      <button type="button" id="sample-toggle" class="sample-toggle" aria-pressed="${state.sample ? 'true' : 'false'}">${state.sample ? 'Back to my letter' : 'See a finished example'}</button>
      <span class="bracket-count" id="bracket-count"></span>
    </div>
    <p class="phone-hint no-print">On a phone, <strong>Download for Word</strong> opens your share menu: pick Pages, Word, Google Docs, or Save to Files. If a different app opens instead, use <strong>Copy letter</strong> and paste it wherever you write.</p>
    <p class="letter-sample-note" id="letter-sample-note" ${state.sample ? '' : 'hidden'}>An example for a fictional veteran, to show what a finished draft looks like. Nothing in it is yours. Switch back to keep working on your own.</p>
    <div id="letter-sheet"></div>
    <details class="fill-in" id="fill-in" ${countBrackets(r.letter) > 0 ? '' : ''}>
      <summary><span class="fi-title">Fill in your letter</span><span class="fi-count" id="fi-count"></span><span class="drawer-hint">Your rating decision\u2019s wording, your work history, your target occupations, your school\u2019s accommodations. One section at a time, and the letter above updates as you type. Saved on this device only.</span></summary>
      <div class="fi-body">
        <div class="fi-sec"><p class="fi-h">Header and background</p>
          <div class="fg-two">${f('counselor', 'Counselor’s name', 'e.g. Ms. Ortega', p.counselor)}${f('branch', 'Branch', 'e.g. United States Navy', p.branch)}</div>
          <div class="fg-two">${f('serviceYears', 'Service years', 'e.g. 2010 to 2018', p.serviceYears)}${f('conditions', 'Your service-connected conditions', 'e.g. PTSD, lumbar strain, tinnitus', p.conditions)}</div>
          <div class="fg-two">${f('school', 'School', 'e.g. State University', p.school)}${f('program', 'Exact program name', 'e.g. M.S. in Cybersecurity', p.program)}</div>
          <div class="fg-two">${buildInput().enrolled ? f('semesters', 'Semesters remaining', 'e.g. 2', p.semesters) + f('gradDate', 'Expected graduation', 'e.g. May 2027', p.gradDate) : f('startTerm', 'Start term', 'e.g. January 2027', p.startTerm) + f('gpa', 'Prior GPA (optional)', 'e.g. 3.4', p.gpa)}</div>
          ${buildInput().enrolled ? `<div class="fg-two">${f('gpa', 'Current GPA', 'e.g. 3.4', p.gpa)}</div>` : ''}
        </div>
        <div class="fi-sec"><p class="fi-h">Your employment handicap, in VA’s words</p>
          <label for="fi-wording" class="chk-label">Paste the findings from your rating decision, one per line</label>
          <textarea id="fi-wording" data-priv="ratingWording" placeholder="e.g.\nDifficulty in adapting to stressful circumstances\nChronic sleep impairment\nForward flexion limited by pain">${esc(p.ratingWording || '')}</textarea>
          <p class="fi-note">Use VA’s exact words from the narrative pages of the decision. The tool never supplies findings for you.</p>
          <p class="chk-label" style="margin-top:10px">Work history since service (up to four)</p>
          ${p.jobs.map(jobRow).join('')}
        </div>
        <div class="fi-sec"><p class="fi-h">Your vocational goal</p>
          ${p.occupations.map(occRow).join('')}
          <p class="fi-note">Pick from the list for an O*NET or federal series code (the link lets you confirm it), or type your own title.</p>
        </div>
        <div class="fi-sec"><p class="fi-h">Why this school</p>
          <label for="fi-accom" class="chk-label">Accommodations or support already in place (from the school’s letter)</label>
          <textarea id="fi-accom" data-priv="accommodations" placeholder="e.g. flexible attendance for medical appointments, extended time on assessments, note-taking support">${esc(p.accommodations || '')}</textarea>
          <p class="fi-note">The cheaper alternative’s name and cost, and the school supports you checked, come from the form above.</p>
        </div>
        <div class="fi-sec"><button type="button" class="fi-clear" id="letter-clear">Clear my draft from this device</button> <span class="fi-note">Saved in your browser only. Never sent to us, never in a link.</span></div>
      </div>
    </details>`;
}
function paintLetter() {
  const sheet = $('letter-sheet'); if (!sheet) return;
  const L = currentLetter();
  sheet.innerHTML = letterToHtml(L, esc);
  const n = countBrackets(L);
  const bc = $('bracket-count'); if (bc) { bc.textContent = state.sample ? 'example' : `${n} bracket${n === 1 ? '' : 's'} left`; bc.classList.toggle('done', n === 0 && !state.sample); }
  const sv = document.querySelector('#card-letter .sc-value'); if (sv) sv.textContent = state.sample ? 'example shown' : `${n} brackets left`;
  const fc = $('fi-count'); if (fc) { fc.textContent = n === 0 ? 'all filled' : `${n} to fill in`; fc.classList.toggle('done', n === 0); }
}
let saveTimer = null;
function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ priv: state.priv, limits: [...state.limits], features: [...state.features], evidence: [...state.evidence] })); } catch {} }, 300);
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); if (!d) return;
    state.priv = { ...emptyPriv(), ...(d.priv || {}) };
    state.priv.jobs = [0, 1, 2, 3].map(i => (state.priv.jobs || [])[i] || {});
    state.priv.occupations = [0, 1, 2].map(i => (state.priv.occupations || [])[i] || {});
    (d.limits || []).forEach(x => state.limits.add(x)); (d.features || []).forEach(x => state.features.add(x)); (d.evidence || []).forEach(x => state.evidence.add(x));
    document.querySelectorAll('[data-limit]').forEach(cb => cb.checked = state.limits.has(cb.dataset.limit));
    document.querySelectorAll('[data-feature]').forEach(cb => cb.checked = state.features.has(cb.dataset.feature));
    goalEl.value = state.priv.goal || ''; altNameEl.value = state.priv.altName || '';
  } catch {}
}
function onPrivateChange() {
  saveDraft();
  if (state.revealed) { const r = run(); state.last = r; renderHero(r); paintLetter(); refreshReadyCard(r); }
}
function refreshReadyCard(r) {
  const rl = document.querySelector('#card-ready .ready-list');
  if (rl) rl.innerHTML = readyListHtml(r);
  const sv = document.querySelector('#card-ready .sc-value'); if (sv) sv.textContent = `${r.readyCount} of ${r.ready.length} documented`;
}
function wireLetterCard() {
  paintLetter();
  document.querySelectorAll('[data-priv]').forEach(el => el.addEventListener('input', () => { state.priv[el.dataset.priv] = el.value; onPrivateChange(); }));
  document.querySelectorAll('[data-job]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
    const i = +el.dataset.job, k = el.dataset.k, j = state.priv.jobs[i] || (state.priv.jobs[i] = {});
    if (k === 'worked') { j.worked = el.value === 'yes'; j.reason = (j.worked ? FITS : LIMITS)[0].id; const rs = document.querySelector(`select[data-job="${i}"][data-k="reason"]`); if (rs) rs.innerHTML = (j.worked ? FITS : LIMITS).map(x => `<option value="${x.id}">${esc(x.label)}</option>`).join(''); }
    else if (k === 'reason') j.reason = el.value;
    else { j.title = el.value; if (!j.reason) j.reason = (j.worked ? FITS : LIMITS)[0].id; }
    onPrivateChange();
  }));
  document.querySelectorAll('[data-occ]').forEach(el => el.addEventListener('input', () => {
    const i = +el.dataset.occ; const m = findOccupation(el.value);
    state.priv.occupations[i] = m ? { ...m } : { title: el.value, code: '', system: '' };
    const codeEl = el.parentElement.querySelector('.occ-code'); if (codeEl) codeEl.innerHTML = m ? `<a href="${esc(occupationUrl(m))}" target="_blank" rel="noopener">${esc(m.code)}</a>` : '';
    onPrivateChange();
  }));
  $('letter-copy')?.addEventListener('click', async () => {
    if (state.sample) return;
    const btn = $('letter-copy'), text = letterToText(currentLetter());
    try { await navigator.clipboard.writeText(text); const o = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(() => { btn.textContent = o; }, 2000); } catch { prompt('Copy your letter:', text); }
    if (typeof gtag === 'function') gtag('event', 'letter_copy', { source: SOURCE });
  });
  $('letter-download')?.addEventListener('click', async () => {
    if (state.sample) return;
    // A genuine .docx (see docx.js). On phones, hand it to the share sheet so the veteran picks the app
    // (Pages, Word, Google Docs, Mail, Files). A plain download on iOS gets routed to whichever app claimed
    // .docx first, which for many people is a job-search app. Desktop keeps the normal download.
    const name = 'VRE-vocational-goal-statement-draft.docx';
    const bytes = buildDocxBytes(currentLetter());
    if (typeof gtag === 'function') gtag('event', 'letter_download', { source: SOURCE });
    const touch = matchMedia('(pointer: coarse)').matches;
    if (touch && typeof File === 'function' && navigator.canShare) {
      try {
        const file = new File([bytes], name, { type: DOCX_MIME });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'VR&E Vocational Goal Statement (draft)' }); return; }
      } catch (err) { if (err && err.name === 'AbortError') return; /* otherwise fall through to a normal download */ }
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: DOCX_MIME }));
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
  $('letter-print')?.addEventListener('click', () => {
    if (state.sample) return;
    document.body.classList.add('print-letter-only');
    const done = () => { document.body.classList.remove('print-letter-only'); removeEventListener('afterprint', done); };
    addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
    if (typeof gtag === 'function') gtag('event', 'letter_print', { source: SOURCE });
  });
  $('sample-toggle')?.addEventListener('click', () => {
    state.sample = !state.sample;
    const b = $('sample-toggle'); b.setAttribute('aria-pressed', state.sample ? 'true' : 'false'); b.textContent = state.sample ? 'Back to my letter' : 'See a finished example';
    $('letter-sample-note').hidden = !state.sample;
    $('letter-copy').disabled = state.sample; $('letter-print').disabled = state.sample; $('letter-download').disabled = state.sample;
    paintLetter();
  });
  $('letter-clear')?.addEventListener('click', () => {
    if (!confirm('Clear the letter details saved on this device? Your form selections stay.')) return;
    state.priv = emptyPriv(); goalEl.value = ''; altNameEl.value = '';
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    reveal({ silent: true });
  });
}

/* ─── FAQ (visible; mirrors FAQPage JSON-LD) ───────────────────────────── */
const FAQ = [
  ['What does it take to get approved for VR&E?', 'Three things, in order. A service-connected rating (20% or more, or 10% with a serious employment handicap). A counselor’s finding that your service-connected conditions create an employment handicap, meaning they get in the way of preparing for, getting, or keeping suitable work. And a vocational goal that is reasonably feasible, with training that is necessary for entry into it. The rating gets you the evaluation; the employment handicap finding and the goal are what the counselor decides.'],
  ['Will VR&E pay for a private or expensive school?', 'It can. Under 38 CFR 21.120(c), cost becomes a factor when more than one facility meets the veteran’s needs. VA’s manual requires the counselor to consider your preference and, where costs differ significantly, to document four questions before the plan is written. Above $50,000 a year in program costs a high program costs memo is required and must be approved before the plan is signed: VR&E Officer up to $75,000, Regional Office Director up to $100,000, Executive Director of VR&E Service above that. Do not argue prestige, rankings, or job outcomes; that argument no longer carries. Argue what this school\u2019s disability services office, format, or location does for your rated conditions that the cheaper school\u2019s cannot.'],
  ['What if my VR&E counselor says I’m already employable?', 'The program’s standard is suitable employment, not any employment. Suitable work is consistent with your abilities and does not aggravate your service-connected conditions. If the jobs you can hold today are the ones that make your conditions worse, they are not suitable, and 38 CFR 21.72 trains a veteran to the level generally recognized as necessary for entry into the suitable goal. Show the pattern in your work history, tie it to the findings in your rating decision, and name the goal that fits.'],
  ['Can VR&E pay for a master’s degree or graduate school?', 'Yes, when that degree is the level generally recognized as necessary for entry into the occupational objective in your plan (38 CFR 21.72). The evidence is concrete: current job postings for the target title that require or prefer the degree, and the O*NET education profile for the occupation. It is easier to get a graduate degree approved as part of one continuous plan established early than to come back after a bachelor’s and ask separately.'],
  ['What should I bring to my first VR&E appointment?', 'Your full rating decision (the narrative pages with VA’s findings), medical records or provider statements that document your functional limits, three current job postings for your target role showing the education required, the O*NET page for the occupation, your resume and transcripts, your admission or enrollment letter, the school’s written description of its disability and veteran support or your accommodation letter, a program cost sheet for every year, and a GI Bill Comparison Tool printout showing the school and program are VA-approved.'],
];
$('faq-items').innerHTML = FAQ.map(([q, a]) => `<details class="faq-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');

/* ─── Share URL (selections only; nothing personal, no limits, no features) ── */
const URL_FIELDS = [['r', ratingEl], ['st', statusEl], ['ed', educationEl], ['pl', programEl], ['c', costEl], ['yr', yearsEl], ['dy', dischargeEl], ['fr', firstRatingEl], ['ad', activeEl], ['en', enrolledEl], ['ac', altCostEl], ['wm', weamsEl], ['dep', depsEl], ['gi', giEl], ['gu', giUsedEl], ['ob', objectionEl], ['wh', happenedEl]];
const SHARE_KEYS = new Set(['m', ...URL_FIELDS.map(([k]) => k), 'ev', 'ap']);
function buildShareUrl() {
  const p = new URLSearchParams();
  p.set('m', state.mode);
  for (const [k, el] of URL_FIELDS) if (el.value !== '' && el.value != null) p.set(k, el.value);
  if (altLacksEl.checked) p.set('ap', '1');
  if (state.evidence.size) p.set('ev', [...state.evidence].join('.'));
  return location.origin + location.pathname + '?' + p.toString() + '&source=' + SOURCE;
}
function hasShareParams(p) { return [...p.keys()].some(k => SHARE_KEYS.has(k)); }
function loadFromUrl() {
  const p = new URLSearchParams(location.search);
  if (!hasShareParams(p)) return false;
  if (!p.has('r')) { if (p.has('m') && MODE_BRIEF[p.get('m')]) { setMode(p.get('m')); history.replaceState(null, '', location.pathname); } return false; }
  setMode(MODE_BRIEF[p.get('m')] ? p.get('m') : 'first');
  for (const [k, el] of URL_FIELDS) if (p.has(k)) el.value = p.get(k);
  altLacksEl.checked = p.get('ap') === '1';
  if (p.has('ev')) p.get('ev').split('.').filter(Boolean).forEach(x => state.evidence.add(x));
  syncConditionalFields();
  if (p.has('dy') || p.has('ac') || p.has('en')) $('assumptions-drawer').open = true;
  history.replaceState(null, '', location.pathname);
  reveal();
  return true;
}

/* ─── Email capture ────────────────────────────────────────────────────── */
async function sendResultsEmail(email, statusEl2, btn, placement) {
  if (!email || !email.includes('@')) { statusEl2.textContent = 'Please enter a valid email.'; statusEl2.className = 'email-status error'; return false; }
  btn.disabled = true;
  statusEl2.textContent = 'Sending…'; statusEl2.className = 'email-status';
  try {
    const res = await fetch('/api/email-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, resultsUrl: buildShareUrl(), source: SOURCE }) });
    const data = await res.json();
    if (res.ok && data.success) {
      statusEl2.textContent = '✓ Check your inbox: your packet link is on the way.'; statusEl2.className = 'email-status success';
      if (typeof gtag === 'function') gtag('event', 'email_capture', { placement, source: SOURCE });
      return true;
    }
    statusEl2.textContent = data.error || 'Something went wrong. Please try again.'; statusEl2.className = 'email-status error';
  } catch { statusEl2.textContent = 'Network error. Please try again.'; statusEl2.className = 'email-status error'; }
  finally { btn.disabled = false; }
  return false;
}
$('hero-capture-form').addEventListener('submit', async e => { e.preventDefault(); if (await sendResultsEmail($('hero-email-input').value.trim(), $('hero-email-status'), $('hero-email-btn'), 'hero')) $('hero-email-input').value = ''; });
$('email-results-form').addEventListener('submit', async e => { e.preventDefault(); if (await sendResultsEmail($('email-input').value.trim(), $('email-status'), $('email-submit-btn'), 'bottom')) $('email-input').value = ''; });
$('print-btn').addEventListener('click', () => window.print());
$('share-btn').addEventListener('click', async () => {
  const btn = $('share-btn');
  try { await navigator.clipboard.writeText(buildShareUrl()); const o = btn.textContent; btn.textContent = '✓ Link Copied!'; setTimeout(() => { btn.textContent = o; }, 2000); }
  catch { prompt('Copy this link:', buildShareUrl()); }
});

/* ─── Interactive tour (house standard, copied from VFI via veteran-business) ── */
const INPUT_TOUR_KEY = 'vap-tour-seen', RESULTS_TOUR_KEY = 'vap-results-tour-seen';
const INPUT_TOUR = [
  { id: 'welcome', target: null, label: 'Step 1 of 7', title: 'Welcome: 60 seconds, then it’s all yours', text: 'VR&E is the most counselor-dependent benefit VA runs. The rules are written down, and this walks your case through them, then drafts the letter you bring to the appointment. Fill in your real answers as we go; exit anytime.' },
  { id: 'pills', target: '#mode-pills', label: 'Step 2 of 7', title: 'What brings you here?', text: 'First appointment, a counselor pushing back, an expensive school, or a stalled case. The cards are the same; which one leads and how the verdict reads changes. Click one.' },
  { id: 'you', target: '#card-you', label: 'Step 3 of 7', title: 'Your rating and where you are', text: 'A rating of 10% or more opens the evaluation. Where you are in the process decides which card leads. Your education feeds the “already employable” question.' },
  { id: 'plan', target: '#card-plan', label: 'Step 4 of 7', title: 'The plan and what it costs', text: 'The program level is checked against your education under 38 CFR 21.72. The annual cost decides who has to approve the plan: your counselor up to $50,000, higher offices above it.' },
  { id: 'assumptions', target: '#assumptions-drawer', label: 'Step 5 of 7', title: 'Your limits and the school’s support', text: 'All optional, and this is where the letter gets its strength: how your rated conditions limit work, and which school supports match those limits. These stay on your device.' },
  { id: 'live', target: '#live-strip', label: 'Step 6 of 7', title: 'Your case, live', text: 'How many of the eight case elements are documented, and what the training is worth, updating as you answer.' },
  { id: 'gate', target: '#compare-btn', label: 'Step 7 of 7', title: 'Build the packet', text: 'Press it, and we’ll walk through the results and the letter together.' },
];
const RESULTS_TOUR = [
  { id: 'r-hero', target: '#hero-verdict', label: 'Results 1 of 5', title: 'The verdict', text: 'How many case elements are documented, who approves your plan, and what the training is worth. Every gap named here is a link: click one and it takes you to the exact field that fixes it.' },
  { id: 'r-lead', target: '#cards-panel > details:first-child', label: 'Results 2 of 5', title: 'The card that leads', text: 'For your situation, this is the one to read first. Open the others the same way; each carries its cite and link.' },
  { id: 'r-letter', target: '#letter-sheet', label: 'Results 3 of 5', title: 'Your letter', text: 'Drafted from your answers. Every highlighted bracket is something only you can supply: your rating decision’s words, your jobs, your school’s accommodations. “See a finished example” shows what done looks like.' },
  { id: 'r-fill', target: '#fill-in', label: 'Results 4 of 5', title: 'Fill it in, one section at a time', text: 'This is where the real work is. Paste the findings from your rating decision, add your jobs and target occupations, and the letter above rewrites itself as you type. The chip counts what is left. Saved in your browser only; never sent, never in a link.' },
  { id: 'r-capture', target: '#email-results-container', label: 'Results 5 of 5', title: 'Don’t lose this', text: 'Email yourself the link; it rebuilds your selections and the letter with its brackets. That’s the walkthrough.' },
];
const tourState = { active: false, i: 0, steps: INPUT_TOUR, seenKey: INPUT_TOUR_KEY, timer: null };
function isTourActive() { return tourState.active; }
function tourEls() { return { root: $('tour-root'), spot: $('tour-spotlight'), tip: $('tour-tooltip') }; }
function positionTour() {
  const step = tourState.steps[tourState.i]; if (!step) return;
  const { spot, tip } = tourEls();
  if (!step.target) {
    spot.style.cssText = `top:${scrollY + innerHeight / 2}px; left:50vw; width:0; height:0;`;
    if (!matchMedia('(max-width: 560px)').matches) {
      tip.style.left = Math.max(24, (innerWidth - Math.min(380, innerWidth - 48)) / 2) + 'px';
      tip.style.top = (scrollY + innerHeight / 2 - (tip.offsetHeight || 220) / 2) + 'px';
    }
    return;
  }
  const target = document.querySelector(step.target);
  if (!target || target.offsetParent === null) return;
  const r = target.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return;
  const pad = 8;
  Object.assign(spot.style, { top: (r.top + scrollY - pad) + 'px', left: (r.left + scrollX - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
  const tipH = tip.offsetHeight || 180;
  const below = r.bottom + 16 + tipH < innerHeight || r.top < tipH + 32;
  if (matchMedia('(max-width: 560px)').matches) { tip.style.top = ''; tip.style.left = ''; }
  else {
    tip.style.top = (below ? r.bottom + scrollY + 14 : r.top + scrollY - tipH - 14) + 'px';
    tip.style.left = Math.max(12, Math.min(r.left + scrollX, innerWidth - tip.offsetWidth - 12)) + 'px';
  }
}
function showTourStep(i, dir = 1) {
  if (i < 0 || i >= tourState.steps.length) return endTour();
  const step = tourState.steps[i];
  if (step.target) { const el = document.querySelector(step.target); if (!el || el.offsetParent === null) return showTourStep(i + dir, dir); }
  tourState.i = i;
  const visible = tourState.steps.filter(s => { if (!s.target) return true; const el = document.querySelector(s.target); return el && el.offsetParent !== null; });
  $('tour-step-label').textContent = `${step.label.split(' ')[0]} ${visible.indexOf(step) + 1} of ${visible.length}`;
  $('tour-title').textContent = step.title;
  $('tour-text').textContent = step.text;
  $('tour-next').textContent = i === tourState.steps.length - 1 ? 'Done ✓' : 'Next';
  $('tour-back').style.visibility = i === 0 ? 'hidden' : 'visible';
  if (step.id === 'assumptions') $('assumptions-drawer').open = true;
  if (step.id === 'r-fill') { const fi = $('fill-in'); if (fi) fi.open = true; }
  if (!step.target) window.scrollTo({ top: 0, behavior: 'smooth' });
  else { const target = document.querySelector(step.target); if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  setTimeout(positionTour, 350);
}
function startTourWith(steps, seenKey) {
  tourState.steps = steps; tourState.seenKey = seenKey; tourState.active = true; tourState.i = 0;
  $('tour-root').hidden = false;
  showTourStep(0);
  clearInterval(tourState.timer);
  tourState.timer = setInterval(positionTour, 400);
}
function endTour() {
  tourState.active = false;
  clearInterval(tourState.timer);
  $('tour-root').hidden = true;
  try { localStorage.setItem(tourState.seenKey, '1'); } catch {}
}
$('tour-next').addEventListener('click', () => showTourStep(tourState.i + 1, 1));
$('tour-back').addEventListener('click', () => showTourStep(tourState.i - 1, -1));
$('tour-exit').addEventListener('click', endTour);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && tourState.active) endTour(); });
document.addEventListener('click', e => {
  if (!tourState.active || e.detail === 0) return;
  if (e.target.closest('#tour-tooltip') || e.target.closest('#tour-restart')) return;
  if (e.target.closest('#compare-btn') || e.target.closest('.mode-pill')) return;
  const r = $('tour-spotlight').getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  if (!inside) endTour();
});
$('tour-restart').addEventListener('click', () => startTourWith(INPUT_TOUR, INPUT_TOUR_KEY));
addEventListener('resize', positionTour);

/* ─── Intro: collapse on phones, one tap to expand (content stays in the HTML) ── */
{
  const about = $('about-this-tool');
  if (about && !about.querySelector('.about-more')) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'about-more no-print'; b.textContent = 'Read more';
    b.addEventListener('click', () => { const open = about.classList.toggle('open'); b.textContent = open ? 'Show less' : 'Read more'; });
    about.appendChild(b);
  }
}

/* ─── Init ─────────────────────────────────────────────────────────────── */
loadDraft();
setMode('first');
syncConditionalFields();
const arrived = loadFromUrl();
let tourSeen = true;
try { tourSeen = localStorage.getItem(INPUT_TOUR_KEY) === '1'; } catch {}
if (!arrived && !window.__vapArrivalHadParams && !tourSeen) setTimeout(() => startTourWith(INPUT_TOUR, INPUT_TOUR_KEY), 600);
updateLiveStrip();
