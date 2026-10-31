#!/usr/bin/env node
/**
 * fix-workflow2.mjs   (website ke folder mein)
 *
 * Pehli koshish mein do cheezein bigRin, aur waja CRLF thi — Windows ki
 * file mein har line \r\n par khatam hoti hai, aur mere regex sirf \n
 * dhoondh rahe the. Nateeja:
 *
 *   - paths: mein 'src/_data/menu.json' do baar aa gayi
 *   - "Build menu sections" step mila hi nahi, to sync step laga hi nahi
 *
 * Ab regex ke bajaye line ba line kaam hota hai, jo line endings se
 * mutasir nahi hota. Dono cheezein theek karti hai, aur jo naqal pehle
 * banayi thi (.bak) woh maujood hai.
 *
 *   node tools/fix-workflow2.mjs            -> sirf dikhana
 *   node tools/fix-workflow2.mjs --write    -> theek karna
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, '.github', 'workflows', 'sync-menu-sections.yml');

const raw = (() => { try { return fs.readFileSync(FILE, 'utf8'); } catch { return null; } })();
if (!raw) { console.log('XX  workflow nahi mili.'); process.exit(1); }

const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
console.log('\nFile ka andaz: ' + (EOL === '\r\n' ? 'CRLF (Windows)' : 'LF'));

let lines = raw.split(/\r?\n/);
const steps = [];

/* ============================================= abhi ki haalat ========== */

const peek = (text) => {
  try {
    const d = yaml.load(text);
    const o = (d && d.on !== undefined) ? d.on : (d && d[true]);
    return { ok: true, paths: o && o.push && o.push.paths };
  } catch (e) { return { ok: false, err: String(e.message).split('\n')[0] }; }
};

const before = peek(raw);
console.log('\nAbhi ki haalat');
console.log('-'.repeat(50));
if (before.ok) console.log('   parse ho rahi hai.  paths: ' + JSON.stringify(before.paths));
else console.log('   TOOTI HUI: ' + before.err);

/* ============================================= 1) paths =============== */

const pi = lines.findIndex((l) => /^\s*paths:\s*$/.test(l));
if (pi < 0) {
  console.log('\n!   paths: nahi mila.');
} else {
  const indent = (lines[pi].match(/^\s*/) || [''])[0];

  let end = pi + 1;
  const found = [];
  while (end < lines.length) {
    const l = lines[end];
    if (l.trim() === '') { end++; continue; }
    const e = l.match(/^\s*-\s*(.+?)\s*$/);
    if (!e) break;
    found.push(e[1]);
    end++;
  }

  // ek hi cheez do baar na rahe
  const seen = new Set();
  const entries = [];
  for (const e of found) {
    const k = e.replace(/["']/g, '').trim();
    if (seen.has(k)) continue;
    seen.add(k);
    entries.push(e);
  }
  for (const want of ["'src/content/**'", "'src/_data/menu.json'"]) {
    const k = want.replace(/["']/g, '');
    if (!seen.has(k)) { seen.add(k); entries.push(want); }
  }

  const rebuilt = [indent + 'paths:', ...entries.map((e) => indent + '  - ' + e)];
  const current = lines.slice(pi, end);

  if (rebuilt.join('\n') !== current.join('\n')) {
    lines = [...lines.slice(0, pi), ...rebuilt, ...lines.slice(end)];
    const dropped = found.length - entries.length;
    steps.push('paths: theek ki — ' + entries.length + ' entries' +
               (dropped > 0 ? ', ' + dropped + ' dohri hatayi' : ''));
  } else {
    console.log('\n   paths: pehle se theek hai.');
  }
}

/* ============================================= 2) sync step =========== */

if (lines.some((l) => l.includes('sync-related-options'))) {
  console.log('   Fehrist taza karne wala step pehle se hai.');
} else {
  const bi = lines.findIndex((l) => /^\s*-\s*name:\s*Build menu sections\s*$/.test(l));
  if (bi < 0) {
    console.log('\n!   "Build menu sections" step ab bhi nahi mila.');
    console.log('    Steps jo file mein hain:');
    for (const l of lines) {
      const m = l.match(/^\s*-\s*(?:name|uses):\s*(.+?)\s*$/);
      if (m) console.log('       ' + m[1]);
    }
  } else {
    const dash = (lines[bi].match(/^\s*/) || [''])[0];   // "      " jahan "- name" shuru hota hai

    // us step ki aakhri line dhoondhein — agla "- name:" ya "- uses:" se pehle
    let after = bi + 1;
    while (after < lines.length && !/^\s*-\s*(name|uses):/.test(lines[after])) {
      if (lines[after].trim() === '' && after + 1 < lines.length &&
          /^\s*-\s*(name|uses):/.test(lines[after + 1])) break;
      after++;
    }

    const block = [
      '',
      dash + '- name: Refresh related journeys list',
      dash + '  run: |',
      dash + '    npm run build',
      dash + '    node tools/sync-related-options.mjs --write',
    ];
    lines = [...lines.slice(0, after), ...block, ...lines.slice(after)];
    steps.push('related journeys ka step joRa');
  }
}

/* ============================================= jaanch ================= */

console.log('\nTabdeeliyan');
console.log('-'.repeat(50));
if (!steps.length) { console.log('   Kuch badalne ko nahi hai.'); process.exit(0); }
for (const s of steps) console.log('   ->  ' + s);

const out = lines.join(EOL);

console.log('\nJaanch');
console.log('-'.repeat(50));

let doc;
try { doc = yaml.load(out); }
catch (e) { console.log('XX  naya YAML parse nahi hua: ' + String(e.message).split('\n')[0]); process.exit(1); }

const on = (doc && doc.on !== undefined) ? doc.on : (doc && doc[true]);
const paths = on && on.push && on.push.paths;
const jobSteps = doc && doc.jobs && doc.jobs.sync && doc.jobs.sync.steps;

if (!Array.isArray(paths) || paths.some((x) => typeof x !== 'string')) {
  console.log('XX  paths saada fehrist nahi bani: ' + JSON.stringify(paths));
  process.exit(1);
}
if (new Set(paths).size !== paths.length) {
  console.log('XX  paths mein ab bhi dohri entry hai: ' + JSON.stringify(paths));
  process.exit(1);
}
if (!Array.isArray(jobSteps) || !jobSteps.length) { console.log('XX  steps gayab.'); process.exit(1); }
if (!jobSteps.some((s) => s && typeof s.run === 'string' && s.run.includes('sync-related-options'))) {
  console.log('!   sync step ab bhi nahi laga.');
}

console.log('   paths: ' + paths.join(', '));
console.log('   steps:');
for (const s of jobSteps) console.log('      - ' + (s.name || s.uses || '(run)'));

if (!WRITE) {
  console.log('\nTheek karne ke liye:');
  console.log('   node tools/fix-workflow2.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bak2')) fs.copyFileSync(FILE, FILE + '.bak2');
fs.writeFileSync(FILE, out, 'utf8');
console.log('\nLIKHA: .github/workflows/sync-menu-sections.yml');
