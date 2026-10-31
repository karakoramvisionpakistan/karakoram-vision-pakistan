#!/usr/bin/env node
/**
 * add-related-journeys.mjs   (website ke folder mein)
 *
 * Itinerary ke neechay "Related journeys" ka pakka khaana.
 *
 * Client ko link likhna nahi parhega — form mein sab trips ki fehrist
 * khulegi, jitne chahe chun le, link khud ba khud ban jayega. Naam badal
 * jaye to link toota hua nahi rehta, woh ghaib ho jata hai.
 *
 * Koi nayi data file nahi banti: fehrist wahi structuredCatalog hai jo
 * pehle se har build par banta hai.
 *
 * Kya lagta hai:
 *   .pages.yml                  -> "Related journeys" ka khaana (sab trips ki fehrist)
 *   eleventy.config.js          -> relatedJourneys filter
 *   related-journeys.njk        -> safhe par dikhane wala hissa
 *   journey.njk                 -> itinerary ke theek neechay
 *   input.css                   -> CSS
 *   tools/sync-related-options.mjs -> naye trips ko fehrist mein lane ke liye
 *   GitHub Action               -> fehrist khud ba khud taza rehti hai
 *
 *   node tools/add-related-journeys.mjs            -> sirf dekhna
 *   node tools/add-related-journeys.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

const COLLECTIONS = ['tours', 'trekking', 'expeditions', 'jeep_safaris', 'hunting_services'];

/* ======================================================= 0) catalogue == */

console.log('\n0) Trips ki fehrist');

const CAT = path.join(ROOT, 'src', '_data', 'structuredCatalog.json');
const catRaw = read(CAT);
if (!catRaw) {
  console.log('XX  src/_data/structuredCatalog.json nahi mili.');
  console.log('    Pehle ek baar  npm run build  chala lein, woh file build par banti hai.');
  process.exit(1);
}

let cat;
try { cat = JSON.parse(catRaw); } catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

/* Catalogue ki shakal maine pehle andaze se maan li thi aur fehrist khaali
   aa gayi. Ab usay dhoondhte hain: andar jahan bhi aisi cheez mile jiska
   naam aur pata dono hon, woh trip hai. Shakal badal bhi jaye to chalta
   rahega. */
const JOURNEY_URL = /^\/(tours|trekking|expeditions|jeep-safaris|hunting-services)\/[^/]+\/?$/;

function collectJourneys(node, depth, found) {
  if (!node || depth > 5) return;
  if (Array.isArray(node)) { for (const n of node) collectJourneys(n, depth + 1, found); return; }
  if (typeof node !== 'object') return;

  const t = node.title || node.label || node.name;
  const u = node.url || node.permalink || node.href || node.path;
  if (typeof t === 'string' && typeof u === 'string' && JOURNEY_URL.test(u)) {
    found.push({ title: t.trim(), url: u });
    return;
  }
  for (const v of Object.values(node)) collectJourneys(v, depth + 1, found);
}

const found = [];
collectJourneys(cat, 0, found);

const titles = [];
const seenT = new Set();
for (const it of found) {
  if (!it.title) continue;
  const k = it.title.toLowerCase();
  if (seenT.has(k)) continue;
  seenT.add(k);
  titles.push(it.title);
}
titles.sort((a, b) => a.localeCompare(b));

console.log('   ' + titles.length + ' trips mile.');
if (titles.length < 5) { console.log('XX  itni kam? fehrist theek nahi lag rahi, ruk raha hoon.'); process.exit(1); }
console.log('   misaal: ' + titles.slice(0, 3).join('  |  '));

/* ======================================================= 1) .pages.yml = */

console.log('\n1) .pages.yml — Related journeys ka khaana');

const YML = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML);
if (!ymlRaw) { console.log('XX  .pages.yml nahi mili.'); process.exit(1); }

let doc;
try { doc = yaml.load(ymlRaw); } catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

