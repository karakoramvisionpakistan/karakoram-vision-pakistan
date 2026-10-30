#!/usr/bin/env node
/**
 * fix-duplicate-titles.mjs
 *
 * MASLA
 *   Naye section pages ka unwaan menu ke label se liya gaya tha, aur menu
 *   mein kuch label do jagah ek jaise hain:
 *     "Best Sellers"    -> /tours/best-sellers/   aur /expeditions/best-sellers/
 *     "Trekking Peaks"  -> /trekking/...          aur /expeditions/...
 *   Google ko do safhe bilkul ek naam se milte hain.
 *
 * YEH SCRIPT
 *   Sirf un safhon ka unwaan badalti hai jin ka naam waqai takra raha hai.
 *   Service ka naam juR jata hai — magar agar unwaan mein woh pehle se ho
 *   to chhoR diya jata hai ("Trekking Peaks" trekking ke liye waisa hi).
 *   Menu ka label nahi badalta, sirf safhe ka unwaan aur Google wala title.
 *
 *   node tools/fix-duplicate-titles.mjs            -> sirf dekhna
 *   node tools/fix-duplicate-titles.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

const WORD = {
  'tours': 'Tours',
  'trekking': 'Trekking',
  'expeditions': 'Expeditions',
  'jeep-safaris': 'Jeep Safaris',
  'hunting-services': 'Hunting',
};

/* ======================================================= 1) collect ==== */

console.log('\n1) Section pages');

const found = [];   // { service, slug, file, title }
for (const service of Object.keys(WORD)) {
  const dir = path.join(ROOT, 'src', service);
  if (!fs.existsSync(dir)) continue;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const file = path.join(dir, e.name, 'index.njk');
    const t = read(file);
    if (!t || !t.startsWith('---')) continue;
    const end = t.indexOf('\n---', 3);
    if (end < 0) continue;
    const fm = t.slice(3, end);
    if (!/^structured_filter\s*:/m.test(fm)) continue;
    const title = ((fm.match(/^title:\s*(.+)$/m) || [])[1] || '').trim().replace(/^["']|["']$/g, '');
    found.push({ service, slug: e.name, file, title });
  }
}
console.log('   ' + found.length + ' section pages mile');

/* ======================================================= 2) clashes ==== */

console.log('\n2) Jin ka unwaan takra raha hai');

const byTitle = {};
for (const p of found) (byTitle[p.title.toLowerCase()] = byTitle[p.title.toLowerCase()] || []).push(p);
const clashing = Object.values(byTitle).filter((l) => l.length > 1).flat();

if (!clashing.length) {
  console.log('   OK  koi takkar nahi.');
  process.exit(0);
}

for (const p of clashing) console.log('   !   ' + p.title + '   (' + p.service + '/' + p.slug + ')');

/* ======================================================= 3) rename ===== */

console.log('\n3) Naye unwaan');

const newTitleFor = (p) => {
  const word = WORD[p.service];
  if (p.title.toLowerCase().includes(word.toLowerCase())) return p.title;  // pehle se mojood
  return p.title + ' — ' + word;
};

let changed = 0;
for (const p of clashing) {
  const next = newTitleFor(p);
  if (next === p.title) {
    console.log('   -   ' + p.service + '/' + p.slug + ': waisa hi ("' + p.title + '")');
    continue;
  }

  /* page file */
  let t = read(p.file);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const beforeT = t;

  t = t.replace(new RegExp('^title:\\s*' + esc(p.title) + '\\s*$', 'm'), 'title: ' + next);
  t = t.replace(
    new RegExp('^(\\s*title:\\s*")' + esc(p.title) + '( \\| [^"]*")', 'm'),
    (m, a, b) => a + next + b
  );

  if (t === beforeT) {
    console.log('   XX  ' + p.service + '/' + p.slug + ': unwaan badla nahi ja saka — chhoR rahe hain');
    continue;
  }
  writes.push({ file: p.file, text: t });

  /* landing file (CMS ki likhai) */
  const land = path.join(ROOT, 'content', 'landing', `${p.service}-${p.slug}.md`);
  const lt = read(land);
  if (lt) {
    let l = lt;
    l = l.replace(new RegExp('^title:\\s*' + esc(p.title) + '\\s*$', 'm'), 'title: ' + next);
    l = l.replace(new RegExp('^seo_title:\\s*' + esc(p.title) + '( \\| .*)$', 'm'), (m, b) => 'seo_title: ' + next + b);
    if (l !== lt) writes.push({ file: land, text: l });
  }

  console.log('   ->  ' + p.service + '/' + p.slug + ': "' + p.title + '"  ->  "' + next + '"');
  changed++;
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

console.log(changed + ' safhe, ' + writes.length + ' files.');

if (!WRITE) {
  console.log('\nSave karne ke liye:');
  console.log('   node tools/fix-duplicate-titles.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
