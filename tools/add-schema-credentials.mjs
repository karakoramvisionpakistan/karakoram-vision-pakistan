#!/usr/bin/env node
/**
 * add-schema-credentials.mjs   (website ke folder mein)
 *
 * DO KAAM schema.njk mein:
 *
 * 1. FAQ bank structured data mein. Abhi bank ke sattarah sawal safhe par
 *    dikhte hain magar FAQPage mein nahi jate, yani Google aur AI ke liye
 *    ginti mein nahi aate. Wahi filter yahan bhi laga diya.
 *
 * 2. License aur membership Organization mein — identifier aur memberOf.
 *    Teenon muqabil ka schema kamzor hai (Trango ka breadcrumb toota hua),
 *    yeh wahi jagah hai jahan bartari poori hoti hai.
 *
 * foundingDate jaan boojh kar nahi chhua: company 2026 mein bani hai, aur
 * wahan 1991 likhna wohi tazaad banata jis se bacha gaya tha. Tajurbe ki
 * baat likhai mein hai, schema mein nahi.
 *
 *   node tools/add-schema-credentials.mjs            -> sirf dekhna
 *   node tools/add-schema-credentials.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, 'src', '_includes', 'components', 'schema.njk');

let text = (() => { try { return fs.readFileSync(FILE, 'utf8'); } catch { return null; } })();
if (!text) { console.log('XX  schema.njk nahi mili.'); process.exit(1); }

const steps = [];
const apply = (what, find, to) => {
  if (!text.includes(find)) { console.log('XX  nahi mila: ' + what); process.exit(1); }
  text = text.replace(find, to);
  steps.push(what);
};

/* ======================================================= 1) FAQ ======== */

console.log('\n1) FAQ bank structured data mein');

if (text.includes('withFaqBank')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  apply('allFaqs tayar karna',
    "{% set primaryImage = primaryImagePath | absoluteUrl(site.url) %}",
    "{% set primaryImage = primaryImagePath | absoluteUrl(site.url) %}\n" +
    "{# Trip ke apne sawal aur aam sawalon ka bank — wahi filter jo safhe par chalta hai,\n" +
    "   taake jo nazar aaye wahi Google ko bhi mile. #}\n" +
    "{% set allFaqs = faqs | withFaqBank(faqBank, service_type) %}"
  );

  apply('FAQPage ka switch',
    '{% if faqs and faqs.length %},',
    '{% if allFaqs and allFaqs.length %},'
  );

  apply('FAQPage ke sawal',
    '"mainEntity":[{% for faq in faqs %}',
    '"mainEntity":[{% for faq in allFaqs %}'
  );
}

/* ======================================================= 2) license ==== */

console.log('\n2) License aur membership Organization mein');

if (text.includes('"identifier"')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  apply('identifier aur memberOf',
    '      "knowsAbout":["Pakistan tours"',

    '      {% if site.credentials.licence_number %}"identifier":[{"@type":"PropertyValue",' +
    '"name":{{ (site.credentials.licence_label or \'Government tour operator licence\') | json | safe }},' +
    '"value":{{ site.credentials.licence_number | json | safe }}}],{% endif %}\n' +

    '      {% if site.credentials.memberships and site.credentials.memberships.length %}' +
    '"memberOf":[{% for m in site.credentials.memberships %}{"@type":"Organization",' +
    '"name":{{ m | json | safe }}}{% if not loop.last %},{% endif %}{% endfor %}],{% endif %}\n' +

    '      "knowsAbout":["Pakistan tours"'
  );
}

/* ======================================================= report ======== */

console.log('\n--------------------------------------------------');

if (!steps.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

console.log('Tabdeeliyan:');
for (const s of steps) console.log('   ->  ' + s);

if (!WRITE) {
  console.log('\nLagane ke liye:');
  console.log('   node tools/add-schema-credentials.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bak18')) fs.copyFileSync(FILE, FILE + '.bak18');
fs.writeFileSync(FILE, text, 'utf8');
console.log('\nLIKHA: src/_includes/components/schema.njk');
console.log('\nAgla qadam:  npm run build');
console.log('\nJaanch: kisi trek ka safha khol kar page source mein');
console.log('"FAQPage" dhoondhein — ikkees sawal hone chahiyein — aur');
console.log('"DTS-GB-TO/00071" dhoondhein, woh Organization ke andar hona chahiye.');
