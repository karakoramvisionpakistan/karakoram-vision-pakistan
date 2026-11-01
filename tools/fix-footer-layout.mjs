#!/usr/bin/env node
/**
 * fix-footer-layout.mjs   (website ke folder mein)
 *
 * Footer ki tarteeb. SAB KUCH YA KUCH BHI NAHI.
 *
 * Pehle footer mein chaar alag pattiyan thin: columns, credentials,
 * copyright, aur banane wale ka naam. Ab do: columns, aur neechay ki ek
 * patti jis mein copyright, qanooni links aur naam teenon hain.
 *
 *  1. Ooper ki khaali jagah kam — padding 2.5rem se 1.25rem.
 *
 *  2. Columns ooper se jamenge, beech se nahi. "items-center" ki wajah se
 *     chhote column ke ooper aur neechay jagah bach rahi thi.
 *
 *  3. Tripadvisor ka dabba "Subscribe by email" button ke naap ka — pehle
 *     poore column jitna chaura tha.
 *
 *  4. AFFILIATED WITH ab Tripadvisor ke neechay (column 1). Us ke hatne se
 *     "International contact hub" ke ooper wali khaali jagah khud khatam
 *     ho jati hai: woh jagah is liye thi ke button aur logos ek qatar mein
 *     thay aur qatar beech se jamti thi.
 *
 *  5. Licence / Member of / Registered with ab company ke khane mein,
 *     contact hub ke neechay — apna alag div nahi. Yeh wahi maloomat hai
 *     jo company ke naam, phone aur pate ke saath hai.
 *
 *  6. Banane wale ka naam neechay wali patti mein, copyright ke saath.
 *
 *   node tools/fix-footer-layout.mjs            -> sirf dikhana
 *   node tools/fix-footer-layout.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FOOTER = path.join(ROOT, 'src', '_includes', 'components', 'footer.njk');
const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');

const problems = [];
const result = {};
const say = (s = '') => console.log(s);

/* ---- footer.njk ke badlav, tarteeb se ---- */

const HUB_BUTTON = `      {% if f.contact.show_contact_hub !== false %}<button type="button" class="bk-footer-contact-hub" data-open-contact>{{ icon('chat') }} {{ f.contact.contact_hub_label or 'International contact hub' }}</button>{% endif %}`;

const TRIPADVISOR = `        {% if site.ratings.tripadvisor_url or site.social.tripadvisor %}<a href="{{ site.ratings.tripadvisor_url or site.social.tripadvisor }}" target="_blank" rel="noopener">{{ icon('tripadvisor') }}<span><strong>{{ site.ratings.tripadvisor_score or 'Tripadvisor' }}</strong><small>Traveller reviews</small></span></a>{% endif %}
      </div>
      {% endif %}`;

const LEGAL_NAV = `    <nav aria-label="Footer navigation">{% for link in f.bottom.links %}{% if link.enabled !== false %}<a href="{{ link.url }}"{% if link.target_blank %} target="_blank" rel="noopener"{% endif %}>{{ link.label }}</a>{% endif %}{% endfor %}</nav>`;

const EDITS = [
  {
    name: 'alag credentials ki patti hatayi',
    find: `  </div>
  {% include "components/credentials.njk" %}
  <div class="bk-footer-bottom">`,
    to: `  </div>
  <div class="bk-footer-bottom">`,
  },
  {
    name: 'AFFILIATED WITH hub-row se nikala, credentials wahan rakhi',
    find: `      <div class="bk-footer-hub-row">
${HUB_BUTTON}
        {% include "components/affiliated-with.njk" %}
      </div>`,
    to: `      <div class="bk-footer-hub-row">
${HUB_BUTTON}
      </div>
      {# Licence aur registration company ke apne khane mein. Yeh wahi
         maloomat hai jo naam, phone aur pate ke saath chalti hai. #}
      {% include "components/credentials.njk" %}`,
  },
  {
    name: 'AFFILIATED WITH ab Tripadvisor ke neechay (column 1)',
    find: TRIPADVISOR,
    to: TRIPADVISOR + `
      {# Column 1 chhota tha aur us ke neechay jagah bach rahi thi. #}
      {% include "components/affiliated-with.njk" %}`,
  },
  {
    name: 'banane wale ka naam neechay wali patti mein',
    find: LEGAL_NAV + `
  </div>
  {% include "components/developer-credit.njk" %}
</footer>`,
    to: LEGAL_NAV + `
    {% include "components/developer-credit.njk" %}
  </div>
</footer>`,
  },
];

