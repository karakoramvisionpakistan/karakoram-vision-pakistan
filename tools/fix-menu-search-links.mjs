#!/usr/bin/env node
/**
 * fix-menu-search-links.mjs   (website ke folder mein)
 *
 * Menu mein abhi bhi kai link search ke natije par jate hain:
 *     Hunza  ->  /search/?type=tours&q=hunza
 * halanke /destinations/hunza/ ka asal safha mojood hai.
 *
 * Yeh script har aise link ko dekhti hai aur:
 *   - jahan asal safha mil jaye, link usi par kar deti hai
 *   - jahan na mile, sirf fehrist dikhati hai taake aap tay karein
 *
 * Koi safha mitata nahi, koi naya nahi banata — sirf menu ke pate theek.
 *
 *   node tools/fix-menu-search-links.mjs            -> sirf dekhna
 *   node tools/fix-menu-search-links.mjs --write    -> theek karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ---- jo safhe waqai mojood hain ---- */

const pages = new Set();

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const t = read(p) || '';
    const m = t.match(/^permalink:\s*(.+)$/m);
    if (m) pages.add(m[1].trim().replace(/^["']|["']$/g, ''));
  }
}
walk(path.join(ROOT, 'src'));

console.log('\n' + pages.size + ' asal safhe mile\n');

/* ---- menu ---- */

const MENU = path.join(ROOT, 'src', '_data', 'menu.json');
const raw = read(MENU);
if (!raw) { console.log('XX  menu.json nahi mili.'); process.exit(1); }

let menu;
try { menu = JSON.parse(raw); }
catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* q ki qeemat se asal safha dhoondhna */
const findPage = (q) => {
  const s = slug(decodeURIComponent(q));
  if (!s) return null;
  const tries = [
    `/destinations/${s}/`,
    `/blog/${s}/`,
    `/tours/${s}/`,
    `/trekking/${s}/`,
    `/expeditions/${s}/`,
    `/jeep-safaris/${s}/`,
    `/special-interests/${s}/`,
    `/holiday-types/${s}/`,
    `/${s}/`,
  ];
  const hits = tries.filter((t) => pages.has(t));
  return hits.length === 1 ? hits[0] : null;
};

const fixed = [];
const left = [];

const walkMenu = (list, trail = []) => {
  for (const item of list || []) {
    const url = String(item.url || '').trim();
    const where = [...trail, item.label].join(' > ');
    if (url.startsWith('/search')) {
      const q = (url.match(/[?&]q=([^&]*)/) || [])[1] || '';
      const page = findPage(q);
      if (page) { fixed.push({ item, where, from: url, to: page }); }
      else { left.push({ where, url }); }
    }
    if (item.children) walkMenu(item.children, [...trail, item.label]);
  }
};
walkMenu(menu.items);

/* ---- report ---- */

console.log('1) Jin ka asal safha mil gaya — yeh theek ho jayenge');
if (!fixed.length) console.log('   (koi nahi)');
for (const f of fixed) {
  console.log('   ->  ' + f.where);
  console.log('        ' + f.from);
  console.log('        ' + f.to);
}

console.log('\n2) Jin ka asal safha nahi hai — yeh search par hi rahenge');
if (!left.length) console.log('   (koi nahi)');
for (const l of left) {
  console.log('   -   ' + l.where.padEnd(50) + l.url);
}

console.log('\n   In ke liye do raaste hain: ya in ka safha banwa lein,');
console.log('   ya menu se nikaal dein agar zaroorat nahi.');

/* ---- write ---- */

console.log('\n--------------------------------------------------');

if (!fixed.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

console.log(fixed.length + ' link theek honge.');

if (!WRITE) {
  console.log('\nTheek karne ke liye:');
  console.log('   node tools/fix-menu-search-links.mjs --write');
  process.exit(0);
}

for (const f of fixed) f.item.url = f.to;

if (!fs.existsSync(MENU + '.bak14')) fs.copyFileSync(MENU, MENU + '.bak14');
fs.writeFileSync(MENU, JSON.stringify(menu, null, 2) + '\n', 'utf8');
console.log('LIKHA: src/_data/menu.json   (backup: menu.json.bak14)');
console.log('\nAgla qadam:  npm run build');
