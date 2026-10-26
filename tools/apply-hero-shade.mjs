// Banner par likhai ka parda bohot halka karta hai, aur likhai ki hifazat
// parde ke bajaye harfon ke saye se karta hai.
//
// Banner ki photo pehla tassur hai - us par chadar nahi parni chahiye. Lekin
// likhai safed hai, aur roshan barf par safed likhai parhi nahi jati. Ab tak
// is ka hal yeh tha ke poori photo par gehra parda daal do:
//
//   bayein taraf   96%     beech mein  72%
//   dayein kinare  55%     neechay se  82%
//
// Behtar tareeqa yeh hai jo bari websites istemal karti hain: parda bohot
// halka rakho, aur har harf ke peechay ek narm saya daal do. Saya sirf harfon
// ke kinare par parta hai - photo par nahi. Is tarah pahar saaf nazar aata hai
// aur likhai phir bhi parhi jati hai, chahe us ke neechay barf ho.
//
//   bayein taraf   58%     beech mein  26%
//   dayein kinare   0%     neechay se  42%
//   + har harf ke peechay saya
//
//   node tools/apply-hero-shade.mjs           -> sirf dikhata hai
//   node tools/apply-hero-shade.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota. Agar is script ka pehla version
// chal chuka ho to us ka kaam khud saaf kar deti hai.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.10.0';
const MARK = '/* parda v3: bohot halka, likhai ki hifazat saye se */';
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

patch('src/assets/css/input.css', 'Banner ka parda bohot halka + harfon ka saya', (t) => {
  if (t.includes(MARK)) return null;

  const nl = nlOf(t);
  let out = t;

  // Is script ke purane version ka kaam saaf karo, warna do parde lag jayenge.
  out = out
    .replace(/\/\* parda(?: v2)?: [^\n]*\*\/\r?\n/g, '')
    .replace(/\/\* Safed likhai ke liye photo par parda[\s\S]*?\*\/\r?\n/, '')
    .replace(/\/\* Likhai bayein taraf hai, to parda[\s\S]*?\*\/\r?\n/, '')
    .replace(/@media \(max-width: 767px\) \{\r?\n\s*\/\* Chhoti screen par likhai[\s\S]*?\}\r?\n\}\r?\n/, '')
    .replace(/\/\* Parda bohot halka hai[\s\S]*?\*\/\r?\n\.bk-hero-copy \{ text-shadow[\s\S]*?\}\r?\n\.bk-hero-copy h1[^\n]*\r?\n/, '');

  // 1. Bayein se aane wali tehh (::after wala rule chhor kar)
  const mainRule = /\.bk-hero-shade(?!::)\s*\{[^}]*\}/;
  if (!mainRule.test(out)) throw new Error('input.css mein .bk-hero-shade ka rule nahi mila');
  out = out.replace(mainRule, [
    MARK,
    '/* Likhai bayein taraf hai, to thora sa parda wahin se aata hai aur beech',
    '   tak khatam ho jata hai. Dayein taraf bilkul kuch nahi - pehle wahan bhi',
    '   55% ki chadar pari rehti thi, halanke wahan koi likhai hai hi nahi.',
    '   pointer-events: none is liye ke parda button ke raaste mein na aaye. */',
    '.bk-hero-shade { position: absolute; inset: 0; pointer-events: none;',
    '  background: linear-gradient(90deg, rgba(2,6,23,.58) 0%, rgba(2,6,23,.26) 34%,',
    '    rgba(2,6,23,0) 62%); }',
  ].join(nl));

  // 2. Neechay wali tehh + chhoti screen ka hukum (yeh base ke BAAD aana zaroori
  //    hai - CSS mein jo baad mein likha ho wohi chalta hai)
  const afterRule = /\.bk-hero-shade::after\s*\{[^}]*\}/;
  if (!afterRule.test(out)) throw new Error('input.css mein .bk-hero-shade::after ka rule nahi mila');
  out = out.replace(afterRule, [
    '.bk-hero-shade::after { content: ""; position: absolute; inset: auto 0 0; height: 44%;',
    '  background: linear-gradient(0deg, rgba(2,6,23,.42), transparent); }',
    '',
    '/* Parda bohot halka hai, is liye likhai apni hifazat khud karti hai: har',
    '   harf ke peechay ek narm saya. Saya sirf harfon par parta hai, photo par',
    '   nahi - is liye pahar saaf rehta hai. Button safed hai, us par saye ki',
    '   zaroorat nahi. */',
    '.bk-hero-copy { text-shadow: 0 1px 2px rgba(2,6,23,.5), 0 4px 18px rgba(2,6,23,.6); }',
    '.bk-hero-copy h1, .bk-hero-copy h2 { text-shadow: 0 2px 4px rgba(2,6,23,.55), 0 8px 32px rgba(2,6,23,.65); }',
    '.bk-hero-actions a { text-shadow: none; }',
    '',
    '@media (max-width: 767px) {',
    '  /* Chhoti screen par likhai photo ke beech mein aati hai - to bojh neechay',
    '     se, bayein se bilkul kam. */',
    '  .bk-hero-shade { background: linear-gradient(90deg, rgba(2,6,23,.34) 0%,',
    '    rgba(2,6,23,.12) 45%, rgba(2,6,23,0) 100%); }',
    '  .bk-hero-shade::after { height: 60%; background: linear-gradient(0deg,',
    '    rgba(2,6,23,.70), rgba(2,6,23,.20) 48%, transparent); }',
    '}',
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
