/**
 * 100-pt headless smoke test — funnel + tour lifecycle.
 *
 * No new dependencies: serves the tool over HTTP (ES modules won't load from
 * file://) and drives the installed Chrome with --dump-dom.
 *
 *   node 100-pt/test/smoke.mjs        # from tbv-tools/
 *
 * Two assertions deliberately check RENDERED OUTPUT rather than the `selected`
 * attribute: setting `select.value` from a share URL updates the property, not
 * the attribute, so --dump-dom never shows `selected`. Asserting on the
 * attribute produces false failures.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';
import process from 'node:process';

const execFileP = promisify(execFile);
const PORT = 8901;  // deliberately not 8899 — avoids colliding with a preview server
const BASE = `http://localhost:${PORT}/100-pt/`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const SHARE_PARAMS =
  '?r=100pt&a=42&s=TX&ret=no&m=married&c=2&cc=2&dp=0&hv=400000&oh=yes' +
  '&va=400000&sl=yes&slb=45000&oi=60000&py=30&cola=1&colab=recent';

let failures = 0;
function check(ok, label, extra = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);
}

async function dumpDom(url) {
  const { stdout } = await execFileP(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=6000', '--dump-dom', url
  ], { maxBuffer: 20 * 1024 * 1024 });
  return stdout;
}

// Minimal static server. Built in rather than shelling out to python3 so the
// test has no external dependency — and note fileURLToPath, not URL.pathname,
// which percent-encodes the spaces in this repo's path and breaks cwd.
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(PORT, r));
process.on('exit', () => server.close());

try {
  // --- First visit: gated, tour auto-runs -------------------------------
  const first = await dumpDom(BASE);
  check(/<option value="AL"/.test(first), 'states populated (module executed)');
  check(/id="smc-level"[\s\S]{0,400}<option/.test(first), 'SMC dropdown populated');

  const lt = first.match(/id="live-total-value"[^>]*>([^<]*)</);
  check(!!lt && /\$/.test(lt[1]), 'live running total renders pre-submit', lt ? lt[1] : 'n/a');

  const gate = first.match(/id="results-gate"[^>]*style="([^"]*)"/);
  check(!!gate && /display:\s*none/.test(gate[1]), 'results GATED on first load');

  check(/id="tour-root"(?![^>]*hidden)/.test(first), 'tour auto-starts for first-time visitor');
  check(/Step 1 of 6/.test(first), 'tour begins at step 1 of 6');
  check(/id="mode-pills"/.test(first), 'mode pills present');
  check(/id="hero-capture"/.test(first), 'result-moment capture present');

  // --- Share link: results revealed, tour suppressed --------------------
  const shared = await dumpDom(BASE + SHARE_PARAMS);
  const sGate = shared.match(/id="results-gate"[^>]*style="([^"]*)"/);
  check(!!sGate && !/display:\s*none/.test(sGate[1]), 'share link reveals results without a click');
  check(/id="tour-root"[^>]*hidden/.test(shared), 'tour suppressed for share-link arrival');
  check(/id="total-value-card"[\s\S]{0,600}\$/.test(shared), 'hero verdict card rendered');

  // Rendered-output checks (see header note on `selected`)
  check(/Texas/.test(shared), 'state restored from URL (TX in output)');
  const note = shared.match(/id="total-value-note"[^>]*>([^<]*)</);
  check(!!note && /3\.1%/.test(note[1]), 'COLA basis restored to recent-decade (3.1%)');
  check(/Student Loan/.test(shared), 'student-loan benefit shown when sl=yes');

  // --- Redesigned results: glance tiles + grouped panels ----------------
  check(/id="glance-strip"/.test(shared), 'glance strip present');
  check(/id="panel-cash"[^>]*open/.test(shared), 'Monthly Cash panel open by default');
  check(/id="panel-health"(?![^>]*open)/.test(shared), 'other panels closed by default');
  const tileCash = shared.match(/id="tile-cash"[^>]*>([^<]*)</);
  check(!!tileCash && /\/mo/.test(tileCash[1]), 'cash tile filled', tileCash ? tileCash[1] : 'n/a');
  check(/id="grid-cash"[\s\S]{0,400}benefit-card/.test(shared), 'cards render inside grouped grids');

  // --- CHAMPVA cross-link + collapsed deep dive -------------------------
  check(/href="\/champva\/\?source=pt-benefits"/.test(shared), 'CHAMPVA tool CTA present');
  check(/id="champva-more"(?![^>]*open)/.test(shared), 'CHAMPVA deep dive collapsed by default');

  // --- GEO / SEO surface ------------------------------------------------
  check(/id="about-this-tool"/.test(first), 'GEO citable intro present');
  check(/id="how-it-works"/.test(first), 'GEO methodology section present');
  check(/"@type":\s*"FAQPage"/.test(first), 'FAQPage JSON-LD present');
  check(/id="faq"/.test(first), 'visible FAQ present');
  check(/G-HG7N8F337G/.test(first), 'GA4 snippet present');
} finally {
  server.close();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll smoke checks passed.');
process.exit(failures ? 1 : 0);
