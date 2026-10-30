#!/usr/bin/env node
/**
 * slim-footer.mjs   (website ke folder mein)
 *
 * 1. Footer se "Journeys" wala column hata deta hai.
 * 2. Rabte ki do qatarein (Phone aur Alternate) ek kar deta hai.
 * 3. Links ke column mobile par do qataron mein aa jate hain.
 * 4. Likhai chhoti karta hai:
 *      column ke unwaan   20px bold   ->  11.5px baRe harf, halka
 *      links              16px        ->  14px
 *      matn               16px/28     ->  14px/22
 *      social ke gole     42px        ->  36px
 *      footer ki gunjaish ~20% kam
 *
 * Desktop par shakal wahi rehti hai, bas sureeli aur kam bhaari.
 *
 *   node tools/slim-footer.mjs            -> sirf dekhna
 *   node tools/slim-footer.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= 1) column ===== */

console.log('\n1) Footer se "Journeys" column');

const DATA = path.join(ROOT, 'src', '_data', 'siteFooter.json');
const dataRaw = read(DATA);
if (!dataRaw) { console.log('XX  siteFooter.json nahi mili.'); process.exit(1); }

let data;
try { data = JSON.parse(dataRaw); }
catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

const columns = Array.isArray(data.columns) ? data.columns : [];
console.log('   maujooda columns: ' + columns.map((c) => c.heading).join(' | '));

const keep = columns.filter((c) => !/journey/i.test(String(c.heading || '')));
if (keep.length === columns.length) {
  console.log('   OK  "Journeys" naam ka column nahi mila (shayad pehle hat chuka).');
} else {
  const gone = columns.filter((c) => /journey/i.test(String(c.heading || '')));
  for (const g of gone) {
    console.log('   ->  hat raha hai: "' + g.heading + '"  (' + (g.links || []).length + ' links)');
  }
  data.columns = keep;
  writes.push({ file: DATA, text: JSON.stringify(data, null, 2) + '\n', bak: true });
}

/* ======================================================= 2) footer.njk = */

console.log('\n2) footer.njk');

const NJK = path.join(ROOT, 'src', '_includes', 'components', 'footer.njk');
let njk = read(NJK);
if (!njk) { console.log('XX  footer.njk nahi mili.'); process.exit(1); }
const njkBefore = njk;

/* columns ko apni class */
const OLD_COL = `    {% for column in f.columns %}
    <section>`;
const NEW_COL = `    {% for column in f.columns %}
    <section class="bk-footer-links">`;
if (njk.includes('bk-footer-links')) console.log('   OK  links column ki class pehle se hai.');
else if (!njk.includes(OLD_COL)) console.log('   !   links column wala hissa nahi pehchana.');
else { njk = njk.replace(OLD_COL, NEW_COL); console.log('   ->  links column ko apni class mili (mobile par do qatarein).'); }

/* contact section ko apni class */
const OLD_CONTACT = `    {% if f.contact.enabled !== false %}
    <section>`;
const NEW_CONTACT = `    {% if f.contact.enabled !== false %}
    <section class="bk-footer-contact">`;
if (njk.includes('bk-footer-contact')) console.log('   OK  contact ki class pehle se hai.');
else if (!njk.includes(OLD_CONTACT)) console.log('   !   contact wala hissa nahi pehchana.');
else { njk = njk.replace(OLD_CONTACT, NEW_CONTACT); console.log('   ->  contact section ko apni class mili.'); }

/* phone + alternate ek qatar mein */
const OLD_PHONE = `{% if f.contact.show_phone !== false and site.phone %}<p><strong>Phone:</strong> <a href="tel:{{ site.phone }}">{{ site.phone }}</a></p>{% endif %}{% if f.contact.show_phone !== false and site.phone_secondary %}<p><strong>Alternate:</strong> <a href="tel:{{ site.phone_secondary }}">{{ site.phone_secondary }}</a></p>{% endif %}`;
const NEW_PHONE = `{% if f.contact.show_phone !== false and site.phone %}<p><strong>Phone:</strong> <a href="tel:{{ site.phone }}">{{ site.phone }}</a>{% if site.phone_secondary %} <span aria-hidden="true">·</span> <a href="tel:{{ site.phone_secondary }}">{{ site.phone_secondary }}</a>{% endif %}</p>{% endif %}`;
if (njk.includes(NEW_PHONE)) console.log('   OK  phone ki qatarein pehle se mili hui hain.');
else if (!njk.includes(OLD_PHONE)) console.log('   !   phone wali qatarein nahi pehchani.');
else { njk = njk.replace(OLD_PHONE, NEW_PHONE); console.log('   ->  Phone aur Alternate ek qatar mein.'); }

if (njk !== njkBefore) writes.push({ file: NJK, text: njk, bak: true });

/* ======================================================= 3) CSS ======== */

console.log('\n3) input.css — likhai aur faasle');

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
let css = read(CSS);
if (!css) { console.log('XX  input.css nahi mili.'); process.exit(1); }

const MARK = '/* === Footer slim (V11.16) === */';
if (css.includes(MARK)) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const BLOCK = `

${MARK}
/* Yeh @layer ke baahar hai, is liye oopar wali @apply walon par bhaari parta hai.
   Maqsad: footer ki likhai mobile ke naap ki ho jaye aur lambai kam ho. */

.bk-footer-top {
  padding-top: 2rem;
  padding-bottom: 2rem;
  gap: 1.75rem;
}

/* Newsletter ka unwaan - 3xl bohat bara tha */
.bk-footer-top h2 {
  margin-bottom: .5rem;
  font-size: 1.15rem;
  line-height: 1.3;
}

/* Karobar ka naam - brand hai, is liye darmiyana */
.bk-footer-contact h2 {
  margin-bottom: .6rem;
  font-size: 1rem;
  line-height: 1.35;
}

/* Links ke column ka unwaan - chhota, baRe harf */
.bk-footer-links h2 {
  margin-bottom: .7rem;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .66;
}

.bk-footer section > a {
  margin-bottom: .3rem;
  font-size: .875rem;
  line-height: 1.5;
}

.bk-footer p {
  margin-bottom: .4rem;
  font-size: .875rem;
  line-height: 1.55;
}

/* Mobile par links do qataron mein - ek lambi qatar ki jagah */
.bk-footer-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 1rem;
}

.bk-social-links {
  margin-top: 1rem;
  gap: .4rem;
}
.bk-social-links a {
  width: 36px !important;
  height: 36px !important;
}
.bk-social-links .bk-icon {
  width: 1.05rem;
  height: 1.05rem;
}

.bk-footer-rating-links { margin-top: .8rem; gap: .4rem; }
.bk-footer-rating-links a { padding: .5rem .6rem; }

.bk-footer-hub-row { margin-top: .8rem; gap: .8rem 1.1rem; }
.bk-footer-contact-hub { padding: .55rem .7rem; font-size: .85rem; }

.bk-footer-bottom {
  padding-top: .9rem;
  padding-bottom: .9rem;
  font-size: .8rem;
}

@media (min-width: 768px) {
  /* Desktop par links wapas ek qatar mein */
  .bk-footer-links { display: block; }
  .bk-footer-top { padding-top: 2.5rem; padding-bottom: 2.5rem; }
}
/* === Footer slim END === */
`;

  css = css.trimEnd() + '\n' + BLOCK;
  writes.push({ file: CSS, text: css, bak: true });
  console.log('   ->  naya hissa aakhir mein juR jayega.');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/slim-footer.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && !fs.existsSync(w.file + '.bak7')) fs.copyFileSync(w.file, w.file + '.bak7');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
