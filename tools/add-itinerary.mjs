#!/usr/bin/env node
/**
 * add-itinerary.mjs   (website ke folder mein)
 *
 * Din ba din itinerary — teen khaane: Day, Programme, Over night.
 * Programme ke andar har din ka apna bayaan, aur uske sath bulandi,
 * faasla aur chalne ke ghante.
 *
 * Yahi woh cheez hai jis par Apricot aur Trango aage hain. Client ko
 * likhai nahi, khaane bharne honge.
 *
 * Bulandi dono paimano mein: client sirf metre likhta hai, feet khud bante
 * hain. Aur har raat ke camp ke GPS نقطے — Apricot bulandi deta hai, نقطے
 * nahi; yeh naqshe par bhi aate hain aur structured data mein bhi.
 *
 * Kya lagta hai:
 *   .pages.yml         -> har journey form mein "Itinerary" ka hissa
 *   eleventy.config.js -> bulandi aur GPS ke filters
 *   itinerary.njk      -> safhe par teen khaanon wali shakal
 *   journey.njk     -> trip details ke baad, aur nav mein link
 *   schema.njk      -> TouristTrip ke andar itinerary (Google ke liye)
 *   input.css       -> desktop par table, mobile par cards
 *
 *   node tools/add-itinerary.mjs            -> sirf dekhna
 *   node tools/add-itinerary.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

const COLLECTIONS = ['tours', 'trekking', 'expeditions', 'jeep_safaris', 'hunting_services'];

/* ======================================================= 1) .pages.yml = */

console.log('\n1) .pages.yml — Itinerary ka hissa');

const YML = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML);
if (!ymlRaw) { console.log('XX  .pages.yml nahi mili.'); process.exit(1); }

let doc;
try { doc = yaml.load(ymlRaw); }
catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

/* Mojooda form mein select khaana kis shakal mein likha hai — options: [..]
   ya options: { values: [..] } — wahi shakal yahan bhi istemaal karte hain,
   taake naya khaana dashboard par bilkul usi tarah chale jaise baqi chalte
   hain. Andaze se likhne par dropdown khaali reh sakti thi. */
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
const sel = (vals) => (SHAPE === 'values' ? { values: vals } : vals);

const FIELD = {
  name: 'itinerary',
  label: 'Itinerary, day by day',
  type: 'object',
  list: true,
  description: 'One row per day. The day number, what happens, and where the group sleeps. Altitude, distance and walking hours are what set a good itinerary apart — fill them where you know them.',
  fields: [
    { name: 'day', label: 'Day', type: 'string', description: 'Such as 01, or 04-05 for two days together.' },
    { name: 'title', label: 'Programme', type: 'string', description: 'One line: Askole to Jhola, or Rest and acclimatisation at Urdukas.' },
    { name: 'description', label: 'What happens that day', type: 'text', description: 'Two or three sentences. The ground underfoot, what you see, how the day feels. This is what readers and search engines are looking for.' },
    { name: 'altitude', label: 'Altitude', type: 'string', description: 'Write it in metres, such as 3,420 m. The feet figure is worked out and shown on its own, so you never have to convert anything.' },
    { name: 'coords', label: 'GPS coordinates', type: 'string', description: 'Optional, and worth filling where your guides have them: the latitude and longitude of that night\'s camp, such as 35.8825, 76.5133. It puts the camp on the map for the reader and into the structured data for Google. No other operator in Pakistan publishes these.' },
    { name: 'distance', label: 'Distance', type: 'string', description: 'Such as 12 km' },
    { name: 'hours', label: 'Walking hours', type: 'string', description: 'Such as 5-6 hrs' },
    {
      name: 'overnight', label: 'Over night', type: 'select',
      options: sel(['Hotel', 'Guesthouse', 'Camping', 'Base camp', 'Tented camp', 'Flight', 'Not applicable']),
    },
  ],
};

let ymlChanged = false;
let added = 0;

for (const name of COLLECTIONS) {
  const coll = (doc.content || []).find((c) => c.name === name);
  if (!coll) { console.log('   !   collection nahi mili: ' + name); continue; }
  if ((coll.fields || []).some((f) => f.name === 'itinerary')) {
    console.log('   OK  ' + name + ': pehle se hai');
    continue;
  }
  // "Trip details" wale body field se pehle — tarteeb mein theek jagah
  const at = (coll.fields || []).findIndex((f) => f.name === '_h_highlights_inclusions_packin');
  const pos = at >= 0 ? at : (coll.fields || []).length;
  coll.fields.splice(pos, 0, { name: '_h_itinerary', label: 'Itinerary', type: 'heading' }, FIELD);
  console.log('   ->  ' + name + ': Itinerary ka hissa juR gaya');
  ymlChanged = true;
  added++;
}

