#!/usr/bin/env node
/**
 * auto-third-level.mjs
 *
 * MAQSAD
 *   Menu ka teesra darja khud ba khud bane. Jis section ko client form mein
 *   chunega (City Tours, Trending Treks, 8,000m Peaks...), us section ke
 *   saare tours/treks/expeditions menu mein us ke neeche khud aa jayenge.
 *   Client ko menu screen kholne ki zaroorat hi nahi rahegi.
 *
 * KYA KARTI HAI
 *   1. eleventy.config.js mein naya filter: menuWithJourneys
 *      - menu.json jaisa hai waisa rehta hai (CMS ki apni file)
 *      - render ke waqt section items ke neeche journeys juR jaati hain
 *      - sab se oopar "View all ..." ka link, taake section ka apna safha
 *        desktop menu se bhi khul sake
 *      - client ke apne likhe hue items (Lahore, Peshawar...) qaayam rehte hain
 *      - ek hi pata do baar nahi aata
 *      - ek section ke neeche zyada se zyada 8 items, warna menu lamba ho jata
 *   2. header.njk: wahi filter lag jata hai (ek line)
 *   3. menu.json: jin links mein shuru ka "/" nahi (tours/islamabad-city-tour)
 *      woh theek ho jate hain — warna woh 404 par le jate hain
 *
 *   node tools/auto-third-level.mjs            -> sirf dekhna
 *   node tools/auto-third-level.mjs --write    -> save karna
 *
 * Dobara chalane se nuqsan nahi.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

const CFG = path.join(ROOT, 'eleventy.config.js');
const HDR = path.join(ROOT, 'src', '_includes', 'components', 'header.njk');
const MENU = path.join(ROOT, 'src', '_data', 'menu.json');
const MAP = path.join(ROOT, 'src', '_data', 'menuSections.json');

for (const f of [CFG, HDR, MENU]) {
  if (!fs.existsSync(f)) { console.log('XX  nahi mili: ' + path.relative(ROOT, f)); process.exit(1); }
}
if (!fs.existsSync(MAP)) {
  console.log('XX  src/_data/menuSections.json nahi mili — pehle build-menu-sections chalayein.');
  process.exit(1);
}

/* ======================================================= 1) filter ===== */

console.log('\n1) eleventy.config.js — naya filter');

let cfg = read(CFG);

const FILTER = `  eleventyConfig.addFilter("menuWithJourneys", (items, catalog, sections, limit) => {
    // Section ke neeche uski journeys khud juR jaati hain.
    const max = Number(limit) || 8;
    const norm = (value) => {
      let s = String(value || "").trim();
      if (!s || s === "-" || s.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(s)) return s;
      if (!s.startsWith("/")) s = "/" + s;
      return s;
    };
    const index = {};
    for (const service of Object.keys(sections || {})) {
      for (const s of (sections[service] || [])) {
        index["/" + service + "/" + s.slug + "/"] = { service, slug: s.slug };
      }
    }
    const matches = (item, type, filter) => {
      if (type && item && item.data && item.data.service_type !== type) return false;
      const secs = Array.isArray(item.sections) ? item.sections : [];
      if (secs.includes(filter)) return true;
      if (filter === "fixed-departures") return !!item.fixed_departure;
      if (filter === "best-sellers") return !!item.best_seller;
      if (filter === "k2-treks") return !!item.k2_trek;
      if (filter === "cultural-tours") return !!item.cultural_tour;
      if (filter === "8000m-peaks") return !!item.peak_8000m;
      return false;
    };
    const walk = (list) => (list || []).map((raw) => {
      const item = Object.assign({}, raw);
      item.url = norm(item.url);
      let children = walk(item.children);
      const sec = index[item.url];
      if (sec) {
        const journeys = (catalog || [])
          .filter((c) => matches(c, sec.service, sec.slug))
          .map((c) => ({ label: (c.data || {}).title, url: norm((c.data || {}).permalink) }))
          .filter((c) => c.label && c.url)
          .sort((a, b) => String(a.label).localeCompare(String(b.label)));
        if (journeys.length) {
          const merged = [{ label: "View all " + item.label, url: item.url }]
            .concat(children || [], journeys.slice(0, max));
          const seen = new Set();
          children = merged.filter((c) => {
            const key = norm(c.url);
            if (!c.label || !key || key === "-" || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      }
      if (children && children.length) item.children = children;
      else delete item.children;
      return item;
    });
    return walk(items);
  });
`;

