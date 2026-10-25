// Banner mein jo seedhi lakeer (kaali/safed patti) nazar aati thi, usey khatam karta hai.
//
// Masla: "poori photo dikhao" wali surat mein photo banner se kam chauri hoti
// hai, aur bachi hui jagah us ki dhundhli copy bharti hai. Dono ke darmiyan ek
// bilkul seedhi lakeer ban jati thi - aankh usey "patti" ke tor par parhti hai.
// Pehle woh patti halki neeli thi (img ke peeche ka purana rang), ab gehri thi.
// Rang badalne se masla hal nahi hota, lakeer mitani hoti hai.
//
// Hal: photo ab sirf apni chaurai leti hai (poora dabba nahi), dayein kinare se
// lagti hai, aur us ka bayan kinara dhundhli copy mein ghul jata hai. Koi
// lakeer nahi banti, aur photo phir bhi poori nazar aati hai - kuch katta nahi.
//
// Chhoti screen par photo khud ba khud poora banner bhar deti hai, kyunke wahan
// dabba lamba hota hai aur dhundhli copy ki zaroorat nahi parti.
//
//   node tools/apply-hero-blend.mjs           -> sirf dikhata hai
//   node tools/apply-hero-blend.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.5.0';
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

// ------------------------------------------------- 1. kinara ghulana
patch('src/assets/css/input.css', 'Banner: photo ka kinara dhundhli copy mein ghulana', (t) => {
  if (t.includes('mask-image: linear-gradient(to right')) return null;

  const nl = nlOf(t);
  let out = t;

  const oldPhoto = '.bk-hero-slide.is-smart .bk-hero-photo { position: relative; z-index: 1; object-fit: contain; }';
  if (!out.includes(oldPhoto)) throw new Error('input.css mein is-smart wali line nahi mili');

  const newPhoto = [
    '/* Photo sirf apni chaurai leti hai (poora dabba nahi) aur dayein kinare se',
    '   lagti hai. Us ka bayan kinara dhundhli copy mein ghul jata hai, is liye',
    '   koi seedhi lakeer - yani "patti" - nazar nahi aati. Chhoti screen par',
    '   max-width is ko poora banner bhar dene deti hai. */',
    '.bk-hero-slide.is-smart .bk-hero-photo { position: relative; z-index: 1;',
    '  width: auto; height: 100%; max-width: 100%; margin-left: auto; display: block;',
    '  object-fit: cover; object-position: center;',
    '  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 13%);',
    '          mask-image: linear-gradient(to right, transparent 0, #000 13%); }',
  ].join(nl);
  out = out.replace(oldPhoto, newPhoto);

  // Yeh ab fazool hai - photo khud dayein kinare se lagti hai.
  const oldMedia = '@media (min-width: 1024px) { .bk-hero-slide.is-smart .bk-hero-photo { object-position: right center; } }';
  if (out.includes(oldMedia)) {
    out = out.replace(`${oldMedia}${nl}`, '').replace(oldMedia, '');
  }

  // Dhundhli copy thori roshan aur zyada phaili hui - kinara aur narm lagta hai.
  const oldBg = 'filter: blur(34px) brightness(.62) saturate(1.1); transform: scale(1.14);';
  if (!out.includes(oldBg)) throw new Error('input.css mein .bk-hero-bg wali filter line nahi mili');
  out = out.replace(oldBg, 'filter: blur(44px) brightness(.72) saturate(1.15); transform: scale(1.3);');

  return out;
});

// ------------------------------------------------- 2. CSS version
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
