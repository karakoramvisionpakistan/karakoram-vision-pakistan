// Chaukor ki bulandi kam karta hai.
//
// Masla: inline likhai ke peechay ka rang harf ke naap se nahi bharta, balke
// FONT ke apne dabbe se - aur us dabbe mein oopar neechay khali jagah pehle se
// shamil hoti hai (jahan 'p' ki dum aur oopar ke nishan aate hain). Padding
// sifar kar dein tab bhi woh jagah rehti hai, is liye chaukor harf se bara
// lagta hai.
//
// Hal: rang ko background ki soorat mein dalte hain aur us ki bulandi khud
// muqarrar karte hain (background-size). Ab band utna hi uncha hai jitni
// likhai - na us se zyada.
//
// PEHLE apply-hero-shade.mjs aur apply-hero-mark-tune.mjs chal chuki hon.
//
//   node tools/apply-hero-mark-height.mjs           -> sirf dikhata hai
//   node tools/apply-hero-mark-height.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota. Jo darkness aap ne set ki hai
// (42% ya jo bhi) woh waisi hi rehti hai.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.14.0';
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

patch('src/assets/css/input.css', 'Chaukor ki bulandi likhai jitni', (t) => {
  if (t.includes('background-size: 100% .84em')) return null;

  const nl = t.includes('\r\n') ? '\r\n' : '\n';

  // Jo rang aap ne chuna hai usey pakar lo, taake badal na jaye.
  const colour = /\.bk-hero-mark \{ display: inline; background: (rgba\(2,6,23,\.\d+\));/.exec(t);
  if (!colour) {
    throw new Error('bk-hero-mark nahi mila - pehle apply-hero-shade.mjs aur apply-hero-mark-tune.mjs chalayein');
  }
  const c = colour[1];
  console.log(`   (aap ka chuna hua rang rakha ja raha hai: ${c})`);

  const oldBlock = new RegExp(
    '\\.bk-hero-mark \\{ display: inline; background: rgba\\(2,6,23,\\.\\d+\\);[\\s\\S]*?'
    + '\\.bk-hero-summary \\.bk-hero-mark, \\.bk-hero-feature-title \\.bk-hero-mark \\{[^}]*\\}'
  );
  if (!oldBlock.test(t)) throw new Error('bk-hero-mark ke teenon rule ek saath nahi mile');

  return t.replace(oldBlock, [
    '/* Rang ab "background" ki soorat mein hai aur us ki bulandi khud muqarrar',
    '   ki hui hai. Wajah: inline likhai ke peechay ka rang font ke apne dabbe se',
    '   bharta hai, jis mein oopar neechay khali jagah shamil hoti hai - padding',
    '   sifar kar dein tab bhi. background-size us ko kaat deta hai, to band utna',
    '   hi uncha rehta hai jitni likhai.',
    '   Rang badalna ho to neechay DONO jagah badalna hoga, kyunke gradient ko',
    '   do rang chahiye hote hain (dono ek hi rakhne se saada rang banta hai). */',
    `.bk-hero-mark { display: inline; background-color: transparent;`,
    `  background-image: linear-gradient(${c}, ${c});`,
    '  background-size: 100% .84em; background-position: 0 .26em; background-repeat: no-repeat;',
    '  -webkit-box-decoration-break: clone; box-decoration-break: clone;',
    '  padding: 0 .14em; }',
    '.bk-hero-eyebrow .bk-hero-mark { background-size: 100% 1.3em; background-position: 0 -.14em;',
    '  padding: 0 .3em; }',
    '.bk-hero-summary .bk-hero-mark, .bk-hero-feature-title .bk-hero-mark {',
    '  background-size: 100% 1.12em; background-position: 0 0; padding: 0 .22em; }',
  ].join(nl));
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
if (WRITE && changed) console.log('\nBand ki bulandi input.css mein ".84em" se tay hoti hai.\nAur chhota: ".78em" (aur ".26em" ko ".29em"). Bara: ".92em" (aur ".22em").');
