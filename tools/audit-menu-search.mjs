#!/usr/bin/env node
/**
 * audit-menu-search.mjs   (website ke folder mein)
 *
 * Menu ke har search link ko ASAL catalog par chala kar dekhta hai ke
 * visitor ko kitne natije milenge — andaza nahi, waqai ginti.
 *
 *   1 natija  -> link usi safhe par kar diya jata hai (search ki zaroorat nahi)
 *   0 natije  -> khali search. Yeh menu mein hone se behtar hai ke na ho.
 *   2+ natije -> search theek kaam kar raha hai, chhoR diya jata hai
 *
 *   node tools/audit-menu-search.mjs            -> sirf dekhna
 *   node tools/audit-menu-search.mjs --write    -> 1 wale theek karna
 *   node tools/audit-menu-search.mjs --write --prune
 *                                               -> sath hi 0 wale menu se nikaalna
 *
 * --prune ke baghair khali wale sirf fehrist mein aate hain.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const PRUNE = process.argv.includes('--prune');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ---- catalog ---- */

const catRaw = read(path.join(ROOT, 'src', '_data', 'structuredCatalog.json'));
if (!catRaw) { console.log('XX  structuredCatalog.json nahi mili — pehle npm run build chalayein.'); process.exit(1); }
const catalog = JSON.parse(catRaw);
console.log('\n' + catalog.length + ' journeys catalog mein\n');

/* website ki apni search jaisa milaan */
const normalize = (v) => String(v ?? '')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const search = (type, q) => {
  const words = normalize(decodeURIComponent(q)).split(' ').filter(Boolean);
  if (!words.length) return [];
  return catalog.filter((item) => {
    if (type && type !== 'all' && item.data?.service_type !== type) return false;
    const hay = normalize([
      item.normalized_title, item.normalized_slug, item.normalized_tags,
      item.normalized_destination, item.normalized_summary,
    ].join(' '));
    return words.every((w) => hay.includes(w));
  });
};

/* ---- menu ---- */

const MENU = path.join(ROOT, 'src', '_data', 'menu.json');
const menu = JSON.parse(read(MENU));

/* Kuch milaan khud ba khud ghalat nikalte hain — matn mein lafz aa jata hai
   magar safha us cheez ka nahi hota. Yeh haath se tay kiye gaye hain. */
const SKIP = new Set([
  // Nanga Parbat Himalaya mein hai, Hindu Kush mein nahi
  'Expeditions > Mountain Ranges > Hindu Kush Range',
  // K2 ki tayari wala article insurance ka safha nahi hai
  'About > Travel Resources > Travel Insurance',
  // aur yeh usi safhe par chala jata, do menu items ek jagah
  'About > Travel Resources > Health & Altitude',
]);

/* Jahan theek jawab maloom hai magar search use nahi dhoondh sakti */
const OVERRIDE = {
  // "Updates" ek post ka nahi, poore blog ka menu item hai
  'News & Updates > K2 & Expedition Updates': '/blog/',
};

const one = [];
const none = [];
const many = [];
const skipped = [];

const walk = (list, trail = [], parent = null) => {
  for (const item of list || []) {
    const url = String(item.url || '').trim();
    const where = [...trail, item.label].join(' > ');
    if (url.startsWith('/search')) {
      const type = (url.match(/[?&]type=([^&]*)/) || [])[1] || '';
      const q = (url.match(/[?&]q=([^&]*)/) || [])[1] || '';
      const hits = search(type, q);
      if (OVERRIDE[where]) {
        one.push({ item, where, url, to: OVERRIDE[where], title: 'haath se tay kiya gaya' });
      } else if (SKIP.has(where)) {
        skipped.push({ where, url });
      } else if (hits.length === 1) {
        one.push({ item, where, url, to: hits[0].url, title: hits[0].data?.title });
      } else if (hits.length === 0) {
        none.push({ item, where, url, parent });
      } else {
        many.push({ where, url, n: hits.length });
      }
    }
    if (item.children) walk(item.children, [...trail, item.label], item);
  }
};
walk(menu.items);

/* ---- report ---- */

console.log('1) EK natija — link seedha us safhe par ja sakta hai');
if (!one.length) console.log('   (koi nahi)');
for (const o of one) {
  console.log('   ->  ' + o.where);
  console.log('        ' + o.to + '   (' + o.title + ')');
}

console.log('\n2) KHALI — in par click karne se kuch nahi milta');
if (!none.length) console.log('   (koi nahi)');
for (const n of none) console.log('   !   ' + n.where.padEnd(52) + n.url);
if (none.length) {
  console.log('\n   Menu mein aisa naam hona, jis par kuch na mile, na hone se bura hai.');
  console.log('   --prune lagane se yeh menu se nikal jayenge (mitte nahi, sirf menu se).');
}

if (skipped.length) {
  console.log('\n   Jaan boojh kar chhoRe gaye (milaan ghalat tha):');
  for (const s of skipped) console.log('   -   ' + s.where.padEnd(52) + s.url);
}

console.log('\n3) Kai natije — search theek chal rahi hai, chhoR raha hoon');
if (!many.length) console.log('   (koi nahi)');
for (const m of many) console.log('   -   ' + m.where.padEnd(52) + m.n + ' natije');

/* ---- write ---- */

console.log('\n--------------------------------------------------');

const changes = one.length + (PRUNE ? none.length : 0);
if (!changes) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

console.log(one.length + ' link theek honge' + (PRUNE ? ', ' + none.length + ' menu se nikleinge' : ''));

if (!WRITE) {
  console.log('\nKarne ke liye:');
  console.log('   node tools/audit-menu-search.mjs --write');
  console.log('   node tools/audit-menu-search.mjs --write --prune    (khali wale bhi nikaal dein)');
  process.exit(0);
}

for (const o of one) o.item.url = o.to;

if (PRUNE) {
  const drop = new Set(none.map((n) => n.item));
  const clean = (list) => (list || []).filter((item) => {
    if (item.children) item.children = clean(item.children);
    return !drop.has(item);
  });
  menu.items = clean(menu.items);
}

if (!fs.existsSync(MENU + '.bak15')) fs.copyFileSync(MENU, MENU + '.bak15');
fs.writeFileSync(MENU, JSON.stringify(menu, null, 2) + '\n', 'utf8');
console.log('LIKHA: src/_data/menu.json   (backup: menu.json.bak15)');
console.log('\nAgla qadam:  npm run build');
