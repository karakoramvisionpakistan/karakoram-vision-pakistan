#!/usr/bin/env node
/**
 * fix-health-issues.mjs
 *
 * check-site-health.mjs ne jo kharabiyan pakRi theen, unhe theek karta hai:
 *   1. tooti hui link: /trekking/k2-base-camp-baltoro-trek/ -> /trekking/k2-base-camp-trek/
 *   2. email bina mailto: ke  -> click karne par 404
 *   3. www.karakoramvision.com bina https:// ke
 *   4. expeditions/trango-expedition/ bina shuru ke "/" ke
 *   5. Best Sellers / Trekking Peaks ke joRon ki ek jaisi description
 *   6. "K5" wala ajeeb link — sirf dikhata hai, chhuata nahi
 *
 *   node tools/fix-health-issues.mjs            -> sirf dekhna
 *   node tools/fix-health-issues.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const edits = new Map();        // file -> text
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const files = walk(path.join(ROOT, 'src')).filter((f) => /\.(md|njk)$/.test(f));
const current = (f) => edits.get(f) ?? read(f);
const put = (f, t) => { if (t !== current(f)) edits.set(f, t); };

/* ======================================================= 1-4 links ===== */

console.log('\n1) Tooti aur adhoori links');

const RULES = [
  { what: 'k2 base camp ka purana pata',
    find: /\/trekking\/k2-base-camp-baltoro-trek\//g,
    to: '/trekking/k2-base-camp-trek/' },

  { what: 'email bina mailto:',
    find: /\]\(\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\s*\)/g,
    to: (m, addr) => '](mailto:' + addr + ')' },

  { what: 'email href bina mailto:',
    find: /href=(["'])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\1/g,
    to: (m, q, addr) => 'href=' + q + 'mailto:' + addr + q },

  { what: 'website bina https://',
    find: /\]\(\s*(www\.[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^)\s]*)\s*\)/g,
    to: (m, host) => '](https://' + host + ')' },

  { what: 'website href bina https://',
    find: /href=(["'])(www\.[A-Za-z0-9.-]+[^"']*)\1/g,
    to: (m, q, host) => 'href=' + q + 'https://' + host + q },

  { what: 'andarooni link bina shuru ke "/"',
    find: /\]\(\s*((?:expeditions|trekking|tours|jeep-safaris|hunting-services|vehicles|blog|destinations)\/[^)\s]*)\s*\)/g,
    to: (m, p) => '](/' + p + ')' },
];

let total = 0;
for (const file of files) {
  let text = current(file);
  if (!text) continue;
  for (const rule of RULES) {
    const before = text;
    text = text.replace(rule.find, rule.to);
    if (text !== before) {
      const n = (before.match(rule.find) || []).length;
      console.log('   ->  ' + path.relative(ROOT, file).replace(/\\/g, '/') + '   ' + rule.what + ' (' + n + ')');
      total += n;
    }
  }
  put(file, text);
}
if (!total) console.log('   OK  kuch nahi mila.');

/* ======================================================= 5 descriptions  */

console.log('\n2) Ek jaisi description (section pages)');

const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const GEN = /^(.+?) from Karakoram Vision Pakistan - planned from Skardu/;

let descFixed = 0;
for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', service);
  if (!fs.existsSync(dir)) continue;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const file = path.join(dir, e.name, 'index.njk');
    let text = current(file);
    if (!text || !text.startsWith('---')) continue;
    const end = text.indexOf('\n---', 3);
    if (end < 0) continue;
    const fm = text.slice(3, end);
    if (!/^structured_filter\s*:/m.test(fm)) continue;

    const title = ((fm.match(/^title:\s*(.+)$/m) || [])[1] || '').trim().replace(/^["']|["']$/g, '');
    if (!title) continue;

    // description ka pehla lafz unwaan se badlo, sirf tab jab woh khud bani hui ho
    const next = text.replace(
      /^(\s{4})(.+?)( from Karakoram Vision Pakistan - planned from Skardu)/m,
      (m, indent, old, tail) => (old === title ? m : indent + title + tail)
    );
    if (next !== text) {
      console.log('   ->  ' + service + '/' + e.name + ': "' + title + '"');
      put(file, next);
      descFixed++;
    }

    // landing file bhi
    const land = path.join(ROOT, 'content', 'landing', `${service}-${e.name}.md`);
    const lt = current(land);
    if (lt) {
      const ln = lt.replace(
        /^(\s{2})(.+?)( from Karakoram Vision Pakistan - planned from Skardu)/m,
        (m, indent, old, tail) => (old === title ? m : indent + title + tail)
      );
      if (ln !== lt) put(land, ln);
    }
  }
}
if (!descFixed) console.log('   OK  sab alag hain.');

/* ======================================================= 6 K5 ========== */

console.log('\n3) "K5" wala ajeeb link (sirf dikha raha hoon)');

let found = false;
for (const file of files) {
  const text = current(file);
  if (!text) continue;
  for (const m of text.matchAll(/\[([^\]]*)\]\(\s*(K5|k5)\s*\)/g)) {
    found = true;
    const at = Math.max(0, m.index - 90);
    console.log('   !   ' + path.relative(ROOT, file).replace(/\\/g, '/'));
    console.log('       …' + text.slice(at, m.index + m[0].length + 60).replace(/\s+/g, ' ') + '…');
  }
}
if (!found) console.log('   (nahi mila — shayad HTML mein hai, build ke baad dobara jaanch lein)');

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!edits.size) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

console.log(edits.size + ' file(s) badlengi.');

if (!WRITE) {
  console.log('\nSave karne ke liye:');
  console.log('   node tools/fix-health-issues.mjs --write');
  process.exit(0);
}

for (const [file, text] of edits) {
  fs.writeFileSync(file, text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build  phir  node tools/check-site-health.mjs');