if (cfg.includes('menuWithJourneys')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const anchor = '  eleventyConfig.addFilter("catalogFilter"';
  if (!cfg.includes(anchor)) {
    console.log('XX  catalogFilter wali line nahi mili — rok rahe hain.');
    process.exit(1);
  }
  cfg = cfg.replace(anchor, FILTER + anchor);
  writes.push({ file: CFG, text: cfg, bak: true });
  console.log('   ->  menuWithJourneys filter juR jayega.');
}

/* ======================================================= 2) header ==== */

console.log('\n2) header.njk');

let hdr = read(HDR);
const OLD_LINE = '{% set liveMenuItems = menu.items | liveMenu %}';
const NEW_LINE = '{% set liveMenuItems = menu.items | menuWithJourneys(structuredCatalog, menuSections) | liveMenu %}';

if (hdr.includes('menuWithJourneys')) {
  console.log('   OK  pehle se laga hua hai.');
} else if (!hdr.includes(OLD_LINE)) {
  console.log('XX  yeh line nahi mili: ' + OLD_LINE);
  process.exit(1);
} else {
  hdr = hdr.replace(OLD_LINE, NEW_LINE);
  writes.push({ file: HDR, text: hdr, bak: true });
  console.log('   ->  filter lag jayega.');
}

/* ======================================================= 3) slashes === */

console.log('\n3) menu.json — adhoore links');

let menu;
try { menu = JSON.parse(read(MENU)); }
catch (e) { console.log('XX  menu.json parse nahi hui: ' + e.message); process.exit(1); }

const fixes = [];
const fixUrls = (list) => {
  for (const item of (list || [])) {
    const url = String(item.url ?? '').trim();
    if (url && url !== '-' && !url.startsWith('/') && !url.startsWith('#') &&
        !/^(https?:|mailto:|tel:)/i.test(url)) {
      fixes.push(`${item.label}: ${url}  ->  /${url}`);
      item.url = '/' + url;
    }
    if (item.children) fixUrls(item.children);
  }
};
fixUrls(menu.items);

if (!fixes.length) console.log('   OK  saare links theek hain.');
else {
  for (const f of fixes) console.log('   ->  ' + f);
  writes.push({ file: MENU, text: JSON.stringify(menu, null, 2) + '\n', bak: true });
}

/* ======================================================= preview ====== */

console.log('\n4) Natije ki jhalak (abhi ke data par)');

try {
  const sections = JSON.parse(read(MAP));
  const cat = JSON.parse(read(path.join(ROOT, 'src', '_data', 'structuredCatalog.json')) || '[]');
  const matches = (item, type, filter) => {
    if (type && item && item.data && item.data.service_type !== type) return false;
    const secs = Array.isArray(item.sections) ? item.sections : [];
    if (secs.includes(filter)) return true;
    if (filter === 'fixed-departures') return !!item.fixed_departure;
    if (filter === 'best-sellers') return !!item.best_seller;
    if (filter === 'k2-treks') return !!item.k2_trek;
    if (filter === 'cultural-tours') return !!item.cultural_tour;
    if (filter === '8000m-peaks') return !!item.peak_8000m;
    return false;
  };
  for (const service of Object.keys(sections)) {
    for (const s of sections[service]) {
      const n = cat.filter((c) => matches(c, service, s.slug)).length;
      console.log(`   ${(service + '/' + s.slug).padEnd(42)} ${String(n).padStart(2)} journeys`);
    }
  }
} catch (e) {
  console.log('   (jhalak nahi bana saka: ' + e.message + ')');
}

/* ======================================================= write ======== */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/auto-third-level.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && !fs.existsSync(w.file + '.bak2')) fs.copyFileSync(w.file, w.file + '.bak2');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