/* Select khaana unke form mein kis shakal mein likha hai, wahi shakal lein. */
function findSelect(f) {
  if (f && f.type === 'select' && f.options) {
    if (Array.isArray(f.options)) return 'array';
    if (Array.isArray(f.options.values)) return 'values';
  }
  if (f && Array.isArray(f.fields)) {
    for (const sub of f.fields) { const r = findSelect(sub); if (r) return r; }
  }
  return null;
}
let SHAPE = 'array';
outer:
for (const c of doc.content || []) {
  for (const f of c.fields || []) { const r = findSelect(f); if (r) { SHAPE = r; break outer; } }
}
console.log('   select ki shakal: ' + (SHAPE === 'values' ? 'options: { values: [...] }' : 'options: [...]'));

const relField = () => ({
  name: 'related',
  label: 'Related journeys',
  type: 'select',
  list: true,
  options: SHAPE === 'values' ? { values: titles.slice() } : titles.slice(),
  description: 'Pick as many as you like. They appear under the itinerary as links. Nearby trips in the same valley, an easier or harder version of this one, or what people usually book next.',
});

let ymlChanged = false;

for (const name of COLLECTIONS) {
  const coll = (doc.content || []).find((c) => c.name === name);
  if (!coll) { console.log('   !   collection nahi mili: ' + name); continue; }

  const at = (coll.fields || []).findIndex((f) => f.name === 'related');
  if (at >= 0) {
    coll.fields[at] = relField();
    console.log('   ->  ' + name + ': fehrist taza ki');
    ymlChanged = true;
    continue;
  }

  const itin = (coll.fields || []).findIndex((f) => f.name === 'itinerary');
  if (itin < 0) {
    console.log('   !   ' + name + ': itinerary ka khaana nahi mila.');
    console.log('       Pehle add-itinerary.mjs chala lein, phir yeh.');
    process.exit(1);
  }
  coll.fields.splice(itin + 1, 0, relField());
  console.log('   ->  ' + name + ': khaana juR gaya, itinerary ke theek neechay');
  ymlChanged = true;
}

if (ymlChanged) {
  const before = new Set();
  const orig = yaml.load(ymlRaw);
  for (const c of orig.content || []) for (const f of c.fields || []) before.add(c.name + '.' + f.name);

  const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
  let check;
  try { check = yaml.load(dumped); } catch (e) { console.log('XX  naya YAML parse nahi hua: ' + e.message); process.exit(1); }

  const after = new Set();
  for (const c of check.content || []) for (const f of c.fields || []) after.add(c.name + '.' + f.name);
  const lost = [...before].filter((n) => !after.has(n));
  if (lost.length) { console.log('XX  yeh fields gayab ho rahe hain: ' + lost.join(', ')); process.exit(1); }

  console.log('   jaanch: ' + before.size + ' -> ' + after.size + ' fields, koi gum nahi.');
  writes.push({ file: YML, text: dumped, bak: true });
}

/* ======================================================= 2) filter ===== */

console.log('\n2) eleventy.config.js — relatedJourneys filter');

const CFG = path.join(ROOT, 'eleventy.config.js');
let cfg = read(CFG);
if (!cfg) { console.log('XX  eleventy.config.js nahi mili.'); process.exit(1); }

