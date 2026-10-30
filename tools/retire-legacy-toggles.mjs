#!/usr/bin/env node
/**
 * retire-legacy-toggles.mjs
 *
 * MASLA
 *   Ab har journey form mein do control hain: purane toggles (Best seller,
 *   Fixed departure, K2 Treks, Cultural Tours, 8,000m Peaks) aur naya
 *   "Menu sections" dropdown. Jis entry mein dropdown bhara hua ho, wahan
 *   toggles bilkul nazar andaaz hote hain — yani client toggle daba kar
 *   intezar karega aur kuch nahi hoga.
 *
 * YEH SCRIPT
 *   1. Har journey entry mein woh sections likh deti hai jo ABHI website par
 *      chal rahe hain (structuredCatalog se), agar pehle se na likhe hon.
 *      Is tarah maujooda halat jyun ki tyun mehfooz ho jati hai.
 *   2. .pages.yml se woh paanch toggles hata deti hai. "Featured" rehta hai,
 *      kyunke woh menu ka hissa nahi — homepage ke liye hai.
 *
 *   Qeematein md files mein mojood rahengi, sirf form se khanay hat rahe hain.
 *
 *   node tools/retire-legacy-toggles.mjs            -> sirf dekhna
 *   node tools/retire-legacy-toggles.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];

const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const COLLECTION_OF = {
  'tours': 'tours',
  'trekking': 'trekking',
  'expeditions': 'expeditions',
  'jeep-safaris': 'jeep_safaris',
  'hunting-services': 'hunting_services',
};
const DROP = ['best_seller', 'fixed_departure', 'k2_trek', 'cultural_tour', 'peak_8000m'];

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= data ========== */

const catRaw = read(path.join(ROOT, 'src', '_data', 'structuredCatalog.json'));
const mapRaw = read(path.join(ROOT, 'src', '_data', 'menuSections.json'));
if (!catRaw) { console.log('XX  structuredCatalog.json nahi mili — pehle npm run build chalayein.'); process.exit(1); }
if (!mapRaw) { console.log('XX  menuSections.json nahi mili.'); process.exit(1); }

let catalog, sectionMap;
try { catalog = JSON.parse(catRaw); sectionMap = JSON.parse(mapRaw); }
catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

if (!catalog.length || catalog[0].sections === undefined) {
  console.log('XX  catalog mein "sections" nahi hai — pehle npm run build chalayein.');
  process.exit(1);
}

const byUrl = {};
for (const item of catalog) byUrl[String(item.url || '').trim()] = item;

const labelOf = {};              // service -> { slug: label }
for (const service of Object.keys(sectionMap)) {
  labelOf[service] = {};
  for (const s of sectionMap[service]) labelOf[service][s.slug] = s.label;
}

/* ======================================================= 1) content ==== */

console.log('\n1) Entries mein maujooda sections likhna');

let written = 0, already = 0, empty = 0;

for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!fs.existsSync(dir)) continue;

  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(dir, name);
    const text = read(file);
    if (!text || !text.startsWith('---')) continue;
    const end = text.indexOf('\n---', 3);
    if (end < 0) continue;
    const fm = text.slice(3, end);

    if (/^menu_sections\s*:/m.test(fm)) { already++; continue; }

    const permalink = ((fm.match(/^permalink:\s*(.+)$/m) || [])[1] || '').trim().replace(/^["']|["']$/g, '');
    const item = byUrl[permalink];
    const slugs = item && Array.isArray(item.sections) ? item.sections : [];
    const labels = slugs.map((s) => (labelOf[service] || {})[s]).filter(Boolean);

    if (!labels.length) { empty++; continue; }

    const block = 'menu_sections:\n' + labels.map((l) => `  - ${l}`).join('\n') + '\n';
    writes.push({ file, text: text.slice(0, end + 1) + block + text.slice(end + 1) });
    written++;
  }
}

console.log(`   ${written} entries mein likha jayega`);
console.log(`   ${already} entries mein pehle se hai`);
console.log(`   ${empty} entries kisi section mein nahi (dropdown khali rahega)`);

/* ======================================================= 2) .pages.yml = */

console.log('\n2) .pages.yml se purane toggles hatana');

const YML = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML);
if (!ymlRaw) { console.log('XX  .pages.yml nahi mili.'); process.exit(1); }

let doc;
try { doc = yaml.load(ymlRaw); }
catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

let removed = 0, ymlChanged = false;

for (const service of SERVICES) {
  const collName = COLLECTION_OF[service];
  const coll = (doc.content || []).find((c) => c.name === collName);
  if (!coll) { console.log('   !   collection nahi mili: ' + collName); continue; }

  const hasDropdown = (coll.fields || []).some((f) => f.name === 'menu_sections');
  if (!hasDropdown) {
    console.log('   -   ' + collName + ': dropdown nahi hai, toggles rehne diye');
    continue;
  }

  const before = coll.fields.length;
  coll.fields = coll.fields.filter((f) => !DROP.includes(f.name));
  const gone = before - coll.fields.length;
  if (gone) {
    console.log('   ->  ' + collName + ': ' + gone + ' toggle hataye');
    removed += gone;
    ymlChanged = true;
  } else {
    console.log('   OK  ' + collName + ': pehle se saaf');
  }
}

if (ymlChanged) {
  // jaanch: sirf wahi fields gaye jo hatane the
  const beforeNames = new Set();
  const orig = yaml.load(ymlRaw);
  for (const c of orig.content || []) for (const f of c.fields || []) beforeNames.add(c.name + '.' + f.name);

  const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
  let check;
  try { check = yaml.load(dumped); }
  catch (e) { console.log('XX  naya YAML parse nahi hua: ' + e.message); process.exit(1); }

  const afterNames = new Set();
  for (const c of check.content || []) for (const f of c.fields || []) afterNames.add(c.name + '.' + f.name);

  const lost = [...beforeNames].filter((n) => !afterNames.has(n));
  const unexpected = lost.filter((n) => !DROP.includes(n.split('.')[1]));
  if (unexpected.length) {
    console.log('XX  yeh fields ghalati se ja rahe hain: ' + unexpected.join(', '));
    process.exit(1);
  }
  console.log('   jaanch: ' + beforeNames.size + ' -> ' + afterNames.size + ' fields, sirf ' + lost.length + ' hataye (sab mutawaqqa).');
  writes.push({ file: YML, text: dumped, bak: true });
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

console.log(writes.length + ' file(s) badlengi (' + written + ' content, ' + (ymlChanged ? 1 : 0) + ' schema).');

if (!WRITE) {
  console.log('\nSave karne ke liye:');
  console.log('   node tools/retire-legacy-toggles.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && !fs.existsSync(w.file + '.bak3')) fs.copyFileSync(w.file, w.file + '.bak3');
  fs.writeFileSync(w.file, w.text, 'utf8');
}
console.log('\nLikh diya. Agla qadam:  npm run build');
