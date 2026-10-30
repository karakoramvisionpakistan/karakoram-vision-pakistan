#!/usr/bin/env node
/**
 * add-page-banners.mjs
 *
 * MASLA
 *   "Page banners" ki setting mein About, Gallery aur Our Team nahi hain.
 *   Aur About ka safha layouts/page.njk istemaal karta hai, jo banner wale
 *   hisse (landing-hero.njk) ko bulata hi nahi — apni alag grey patti banata
 *   hai. Is liye wahan khaana rakh dene se bhi kuch na hota.
 *
 * YEH SCRIPT
 *   1. page.njk ki grey patti ki jagah asal banner ka hissa lagati hai.
 *      Default (banner band, koi photo nahi) par woh wahi saada patti
 *      dikhata hai — yani abhi jaisa dikh raha hai waisa hi rahega, magar
 *      ab client CMS se photo ya slider laga sakega.
 *   2. menu ke har safhe ka khaana heroSettings.json aur .pages.yml dono
 *      mein bana deti hai (band haalat mein), taake koi safha chhoote nahi.
 *   3. Gallery / Our Team jaise apne safhon mein banner ka hissa sirf tab
 *      lagati hai jab un ka apna <h1> na ho — warna do unwaan ban jate.
 *
 *   node tools/add-page-banners.mjs            -> sirf dekhna
 *   node tools/add-page-banners.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= 1) page.njk === */

console.log('\n1) layouts/page.njk — banner ka hissa');

const PAGE = path.join(ROOT, 'src', '_includes', 'layouts', 'page.njk');
let pageText = read(PAGE);
if (!pageText) { console.log('XX  page.njk nahi mili.'); process.exit(1); }

if (pageText.includes('landing-hero.njk')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const OLD = /<section class="border-b border-slate-200 bg-slate-50 py-16">[\s\S]*?<\/section>/;
  if (!OLD.test(pageText)) {
    console.log('XX  purani grey patti nahi mili — rok rahe hain.');
    process.exit(1);
  }
  const NEW = `{% set heroCompact = true %}
{% set heroEyebrow = site.name %}
{% include "components/landing-hero.njk" %}`;
  pageText = pageText.replace(OLD, NEW);
  writes.push({ file: PAGE, text: pageText, bak: true });
  console.log('   ->  grey patti ki jagah banner ka hissa.');
}

/* ======================================================= 2) keys ======= */

console.log('\n2) Kaun kaun se safhon ko khaana chahiye');

const menu = JSON.parse(read(path.join(ROOT, 'src', '_data', 'menu.json')) || '{}');

/** page.url se chaabi: pehla hissa, "/" ke liye homepage */
const keyOf = (url) => {
  const s = String(url || '').trim();
  if (!s.startsWith('/')) return null;
  const clean = s.split('?')[0].split('#')[0];
  if (clean === '/' || clean === '') return 'homepage';
  const first = clean.split('/').filter(Boolean)[0];
  return first || 'homepage';
};

const wanted = new Map();          // key -> label
wanted.set('homepage', 'Home page');

const collect = (list) => {
  for (const item of list || []) {
    const key = keyOf(item.url);
    if (key && !wanted.has(key)) wanted.set(key, String(item.label || key).trim());
    if (item.children) collect(item.children);
  }
};
collect(menu.items);

