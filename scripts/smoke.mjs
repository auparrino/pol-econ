#!/usr/bin/env node
// Render every tab for the provinces that have actually broken, and fail on
// anything the browser logs.
//
// This repo had no test of any kind. The bugs it shipped were not subtle data
// errors — they were blank panels: a rules-of-hooks violation that crashed the
// employment tab, an accent-folding bug that left CABA's cabinet empty, and a
// province lookup that returned Chubut's power plants for Tierra del Fuego.
// Every one of them is visible in the first second of a render, and every one
// of them survived review because nobody rendered the page.
//
// The provinces here are not a sample; each one is a failure mode that got
// through review. Buenos Aires has data in every panel. CABA is the one whose
// name nests inside "Buenos Aires" and is a city, not a province. Tierra del
// Fuego has the long legal name ("...Antártida e Islas del Atlántico Sur") that
// broke matching, and is the one that showed Chubut's power plants. Neuquén is
// accented, and it is the only one of the four that is — worth keeping even
// though removing accent folding from utils/provinces.js no longer fails this
// suite: the datasets are canonical now, so folding only matters at the scraped
// boundary. If a future panel reads a scraped name directly, this is the row
// that would notice.
//
//   npm test                 build, serve, check
//   npm test -- --headed     watch it happen
//   npm test -- --keep       leave the preview server up afterwards

import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/pol-econ/';          // vite.config.js `base`
const PORT = 4317;
const ORIGIN = `http://localhost:${PORT}${BASE}`;

const PROVINCES = ['Buenos Aires', 'Ciudad de Buenos Aires', 'Tierra del Fuego', 'Neuquén'];
const TABS = ['overview', 'congress', 'cabinet', 'employment', 'fiscal', 'exports', 'production', 'rigi', 'news'];

// Console noise that is not a defect.
//
// The network filters matter: this app fetches map tiles and live FX rates from
// third-party origins at runtime, and a sandboxed or offline machine cannot
// reach them. Failing the suite on that would make it unrunnable in CI while
// saying nothing about the code. Requests back to the preview server are a
// different matter and are never ignored — a 404 on our own bundle is a bug.
const IGNORE = [
  /Download the React DevTools/i,
  /favicon/i,
  /\[vite\]/i,
  /net::ERR_(CERT_AUTHORITY_INVALID|TUNNEL_CONNECTION_FAILED|NAME_NOT_RESOLVED|CONNECTION_(REFUSED|RESET)|PROXY_CONNECTION_FAILED)/,
  /Congress data fetch failed/,          // comovoto.dev.ar, fetched live at runtime
  // Recharts measures its container before layout settles and logs this once
  // per chart. Every container in this app has an explicit pixel height, so the
  // warning is transient — check 4 below proves the charts really did render,
  // which is the thing the warning would otherwise be hinting at.
  /The width\(-1\) and height\(-1\) of chart should be greater than 0/,
];

/**
 * The Chromium to drive.
 *
 * Playwright resolves its browser by the exact build number the installed
 * version pins, which does not have to match what is on the machine — here the
 * package wants build 1208 and the image ships 1194, and its error message
 * tells you to re-download rather than use it. Take the newest chromium
 * actually present instead.
 */
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;   // let Playwright try its own
  const builds = readdirSync(root)
    .filter(d => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const b of builds) {
    const exe = path.join(root, b, 'chrome-linux', 'chrome');
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

const headed = process.argv.includes('--headed');
const keep = process.argv.includes('--keep');

const failures = [];
function fail(where, what) {
  failures.push(`${where}: ${what}`);
  console.log(`  \x1b[31mFAIL\x1b[0m ${where} — ${what}`);
}

// ---------------------------------------------------------------- build
if (!existsSync(path.join(ROOT, 'dist', 'index.html')) || !process.argv.includes('--no-build')) {
  console.log('Building…');
  const b = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: true });
  if (b.status !== 0) { console.error('Build failed.'); process.exit(1); }
}

// ---------------------------------------------------------------- serve
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'],
  { cwd: ROOT, shell: true, stdio: 'ignore', detached: true });

async function waitForServer(timeoutMs = 30_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const r = await fetch(ORIGIN);
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

function stopServer() {
  if (keep) { console.log(`\nPreview left running at ${ORIGIN}`); return; }
  try { process.kill(-server.pid); } catch { /* already gone */ }
}

// ---------------------------------------------------------------- check
async function main() {
  if (!await waitForServer()) { console.error(`Preview server never came up on ${PORT}.`); return 1; }

  const browser = await chromium.launch({
    headless: !headed,
    executablePath: findChromium(),
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const province of PROVINCES) {
    for (const tab of TABS) {
      const where = `${province} · ${tab}`;
      const page = await ctx.newPage();
      const logged = [];
      page.on('console', m => {
        if (m.type() !== 'error' && m.type() !== 'warning') return;
        const text = m.text();
        if (IGNORE.some(re => re.test(text))) return;
        logged.push(text);
      });
      page.on('pageerror', e => logged.push(`uncaught: ${e.message}`));

      const url = `${ORIGIN}?province=${encodeURIComponent(province)}&tab=${tab}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        // Lazy panels resolve after the first paint.
        await page.waitForSelector(`[role="tab"][aria-selected="true"]`, { timeout: 10_000 });
        await page.waitForTimeout(600);

        // 1. The tab the URL asked for is the tab we are on.
        const active = await page.getAttribute('[role="tab"][aria-selected="true"]', 'aria-controls');
        if (active !== `panel-${tab}`) fail(where, `URL asked for ${tab}, rendered ${active}`);

        // 2. The error boundary did not catch anything.
        const boundary = await page.locator('text=/Something went wrong|Algo salió mal/i').count();
        if (boundary) fail(where, 'error boundary rendered');

        // 3. The panel has content. A crashed or empty panel is the exact bug
        //    class this file exists to catch, so measure the panel, not the page.
        const body = await page.locator('aside').first().innerText();
        if (body.replace(/\s+/g, ' ').trim().length < 120) {
          fail(where, `panel is effectively empty (${body.trim().length} chars)`);
        }

        // 4. Every chart that was asked for actually has pixels. Recharts fails
        //    soft: a chart in a zero-height container renders nothing at all and
        //    logs a warning nobody reads.
        const charts = await page.locator('aside .recharts-responsive-container').count();
        if (charts) {
          const drawn = await page.locator('aside svg.recharts-surface').evaluateAll(
            els => els.filter(el => el.getBoundingClientRect().height > 1).length);
          if (drawn < charts) fail(where, `${charts - drawn} of ${charts} charts rendered with no height`);
        }

        // 5. Nothing was logged.
        if (logged.length) fail(where, logged.slice(0, 3).join(' | '));

        if (!failures.some(f => f.startsWith(where))) console.log(`  \x1b[32mok\x1b[0m   ${where}`);
      } catch (e) {
        fail(where, e.message.split('\n')[0]);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  console.log(`\n${PROVINCES.length * TABS.length - failures.length}/${PROVINCES.length * TABS.length} renders clean`);
  if (failures.length) {
    console.log(`\n\x1b[31m${failures.length} failure(s)\x1b[0m`);
    for (const f of failures) console.log(`  ${f}`);
    return 1;
  }
  return 0;
}

let code = 1;
try { code = await main(); } finally { stopServer(); }
process.exit(code);