if (ymlChanged) {
  const before = new Set();
  const orig = yaml.load(ymlRaw);
  for (const c of orig.content || []) for (const f of c.fields || []) before.add(c.name + '.' + f.name);

  const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
  let check;
  try { check = yaml.load(dumped); }
  catch (e) { console.log('XX  naya YAML parse nahi hua: ' + e.message); process.exit(1); }

  const after = new Set();
  for (const c of check.content || []) for (const f of c.fields || []) after.add(c.name + '.' + f.name);
  const lost = [...before].filter((n) => !after.has(n));
  if (lost.length) { console.log('XX  yeh fields gayab ho rahe hain: ' + lost.join(', ')); process.exit(1); }

  console.log('   jaanch: ' + before.size + ' -> ' + after.size + ' fields, koi gum nahi.');
  writes.push({ file: YML, text: dumped, bak: true });
}

/* ======================================================= 2) filters === */

console.log('\n2) eleventy.config.js — bulandi aur GPS ke filters');

const CFG = path.join(ROOT, 'eleventy.config.js');
let cfg = read(CFG);
if (!cfg) { console.log('XX  eleventy.config.js nahi mili.'); process.exit(1); }

const FILTERS = `  // Bulandi: client sirf metre likhta hai, feet yahan bante hain. Europe
  // aur America ke trekkers feet mein sochte hain, aur unhein tarjuma khud
  // karne dena ek chhoti si rukawat hai jo muqabil chhoR dete hain.
  eleventyConfig.addFilter("altitudeBoth", (v) => {
    const s = String(v || "").trim();
    if (!s) return "";
    if (/ft|feet|'/i.test(s)) return s;              // pehle se feet mein hai
    // Ek se zyada adad ka matlab range hai ("4,200-4,600 m"). Us par ek hi
    // feet ka hindsa lagana ghalat tasveer deta, is liye chhoR dete hain.
    const nums = s.replace(/,/g, "").match(/\\d{2,5}/g);
    if (!nums || nums.length !== 1) return s;
    const metres = Number(nums[0]);
    if (!metres || metres < 100 || metres > 9000) return s;
    const feet = Math.round((metres * 3.28084) / 10) * 10;
    return s + " / " + feet.toLocaleString("en-US") + " ft";
  });

  // Wahi adad Google ke liye — likhai nahi, sirf number.
  eleventyConfig.addFilter("altitudeMetres", (v) => {
    const nums = String(v || "").replace(/,/g, "").match(/\\d{2,5}/g);
    if (!nums || nums.length !== 1) return null;    // range par koi ek adad nahi
    const metres = Number(nums[0]);
    return metres >= 100 && metres <= 9000 ? metres : null;
  });

  // "35.8825, 76.5133" -> alag alag. Ghalat likha ho to kuch nahi lautata,
  // taake safhe par toota hua naqsha ka link kabhi na aaye.
  const geoParts = (v) => {
    const m = String(v || "").match(/(-?\\d{1,3}(?:\\.\\d+)?)\\s*[,; ]\\s*(-?\\d{1,3}(?:\\.\\d+)?)/);
    if (!m) return null;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
  };
  eleventyConfig.addFilter("geoLat", (v) => { const g = geoParts(v); return g ? g.lat : null; });
  eleventyConfig.addFilter("geoLon", (v) => { const g = geoParts(v); return g ? g.lon : null; });
`;

if (cfg.includes('altitudeBoth')) {
  console.log('   OK  pehle se lage hue hain.');
} else {
  const cfgAnchor = '  eleventyConfig.addFilter("catalogFilter"';
  if (!cfg.includes(cfgAnchor)) { console.log('XX  jagah nahi mili.'); process.exit(1); }
  cfg = cfg.replace(cfgAnchor, FILTERS + cfgAnchor);
  writes.push({ file: CFG, text: cfg, bak: true });
  console.log('   ->  altitudeBoth, altitudeMetres, geoLat, geoLon');
}

/* ======================================================= 3) component == */

console.log('\n3) Safhe par dikhane wala hissa');

