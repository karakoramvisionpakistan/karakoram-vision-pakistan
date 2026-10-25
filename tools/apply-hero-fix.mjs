// Hero ki do kharabiyan theek karta hai.
//
// 1. SAFED PATTI
//    input.css mein ek purana rule hai: `img { background: #eef4ff; }` - har photo
//    ke peeche halka neela rang, taake load hone tak khali dabba na lage. `cover`
//    mein photo poora dabba bhar deti hai to woh rang kabhi nazar nahi aata, lekin
//    "poori photo dikhao" wali surat mein jo jagah bachti hai wahan wahi rang aa
//    jata tha - aur dhundhli copy us ke neeche dab jati thi. Hero ki photos ke
//    liye woh rang hata dete hain.
//
// 2. BULANDI
//    Pichli dafa maine mobile aur tablet par banner chhota kar diya tha, jis se
//    trip finder ne slider ko dhanp liya. Ab banner kahin bhi pehle se chhota
//    nahi hoga - sirf bari screen par thora uncha, jahan crop sab se zyada tha.
//
//   node tools/apply-hero-fix.mjs           -> sirf dikhata hai
//   node tools/apply-hero-fix.mjs --write   -> files badal deta hai
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.4.0';
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

// ------------------------------------------------- 1. safed patti
patch('src/assets/css/input.css', 'Hero photos ke peeche ka halka rang hatana', (t) => {
  const old = '.bk-hero-slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }';
  if (!t.includes(old)) {
    if (t.includes('background: transparent')) return null;
    throw new Error('input.css mein hero image wali line nahi mili');
  }
  return t.replace(old,
    '.bk-hero-slide img { width: 100%; height: 100%; object-fit: cover; object-position: center;'
    + ' background: transparent; }');
});

// ------------------------------------------------- 2. bulandi
patch('src/assets/css/input.css', 'Banner ki bulandi: kahin chhoti na ho', (t) => {
  if (t.includes('/* bulandi: kahin chhoti nahi, bari screen par thori zyada */')) return null;

  const nl = nlOf(t);
  let out = t;

  // Base: `height` ki jagah `min-height`, taake agar andar ka content zyada ho
  // to banner barh sake (pehle bhi aisa hi tha).
  const baseNow = '.bk-hero { position: relative; height: clamp(520px, 52vw, 820px); overflow: hidden;';
  const baseOld = '.bk-hero { position: relative; min-height: 720px; overflow: hidden;';
  const baseNew = '.bk-hero { position: relative; min-height: clamp(720px, 52vw, 860px); overflow: hidden;';
  if (out.includes(baseNow)) out = out.replace(baseNow, baseNew);
  else if (out.includes(baseOld)) out = out.replace(baseOld, baseNew);
  else throw new Error('input.css mein .bk-hero wali line nahi mili');

  for (const [from, to] of [
    ['.bk-hero-compact { height: clamp(420px, 42vw, 660px); }', '.bk-hero-compact { min-height: clamp(560px, 42vw, 700px); }'],
    ['.bk-hero-compact { min-height: 560px; }', '.bk-hero-compact { min-height: clamp(560px, 42vw, 700px); }'],
    // tablet aur mobile: bilkul wahi jo pehle tha
    ['  .bk-hero { height: clamp(480px, 58vw, 680px); }', '  .bk-hero { min-height: 680px; }'],
    ['  .bk-hero-compact { height: clamp(400px, 46vw, 540px); }', '  .bk-hero-compact { min-height: 520px; }'],
    ['  .bk-hero, .bk-hero-compact { height: clamp(440px, 118vw, 560px); }', '  .bk-hero, .bk-hero-compact { min-height: 690px; }'],
  ]) {
    if (out.includes(from)) out = out.replace(from, to);
  }

  out = out.replace('/* bulandi screen ke saath */', '/* bulandi: kahin chhoti nahi, bari screen par thori zyada */');
  if (!out.includes('/* bulandi: kahin chhoti nahi')) {
    out = out.replace(baseNew, `/* bulandi: kahin chhoti nahi, bari screen par thori zyada */${nl}${baseNew}`);
  }

  // koi `height:` wala hero rule reh to nahi gaya
  if (/\.bk-hero[^{]*\{[^}]*(?<!min-)height:\s*clamp/.test(out)) {
    throw new Error('input.css mein ab bhi hero par sakht height lagi hai - mujhe batayein');
  }
  return out;
});

// ------------------------------------------------- 3. CSS version
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
