#!/usr/bin/env node
/**
 * seo-batch2.mjs  —  On-page SEO, Batch 2: Keyword Map ke mutabiq naam (H1) aur SEO titles
 *
 *   node tools/seo-batch2.mjs            dry-run
 *   node tools/seo-batch2.mjs --write    lagata hai (.bak-seo2 backup ke sath)
 *   npm run build
 *   node tools/seo-batch2.mjs --verify   _site mein H1 aur <title> check
 *
 * Kya badalta hai:
 *   - Trips aur pages ka naam (title = page ka H1), jahan naam kamzor tha
 *     ("Islamabad", "Car", "Cycling on KKH", "Gasherbrum-I" waghera).
 *   - Jahan naam badla, wahan doosre pages ki "related" fehrist mein bhi naya naam.
 *   - SEO titles (K2 pages par 2027, bina "|" wale titles, lambe titles).
 *   - Category/hub pages (content/landing) ka H1 aur kuch SEO titles.
 *   - Home ka H1 (homePage.json > hero.heading).
 *   - Islamabad tour ki meta description (kharab English).
 *
 * All-or-nothing. Har file likhne se pehle YAML dobara parh kar check hoti hai
 * ke sirf wahi khane badle jo badalne thay.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const VERIFY = process.argv.includes('--verify');
const BAK = '.bak-seo2';
const P = (rel) => path.join(ROOT, rel);

let yaml;
try { yaml = createRequire(P('package.json'))('js-yaml'); }
catch { console.log('\nXX 1 MASLA - KOI FILE NAHI BADLI\n\n   - js-yaml nahi mila. Website ke folder se chalayen (jahan package.json hai).\n'); process.exit(1); }

/* ------------------------------------------------------------------ */
/*  Naqsha                                                             */
/* ------------------------------------------------------------------ */

