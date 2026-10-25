// Banner ki kaali patti jar se khatam karta hai.
//
// Ab tak photo apni asli shakal mein beech/dayein rakhi jati thi aur bachi hui
// jagah us ki dhundhli copy bharti thi. Kinara to ghul gaya tha, lekin woh
// jagah phir bhi gehri nazar aati thi - khaas tor par text ke gehre parde ke
// neechay. Jab tak wahan photo nahi hogi, kuch na kuch patti dikhti rahegi.
//
// Is liye ab photo poora banner bharti hai. Koi khali jagah nahi bachti, to
// koi patti nahi banti. Iss ki qeemat yeh hai ke photo ka oopar-neechay ka
// thora hissa kat jata hai - banner ab kaafi uncha hai, is liye yeh katai
// takreeban 15% rehti hai aur aankh ko mehsoos nahi hoti.
//
// Dhundhli copy ab band kar di gayi hai, us ki zaroorat nahi rahi.
//
//   node tools/apply-hero-fill.mjs           -> sirf dikhata hai
//   node tools/apply-hero-fill.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.6.0';
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

patch('src/assets/css/input.css', 'Banner: photo poora banner bhare, patti khatam', (t) => {
  if (t.includes('/* photo poora banner bharti hai */')) return null;

  const nl = nlOf(t);
  let out = t;

  // 1. Photo poora banner bhare.
  const photoRule = /\.bk-hero-slide\.is-smart \.bk-hero-photo \{[^}]*\}/;
  if (!photoRule.test(out)) throw new Error('input.css mein is-smart wali photo ka rule nahi mila');
  out = out.replace(photoRule, [
    '/* photo poora banner bharti hai */',
    '.bk-hero-slide.is-smart .bk-hero-photo { position: relative; z-index: 1;',
    '  width: 100%; height: 100%; display: block;',
    '  object-fit: cover; object-position: center; }',
  ].join(nl));

  // 1b. Purane comment ab ulta mazmoon bayan karte hain - hata dein.
  out = out
    .replace(/\/\* "Smart" slide:[\s\S]*?\*\/\r?\n/, '')
    .replace(/\/\* Photo sirf apni chaurai[\s\S]*?\*\/\r?\n/, '');

  // 2. Dhundhli copy band - ab khali jagah hai hi nahi.
  const bgRule = /\.bk-hero-bg \{[^}]*\}/;
  if (!bgRule.test(out)) throw new Error('input.css mein .bk-hero-bg ka rule nahi mila');
  out = out.replace(bgRule, [
    '/* Dhundhli copy ki ab zaroorat nahi - photo khud poori jagah bhar deti hai. */',
    '.bk-hero-bg { display: none; }',
  ].join(nl));

  return out;
});

patch('src/_includes/layouts/base.njk', `site.css ka version ${CSS_VER}`, (t) => {
  if (t.includes(`site.css?v=${CSS_VER}`)) return null;
  const out = t.replace(/\/assets\/css\/site\.css(\?v=[\d.]+)?/g, `/assets/css/site.css?v=${CSS_VER}`);
  if (out === t) throw new Error('base.njk mein site.css wali line nahi mili');
  return out;
});

patch('src/_headers', `_headers mein site.css ka version ${CSS_VER}`, (t) => {
  if (!/site\.css/.test(t)) return null;
  if (t.includes(`site.css?v=${CSS_VER}`)) return null;
  return t.replace(/\/assets\/css\/site\.css(\?v=[\d.]+)?/g, `/assets/css/site.css?v=${CSS_VER}`);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