// sirf wahi jin ka asal safha mojood hai
const hasPage = (key) => {
  if (key === 'homepage') return fs.existsSync(path.join(ROOT, 'src', 'index.njk'));
  if (fs.existsSync(path.join(ROOT, 'src', key, 'index.njk'))) return true;
  const dir = path.join(ROOT, 'src', 'content', 'pages');
  if (!fs.existsSync(dir)) return false;
  for (const f of fs.readdirSync(dir)) {
    const t = read(path.join(dir, f)) || '';
    const m = t.match(/^permalink:\s*(.+)$/m);
    if (m && keyOf(m[1].trim().replace(/^["']|["']$/g, '')) === key) return true;
  }
  return false;
};

/** kya is safhe par banner waqai chal sakta hai? */
const canHero = (key) => {
  if (key === 'homepage') return true;
  const own = path.join(ROOT, 'src', key, 'index.njk');
  if (!fs.existsSync(own)) return true;            // content page -> page.njk ab hero parhta hai
  const t = read(own) || '';
  if (t.includes('landing-hero.njk') || t.includes('catalog-landing.njk')) return true;
  return !/<h1/i.test(t);                          // apna unwaan hai to banner nahi lag sakta
};

const withPage = [...wanted.entries()].filter(([k]) => hasPage(k));
const keys = withPage.filter(([k]) => canHero(k));

const noPage = [...wanted.keys()].filter((k) => !withPage.some(([kk]) => kk === k));
const noHero = withPage.filter(([k]) => !canHero(k)).map(([k]) => k);

console.log('   ' + keys.length + ' safhe: ' + keys.map(([k]) => k).join(', '));
if (noPage.length) console.log('   chhoR diye (asal safha nahi): ' + noPage.join(', '));
if (noHero.length) {
  console.log('   chhoR diye (apna unwaan hai, banner nahi lag sakta): ' + noHero.join(', '));
  console.log('      -> in ka khaana banane ka faida nahi, woh switch bekaar hota.');
}

/* ======================================================= 3) settings === */

console.log('\n3) heroSettings.json');

const HS = path.join(ROOT, 'src', '_data', 'heroSettings.json');
const hs = JSON.parse(read(HS) || '{}');
const addedKeys = [];
for (const [key] of keys) {
  if (hs[key]) continue;
  hs[key] = { enabled: false, image: '', image_alt: '' };
  addedKeys.push(key);
}
if (!addedKeys.length) console.log('   OK  sab khaane pehle se hain.');
else {
  console.log('   ->  naye khaane: ' + addedKeys.join(', '));
  writes.push({ file: HS, text: JSON.stringify(hs, null, 2) + '\n', bak: true });
}

/* ======================================================= 4) .pages.yml = */

console.log('\n4) .pages.yml — Page banners screen');

const YML = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML);
const doc = yaml.load(ymlRaw);
const screen = (doc.content || []).find((c) => c.name === 'hero_banners');
if (!screen) { console.log('XX  hero_banners screen nahi mila.'); process.exit(1); }

const before = (screen.fields || []).length;
const have = new Set((screen.fields || []).map((f) => f.name));
const addedFields = [];

for (const [key, label] of keys) {
  if (have.has(key)) continue;
  screen.fields.push({
    name: key,
    label: label,
    type: 'object',
    fields: [
      { name: 'enabled', label: 'Show the sliding banner', type: 'boolean' },
      { name: 'image', label: 'Or one photo instead', type: 'image' },
      { name: 'image_alt', label: 'Photo description', type: 'string' },
    ],
  });
  addedFields.push(key);
}

if (!addedFields.length) console.log('   OK  screen pehle se poori hai.');
else {
  const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
  let check;
  try { check = yaml.load(dumped); }
  catch (e) { console.log('XX  naya YAML parse nahi hua: ' + e.message); process.exit(1); }
  const after = (check.content || []).find((c) => c.name === 'hero_banners');
  if (!after || after.fields.length !== before + addedFields.length) {
    console.log('XX  ginti mel nahi khai — rok rahe hain.');
    process.exit(1);
  }
  console.log('   ->  ' + addedFields.length + ' naye khaane: ' + addedFields.join(', '));
  console.log('   jaanch: ' + before + ' -> ' + after.fields.length + ' khaane.');
  writes.push({ file: YML, text: dumped, bak: true });
}

/* ======================================================= 5) apne safhe = */

console.log('\n5) Apne safhe (Gallery, Our Team waghera)');

for (const [key] of keys) {
  if (key === 'homepage') continue;
  const file = path.join(ROOT, 'src', key, 'index.njk');
  if (!fs.existsSync(file)) continue;
  const text = read(file);
  if (text.includes('landing-hero.njk') || text.includes('catalog-landing.njk')) {
    console.log('   OK  ' + key + ': banner pehle se chalta hai');
    continue;
  }
  if (/<h1/i.test(text)) {
    console.log('   !   ' + key + ': apna <h1> mojood hai — chhoR rahe hain (warna do unwaan)');
    continue;
  }
  const end = text.startsWith('---') ? text.indexOf('\n---', 3) : -1;
  if (end < 0) { console.log('   !   ' + key + ': front matter nahi mili'); continue; }
  const cut = text.indexOf('\n', end + 1) + 1;
  const insert = `{% set heroCompact = true %}\n{% set heroEyebrow = site.name %}\n{% include "components/landing-hero.njk" %}\n`;
  writes.push({ file, text: text.slice(0, cut) + insert + text.slice(cut), bak: true });
  console.log('   ->  ' + key + ': banner ka hissa laga diya');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/add-page-banners.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && !fs.existsSync(w.file + '.bak4')) fs.copyFileSync(w.file, w.file + '.bak4');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