// Trips aur pages (src/content/**.md):  url -> { title?, seoTitle?, seoDesc? }
const CONTENT = {
  '/trekking/k2-base-camp-trek/':            { seoTitle: 'K2 Base Camp Trek 2027 - 21 Days | Karakoram Vision' },
  '/trekking/gondogoro-la-circuit-trek/':    { title: 'K2 Base Camp and Gondogoro La Trek', seoTitle: 'K2 & Gondogoro La Trek - 21 Days | Karakoram Vision' },
  '/trekking/biafo-hispar-trek/':            { title: 'Biafo Hispar Snow Lake Trek', seoTitle: 'Biafo Hispar Snow Lake Trek - 22 Days | Karakoram Vision' },
  '/trekking/fairy-meadows-base-camp-trek/': { title: 'Nanga Parbat Base Camp Trek via Fairy Meadows', seoTitle: 'Nanga Parbat Base Camp Trek - 10 Days | Karakoram Vision' },
  '/trekking/thalle-la-trek/':               { title: 'Thalle La Trek' },
  '/trekking/khosar-gang-peak/':             { title: 'Khosar Gang Peak Climb', seoTitle: 'Khosar Gang Peak Climb, Shigar | Karakoram Vision' },
  '/trekking/rakaposhi-base-camp-trek/':     { seoTitle: 'Rakaposhi Base Camp Trek - 7 Days | Karakoram Vision' },
  '/expeditions/k2-expedition/':             { seoTitle: 'K2 Expedition 2027 (8,611 m) - 60 Days | Karakoram Vision' },
  '/expeditions/gasherbrum-i-expedition/':   { title: 'Gasherbrum I Expedition' },
  '/expeditions/trango-expedition/':         { title: 'Trango Tower Expedition' },
  '/hunting-services/ibex-markhor-hunting-permits/': { title: 'Ibex and Markhor Hunting in Gilgit-Baltistan' },
  '/jeep-safaris/deosai-jeep-safari/':       { title: 'Deosai Jeep Safari' },
  '/jeep-safaris/shigar-basho-khaplu-jeep-safari/': { title: 'Shigar, Basho and Khaplu Jeep Safari' },
  '/jeep-safaris/mountains-villages-safari/': { title: 'Mountains and Villages Jeep Safari' },
  '/tours/autumn-hunza-skardu-tour/':        { title: 'Hunza and Skardu Autumn Tour' },
  '/tours/cycle-touring/':                   { title: 'Karakoram Highway Cycling Tour', seoTitle: 'Karakoram Highway Cycling Tour | Karakoram Vision' },
  '/tours/gilgit-baltistan-grand-circuit/':  { title: 'Gilgit-Baltistan Grand Circuit Tour' },
  '/tours/islamabad-city-tour/':             { title: 'Islamabad City Tour', seoTitle: 'Islamabad City Tour & Sightseeing | Karakoram Vision',
                                               seoDesc: 'Islamabad city tour with a local guide, covering Faisal Mosque, Pakistan Monument, Daman-e-Koh, Lok Virsa Museum and the Margalla Hills.' },
  '/tours/lahore-city-tour/':                { title: 'Lahore City Tour', seoTitle: 'Lahore City Tour & Sightseeing | Karakoram Vision' },
  '/tours/skardu-shigar-valley-explorer/':   { title: 'Skardu and Shigar Valley Tour' },
  '/tours/spring-blossom-tour/':             { title: 'Hunza Spring Blossom Tour' },
  '/vehicles/car/':                          { title: 'Car Rental in Skardu', seoTitle: 'Car Rental in Skardu | Karakoram Vision' },
  '/blog/pakistan-trekking-permits-visa/':   { seoTitle: 'Pakistan Trekking Permit & Visa Guide | Karakoram Vision' },
  '/family-tours/':                          { title: 'Family Tours in Pakistan' },
  '/why-choose-us/':                         { title: 'Why Travel with Karakoram Vision Pakistan' },
  '/faqs/':                                  { title: 'Pakistan Travel FAQs' },
  '/equipment-checklist/':                   { title: 'Trekking Equipment Checklist' },
  '/destinations/deosai/':                   { title: 'Deosai National Park Travel Guide' },
  '/destinations/fairy-meadows/':            { title: 'Fairy Meadows Travel Guide' },
  '/destinations/khaplu/':                   { title: 'Khaplu Valley Travel Guide' },
  '/destinations/shigar/':                   { title: 'Shigar Valley Travel Guide' },
  '/destinations/skardu/':                   { title: 'Skardu Valley Travel Guide' },
};

// Hub pages (content/landing/*.md):  url -> { title?, seoTitle? }
const LANDING = {
  '/trekking/':                          { title: 'Trekking in Pakistan' },
  '/trekking/k2-treks/':                 { title: 'K2 and Baltoro Glacier Treks' },
  '/trekking/best-sellers/':             { title: 'Best Treks in Pakistan' },
  '/trekking/fixed-departures/':         { title: 'Fixed Departure Treks in Pakistan' },
  '/trekking/trending-treks/':           { title: 'Trending Treks in Pakistan', seoTitle: 'Trending Treks in Pakistan | Karakoram Vision' },
  '/expeditions/':                       { title: 'Mountaineering Expeditions in Pakistan' },
  '/expeditions/8000m-peaks/':           { title: '8000m Peak Expeditions in Pakistan' },
  '/expeditions/best-sellers/':          { title: 'Best-Selling Expeditions in Pakistan', seoTitle: 'Best-Selling Expeditions in Pakistan | Karakoram Vision' },
  '/expeditions/fixed-departures/':      { title: 'Fixed Departure Expeditions in Pakistan', seoTitle: 'Fixed Departure Expeditions, Pakistan | Karakoram Vision' },
  '/tours/':                             { title: 'Pakistan Tour Packages' },
  '/tours/best-sellers/':                { title: 'Best-Selling Pakistan Tours', seoTitle: 'Best-Selling Pakistan Tours | Karakoram Vision' },
  '/jeep-safaris/':                      { title: 'Jeep Safaris in Pakistan' },
  '/hunting-services/':                  { title: 'Licensed Hunting Services in Gilgit-Baltistan' },
  '/vehicles/':                          { title: 'Vehicle Rental in Skardu and Gilgit' },
  '/destinations/':                      { title: 'Destinations in Northern Pakistan' },
  '/blog/':                              { title: 'Pakistan Travel Guides' },
  '/holiday-types/':                     { title: 'Holiday Types in Pakistan' },
  '/holiday-types/camping/':             { title: 'Camping Tours in Pakistan', seoTitle: 'Camping Tours in Pakistan | Karakoram Vision' },
  '/holiday-types/family-holidays/':     { title: 'Family Holidays in Pakistan', seoTitle: 'Family Holidays in Pakistan | Karakoram Vision' },
  '/holiday-types/road-trips/':          { title: 'Road Trips in Northern Pakistan', seoTitle: 'Road Trips in Northern Pakistan | Karakoram Vision' },
  '/special-interests/':                 { title: 'Special Interest Tours in Pakistan' },
  '/special-interests/mountain-passes/': { title: 'Mountain Pass Treks in Pakistan', seoTitle: 'Mountain Pass Treks in Pakistan | Karakoram Vision' },
  '/plan-a-trip/':                       { title: 'Plan a Custom Trip to Pakistan' },
  '/trip-calendar/':                     { title: 'Trip Calendar and Departure Dates' },
  '/guest-reviews/':                     { title: 'Karakoram Vision Pakistan Guest Reviews' },
  '/travel-resources/':                  { title: 'Pakistan Travel Resources' },
  '/contact-us/':                        { seoTitle: 'Contact Karakoram Vision Pakistan, Skardu' },
};