/* ---- CSS ---- */

const MARK = '/* === Footer layout tightened (V11.25) === */';
const BLOCK = `

${MARK}
/* V11.24 ke baad. Maqsad: chaar pattiyon ki jagah do, aur khaali jagah kam.
   Wapas lena ho to poora block hata dein. */

/* ---- 1) Ooper ki khaali jagah --------------------------------------- */
.bk-footer-top {
  padding-top: 1.25rem;
  padding-bottom: 1.75rem;
  gap: 1.5rem 2.5rem;
}
@media (min-width: 768px) {
  .bk-footer-top { padding-top: 1.5rem; padding-bottom: 2rem; }
}

/* ---- 2) Columns ooper se jamein, beech se nahi -----------------------
   "items-center" ki wajah se chhote column ke ooper aur neechay barabar
   jagah bach rahi thi — screenshot mein wahi khaali dabbe thay. */
.bk-footer-top { align-items: flex-start !important; }
.bk-footer-top > section { align-self: flex-start; }

/* ---- 3) Tripadvisor: button ke naap ka ------------------------------- */
.bk-footer-rating-links {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  margin-top: .7rem;
}
.bk-footer-rating-links a {
  width: fit-content;
  gap: .5rem;
  padding: .45rem .75rem;
  border-radius: 8px;
}
.bk-footer-rating-links strong { font-size: .85rem; line-height: 1.2; }
.bk-footer-rating-links small { font-size: .65rem; line-height: 1.2; }
.bk-footer-rating-links .bk-icon { width: 1.1rem; height: 1.1rem; }

/* ---- 4) AFFILIATED WITH ab column 1 mein ----------------------------- */
.bk-footer-top > section > .bk-affiliations { margin-top: 1.1rem; }
.bk-affiliations-list img { width: 44px; height: 44px; }
.bk-affiliations-label { font-size: .66rem; }

/* Hub row mein ab sirf button hai, to qatar ki jagah seedha button */
.bk-footer-hub-row { margin-top: .7rem; gap: .6rem; }

/* ---- 5) Credentials ab company ke khane mein ------------------------
   Apna container, border aur patti nahi — woh usay alag dabba bana dete
   thay. Ab tang column mein neechay ki taraf lage hue chhote khaane. */
.bk-footer .bk-credentials {
  margin-top: 1.1rem;
  padding-top: .9rem;
  border-top: 1px solid var(--bk-border, rgba(255,255,255,.12));
}
.bk-footer .bk-credentials-inner {
  margin: 0;
  max-width: none;
  padding: 0;
}
.bk-footer .bk-credentials-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: .7rem 1.25rem;
}
.bk-footer .bk-credential dt { font-size: .6rem; }
.bk-footer .bk-credential dd { font-size: .82rem; }
.bk-footer .bk-credentials-note {
  margin-top: .6rem !important;
  font-size: .74rem !important;
  line-height: 1.5 !important;
}

/* ---- 6) Neechay ki patti: copyright + links + naam ------------------- */
.bk-footer-bottom {
  align-items: center;
  gap: .6rem 1.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.bk-footer .bk-devcredit {
  border-top: 0;
  padding: 0;
  text-align: center;
}
@media (min-width: 768px) {
  .bk-footer .bk-devcredit { text-align: right; }
}
.bk-footer .bk-devcredit-line { font-size: .78rem !important; }
.bk-footer .bk-devcredit-role {
  margin-top: 0 !important;
  font-size: .62rem !important;
}
/* Menu neechay ki patti mein hai, to list ooper khulti hai */
.bk-footer .bk-devcredit-links { bottom: calc(100% + .45rem); }
/* === V11.25 END === */
`;

/* ==================================================================== */

