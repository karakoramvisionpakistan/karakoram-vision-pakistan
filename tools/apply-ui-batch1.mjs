// Batch 1 - website ki chhoti tabdeeliyan:
//   1. Tour/trek pages par tags visitor ko nazar na aayein (data wahi rahega)
//   2. "Back to top" ka button har page par
//   3. Indicative price: "From On request" ki jagah sirf "On request"
//   4. Inquiry form: Gender aur Nationality add, Approximate budget band
//
//   node tools/apply-ui-batch1.mjs           -> sirf dikhata hai
//   node tools/apply-ui-batch1.mjs --write   -> files badal deta hai
// Dobara chalane par kuch duplicate nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
let changed = 0, skipped = 0, problems = 0;

function patch(file, label, fn) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; return; }
  const before = fs.readFileSync(file, 'utf8');
  let after;
  try { after = fn(before); } catch (e) { console.log(`!! ${label}\n   ${e.message}`); problems++; return; }
  if (after === null) { console.log(`   pehle se theek: ${label}`); skipped++; return; }
  if (after === before) { console.log(`   koi tabdeeli nahi: ${label}`); skipped++; return; }
  console.log(`${WRITE ? 'badla' : 'badlega'}: ${label}  (${file})`);
  changed++;
  if (WRITE) fs.writeFileSync(file, after, 'utf8');
}

const nlOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

// ---------- 1. tags chhupana ----------
patch('src/_includes/layouts/journey.njk', 'Tags ab visitor ko nazar nahi aayenge', (t) => {
  const rx = /\s*\{% if tags and tags\.length %\}<div class="bk-trip-tags">[\s\S]*?\{% endif %\}/;
  if (!rx.test(t)) return null;
  return t.replace(rx, '\n    {# Tags front matter mein mojood hain (search aur schema ke liye) lekin page par nahi dikhte #}');
});

// ---------- 2. back to top ----------
patch('src/_includes/layouts/base.njk', 'Back-to-top button har page par', (t) => {
  if (t.includes('components/back-to-top.njk')) return null;
  const marker = '{% include "components/contact-modal.njk" %}';
  if (!t.includes(marker)) throw new Error('base.njk mein contact-modal wali line nahi mili');
  const nl = nlOf(t);
  return t.replace(marker, `${marker}${nl}  {% include "components/back-to-top.njk" %}`);
});

// ---------- 3. "From On request" ----------
patch('src/_includes/components/answer-block.njk', 'Price: "From On request" ki jagah sirf "On request"', (t) => {
  if (t.includes('priceText')) return null;
  const old = '<dd class="mt-1 font-semibold text-slate-950">From {{ price_from }}</dd>';
  if (!t.includes(old)) throw new Error('answer-block.njk mein price wali line nahi mili');
  const neu = '<dd class="mt-1 font-semibold text-slate-950">'
    + '{% set priceText = price_from | string | trim %}'
    + "{% if priceText | lower == 'on request' or priceText | lower == 'on-request' %}{{ priceText }}"
    + '{% else %}From {{ priceText }}{% endif %}</dd>';
  return t.replace(old, neu);
});

// ---------- 4. form: gender + nationality, budget band ----------
patch('src/_data/formsConfig.json', 'Form settings: Gender/Nationality add, budget band', (t) => {
  const data = JSON.parse(t);
  const f = data.plan_trip?.fields;
  if (!f) throw new Error('formsConfig.json mein plan_trip.fields nahi mila');
  if (f.gender && f.nationality && f.budget?.enabled === false) return null;

  if (f.budget) f.budget.enabled = false;

  const rebuilt = {};
  for (const [key, value] of Object.entries(f)) {
    rebuilt[key] = value;
    if (key === 'travelers') {
      rebuilt.gender = f.gender || {
        enabled: true, required: false, label: 'Gender (optional)',
        description: 'Helps us plan room and tent sharing.'
      };
      rebuilt.nationality = f.nationality || {
        enabled: true, required: false, label: 'Nationality',
        placeholder: 'e.g. United Kingdom'
      };
    }
  }
  if (!rebuilt.gender) {
    rebuilt.gender = { enabled: true, required: false, label: 'Gender (optional)' };
    rebuilt.nationality = { enabled: true, required: false, label: 'Nationality' };
  }
  data.plan_trip.fields = rebuilt;
  data.plan_trip.gender_options = data.plan_trip.gender_options
    || ['Prefer not to say', 'Male', 'Female', 'Other'];

  return JSON.stringify(data, null, 2) + nlOf(t);
});

patch('src/plan-a-trip/index.njk', 'Form par Gender aur Nationality ke khane', (t) => {
  if (t.includes('name="nationality"')) return null;
  const anchor = t.match(/\{% if form\.fields\.travelers\.enabled[\s\S]*?\{% endif %\}/);
  if (!anchor) throw new Error('plan-a-trip mein travelers wali line nahi mili');
  const nl = nlOf(t);
  const genderLine = '{% if form.fields.gender.enabled !== false %}<label class="grid gap-2 font-bold">{{ form.fields.gender.label }}'
    + '<select class="rounded-md border border-slate-300 px-4 py-3 font-normal" name="gender"{% if form.fields.gender.required %} required{% endif %}>'
    + '{% for option in form.gender_options %}<option value="{{ option }}">{{ option }}</option>{% endfor %}</select></label>{% endif %}';
  const nationalityLine = '{% if form.fields.nationality.enabled !== false %}<label class="grid gap-2 font-bold">{{ form.fields.nationality.label }}'
    + '<input class="rounded-md border border-slate-300 px-4 py-3 font-normal" name="nationality"{% if form.fields.nationality.required %} required{% endif %}'
    + ' autocomplete="country-name"{% if form.fields.nationality.placeholder %} placeholder="{{ form.fields.nationality.placeholder }}"{% endif %}></label>{% endif %}';
  return t.replace(anchor[0], `${anchor[0]}${nl}    ${nationalityLine}${nl}    ${genderLine}`);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
