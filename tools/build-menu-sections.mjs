#!/usr/bin/env node
/**
 * build-menu-sections.mjs
 *
 * MAQSAD
 *   Har service (tours / trekking / expeditions / jeep-safaris / hunting)
 *   ke sub-menus ko asal pages bana dena, aur har journey form mein ek
 *   "Menu sections" dropdown lagana jiske options menu se khud banein.
 *
 * KYA KARTI HAI
 *   1. menu.json parh kar har service ke sections nikalti hai
 *      (level-2 sub-menu items, "View all" waghera chhoR kar)
 *      + woh pages jo pehle se mojood hain (jaise cultural-tours)
 *   2. jin sections ka page nahi, un ka page banati hai
 *      (bilkul usi saanche mein jaisa k2-treks ka hai)
 *      + CMS se likhai badalne ke liye content/landing/*.md
 *   3. menu.json mein un sections ka URL naye page par kar deti hai
 *      ("-" aur /search/?... ki jagah)
 *   4. src/_data/menuSections.json likhti hai (naam -> slug ki fehrist)
 *   5. .pages.yml: har journey form mein "Menu sections" dropdown
 *   6. generator ko sikhati hai ke naam ko slug mein kaise badalna hai
 *   7. maujooda entries ki migration: jo trek abhi K2 Treks par hai woh
 *      dropdown mein bhi K2 Treks par ho jata hai — kuch gayab nahi hota
 *
 *   node tools/build-menu-sections.mjs            -> sirf dekhna
 *   node tools/build-menu-sections.mjs --write    -> save karna
 *
 * Dobara chalane se nuqsan nahi (idempotent).
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

const SERVICES = {
  'tours': 'Tours',
  'trekking': 'Trekking',
  'expeditions': 'Expeditions',
  'jeep-safaris': 'Jeep Safaris',
  'hunting-services': 'Hunting Services',
};

/* collection ka naam .pages.yml mein */
const COLLECTION_OF = {
  'tours': 'tours',
  'trekking': 'trekking',
  'expeditions': 'expeditions',
  'jeep-safaris': 'jeep_safaris',
  'hunting-services': 'hunting_services',
};

/* purane switch -> section slug */
const LEGACY = {
  best_seller: 'best-sellers',
  fixed_departure: 'fixed-departures',
  k2_trek: 'k2-treks',
  cultural_tour: 'cultural-tours',
  peak_8000m: '8000m-peaks',
};

const writes = [];        // { file, text, kind }
const menuEdits = [];     // report ke liye

