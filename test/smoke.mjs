/**
 * VR&E Approval Prep headless smoke test (house pattern from cp-exam-prep/test/smoke.mjs).
 * Run from tbv-tools/:  node vre-approval-prep/test/smoke.mjs   (port 8917)
 * Serves tbv-tools/ so the cross-tool import (/gi-bill-vre/data/vre-rates.js) resolves like production.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';
import process from 'node:process';

const execFileP = promisify(execFile);
const PORT = 8917;
const BASE = `http://localhost:${PORT}/vre-approval-prep/`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Real keys from buildShareUrl. No private field is in here by design.
const SHARE = '?m=cost&r=70&st=in-program&ed=bach&pl=mast&c=62000&yr=2&en=yes&ac=15000&wm=yes&dep=1&gi=yes&gu=36&ev=rating.postings.onet.resume.transcripts&source=vre-approval-prep';

let failures = 0;
const check = (ok, label, extra = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`); };
async function chrome(url, extra = []) {
  const { stdout, stderr } = await execFileP(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', '--enable-logging=stderr', '--v=0', '--virtual-time-budget=9000', '--dump-dom', ...extra, url], { maxBuffer: 30 * 1024 * 1024 }).catch(e => e);
  const errors = (stderr || '').split('\n').filter(l => /Uncaught|ReferenceError|TypeError|SyntaxError|Failed to load module/.test(l));
  return { dom: stdout || '', errors };
}

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(PORT, r));
process.on('exit', () => server.close());

try {
  const first = await chrome(BASE);
  check(first.errors.length === 0, 'first visit: no console errors', first.errors.slice(0, 3).join(' | '));
  check(/id="tour-root"(?![^>]*hidden)/.test(first.dom), 'tour auto-starts on first visit');
  check(/Step 1 of 7/.test(first.dom), 'tour step label renders');
  check(/__vapArrivalHadParams/.test(first.dom), 'arrival-params snippet present');
  check(/"FAQPage"/.test(first.dom) && /"WebApplication"/.test(first.dom), 'JSON-LD present');
  check(/G-HG7N8F337G/.test(first.dom), 'GA4 present');
  check(/<h1>VR&amp;E Approval Prep Tool<\/h1>/.test(first.dom), 'static h1');
  check(/id="about-this-tool"/.test(first.dom) && /id="how-it-works"/.test(first.dom), 'GEO sections present');
  check(/data-limit="standing"/.test(first.dom) && /data-feature="dso"/.test(first.dom), 'limits and features rendered');
  check(/id="results-container"[^>]*style="display:none;"/.test(first.dom), 'results gated on first visit');
  check(/Required to run/.test(first.dom), 'live strip shows the gate message');
  check(/More Free Veteran Tools/.test(first.dom), 'footer present');

  const share = await chrome(BASE + SHARE);
  check(share.errors.length === 0, 'share link: no console errors', share.errors.slice(0, 3).join(' | '));
  check(/id="tour-root"[^>]*hidden/.test(share.dom), 'tour does NOT auto-run for share arrivals');
  check(/id="results-container"[^>]*style="display:\s*block;"/.test(share.dom), 'share link reveals results');
  check(/id="hero-capture"[^>]*style="display:\s*block;"/.test(share.dom), 'hero capture shown at result moment');
  check(/VR&amp;E Officer at your regional office/.test(share.dom), 'ladder names the VR&E Officer at $62,000');
  check(/id="letter-sheet"/.test(share.dom) && /VOCATIONAL GOAL AND REHABILITATION PLAN STATEMENT/.test(share.dom), 'letter renders');
  check(/Retroactive induction/.test(share.dom), 'enrolled share link includes the retroactive request');
  check(/class="lb"/.test(share.dom), 'brackets highlighted in the letter');
  check(/\$50,000 is a signature line, not a limit/.test(share.dom), 'memo rule on the ladder card');
  check(/First test: can the cheaper school deliver your plan at all\?/.test(share.dom), 'plan-services rule on the four-questions card');
  check(/id="letter-download"/.test(share.dom), 'Word download button present');
  check(/extension of entitlement beyond 48 months/i.test(share.dom), '36 months used + 2-year program: letter asks for the 48-month extension');
  check(/Public schools owe you the in-state rate/.test(share.dom), 'in-state tuition rule on the ladder card');
  check(/A serious employment handicap unlocks a higher level/.test(share.dom), 'SEH higher-level rule on the objections card');
  check(/<details class="stack-card" open=""[^>]*id="card-ladder"|id="card-ladder"[^>]*open/.test(share.dom), 'cost mode leads with the ladder card');
  check(/one-line/.test(share.dom) === false, 'no one-on-one line at $62,000 (below $75,000)');
  check(/data-ev="rating" checked/.test(share.dom), 'evidence ticks restored from the link');
  check(/id="card-school"/.test(share.dom.slice(share.dom.indexOf('id="input-section"'), share.dom.indexOf('id="assumptions-drawer"'))), 'cost mode pulls the school card into Start here');

  const high = await chrome(BASE + SHARE.replace('c=62000', 'c=90000'));
  check(/Regional Office Director/.test(high.dom), 'ladder names the RO Director at $90,000');
  check(/one-line/.test(high.dom), 'one-on-one line appears above $75,000');

  const tracking = await chrome(BASE + '?fbclid=abc123&utm_source=fb');
  check(/id="tour-root"(?![^>]*hidden)/.test(tracking.dom), 'tracking params alone still auto-run the tour');
  check(/id="results-container"[^>]*style="display:none;"/.test(tracking.dom), 'tracking params do not skip the gate');

  const denied = await chrome(BASE + '?m=denied&r=40&st=denied&wh=denied&source=vre-approval-prep');
  check(/<details class="stack-card" open=""[^>]*id="card-escalation"|id="card-escalation"[^>]*open/.test(denied.dom), 'denied mode leads with the escalation card');
  check(/Review first\. Reapply only alongside\./.test(denied.dom), 'reapply guidance present');
  check(/Reported by veterans, not confirmed as policy/.test(denied.dom), 'regional-office note is labeled as reported');
  check(/Chase the answer/.test(denied.dom), 'denied steps include chasing a late review decision');
  check(/Denied in writing/.test(denied.dom), 'happened picker drives the escalation title');

  const memo = await chrome(BASE + '?m=pushback&r=70&st=in-program&ed=bach&pl=mast&c=90000&ob=memo&source=vre-approval-prep');
  check(memo.errors.length === 0, 'pushback/memo: no console errors', memo.errors.slice(0, 3).join(' | '));
  check(/M28C\.V\.B\.1\.02/.test(memo.dom) && /must complete and submit the high program costs memo/.test(memo.dom), 'memo objection quotes the manual');
  check(/<details class="stack-card" open=""[^>]*id="card-objections"|id="card-objections"[^>]*open/.test(memo.dom), 'pushback mode leads with the objections card');

  const unrated = await chrome(BASE + '?m=first&r=unrated&st=not-applied&source=vre-approval-prep');
  check(unrated.errors.length === 0, 'unrated: no console errors', unrated.errors.slice(0, 3).join(' | '));
  check(/Start with the rating/.test(unrated.dom), 'unrated hero routes to the claim first');
} finally {
  server.close();
}
console.log(failures === 0 ? 'ALL SMOKE CHECKS PASSED' : `${failures} smoke check(s) failed`);
process.exitCode = failures === 0 ? 0 : 1;
