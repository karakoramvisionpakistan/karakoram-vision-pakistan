// Banner ka parda poori photo se utha kar har line ke peechay chhote chaukor
// mein badal deta hai.
//
// Ab tak photo par ek chadar pari rehti thi - poori chaurai par, kinare se
// kinare tak (bayein 96%, dayein 55%, neechay 82%). Photo hi pehla tassur hai,
// aur us par chadar nahi parni chahiye.
//
// Parda bilkul hatana bhi theek nahi: aap ki photos pahar aur BARF ki hain,
// aur safed barf par safed likhai parhi hi nahi jati.
//
// Hal: parda sirf wahin jahan harf hain. Har line ka apna chhota chaukor, aur
// jahan likhai khatam hoti hai wahan chaukor bhi khatam. Us ke neechay, oopar
// aur dayein - photo bilkul saaf.
//
// YEH CSS AKELE NAHI HO SAKTA: har line ko apna chaukor dene ke liye likhai ko
// ek <span> mein lapetna parta hai. Is liye landing-hero.njk ka naya version
// bhi copy karna zaroori hai, warna chaukor nazar nahi aayenge.
//
// PEHLE: src/_includes/components/landing-hero.njk copy karein.
//
//   node tools/apply-hero-shade.mjs           -> sirf dikhata hai
//   node tools/apply-hero-shade.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota. Is script ke purane version chal
// chuke hon to un ka kaam khud saaf kar deti hai.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.12.0';
const MARK = '/* parda v5: har line ka apna chaukor */';
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

// ---------------------------------------------- 0. template naya hai ya nahi
const njk = 'src/_includes/components/landing-hero.njk';
if (!fs.existsSync(njk)) {
  console.log(`MISSING FILE  ${njk}`);
  process.exit(1);
}
if (!fs.readFileSync(njk, 'utf8').includes('bk-hero-mark')) {
  console.log('!! landing-hero.njk ka naya version copy nahi hua.');
  console.log('   Us ke baghair chaukor nazar nahi aayenge - pehle woh file copy karein.');
  console.log('\n0 tabdeeliyan, 0 pehle se theek, 1 problem.');
  process.exit(1);
}
console.log('   theek: landing-hero.njk ka naya version mojood hai');

patch('src/assets/css/input.css', 'Parda hataya, har line ko apna chaukor', (t) => {
  if (t.includes(MARK)) return null;

  const nl = nlOf(t);
  let out = t;

  // Purane version ka kaam saaf karo, warna do parde lag jayenge.
  out = out
    .replace(/\/\* parda(?: v\d)?: [^\n]*\*\/\r?\n/g, '')
    .replace(/\/\* Safed likhai ke liye photo par parda[\s\S]*?\*\/\r?\n/, '')
    .replace(/\/\* Likhai bayein taraf hai[\s\S]*?\*\/\r?\n/, '')
    .replace(/\/\* Parda (?:bohot halka hai|ab poori chaurai)[\s\S]*?\*\/\r?\n/, '')
    .replace(/\/\* Daira halka hai[\s\S]*?\*\/\r?\n/, '')
    .replace(/^\.bk-hero-copy \{ text-shadow:[^\n]*\r?\n/m, '')
    .replace(/^\.bk-hero-copy h1, \.bk-hero-copy h2 \{ text-shadow:[^\n]*\r?\n/m, '')
    .replace(/^\.bk-hero-actions a \{ text-shadow: none; \}\r?\n/m, '')
    .replace(/@media \(max-width: 767px\) \{\r?\n\s*\/\* Chhoti screen par likhai[\s\S]*?\}\r?\n\}\r?\n/, '');

  // 1. Poora parda khatam
  const mainRule = /\.bk-hero-shade(?!::)\s*\{[^}]*\}/;
  if (!mainRule.test(out)) throw new Error('input.css mein .bk-hero-shade ka rule nahi mila');
  out = out.replace(mainRule, [
    MARK,
    '/* Photo par ab koi chadar nahi. Likhai ki hifazat neechay bk-hero-mark',
    '   karta hai - har line ka apna chhota chaukor. */',
    '.bk-hero-shade { position: absolute; inset: 0; pointer-events: none; background: none; }',
  ].join(nl));

  // 2. Neechay ki tehh bhi takreeban khatam - sirf itni ke slider ke dots aur
  //    kinare ka button photo mein gum na ho jayein.
  const afterRule = /\.bk-hero-shade::after\s*\{[^}]*\}/;
  if (!afterRule.test(out)) throw new Error('input.css mein .bk-hero-shade::after ka rule nahi mila');
  out = out.replace(afterRule, [
    '.bk-hero-shade::after { content: ""; position: absolute; inset: auto 0 0; height: 22%;',
    '  background: linear-gradient(0deg, rgba(2,6,23,.20), transparent); }',
  ].join(nl));

  // 3. Chaukor khud. Yeh file ke AAKHIR mein jaate hain, kyunke in mein h1 ki
  //    line-height badalni hai aur CSS mein jo baad mein likha ho wohi chalta hai.
  out = `${out.replace(/\s+$/, '')}${nl}${nl}${[
    MARK,
    '/* Har line ke peechay apna chhota chaukor. box-decoration-break: clone woh',
    '   cheez hai jo har line ko alag chaukor deti hai - us ke baghair poori',
    '   likhai ka ek hi lamba dabba ban jata. Likhai jahan khatam, chaukor bhi',
    '   wahin khatam: neechay aur dayein photo bilkul saaf rehti hai.',
    '   Rang halka rakha hai (55%) - gehri photo par yeh nazar hi nahi aata,',
    '   aur barf wali photo par itna hai ke likhai parhi ja sake. */',
    '.bk-hero-mark { display: inline; background: rgba(2,6,23,.55);',
    '  -webkit-box-decoration-break: clone; box-decoration-break: clone;',
    '  padding: .06em .22em; border-radius: .12em; }',
    '.bk-hero-eyebrow .bk-hero-mark { padding: .25em .45em; }',
    '.bk-hero-summary .bk-hero-mark, .bk-hero-feature-title .bk-hero-mark { padding: .12em .3em; }',
    '/* Lines ke darmiyan thori jagah, warna chaukor ek doosre par charh jate hain. */',
    '.bk-hero-copy h1, .bk-hero-copy h2 { line-height: 1.08; }',
  ].join(nl)}${nl}`;

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
if (WRITE && changed) console.log('\nChaukor zyada gehra ya halka karna ho to input.css mein ".bk-hero-mark" dhoond kar\n0.55 ko badal dein - 0.45 halka, 0.65 gehra.');