const FILTER = `  eleventyConfig.addFilter("relatedJourneys", (picked, catalog, selfUrl) => {
    // Client form mein sirf naam chunta hai. Link yahan catalogue se nikalta
    // hai, is liye naam badal jane par toota hua link nahi rehta — woh entry
    // khamoshi se ghaib ho jati hai.
    const want = Array.isArray(picked) ? picked : (picked ? [picked] : []);
    if (!want.length) return [];

    // Catalogue ke andar jahan bhi naam aur pata dono mile, woh trip hai.
    const JOURNEY_URL = /^\\/(tours|trekking|expeditions|jeep-safaris|hunting-services)\\/[^/]+\\/?$/;
    const found = [];
    const walk = (node, depth) => {
      if (!node || depth > 5) return;
      if (Array.isArray(node)) { for (const n of node) walk(n, depth + 1); return; }
      if (typeof node !== "object") return;
      const t = node.title || node.label || node.name;
      const u = node.url || node.permalink || node.href || node.path;
      if (typeof t === "string" && typeof u === "string" && JOURNEY_URL.test(u)) {
        found.push({ ...node, title: t.trim(), url: u });
        return;
      }
      for (const v of Object.values(node)) walk(v, depth + 1);
    };
    walk(catalog, 0);

    const key = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    const byTitle = new Map();
    for (const it of found) {
      const t = key(it.title);
      if (t && !byTitle.has(t)) byTitle.set(t, it);
    }

    const out = [];
    const seen = new Set();
    for (const w of want) {
      const it = byTitle.get(key(w));
      if (!it) continue;
      if (selfUrl && it.url === selfUrl) continue;   // apne aap se link nahi
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      out.push(it);
    }
    return out;
  });
`;

if (cfg.includes('relatedJourneys')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const anchor = '  eleventyConfig.addFilter("catalogFilter"';
  if (!cfg.includes(anchor)) { console.log('XX  jagah nahi mili.'); process.exit(1); }
  cfg = cfg.replace(anchor, FILTER + anchor);
  writes.push({ file: CFG, text: cfg, bak: true });
  console.log('   ->  filter juR gaya');
}

/* ======================================================= 3) component == */

console.log('\n3) Safhe par dikhane wala hissa');

const COMP = path.join(ROOT, 'src', '_includes', 'components', 'related-journeys.njk');
const COMP_TEXT = `{# Itinerary ke neechay related journeys.

   Client form mein naam chunta hai; link yahan catalogue se banta hai.
   Safha apne aap se link nahi karta, aur jo naam catalogue mein na ho
   woh khamoshi se chhoR diya jata hai — toota hua link kabhi nahi
   dikhta. #}
{% set relatedPicked = related | relatedJourneys(structuredCatalog, page.url) %}
{% if relatedPicked and relatedPicked.length %}
<section id="related" class="bk-trip-content-section">
  <p class="eyebrow">You might also like</p>
  <h2>Related journeys</h2>

  <ul class="bk-related">
    {% for r in relatedPicked %}
    <li class="bk-related-item">
      <a href="{{ r.url or r.permalink }}">
        <span class="bk-related-title">{{ r.title or r.label }}</span>
        {% if r.duration or r.difficulty %}
        <span class="bk-related-meta">
          {% if r.duration %}{{ r.duration }}{% endif %}
          {% if r.duration and r.difficulty %} &middot; {% endif %}
          {% if r.difficulty %}{{ r.difficulty }}{% endif %}
        </span>
        {% endif %}
      </a>
    </li>
    {% endfor %}
  </ul>
</section>
{% endif %}
`;

if (read(COMP) === COMP_TEXT) console.log('   OK  pehle se hai.');
else { writes.push({ file: COMP, text: COMP_TEXT }); console.log('   ->  components/related-journeys.njk'); }

/* ======================================================= 4) journey ==== */

console.log('\n4) journey.njk mein jagah');

const J = path.join(ROOT, 'src', '_includes', 'layouts', 'journey.njk');
let j = read(J);
if (!j) { console.log('XX  journey.njk nahi mili.'); process.exit(1); }

if (j.includes('components/related-journeys.njk')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const m = j.match(/^([ \t]*)\{%\s*include "components\/itinerary\.njk"\s*%\}[ \t]*$/m);
  if (!m) {
    console.log('XX  itinerary ka include nahi mila.');
    console.log('    Pehle add-itinerary.mjs chala lein, phir yeh.');
    process.exit(1);
  }
  j = j.replace(m[0], m[0] + '\n\n' + m[1] + '{% include "components/related-journeys.njk" %}');
  writes.push({ file: J, text: j, bak: true });
  console.log('   ->  itinerary ke theek neechay');
}