const COMP = path.join(ROOT, 'src', '_includes', 'components', 'itinerary.njk');
const COMP_TEXT = `{# Din ba din itinerary.

   Teen khaane: Day, Programme, Over night. Desktop par qatarein, mobile
   par alag alag card — table mobile par parhi nahi jati.

   Bulandi, faasla aur chalne ke ghante Programme ke andar chhote adad ke
   tor par aate hain. Yehi woh tafseel hai jo achhe itinerary ko aam se
   alag karti hai, aur jisay log safha chhoR kar kisi aur ke paas
   dhoondhne jate hain. #}
{% if itinerary and itinerary.length %}
<section id="itinerary" class="bk-trip-content-section">
  <p class="eyebrow">Day by day</p>
  <h2>Itinerary</h2>

  <div class="bk-itin">
    <div class="bk-itin-head" aria-hidden="true">
      <span>Day</span><span>Programme</span><span>Over night</span>
    </div>

    {% for d in itinerary %}
    <article class="bk-itin-row">
      <div class="bk-itin-day"><span>{{ d.day or loop.index }}</span></div>

      <div class="bk-itin-main">
        {% if d.title %}<h3>{{ d.title }}</h3>{% endif %}
        {% if d.altitude or d.distance or d.hours or d.coords %}
        <p class="bk-itin-meta">
          {% if d.altitude %}<span title="Altitude">{{ d.altitude | altitudeBoth }}</span>{% endif %}
          {% if d.distance %}<span title="Distance">{{ d.distance }}</span>{% endif %}
          {% if d.hours %}<span title="Walking hours">{{ d.hours }}</span>{% endif %}
          {% if d.coords | geoLat %}
          <a class="bk-itin-map"
             href="https://www.openstreetmap.org/?mlat={{ d.coords | geoLat }}&amp;mlon={{ d.coords | geoLon }}#map=12/{{ d.coords | geoLat }}/{{ d.coords | geoLon }}"
             target="_blank" rel="noopener"
             title="{{ d.coords }}">On the map</a>
          {% endif %}
        </p>
        {% endif %}
        {% if d.description %}<p class="bk-itin-text">{{ d.description }}</p>{% endif %}
      </div>

      <div class="bk-itin-night">
        {% if d.overnight and d.overnight != 'Not applicable' %}
          <span class="bk-itin-night-label">Over night</span>
          <span class="bk-itin-night-value">{{ d.overnight }}</span>
        {% endif %}
      </div>
    </article>
    {% endfor %}
  </div>
</section>
{% endif %}
`;

if (read(COMP) === COMP_TEXT) console.log('   OK  pehle se hai.');
else { writes.push({ file: COMP, text: COMP_TEXT }); console.log('   ->  components/itinerary.njk'); }

/* ======================================================= 4) journey ==== */

console.log('\n4) journey.njk mein jagah');

const J = path.join(ROOT, 'src', '_includes', 'layouts', 'journey.njk');
let j = read(J);
if (!j) { console.log('XX  journey.njk nahi mili.'); process.exit(1); }

if (j.includes('components/itinerary.njk')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  /* Nav ki qatar aur asli section, dono mein wahi shart likhi hai. Nav ki
     line mein <a> bhi hota hai, section ki line mein nahi — isi se dono
     alag pehchane jate hain. */
  const lines = j.split('\n');
  let navAt = -1, secAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!/\{%\s*if included and included\.length/.test(lines[i])) continue;
    if (lines[i].includes('<a ')) { if (navAt < 0) navAt = i; }
    else if (secAt < 0) secAt = i;
  }

  if (secAt < 0) {
    console.log('XX  journey.njk mein "included" wala section nahi pehchana.');
    console.log('    Yeh file mujhe bhej dein, main theek jagah laga doonga.');
    process.exit(1);
  }

  const ind = (lines[secAt].match(/^[ \t]*/) || [''])[0];
  lines.splice(secAt, 0, ind + '{% include "components/itinerary.njk" %}', '');
  if (navAt > secAt) navAt += 2;
  console.log('   ->  trip details ke baad aa jayega');

  if (navAt >= 0) {
    const nind = (lines[navAt].match(/^[ \t]*/) || [''])[0];
    lines.splice(navAt, 0,
      nind + '{% if itinerary and itinerary.length %}<a href="#itinerary">Itinerary</a>{% endif %}');
    console.log('   ->  oopar wali qatar mein bhi link');
  } else {
    console.log('   !   nav mein link nahi laga saka (baqi theek hai)');
  }

  writes.push({ file: J, text: lines.join('\n'), bak: true });
}

/* ======================================================= 5) schema ===== */

