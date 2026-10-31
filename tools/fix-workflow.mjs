#!/usr/bin/env node
/**
 * fix-workflow.mjs   (website ke folder mein)
 *
 * MERI GHALTI. add-related-journeys.mjs ne paths: mein entry joRte waqt
 * indentation bigaR di:
 *
 *     paths:
 *
 *           - 'src/content/**'
 *       - 'src/_data/menu.json'
 *
 * Pehli entry das space par, doosri chhe par — YAML isay qubool nahi karta,
 * yani woh Action har push par fail ho rahi hai.
 *
 * Yeh woh theek karti hai, aur related journeys ki fehrist taza rakhne wala
 * step bhi laga deti hai. Aakhir mein YAML parse kar ke dekhti hai.
 *
 *   node tools/fix-workflow.mjs            -> sirf dikhana
 *   node tools/fix-workflow.mjs --write    -> theek karna
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, '.github', 'workflows', 'sync-menu-sections.yml');

let text = (() => { try { return fs.readFileSync(FILE, 'utf8'); } catch { return null; } })();
if (!text) { console.log('XX  workflow nahi mili: .github/workflows/sync-menu-sections.yml'); process.exit(1); }

console.log('\nAbhi ki haalat');
console.log('-'.repeat(50));
try {
  const d = yaml.load(text);
  const o = (d && d.on !== undefined) ? d.on : (d && d[true]);
  const p = o && o.push && o.push.paths;
  console.log('   YAML parse ho rahi hai.');
  console.log('   paths abhi: ' + JSON.stringify(p));
  if (!Array.isArray(p) || p.some((x) => typeof x !== 'string')) {
    console.log('   -> magar yeh saada fehrist nahi hai, is liye Action theek');
    console.log('      nahi chal rahi hogi.');
  }
} catch (e) {
  console.log('   YAML TOOTI HUI HAI, Action har push par fail ho rahi hai:');
  console.log('   ' + String(e.message).split('\n')[0]);
}

const steps = [];

/* ================================================= 1) paths theek ====== */

/* paths: ke baad jo bhi khaali linein aur list ki entries hain, unko
   dobara theek indentation ke sath likhte hain. */
const pathsRe = /^(\s*)paths:\s*\n((?:\s*\n|\s*-\s*.*\n)*)/m;
const m = text.match(pathsRe);

if (!m) {
  console.log('\n!   paths: ka hissa nahi mila — chhoR raha hoon.');
} else {
  const indent = m[1];
  const entries = [];
  for (const line of m[2].split('\n')) {
    const e = line.match(/^\s*-\s*(.+?)\s*$/);
    if (e) entries.push(e[1]);
  }

  // jo chahiye woh dono maujood hon
  for (const want of ["'src/content/**'", "'src/_data/menu.json'"]) {
    if (!entries.some((x) => x.replace(/["']/g, '') === want.replace(/["']/g, ''))) entries.push(want);
  }

  const rebuilt = indent + 'paths:\n' + entries.map((e) => indent + '  - ' + e + '\n').join('');
  if (rebuilt !== m[0]) {
    text = text.replace(pathsRe, rebuilt);
    steps.push('paths: ki indentation theek ki (' + entries.length + ' entries)');
  }
}

/* ================================================= 2) sync step ======== */

if (text.includes('sync-related-options')) {
  console.log('\n   Fehrist taza karne wala step pehle se hai.');
} else {
  const anchor = text.match(/^([ \t]*)- name: Build menu sections\n[ \t]*run: .*\n/m);
  if (!anchor) {
    console.log('\n!   "Build menu sections" step nahi mila — sync step nahi laga.');
  } else {
    const ind = anchor[1];
    const add = anchor[0] + '\n' +
      ind + '- name: Refresh related journeys list\n' +
      ind + '  run: |\n' +
      ind + '    npm run build\n' +
      ind + '    node tools/sync-related-options.mjs --write\n';
    text = text.replace(anchor[0], add);
    steps.push('related journeys ki fehrist taza karne wala step joRa');
  }
}

/* ================================================= jaanch ============== */

console.log('\nTabdeeliyan');
console.log('-'.repeat(50));
if (!steps.length) { console.log('   Kuch badalne ko nahi hai.'); process.exit(0); }
for (const s of steps) console.log('   ->  ' + s);

console.log('\nJaanch');
console.log('-'.repeat(50));

let doc;
try { doc = yaml.load(text); }
catch (e) { console.log('XX  naya YAML bhi parse nahi hua: ' + String(e.message).split('\n')[0]); process.exit(1); }

/* YAML mein "on" ko boolean samjha jata hai, is liye woh doc.on par nahi
   doc[true] par aata hai. Yeh baat mujhe test ne batayi. */
const on = (doc && doc.on !== undefined) ? doc.on : (doc && doc[true]);
const paths = on && on.push && on.push.paths;
const jobSteps = doc && doc.jobs && doc.jobs.sync && doc.jobs.sync.steps;

if (!Array.isArray(paths)) { console.log('XX  on.push.paths list nahi bani.'); process.exit(1); }
if (!Array.isArray(jobSteps) || !jobSteps.length) { console.log('XX  steps gayab hain.'); process.exit(1); }

console.log('   paths: ' + paths.join(', '));
console.log('   steps: ' + jobSteps.length);
for (const s of jobSteps) console.log('      - ' + (s.name || s.uses || '(run)'));

if (!WRITE) {
  console.log('\nTheek karne ke liye:');
  console.log('   node tools/fix-workflow.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bak')) fs.copyFileSync(FILE, FILE + '.bak');
fs.writeFileSync(FILE, text, 'utf8');
console.log('\nLIKHA: .github/workflows/sync-menu-sections.yml');
console.log('\nAb push karne par Action chalegi aur naye trips khud ba khud');
console.log('"Related journeys" ki fehrist mein aa jayenge.');