/* ======================================================= 5) CSS ======== */

console.log('\n5) CSS');

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
const css = read(CSS);
const MARK = '/* === Related journeys (V11.23) === */';
if (!css) console.log('   !   input.css nahi mili.');
else if (css.includes(MARK)) console.log('   OK  pehle se hai.');
else {
  const BLOCK = `

${MARK}
.bk-related {
  display: grid;
  gap: .6rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin: 1.1rem 0 0;
  padding: 0;
  list-style: none;
}

.bk-related-item > a {
  display: block;
  height: 100%;
  padding: .85rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  text-decoration: none;
  transition: border-color .15s ease, background-color .15s ease;
}
.bk-related-item > a:hover,
.bk-related-item > a:focus-visible { border-color: #cbd5e1; background: #f8fafc; }

.bk-related-title {
  display: block;
  color: #0f172a;
  font-weight: 600;
  font-size: .95rem;
  line-height: 1.4;
}
.bk-related-meta {
  display: block;
  margin-top: .25rem;
  color: #64748b;
  font-size: .78rem;
}
/* === Related journeys END === */
`;
  writes.push({ file: CSS, text: css.trimEnd() + '\n' + BLOCK, bak: true });
  console.log('   ->  CSS juR gayi');
}

/* ======================================================= 6) sync tool == */

console.log('\n6) Fehrist taza rakhne wala tool');

const SYNC = path.join(ROOT, 'tools', 'sync-related-options.mjs');
const SYNC_TEXT = `#!/usr/bin/env node
/**
 * sync-related-options.mjs
 *
 * Naya trip banne par uska naam "Related journeys" ki fehrist mein le aata
 * hai. GitHub Action yeh khud chalata hai; haath se bhi chala sakte hain:
 *
 *   npm run build
 *   node tools/sync-related-options.mjs --write
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const COLLECTIONS = ${JSON.stringify(COLLECTIONS)};

const catRaw = fs.readFileSync(path.join(ROOT, 'src', '_data', 'structuredCatalog.json'), 'utf8');
const cat = JSON.parse(catRaw);

const JOURNEY_URL = /^\\/(tours|trekking|expeditions|jeep-safaris|hunting-services)\\/[^/]+\\/?$/;
const found = [];
const walk = (node, depth) => {
  if (!node || depth > 5) return;
  if (Array.isArray(node)) { for (const n of node) walk(n, depth + 1); return; }
  if (typeof node !== 'object') return;
  const t = node.title || node.label || node.name;
  const u = node.url || node.permalink || node.href || node.path;
  if (typeof t === 'string' && typeof u === 'string' && JOURNEY_URL.test(u)) {
    found.push(t.trim());
    return;
  }
  for (const v of Object.values(node)) walk(v, depth + 1);
};
walk(cat, 0);

const titles = [];
const seen = new Set();
for (const t of found) {
  if (!t) continue;
  const k = t.toLowerCase();
  if (seen.has(k)) continue;
  seen.add(k);
  titles.push(t);
}
titles.sort((a, b) => a.localeCompare(b));

if (titles.length < 5) {
  console.log('XX  sirf ' + titles.length + ' trips mile — fehrist theek nahi lagti, ruk raha hoon.');
  process.exit(1);
}

const YML = path.join(ROOT, '.pages.yml');
const raw = fs.readFileSync(YML, 'utf8');
const doc = yaml.load(raw);

let changed = false;
for (const name of COLLECTIONS) {
  const coll = (doc.content || []).find((c) => c.name === name);
  if (!coll) continue;
  const f = (coll.fields || []).find((x) => x.name === 'related');
  if (!f) continue;
  const current = Array.isArray(f.options) ? f.options : (f.options && f.options.values) || [];
  if (JSON.stringify(current) === JSON.stringify(titles)) continue;
  f.options = Array.isArray(f.options) ? titles.slice() : { ...f.options, values: titles.slice() };
  changed = true;
}

if (!changed) { console.log('Fehrist pehle se taza hai (' + titles.length + ' trips).'); process.exit(0); }

const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });

const before = new Set();
for (const c of yaml.load(raw).content || []) for (const f of c.fields || []) before.add(c.name + '.' + f.name);
const after = new Set();
for (const c of yaml.load(dumped).content || []) for (const f of c.fields || []) after.add(c.name + '.' + f.name);
const lost = [...before].filter((n) => !after.has(n));
if (lost.length) { console.log('XX  fields gum ho rahe hain: ' + lost.join(', ')); process.exit(1); }

if (!WRITE) { console.log(titles.length + ' trips. Lagane ke liye: node tools/sync-related-options.mjs --write'); process.exit(0); }

fs.writeFileSync(YML, dumped, 'utf8');
console.log('LIKHA: .pages.yml  (' + titles.length + ' trips fehrist mein)');
`;