say('\nFOOTER KI TARTEEB');
say('='.repeat(80));
say('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

say('1. src/_includes/components/footer.njk');
say('-'.repeat(80));
if (!fs.existsSync(FOOTER)) { say('   XX  file nahi mili'); problems.push('footer.njk'); }
else {
  let t = fs.readFileSync(FOOTER, 'utf8');
  if (t.includes('V11.25-applied') || /affiliated-with\.njk[\s\S]*affiliated-with\.njk/.test(t)) {
    say('   !! shak hai ke pehle se laga hua hai — dekh lein');
  }
  let ok = true;
  for (const e of EDITS) {
    const n = t.split(e.find).length - 1;
    if (n !== 1) {
      say('   XX  "' + e.name + '": ' + n + ' jagah mila, ek chahiye');
      problems.push('footer: ' + e.name); ok = false; continue;
    }
    t = t.split(e.find).join(e.to);
    say('   OK  ' + e.name);
  }
  if (ok) {
    /* jaanch: tags barabar hain? */
    const pairs = [[/<div\b/g, /<\/div>/g, 'div'], [/<section\b/g, /<\/section>/g, 'section'], [/<footer\b/g, /<\/footer>/g, 'footer']];
    for (const [o, c, label] of pairs) {
      const a = (t.match(o) || []).length, b = (t.match(c) || []).length;
      if (a !== b) { say('   XX  ' + label + ' ke tags barabar nahi: ' + a + '/' + b); problems.push('footer: ' + label); ok = false; }
    }
    const ifs = (t.match(/\{%-?\s*if\b/g) || []).length, endifs = (t.match(/\{%-?\s*endif\s*-?%\}/g) || []).length;
    const fors = (t.match(/\{%-?\s*for\b/g) || []).length, endfors = (t.match(/\{%-?\s*endfor\s*-?%\}/g) || []).length;
    if (ifs !== endifs) { say('   XX  if/endif barabar nahi: ' + ifs + '/' + endifs); problems.push('footer: if'); ok = false; }
    if (fors !== endfors) { say('   XX  for/endfor barabar nahi: ' + fors + '/' + endfors); problems.push('footer: for'); ok = false; }
    if (ok) {
      say('   jaanch: div, section, footer, if, for — sab barabar');
      const inc = [...t.matchAll(/\{%\s*include\s+"([^"]+)"/g)].map((m) => m[1]);
      say('   include ki tarteeb: ' + inc.map((x) => x.replace('components/', '')).join(' -> '));
      result[FOOTER] = t;
    }
  }
}

say('');
say('2. src/assets/css/input.css');
say('-'.repeat(80));
if (!fs.existsSync(CSS)) { say('   XX  file nahi mili'); problems.push('input.css'); }
else {
  const t = fs.readFileSync(CSS, 'utf8');
  if (!t.includes('V11.24 END')) { say('   XX  V11.24 nahi mila — pehle woh script chalayein'); problems.push('V11.24 nahi'); }
  else if (t.includes(MARK)) say('   -- V11.25 pehle se laga hua hai, chhora');
  else {
    const nt = t.replace(/\s*$/, '\n') + BLOCK;
    const ob = (nt.match(/\{/g) || []).length, cb = (nt.match(/\}/g) || []).length;
    if (ob !== cb) { say('   XX  CSS ke braces barabar nahi: ' + ob + '/' + cb); problems.push('css braces'); }
    else { result[CSS] = nt; say('   OK  V11.25 block aakhir mein (' + BLOCK.length + ' harf), braces barabar'); }
  }
}

say('');
say('='.repeat(80));
if (problems.length) {
  say('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) say('          ' + m);
  say('');
  say('   Yeh list mujhe bhej dein, badal dunga.');
  process.exit(1);
}
say('   Sab theek. Files badlengi: ' + Object.keys(result).length);
say('');
say('   NAYI SHAKL:');
say('      column 1   Travel updates + Subscribe + Tripadvisor + AFFILIATED WITH');
say('      column 2   Plan & prepare + social logos');
say('      column 3   company + phone/email/pata + contact hub + licence/member/registered');
say('      neechay    copyright  |  Terms Privacy ...  |  Designed and developed by...');
say('');
say('   Agar aap ko naam column 3 mein hi chahiye (meri raay ke khilaf),');
say('   to bata dein — ek line ka farq hai.');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-footer-layout.mjs --write');
  process.exit(0);
}

for (const [f, text] of Object.entries(result)) {
  if (!fs.existsSync(f + '.baklayout')) fs.copyFileSync(f, f + '.baklayout');
  fs.writeFileSync(f, text, 'utf8');
  say('LIKHA: ' + path.relative(ROOT, f).split(path.sep).join('/'));
}
say('');
say(Object.keys(result).length + ' files. backup: *.baklayout');
say('');
say('Agla qadam:  npm run build   phir  npm run dev');
