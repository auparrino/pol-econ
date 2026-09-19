#!/usr/bin/env node
// Re-run a dataset's build, or say exactly why it cannot run.
//
// Before this existed, updating a dataset meant reading every script in
// scripts/ to work out which one wrote the file you wanted, then guessing what
// raw input it expected and where to put it. Six of the audit's open findings
// are stuck there: the fix is known and the file it needs is simply not on
// disk. `npm run refresh` answers both questions — what builds this, and what
// is missing — from scripts/pipelines.json.
//
//   npm run refresh                 list every pipeline and its status
//   npm run refresh <name>          run one
//   npm run refresh <name> --dry    show the command without running it
//   npm run refresh --all           run every pipeline whose inputs are present
//
// Pipelines that need the network or an API key are never run by --all: they
// hit public servers and overwrite a shipped snapshot. Ask for them by name.

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'scripts', 'pipelines.json');

const { pipelines } = JSON.parse(readFileSync(MANIFEST, 'utf8'));

let sources = {};
try {
  sources = (await import(path.join(ROOT, 'src', 'data', 'sources.js'))).SOURCES ?? {};
} catch {
  // sources.js is documentation here, not a dependency — a refresh still works without it.
}

const C = process.stdout.isTTY
  ? { dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', bold: '\x1b[1m', off: '\x1b[0m' }
  : { dim: '', red: '', green: '', yellow: '', bold: '', off: '' };

/** What stands between this pipeline and a run. */
function inspect(p) {
  const missingInputs = (p.inputs ?? []).filter(f => !existsSync(path.join(ROOT, f)));
  const missingEnv = (p.env ?? []).filter(v => !process.env[v]);
  return { missingInputs, missingEnv, ready: !missingInputs.length && !missingEnv.length };
}

function describeSource(key) {
  const s = sources[key];
  if (!s) return key ? `sources.js: ${key}` : null;
  return [s.name, s.datasetUrl || s.sourceUrl].filter(Boolean).join(' — ');
}

function list() {
  console.log(`${C.bold}Data pipelines${C.off} ${C.dim}(scripts/pipelines.json)${C.off}\n`);
  const width = Math.max(...Object.keys(pipelines).map(k => k.length));
  for (const [name, p] of Object.entries(pipelines)) {
    const { missingInputs, missingEnv, ready } = inspect(p);
    const tags = [
      p.network ? `${C.yellow}network${C.off}` : null,
      p.env?.length ? `${C.yellow}needs ${p.env.join(', ')}${C.off}` : null,
    ].filter(Boolean);
    const mark = ready ? `${C.green}ready${C.off}` : `${C.red}blocked${C.off}`;
    console.log(`  ${name.padEnd(width)}  ${mark}${tags.length ? '  ' + tags.join(' ') : ''}`);
    console.log(`  ${' '.repeat(width)}  ${C.dim}${p.script}${C.off}`);
    for (const f of missingInputs) console.log(`  ${' '.repeat(width)}  ${C.red}missing${C.off} ${f}`);
    for (const v of missingEnv) console.log(`  ${' '.repeat(width)}  ${C.red}unset${C.off}   $${v}`);
  }
  console.log(`\n${C.dim}npm run refresh <name>   npm run refresh <name> --dry   npm run refresh --all${C.off}`);
}

function run(name, { dry } = {}) {
  const p = pipelines[name];
  if (!p) {
    console.error(`${C.red}No pipeline named "${name}".${C.off}`);
    console.error(`Known: ${Object.keys(pipelines).join(', ')}`);
    return 1;
  }

  const { missingInputs, missingEnv, ready } = inspect(p);
  if (!ready) {
    console.error(`${C.red}Cannot run "${name}".${C.off}`);
    for (const f of missingInputs) console.error(`  missing input  ${f}`);
    for (const v of missingEnv) console.error(`  unset env      $${v}`);
    const where = describeSource(p.source);
    if (where) console.error(`  get it from    ${where}`);
    if (p.note) console.error(`  note           ${p.note}`);
    return 1;
  }

  const steps = [p.script, p.postprocess].filter(Boolean);
  if (dry) {
    console.log(steps.join('\n'));
    return 0;
  }

  for (const step of steps) {
    console.log(`${C.bold}$ ${step}${C.off}`);
    const r = spawnSync(step, { cwd: ROOT, shell: true, stdio: 'inherit' });
    if (r.status !== 0) {
      console.error(`${C.red}${name}: "${step}" exited ${r.status ?? r.signal}.${C.off}`);
      return r.status ?? 1;
    }
  }

  // Every build writes a dataset, and every dataset needs its _meta block.
  if (name !== 'provenance') {
    console.log(`${C.bold}$ ${pipelines.provenance.script}${C.off}`);
    spawnSync(pipelines.provenance.script, { cwd: ROOT, shell: true, stdio: 'inherit' });
  }

  console.log(`\n${C.dim}Now run: npm run validate${C.off}`);
  return 0;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const names = args.filter(a => !a.startsWith('--'));

if (args.includes('--all')) {
  // Offline pipelines only: --all must never silently replace a shipped
  // snapshot with a live fetch, or hammer a public server.
  const eligible = Object.entries(pipelines)
    .filter(([, p]) => !p.network && !p.env?.length && inspect(p).ready)
    .map(([n]) => n);
  const skipped = Object.keys(pipelines).filter(n => !eligible.includes(n));
  console.log(`${C.bold}Running ${eligible.length} offline pipeline(s)${C.off}`);
  if (skipped.length) console.log(`${C.dim}Skipped (network, key, or missing input): ${skipped.join(', ')}${C.off}\n`);
  let code = 0;
  for (const n of eligible) code = run(n, { dry }) || code;
  process.exit(code);
} else if (names.length) {
  let code = 0;
  for (const n of names) code = run(n, { dry }) || code;
  process.exit(code);
} else {
  list();
}