console.log('\n5) Structured data');

const S = path.join(ROOT, 'src', '_includes', 'components', 'schema.njk');
let s = read(S);
if (!s) console.log('   !   schema.njk nahi mili.');
else if (s.includes('"itinerary"')) console.log('   OK  pehle se hai.');
else {
  const anchor = '      {% if duration %}"duration":{{ duration | json | safe }},{% endif %}';
  if (!s.includes(anchor)) console.log('   !   TouristTrip mein jagah nahi mili.');
  else {
    const ADD = anchor + '\n' +
      '      {% if itinerary and itinerary.length %}"itinerary":{"@type":"ItemList","numberOfItems":{{ itinerary.length }},"itemListElement":[' +
      '{% for d in itinerary %}{"@type":"ListItem","position":{{ loop.index }},"item":{"@type":"Place","name":' +
      '{{ (d.title or (\'Day \' + (d.day or loop.index))) | json | safe }}' +
      '{% if d.description %},"description":{{ d.description | json | safe }}{% endif %}' +
      '{% if d.altitude | altitudeMetres %},"elevation":{{ d.altitude | altitudeMetres }}{% endif %}' +
      '{% if d.coords | geoLat %},"geo":{"@type":"GeoCoordinates",' +
      '"latitude":{{ d.coords | geoLat }},"longitude":{{ d.coords | geoLon }}}{% endif %}}}' +
      '{% if not loop.last %},{% endif %}{% endfor %}]},{% endif %}';
    s = s.replace(anchor, ADD);
    writes.push({ file: S, text: s, bak: true });
    console.log('   ->  TouristTrip ke andar itinerary');
  }
}

/* ======================================================= 6) CSS ======== */

console.log('\n6) CSS');

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
const css = read(CSS);
const MARK = '/* === Itinerary (V11.22) === */';
if (!css) console.log('   !   input.css nahi mili.');
else if (css.includes(MARK)) console.log('   OK  pehle se hai.');
else {
  const BLOCK = `

${MARK}
/* Desktop par teen khaane, mobile par alag alag card.
   Table mobile par parhi nahi jati, is liye grid. */

.bk-itin { margin-top: 1.25rem; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }

.bk-itin-head {
  display: none;
  background: #0f172a;
  color: #ffffff;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.bk-itin-row {
  display: grid;
  gap: .5rem 1rem;
  padding: 1rem 1.1rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}
.bk-itin-row:first-of-type { border-top: 0; }
.bk-itin-row:nth-of-type(even) { background: #f8fafc; }

.bk-itin-day > span {
  display: inline-grid;
  place-items: center;
  min-width: 2.2rem;
  padding: .25rem .5rem;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: .78rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.bk-itin-main h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }

.bk-itin-meta { display: flex; flex-wrap: wrap; gap: .35rem; margin: .4rem 0 0; }
.bk-itin-meta span {
  padding: .15rem .5rem;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-size: .72rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.bk-itin-map {
  padding: .15rem .5rem;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #1d4ed8;
  font-size: .72rem;
  font-weight: 600;
  text-decoration: none;
}
.bk-itin-map:hover,
.bk-itin-map:focus-visible { background: #eff6ff; border-color: #93c5fd; }

.bk-itin-text { margin: .55rem 0 0; color: #475569; line-height: 1.65; font-size: .92rem; }

.bk-itin-night-label {
  display: inline-block;
  margin-right: .35rem;
  color: #64748b;
  font-size: .7rem;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.bk-itin-night-value { color: #0f172a; font-weight: 600; font-size: .85rem; }

@media (min-width: 820px) {
  .bk-itin-head { display: grid; }
  .bk-itin-head,
  .bk-itin-row {
    grid-template-columns: 5rem minmax(0, 1fr) 9rem;
    align-items: start;
  }
  .bk-itin-head span { padding: .6rem 1.1rem; }
  .bk-itin-night-label { display: none; }
  .bk-itin-night { padding-top: .15rem; }
}
/* === Itinerary END === */
`;
  writes.push({ file: CSS, text: css.trimEnd() + '\n' + BLOCK, bak: true });
  console.log('   ->  CSS juR gayi');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/add-itinerary.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  if (w.bak && fs.existsSync(w.file) && !fs.existsSync(w.file + '.bak19')) fs.copyFileSync(w.file, w.file + '.bak19');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
console.log('\nPhir CMS mein koi trek khol kar "Itinerary, day by day" mein');
console.log('do teen din bhar kar Save karein, aur safha dekh lein.');