if (read(SYNC) === SYNC_TEXT) console.log('   OK  pehle se hai.');
else { writes.push({ file: SYNC, text: SYNC_TEXT }); console.log('   ->  tools/sync-related-options.mjs'); }

/* ======================================================= 7) action ===== */

console.log('\n7) GitHub Action');

const WF_DIR = path.join(ROOT, '.github', 'workflows');
let wfFile = null;
if (fs.existsSync(WF_DIR)) {
  for (const n of fs.readdirSync(WF_DIR)) {
    const t = read(path.join(WF_DIR, n)) || '';
    if (t.includes('build-menu-sections')) { wfFile = path.join(WF_DIR, n); break; }
  }
}

if (!wfFile) {
  console.log('   !   workflow nahi mila. Baqi sab phir bhi chalega —');
  console.log('       naye trip ke baad ek baar yeh chala lijiye ga:');
  console.log('       node tools/sync-related-options.mjs --write');
} else {
  let wf = read(wfFile);
  const rel = path.relative(ROOT, wfFile).replace(/\\/g, '/');

  if (wf.includes('sync-related-options')) {
    console.log('   OK  ' + rel + ': pehle se laga hua hai.');
  } else {
    let touched = false;

    // content badalne par bhi chale, warna naye trip fehrist mein nahi aate
    if (/^\s*paths:/m.test(wf) && !wf.includes('src/content/**')) {
      wf = wf.replace(/^(\s*)paths:\s*\n/m, (m, ind) => m + ind + "      - 'src/content/**'\n");
      console.log('   ->  ' + rel + ': content badalne par bhi chalega');
      touched = true;
    }

    const m = wf.match(/^([ \t]*)- run: node tools\/build-menu-sections\.mjs.*$/m);
    if (m) {
      wf = wf.replace(m[0], m[0] + '\n' + m[1] + '- run: npm run build\n' + m[1] + '- run: node tools/sync-related-options.mjs --write');
      console.log('   ->  ' + rel + ': fehrist khud ba khud taza hogi');
      touched = true;
    } else {
      console.log('   !   ' + rel + ': step ki jagah nahi pehchani.');
      console.log('       Yeh file mujhe bhej dein to main laga doonga. Tab tak');
      console.log('       naye trip ke baad: node tools/sync-related-options.mjs --write');
    }

    if (touched) writes.push({ file: wfFile, text: wf, bak: true });
  }
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/add-related-journeys.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  if (w.bak && fs.existsSync(w.file) && !fs.existsSync(w.file + '.bak20')) fs.copyFileSync(w.file, w.file + '.bak20');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
console.log('\nPhir CMS mein koi trek khol kar "Related journeys" mein do teen');
console.log('naam chun kar Save karein — itinerary ke neechay link aa jayenge.');