const slugify = (value) =>
  String(value ?? '')
    .replace(/[',’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const exists = (p) => fs.existsSync(p);

/* ======================================================= menu parho ==== */

console.log('\n1) Menu se sections nikaal rahe hain');

const MENU_PATH = path.join(ROOT, 'src', '_data', 'menu.json');
const menuRaw = read(MENU_PATH);
if (!menuRaw) { console.log('XX  src/_data/menu.json nahi mili.'); process.exit(1); }

let menu;
try { menu = JSON.parse(menuRaw); }
catch (e) { console.log('XX  menu.json parse nahi hui: ' + e.message); process.exit(1); }

const topItems = Array.isArray(menu.items) ? menu.items : [];

/** kya yeh child ek section hai? */
function sectionOf(service, child) {
  const label = String(child.label ?? '').trim();
  const url = String(child.url ?? '').trim();
  if (!label) return null;
  if (/^view all/i.test(label)) return null;
  if (url === `/${service}/`) return null;

  // apni service ke andar ka page -> uska slug
  if (url.startsWith(`/${service}/`)) {
    const slug = url.slice(`/${service}/`.length).replace(/\/+$/, '');
    if (!slug || slug.includes('/')) return null;
    return { slug, label, oldUrl: url };
  }
  // "-" ya khali ya search link -> naya page banega
  if (url === '-' || url === '' || url.startsWith('/search')) {
    return { slug: slugify(label), label, oldUrl: url };
  }
  // kisi aur page ka link (trip-calendar, plan-a-trip) -> chhoR dein
  return null;
}

const sectionsByService = {};

for (const [service, serviceLabel] of Object.entries(SERVICES)) {
  const top = topItems.find((it) => String(it.url ?? '').trim() === `/${service}/`);
  const found = [];
  const seen = new Set();

  for (const child of (top?.children || [])) {
    const sec = sectionOf(service, child);
    if (!sec || seen.has(sec.slug)) continue;
    seen.add(sec.slug);
    found.push({ ...sec, ref: child });
  }

  // jo pages pehle se mojood hain magar menu mein nahi (jaise cultural-tours)
  const dir = path.join(ROOT, 'src', service);
  if (exists(dir)) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (!exists(path.join(dir, e.name, 'index.njk'))) continue;
      if (seen.has(e.name)) continue;
      const txt = read(path.join(dir, e.name, 'index.njk')) || '';
      const label = (txt.match(/^filter_label:\s*(.+)$/m) || txt.match(/^title:\s*(.+)$/m) || [])[1];
      seen.add(e.name);
      found.push({ slug: e.name, label: String(label || e.name).replace(/^["']|["']$/g, '').trim(), oldUrl: `/${service}/${e.name}/`, ref: null });
    }
  }

  sectionsByService[service] = found;
  console.log(`   ${serviceLabel}: ` + (found.length ? found.map((s) => s.slug).join(', ') : '(koi nahi)'));
}

/* ======================================================= naye pages ==== */

console.log('\n2) Jin sections ka page nahi, un ke pages');

const PAGE_TPL = (service, serviceLabel, sec) => `---
layout: layouts/base.njk
permalink: /${service}/${sec.slug}/
title: ${sec.label}
summary: Explore ${sec.label.toLowerCase()} from Karakoram Vision Pakistan.
service_type: ${service}
structured_filter: ${sec.slug}
filter_label: ${sec.label}
filter_eyebrow: ${serviceLabel} collection
seo:
  title: "${sec.label} | Karakoram Vision Pakistan"
  description: >-
    ${sec.label} from Karakoram Vision Pakistan - planned from Skardu with
    permits, transport and local guides arranged.
---
{% include "components/structured-catalog-landing.njk" %}
`;

const LANDING_TPL = (service, sec) => `---
url: /${service}/${sec.slug}/
title: ${sec.label}
summary: Explore ${sec.label.toLowerCase()} from Karakoram Vision Pakistan.
seo_title: ${sec.label} | Karakoram Vision Pakistan
seo_description: >-
  ${sec.label} from Karakoram Vision Pakistan - planned from Skardu with
  permits, transport and local guides arranged.
---
`;

let newPages = 0;
for (const [service, serviceLabel] of Object.entries(SERVICES)) {
  for (const sec of sectionsByService[service]) {
    const pageFile = path.join(ROOT, 'src', service, sec.slug, 'index.njk');
    if (!exists(pageFile)) {
      writes.push({ file: pageFile, text: PAGE_TPL(service, serviceLabel, sec), kind: 'naya page' });
      console.log('   ->  src/' + service + '/' + sec.slug + '/index.njk');
      newPages++;
    }
    const landFile = path.join(ROOT, 'content', 'landing', `${service}-${sec.slug}.md`);
    if (!exists(landFile)) {
      writes.push({ file: landFile, text: LANDING_TPL(service, sec), kind: 'landing' });
    }
  }
}
if (!newPages) console.log('   OK  saare pages pehle se mojood hain.');

/* ======================================================= menu urls ===== */

console.log('\n3) Menu ke URL naye pages par');

let menuChanged = false;
for (const [service] of Object.entries(SERVICES)) {
  for (const sec of sectionsByService[service]) {
    if (!sec.ref) continue;
    const want = `/${service}/${sec.slug}/`;
    if (String(sec.ref.url ?? '').trim() === want) continue;
    menuEdits.push(`${sec.label}: ${sec.ref.url || '(khali)'}  ->  ${want}`);
    sec.ref.url = want;
    menuChanged = true;
  }
}
if (!menuEdits.length) console.log('   OK  menu pehle se theek hai.');
else for (const e of menuEdits) console.log('   ->  ' + e);

if (menuChanged) {
  writes.push({ file: MENU_PATH, text: JSON.stringify(menu, null, 2) + '\n', kind: 'menu.json' });
}

/* ======================================================= map file ====== */

console.log('\n4) src/_data/menuSections.json');

const mapOut = {};
for (const [service] of Object.entries(SERVICES)) {
  mapOut[service] = sectionsByService[service].map((s) => ({ slug: s.slug, label: s.label }));
}
const MAP_PATH = path.join(ROOT, 'src', '_data', 'menuSections.json');
const mapText = JSON.stringify(mapOut, null, 2) + '\n';
if (read(MAP_PATH) === mapText) console.log('   OK  pehle se theek hai.');
else { writes.push({ file: MAP_PATH, text: mapText, kind: 'map' }); console.log('   ->  likhi jayegi'); }

/* ======================================================= .pages.yml ==== */

console.log('\n5) .pages.yml — Menu sections dropdown');

const YML_PATH = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML_PATH);
if (!ymlRaw) { console.log('XX  .pages.yml nahi mili.'); process.exit(1); }

let doc;
try { doc = yaml.load(ymlRaw); }
catch (e) { console.log('XX  .pages.yml parse nahi hui: ' + e.message); process.exit(1); }

const beforeNames = new Set();
for (const c of doc.content || []) for (const f of c.fields || []) beforeNames.add(c.name + '.' + f.name);

let ymlChanged = false;
for (const [service] of Object.entries(SERVICES)) {
  const collName = COLLECTION_OF[service];
  const coll = (doc.content || []).find((c) => c.name === collName);
  if (!coll) { console.log('   !   collection nahi mili: ' + collName); continue; }
  const opts = sectionsByService[service].map((s) => s.label);
  if (!opts.length) { console.log('   -   ' + collName + ': koi section nahi, dropdown nahi lagaya'); continue; }

  const field = {
    name: 'menu_sections',
    label: 'Menu sections',
    type: 'select',
    list: true,
    description: 'Which menu sections this should appear in. Choose as many as you like.',
    options: opts,
  };

  const at = (coll.fields || []).findIndex((f) => f.name === 'menu_sections');
  if (at >= 0) {
    if (JSON.stringify(coll.fields[at].options) === JSON.stringify(opts)) {
      console.log('   OK  ' + collName + ': pehle se theek');
      continue;
    }
    coll.fields[at] = field;
    console.log('   ->  ' + collName + ': options update (' + opts.length + ')');
  } else {
    const after = (coll.fields || []).findIndex((f) => f.name === 'fixed_departure');
    const pos = after >= 0 ? after + 1 : (coll.fields || []).length;
    coll.fields.splice(pos, 0, field);
    console.log('   ->  ' + collName + ': dropdown laga (' + opts.length + ' options: ' + opts.join(', ') + ')');
  }
  ymlChanged = true;
}

if (ymlChanged) {
  const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
  // safety: koi field gayab to nahi hua
  let check;
  try { check = yaml.load(dumped); }
  catch (e) { console.log('XX  naya YAML parse nahi hua: ' + e.message); process.exit(1); }
  const afterNames = new Set();
  for (const c of check.content || []) for (const f of c.fields || []) afterNames.add(c.name + '.' + f.name);
  const lost = [...beforeNames].filter((n) => !afterNames.has(n));
  if (lost.length) {
    console.log('XX  yeh fields gayab ho rahe hain, rok rahe hain: ' + lost.join(', '));
    process.exit(1);
  }
  console.log('   jaanch: ' + beforeNames.size + ' fields the, ' + afterNames.size + ' hain — sab mahfooz.');
  writes.push({ file: YML_PATH, text: dumped, kind: '.pages.yml' });
}

/* ======================================================= generator ===== */

console.log('\n6) generator ko naam -> slug sikhana');

const GEN_PATH = path.join(ROOT, 'tools', 'generate_runtime_catalog.mjs');
let gen = read(GEN_PATH);
if (!gen) { console.log('XX  generator nahi mila.'); process.exit(1); }

if (gen.includes('sectionLookup')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const OLD_MAP = `const sectionsChosen = (Array.isArray(data.menu_sections) ? data.menu_sections : [])
      .map(slugifySection).filter(Boolean);`;
  const OLD_MAP_ALT = /const sectionsChosen = \(Array\.isArray\(data\.menu_sections\) \? data\.menu_sections : \[\]\)\s*\n\s*\.map\(slugifySection\)\.filter\(Boolean\);/;

  if (!OLD_MAP_ALT.test(gen)) {
    console.log('XX  sectionsChosen wali line nahi mili — pehle fix-toggles-honour chalayein.');
    process.exit(1);
  }
  gen = gen.replace(OLD_MAP_ALT,
    `const sectionsChosen = (Array.isArray(data.menu_sections) ? data.menu_sections : [])
      .map(v => sectionLookup[String(v ?? '').toLowerCase().trim()] || slugifySection(v))
      .filter(Boolean);`);

  // lookup table file ke shuru mein
  const anchor = 'const items = [];';
  if (!gen.includes(anchor)) { console.log('XX  "const items = [];" nahi mila.'); process.exit(1); }
  gen = gen.replace(anchor, `const items = [];
const sectionLookup = (() => {
  // naam ("K2 Treks") aur slug ("k2-treks") dono ko slug par le jata hai
  const map = {};
  try {
    const raw = fs.readFileSync(path.join(root, 'src', '_data', 'menuSections.json'), 'utf8');
    for (const list of Object.values(JSON.parse(raw))) {
      for (const s of list) {
        map[String(s.label).toLowerCase().trim()] = s.slug;
        map[String(s.slug).toLowerCase().trim()] = s.slug;
      }
    }
  } catch {}
  return map;
})();`);

  writes.push({ file: GEN_PATH, text: gen, kind: 'generator' });
  console.log('   ->  ab "K2 Treks" jaise naam bhi samajh lega.');
}

/* ======================================================= migration ===== */

console.log('\n7) Maujooda entries ki migration');

let migrated = 0;
for (const [service] of Object.entries(SERVICES)) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!exists(dir)) continue;
  const slugToLabel = {};
  for (const s of sectionsByService[service]) slugToLabel[s.slug] = s.label;

  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(dir, name);
    const text = read(file);
    if (!text || !text.startsWith('---')) continue;
    const end = text.indexOf('\n---', 3);
    if (end < 0) continue;
    const fm = text.slice(3, end);
    if (/^menu_sections\s*:/m.test(fm)) continue;      // pehle se hai

    const chosen = [];
    for (const [field, slug] of Object.entries(LEGACY)) {
      const m = fm.match(new RegExp('^' + field + ':\\s*(\\S+)\\s*$', 'm'));
      if (m && /^(true|yes)$/i.test(m[1]) && slugToLabel[slug]) chosen.push(slugToLabel[slug]);
    }
    if (!chosen.length) continue;

    const block = 'menu_sections:\n' + chosen.map((c) => `  - ${c}`).join('\n') + '\n';
    const next = text.slice(0, end + 1) + block + text.slice(end + 1);
    writes.push({ file, text: next, kind: 'migration' });
    migrated++;
  }
}
console.log('   ' + migrated + ' entries mein menu_sections likha jayega.');

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

const byKind = {};
for (const w of writes) byKind[w.kind] = (byKind[w.kind] || 0) + 1;
console.log('Tabdeeliyan: ' + Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', '));

if (!WRITE) {
  console.log('\nSave karne ke liye:');
  console.log('   node tools/build-menu-sections.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  if (exists(w.file) && !exists(w.file + '.bak') && /\.(yml|json|mjs)$/.test(w.file)) {
    fs.copyFileSync(w.file, w.file + '.bak');
  }
  fs.writeFileSync(w.file, w.text, 'utf8');
}
console.log('\n' + writes.length + ' file(s) likhi gayin.');
console.log('Agla qadam:  npm run build');
