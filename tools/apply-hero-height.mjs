// Banner ki katai kam karta hai - 15% se takreeban 7% par.
//
// Photo poora banner bharti hai, is liye jitna farq photo ki shakal aur banner
// ki shakal mein hoga, utna hi oopar-neechay se katega. Aam photo 3:2 ki hoti
// hai (1.5). Banner abhi 1.76 ka tha, yani 15% kat raha tha. Banner ko 1.6 ke
// qareeb laate hain to katai 7% rah jati hai.
//
//   banner ki shakal   katai
//   1.76 (abhi)        15%
//   1.61 (naya)         7%
//   1.50 (photo)        0%
//
// Bohot chauri screen (1920+) par bulandi ki hadd lag jati hai, wahan katai
// phir bhi 20% ke qareeb rahegi - is se aagy banner itna uncha ho jata hai ke
// poori screen ghair jata hai. Aam laptop par 7% hi rahega.
//
// Ek aur faida: banner uncha hone se trip finder ko jagah mil jati hai.
//
//   node tools/apply-hero-height.mjs           -> sirf dikhata hai
//   node tools/apply-hero-height.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.7.0';
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

patch('src/assets/css/input.css', 'Banner ki bulandi: katai 15% se 7% par', (t) => {
  if (t.includes('62vw')) return null;

  let out = t;

  // Bara banner: 52vw -> 62vw (yani shakal 1.92 se 1.61 par), hadd 860 -> 1000.
  const big = 'min-height: clamp(720px, 52vw, 860px);';
  if (!out.includes(big)) throw new Error('input.css mein .bk-hero ki bulandi wali line nahi mili');
  out = out.replace(big, 'min-height: clamp(700px, 62vw, 1000px);');

  // Andar ke pages ka chhota banner: thora sa uncha, itna nahi ke bhaari lage.
  const small = '.bk-hero-compact { min-height: clamp(560px, 42vw, 700px); }';
  if (out.includes(small)) {
    out = out.replace(small, '.bk-hero-compact { min-height: clamp(560px, 50vw, 820px); }');
  } else {
    console.log('   (dhyan: .bk-hero-compact wali line nahi mili, usey chhor diya)');
  }

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