const HOME_H1 = 'Pakistan Tours, Treks and K2 Expeditions';

/* ------------------------------------------------------------------ */
/*  Madadgar                                                           */
/* ------------------------------------------------------------------ */

const fail = (problems) => {
  console.log('\nXX ' + problems.length + ' MASLA - KOI FILE NAHI BADLI\n');
  for (const p of problems) console.log('   - ' + p);
  console.log('');
  process.exit(1);
};
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
};
const rel = (abs) => path.relative(ROOT, abs).replace(/\\/g, '/');
// YAML ke liye: saada ho to bina quotes, warna double quotes
const q = (s) => (/^[A-Za-z][A-Za-z0-9 ,.()&'\/-]*$/.test(s) && !/: | #|[ ]$/.test(s) ? s : JSON.stringify(s));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// front matter ko lines mein tor kar deta hai
function split(raw) {
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const text = raw.replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  return { eol, fm: text.slice(4, end).split('\n'), rest: text.slice(end) };
}
const join = (s) => { const t = '---\n' + s.fm.join('\n') + s.rest; return s.eol === '\r\n' ? t.replace(/\n/g, '\r\n') : t; };

// ek khana (key) dhoond kar us ki poori lines (agli gehri lines samait) ek nayi line se badalta hai
// indent: key se pehle kitni spaces. within: [from, to) lines ki had.
function setKey(lines, key, value, indent, from = 0, to = lines.length, insertAt = null) {
  const pad = ' '.repeat(indent);
  const re = new RegExp('^' + pad + key + ':(\\s|$)');
  for (let i = from; i < to; i++) {
    if (!re.test(lines[i])) continue;
    let j = i + 1;
    while (j < to && /\S/.test(lines[j]) && lines[j].search(/\S/) > indent) j++;   // folded (>-) ya agli gehri lines
    lines.splice(i, j - i, pad + key + ': ' + q(value));
    return true;
  }
  if (insertAt === null) return false;
  lines.splice(insertAt, 0, pad + key + ': ' + q(value));
  return true;
}
// "seo:" ke neeche wali lines ki had
function seoRange(lines) {
  const i = lines.findIndex((l) => /^seo:\s*$/.test(l));
  if (i < 0) return null;
  let j = i + 1;
  while (j < lines.length && (/^\s+\S/.test(lines[j]) || /^\s*$/.test(lines[j]))) j++;
  while (j > i + 1 && /^\s*$/.test(lines[j - 1])) j--;
  return [i + 1, j];
}

/* ------------------------------------------------------------------ */
/*  Files parhna                                                       */
/* ------------------------------------------------------------------ */

const problems = [];
const files = {};   // rel -> { raw, s, before }
const load = (abs) => {
  const r = rel(abs);
  if (files[r]) return files[r];
  const raw = fs.readFileSync(abs, 'utf8');
  const s = split(raw);
  if (!s) { problems.push(r + ': front matter nahi mila'); return null; }
  let before;
  try { before = yaml.load(s.fm.join('\n')) || {}; } catch (e) { problems.push(r + ': YAML parh nahi saka (' + e.message.split('\n')[0] + ')'); return null; }
  return (files[r] = { raw, s, before });
};

const contentFiles = walk(P('src/content')).filter((f) => !/[\\/]sliders[\\/]/.test(f));
const landingFiles = walk(P('content/landing'));
const byUrl = {}; const byLanding = {};
for (const f of contentFiles) { const d = load(f); if (d && d.before.permalink) byUrl[d.before.permalink] = rel(f); }
for (const f of landingFiles) { const d = load(f); if (d && d.before.url) byLanding[d.before.url] = rel(f); }
if (problems.length) fail(problems);

/* ------------------------------ VERIFY ---------------------------- */

if (VERIFY) {
  const SITE = P('_site');
  if (!fs.existsSync(SITE)) fail(['_site nahi mila. Pehle: npm run build']);
  const dec = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&mdash;/g, '—').replace(/\s+/g, ' ').trim();
  const bad = []; let ok = 0;
  const page = (u) => { try { return fs.readFileSync(path.join(SITE, u, 'index.html'), 'utf8'); } catch { return null; } };
  const check = (u, want) => {
    const h = page(u);
    if (!h) { bad.push(u + ': safha _site mein nahi'); return; }
    if (want.title) {
      const h1 = [...h.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => dec(m[1]));
      if (h1.length === 1 && h1[0] === want.title) ok++; else bad.push(u + ': H1 "' + h1.join('" / "') + '" hai, chahiye "' + want.title + '"');
    }
    if (want.seoTitle) {
      const t = dec((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
      if (t === want.seoTitle || t.startsWith(want.seoTitle + ' |')) ok++; else bad.push(u + ': <title> "' + t + '" hai, chahiye "' + want.seoTitle + '"');
    }
    if (want.seoDesc) {
      const d = dec((h.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '');
      if (d === want.seoDesc) ok++; else bad.push(u + ': description nahi badli');
    }
  };
  for (const [u, w] of Object.entries(CONTENT)) check(u, w);
  for (const [u, w] of Object.entries(LANDING)) check(u, w);
  check('/', { title: HOME_H1 });
  console.log('\n   ' + ok + ' check paas.');
  if (bad.length) { console.log('\nXX ' + bad.length + ' MASLA (verify)\n'); for (const b of bad) console.log('   - ' + b); console.log(''); process.exit(1); }
  console.log('   Sab theek.\n');
  process.exit(0);
}

/* --------------------------- TABDEELIYAN -------------------------- */

const plan = [];
const renames = {};   // purana naam (trim) -> naya naam

// 1. trips / pages
for (const [url, w] of Object.entries(CONTENT)) {
  const r = byUrl[url];
  if (!r) { problems.push(url + ': is URL ki file src/content mein nahi mili'); continue; }
  const d = files[r]; const L = d.s.fm;
  if (w.title && d.before.title !== w.title) {
    if (typeof d.before.title !== 'string') { problems.push(r + ': title nahi mila'); continue; }
    renames[d.before.title.trim()] = w.title;
    if (!setKey(L, 'title', w.title, 0)) problems.push(r + ': "title:" line nahi mili');
    plan.push([r, 'naam: "' + d.before.title.trim() + '" -> "' + w.title + '"']);
  }
  if (w.seoTitle || w.seoDesc) {
    const range = seoRange(L);
    if (!range) { problems.push(r + ': "seo:" hissa nahi mila'); continue; }
    const cur = d.before.seo || {};
    if (w.seoTitle && cur.title !== w.seoTitle) {
      setKey(L, 'title', w.seoTitle, 2, range[0], range[1], range[0]);
      plan.push([r, 'SEO title: "' + w.seoTitle + '"']);
    }
    if (w.seoDesc && cur.description !== w.seoDesc) {
      const r2 = seoRange(L);
      setKey(L, 'description', w.seoDesc, 2, r2[0], r2[1], r2[0] + 1);
      plan.push([r, 'meta description nayi']);
    }
  }
}

// 2. "related" fehristein — jahan purana naam likha hai
for (const f of contentFiles) {
  const r = rel(f); const d = files[r]; const L = d.s.fm;
  const i = L.findIndex((l) => /^related:\s*$/.test(l));
  if (i < 0) continue;
  for (let j = i + 1; j < L.length && /^\s+- /.test(L[j]); j++) {
    let v; try { v = yaml.load(L[j].replace(/^\s+- /, '')); } catch { continue; }
    if (typeof v !== 'string') continue;
    const nn = renames[v.trim()];
    if (nn) { L[j] = L[j].match(/^\s+- /)[0] + q(nn); plan.push([r, 'related: "' + v.trim() + '" -> "' + nn + '"']); }
  }
}

// 3. hub pages
for (const [url, w] of Object.entries(LANDING)) {
  const r = byLanding[url];
  if (!r) { problems.push(url + ': is URL ki file content/landing mein nahi mili'); continue; }
  const d = files[r]; const L = d.s.fm;
  if (w.title && d.before.title !== w.title) {
    if (!setKey(L, 'title', w.title, 0)) problems.push(r + ': "title:" line nahi mili');
    plan.push([r, 'H1: "' + d.before.title + '" -> "' + w.title + '"']);
  }
  if (w.seoTitle && d.before.seo_title !== w.seoTitle) {
    const ti = L.findIndex((l) => /^title:(\s|$)/.test(l));
    setKey(L, 'seo_title', w.seoTitle, 0, 0, L.length, ti + 1);
    plan.push([r, 'SEO title: "' + w.seoTitle + '"']);
  }
}

// 4. har badli file ko dobara parh kar check: sirf mutaliqa khane badle hon
const out = {};   // rel -> naya matn
for (const [r, d] of Object.entries(files)) {
  const text = join(d.s);
  if (text === d.raw) continue;
  let after;
  try { after = yaml.load(d.s.fm.join('\n')) || {}; } catch (e) { problems.push(r + ': tabdeeli ke baad YAML toot gaya (' + e.message.split('\n')[0] + ')'); continue; }
  const strip = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.title; delete c.seo_title; delete c.related; if (c.seo) { delete c.seo.title; delete c.seo.description; } return c; };
  if (!same(strip(d.before), strip(after))) { problems.push(r + ': koi aur khana bhi badal gaya — rok diya'); continue; }
  const relBefore = (d.before.related || []).length; const relAfter = (after.related || []).length;
  if (relBefore !== relAfter) { problems.push(r + ': related ki ginti badal gayi'); continue; }
  out[r] = text;
}

// 5. home
const HOME = 'src/_data/homePage.json';
let homeRaw = null; let homeNew = null;
try {
  homeRaw = fs.readFileSync(P(HOME), 'utf8');
  const j = JSON.parse(homeRaw);
  const cur = j.hero && j.hero.heading;
  if (cur !== HOME_H1) {
    if (typeof cur !== 'string') problems.push(HOME + ': hero.heading nahi mila');
    else {
      const needle = '"heading": ' + JSON.stringify(cur);
      const at = homeRaw.indexOf(needle);
      const heroAt = homeRaw.indexOf('"hero"');
      if (at < 0 || heroAt < 0 || at < heroAt || homeRaw.slice(heroAt, at).includes('}')) problems.push(HOME + ': hero.heading ki line nahi pehchani');
      else {
        homeNew = homeRaw.slice(0, at) + '"heading": ' + JSON.stringify(HOME_H1) + homeRaw.slice(at + needle.length);
        const k = JSON.parse(homeNew); k.hero.heading = cur;
        if (!same(k, j)) { problems.push(HOME + ': koi aur khana bhi badal gaya'); homeNew = null; }
        else plan.push([HOME, 'Home H1: "' + cur + '" -> "' + HOME_H1 + '"']);
      }
    }
  }
} catch (e) { problems.push(HOME + ': parh nahi saka (' + e.message + ')'); }

// 6. template ki do durustiyan
//    (a) 7 sections ki *.11tydata.js CMS ka SEO title/description nazarandaz karti thin
//    (b) Plan a Trip ka H1 template mein jama hua tha
const PATCHES = [
  ...['expeditions', 'holiday-types', 'hunting-services', 'jeep-safaris', 'special-interests', 'tours', 'trekking'].map((d) => ({
    file: 'src/' + d + '/' + d + '.11tydata.js',
    name: 'CMS ka SEO title/description is section ke pages par bhi lagu',
    find: "      const seo = Object.assign({}, data.seo || {});\n",
    replace: "      const seo = Object.assign({}, data.seo || {});\n" +
      "      // seoBatch2: CMS (Menu Pages) ka SEO title/description yahan bhi lagu\n" +
      "      const lp = (data.landing || {})[String((data.page && data.page.url) || '')];\n" +
      "      if (lp && lp.seo_title) seo.title = lp.seo_title;\n" +
      "      if (lp && lp.seo_description) seo.description = lp.seo_description;\n",
    done: 'seoBatch2: CMS (Menu Pages)',
  })),
  {
    file: 'src/plan-a-trip/index.njk',
    name: 'Plan a Trip: H1 CMS ke naam se',
    find: "{% set heroHeading = 'Plan a Trip' %}",
    replace: "{% set heroHeading = lp.title or 'Plan a Trip' %}",
    done: "{% set heroHeading = lp.title or 'Plan a Trip' %}",
  },
];
const patched = [];   // [rel, naya, purana]
for (const e of PATCHES) {
  let raw;
  try { raw = fs.readFileSync(P(e.file), 'utf8'); } catch { problems.push(e.file + ' nahi mili'); continue; }
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const cur = raw.replace(/\r\n/g, '\n');
  if (cur.includes(e.done)) continue;
  if (cur.split(e.find).length - 1 !== 1) { problems.push(e.file + ': "' + e.name + '" — jagah nahi pehchani'); continue; }
  const next = cur.replace(e.find, e.replace);
  patched.push([e.file, eol === '\r\n' ? next.replace(/\n/g, '\r\n') : next, raw]);
  plan.push([e.file, e.name]);
}

if (problems.length) fail(problems);

/* ------------------------------ REPORT ---------------------------- */

console.log('\n================ SEO BATCH 2 ' + (WRITE ? '(WRITE)' : '(DRY-RUN)') + ' ================\n');
let last = '';
for (const [r, msg] of plan) { if (r !== last) console.log('   ' + r); last = r; console.log('        ' + msg); }
const nFiles = Object.keys(out).length + (homeNew ? 1 : 0) + patched.length;
console.log('\n' + plan.length + ' tabdeeli, ' + nFiles + ' file.');

if (!WRITE) { console.log('Yeh dry-run tha. Lagane ke liye:  node tools/seo-batch2.mjs --write\n'); process.exit(0); }
if (!nFiles) { console.log('Kuch badalne ko nahi — sab pehle se laga hua hai.\n'); process.exit(0); }

const writes = Object.entries(out).map(([r, t]) => [r, t, files[r].raw]);
if (homeNew) writes.push([HOME, homeNew, homeRaw]);
for (const w of patched) writes.push(w);
const done = [];
try {
  for (const [r, , raw] of writes) if (!fs.existsSync(P(r) + BAK)) fs.writeFileSync(P(r) + BAK, raw);
  for (const [r, t] of writes) { fs.writeFileSync(P(r), t); done.push(r); }
} catch (err) {
  for (const [r, , raw] of writes) if (done.includes(r)) fs.writeFileSync(P(r), raw);
  fail(['likhte waqt ghalti: ' + err.message + ' — jo files badli thin wapas kar di gayin']);
}
console.log('Lag gaya. Backup: har file ke sath ' + BAK);
console.log('Ab:  npm run build   phir   node tools/seo-batch2.mjs --verify\n');
