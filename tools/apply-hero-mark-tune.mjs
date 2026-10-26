// Chaukor ki do kharabiyan theek karta hai.
//
// 1. CHAUKOR LIKHAI SE BARE LAG RAHE THAY
//    Un mein gaddi (padding) zyada thi, aur lines itni paas paas thein ke do
//    chaukor ek doosre par charh kar ek bara block bana dete thay - isi liye
//    "Broad Peak" aur "8047M" ke darmiyan koi faasla nazar nahi aata tha.
//    Ab gaddi kam, aur lines ke darmiyan itni jagah ke har chaukor alag rahe.
//
// 2. UNWAAN DO LINE MEIN TOOT RAHA THA
//    Unwaan par ek purani hadd lagi thi: max-width 14ch, yani zyada se zyada
//    14 harf chaurai. "Broad Peak 8047M" sattrah harf ka hai, is liye toot
//    jata tha. Hadd 20ch kar di - ab aise unwaan ek line mein aa jate hain,
//    aur lamba unwaan phir bhi apne aap toot jata hai.
//
//   node tools/apply-hero-mark-tune.mjs           -> sirf dikhata hai
//   node tools/apply-hero-mark-tune.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.13.0';
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

patch('src/assets/css/input.css', 'Chaukor chhote, aur unwaan ek line mein', (t) => {
  if (t.includes('max-width: 20ch')) return null;
  if (!t.includes('.bk-hero-mark')) {
    throw new Error('bk-hero-mark nahi mila - pehle apply-hero-shade.mjs --write chalayein');
  }

  let out = t;

  // Gaddi kam, kona chhota
  out = once(out,
    '  padding: .06em .22em; border-radius: .12em; }',
    '  padding: .02em .14em; border-radius: .08em; }',
    'chaukor ki gaddi');

  out = once(out,
    '.bk-hero-eyebrow .bk-hero-mark { padding: .25em .45em; }',
    '.bk-hero-eyebrow .bk-hero-mark { padding: .16em .32em; }',
    'eyebrow ki gaddi');

  out = once(out,
    '.bk-hero-summary .bk-hero-mark, .bk-hero-feature-title .bk-hero-mark { padding: .12em .3em; }',
    '.bk-hero-summary .bk-hero-mark, .bk-hero-feature-title .bk-hero-mark { padding: .06em .2em; }',
    'summary ki gaddi');

  // Lines ke darmiyan jagah + unwaan ki chaurai ki hadd
  out = once(out,
    '/* Lines ke darmiyan thori jagah, warna chaukor ek doosre par charh jate hain. */\n.bk-hero-copy h1, .bk-hero-copy h2 { line-height: 1.08; }'.replace(/\n/g, t.includes('\r\n') ? '\r\n' : '\n'),
    [
      '/* Lines ke darmiyan itni jagah ke har chaukor alag rahe - 1.08 par woh ek',
      '   doosre par charh kar ek bara block ban jate thay.',
      '   max-width purani 14ch thi, jis se "Broad Peak 8047M" jaise unwaan do line',
      '   mein toot jate thay. 20ch par woh ek line mein aa jate hain, aur is se',
      '   lamba unwaan phir bhi apne aap toot jata hai. */',
      '.bk-hero-copy h1, .bk-hero-copy h2 { line-height: 1.3; max-width: 20ch; }',
    ].join(t.includes('\r\n') ? '\r\n' : '\n'),
    'lines ki jagah aur chaurai');

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
