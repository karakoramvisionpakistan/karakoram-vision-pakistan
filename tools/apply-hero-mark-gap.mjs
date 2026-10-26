// Do chhoti cheezein theek karta hai.
//
// 1. CHHOTI LIKHAI AUR UNWAAN KE DARMIYAN FAASLA
//    "BROAD VIEW FROM CONCORDIA" aur "Broad Peak 8047M" ke beech bohot jagah
//    thi. Woh chhoti likhai ke apne margin se aa rahi thi (1rem). Ab .3rem -
//    chhoti likhai unwaan ke bilkul oopar baith jati hai.
//
// 2. BAND KE OOPAR NEECHAY BARABAR JAGAH
//    Band oopar se theek tha lekin neechay se jaldi khatam ho jata tha, is
//    liye neechay ki jagah kam lagti thi. Ab band thora uncha hai aur zara
//    oopar se shuru hota hai, to dono taraf jagah barabar rehti hai.
//
// PEHLE apply-hero-mark-height.mjs chal chuki ho.
//
//   node tools/apply-hero-mark-gap.mjs           -> sirf dikhata hai
//   node tools/apply-hero-mark-gap.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.15.0';
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

function once(text, old, neu, what) {
  const parts = text.split(old);
  if (parts.length === 1) throw new Error(`${what}: yeh hissa nahi mila`);
  if (parts.length > 2) throw new Error(`${what}: yeh hissa ek se zyada dafa hai`);
  return parts.join(neu);
}

patch('src/assets/css/input.css', 'Band beech mein, chhoti likhai qareeb', (t) => {
  if (t.includes('background-size: 100% .94em')) return null;

  let out = t;

  // 1. Band oopar neechay barabar
  out = once(out,
    '  background-size: 100% .84em; background-position: 0 .26em; background-repeat: no-repeat;',
    '  background-size: 100% .94em; background-position: 0 .16em; background-repeat: no-repeat;',
    'band ki bulandi aur jagah');

  // 2. Chhoti likhai unwaan ke qareeb
  out = once(out,
    '.bk-hero-eyebrow { margin: 0 0 1rem;',
    '.bk-hero-eyebrow { margin: 0 0 .3rem;',
    'chhoti likhai ka margin');

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
if (WRITE && changed) console.log('\nFaasla aur kam karna ho to input.css mein ".bk-hero-eyebrow { margin: 0 0 .3rem"\nmein .3rem ko .15rem kar dein.');
