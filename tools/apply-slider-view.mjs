// Slider ki photo ki shakal theek karta hai - bina client se kuch pooche.
//
// Masla: hero poori chaurai ka hai lekin bulandi 720px - yani lagbhag 2.7:1 ka
// patta. Aam photo 3:2 ya 4:3 hoti hai, to `object-fit: cover` us ke oopar
// neeche se bara hissa kaat deta hai aur photo "zoom" lagti hai.
//
// Hal (wahi jo Instagram/YouTube karte hain): poori photo beech mein, aur us ke
// peeche usi photo ki dhundhli bari copy jo banner ki baqi jagah bhar deti hai.
// Na kuch katta hai, na khinchta hai, aur banner khali nahi lagta. Yeh default
// hai - client ko kuch chunna nahi parta.
//
// Jo client phir bhi poora banner bharwana chahe (photo pehle se chauri ho),
// us ke liye slide par "Fill the banner" ka option aur "kaun sa hissa rakhna hai"
// ka dropdown mojood hai.
//
//   node tools/apply-slider-view.mjs           -> sirf dikhata hai
//   node tools/apply-slider-view.mjs --write   -> files badal deta hai
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.2.0';
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

// ---------------------------------------------------------------- 1. CSS
patch('src/assets/css/input.css', 'Hero CSS: dhundhli bharai, phota poora nazar aaye', (t) => {
  if (t.includes('.bk-hero-bg')) return null;

  const old = '.bk-hero-slide img { width: 100%; height: 100%; object-fit: cover; }';
  if (!t.includes(old)) throw new Error('input.css mein hero image wali line nahi mili');
  const nl = nlOf(t);

  const neu = [
    '.bk-hero-slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }',
    '/* "Smart" slide: poori photo beech mein, peeche usi ki dhundhli copy jagah bharti hai.',
    '   Is tarah kisi bhi naap ki photo na katti hai na khinchti hai. */',
    '.bk-hero-bg { position: absolute; inset: 0; z-index: 0; object-fit: cover;',
    '  filter: blur(34px) brightness(.62) saturate(1.1); transform: scale(1.14); }',
    '.bk-hero-slide.is-smart .bk-hero-photo { position: relative; z-index: 1; object-fit: contain; }',
    '@media (min-width: 1024px) { .bk-hero-slide.is-smart .bk-hero-photo { object-position: right center; } }',
    '/* Jahan asli photo nahi lagi, wahan placeholder khinche nahi */',
    '.bk-hero-slide img[src$="placeholder.svg"] { object-fit: contain; }',
  ].join(nl);

  return t.replace(old, neu);
});

// ------------------------------------------------- 1b. banner ki bulandi
patch('src/assets/css/input.css', 'Hero ki bulandi screen ke saath badle', (t) => {
  if (t.includes('/* bulandi screen ke saath */')) return null;

  const oldHero = '.bk-hero { position: relative; min-height: 720px; overflow: hidden;';
  const oldCompact = '.bk-hero-compact { min-height: 560px; }';
  if (!t.includes(oldHero)) throw new Error('input.css mein .bk-hero wali line nahi mili');
  if (!t.includes(oldCompact)) throw new Error('input.css mein .bk-hero-compact wali line nahi mili');

  // 720px par jami bulandi bari screen par 2.7:1 ka patla patta banati thi,
  // jis mein har aam photo ka bara hissa kat jata tha. Ab bulandi chaurai ke
  // saath barhti hai, to patta kam chaura rehta hai aur crop kam hota hai.
  let out = t
    .replace(oldHero, '/* bulandi screen ke saath */\n.bk-hero { position: relative; height: clamp(520px, 52vw, 820px); overflow: hidden;')
    .replace(oldCompact, '.bk-hero-compact { height: clamp(420px, 42vw, 660px); }');

  // Neeche media queries mein purani jami hui bulandi bhi likhi hai. Agar woh
  // rahe to nayi settings ko daba degi, is liye unhein bhi badal dete hain.
  out = out
    .replace('  .bk-hero { min-height: 680px; }', '  .bk-hero { height: clamp(480px, 58vw, 680px); }')
    .replace('  .bk-hero-compact { min-height: 520px; }', '  .bk-hero-compact { height: clamp(400px, 46vw, 540px); }')
    .replace('  .bk-hero, .bk-hero-compact { min-height: 690px; }', '  .bk-hero, .bk-hero-compact { height: clamp(440px, 118vw, 560px); }');

  if (/\.bk-hero[^{]*\{[^}]*min-height/.test(out)) {
    throw new Error('input.css mein ab bhi hero ki purani min-height baqi hai - mujhe batayein');
  }
  return out;
});

// ---------------------------------------------------------------- 2. CSS version
patch('src/_includes/layouts/base.njk', `site.css ka version ${CSS_VER}`, (t) => {
  if (t.includes(`site.css?v=${CSS_VER}`)) return null;
  const out = t.replace(/\/assets\/css\/site\.css(\?v=[\d.]+)?/g, `/assets/css/site.css?v=${CSS_VER}`);
  if (out === t) throw new Error('base.njk mein site.css wali line nahi mili');
  return out;
});

patch('src/_headers', `_headers mein site.css ka version ${CSS_VER}`, (t) => {
  if (!/site\.css/.test(t)) return null;           // is file mein preload hai hi nahi
  if (t.includes(`site.css?v=${CSS_VER}`)) return null;
  return t.replace(/\/assets\/css\/site\.css(\?v=[\d.]+)?/g, `/assets/css/site.css?v=${CSS_VER}`);
});

// ---------------------------------------------------------------- 3. .pages.yml
patch('.pages.yml', 'CMS: slide par photo ki shakal ke khane', (t) => {
  if (t.includes('- name: fit')) return null;

  const nl = nlOf(t);
  const lines = t.split(/\r?\n/);

  let start = lines.findIndex((l) => l === '- name: sliders');
  if (start === -1) throw new Error('.pages.yml mein sliders wala hissa nahi mila - pehle apply-sliders.mjs chalayein');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^- name: \S/.test(lines[i])) { end = i; break; }
  }

  // image_alt ke block ke foran baad daalna hai
  let at = -1;
  for (let i = start; i < end; i++) {
    if (lines[i] === '  - name: image_alt') {
      at = end;
      for (let j = i + 1; j < end; j++) {
        if (/^  - name: /.test(lines[j]) || /^\S/.test(lines[j])) { at = j; break; }
      }
      break;
    }
  }
  if (at === -1) throw new Error('.pages.yml ke sliders mein image_alt wala khana nahi mila');

  const block = [
    '  - name: fit',
    '    label: How the photo sits in the banner',
    '    type: select',
    '    default: smart',
    '    description: "Pehla option chhor dein to har naap ki photo theek lagti hai - poori nazar aati hai aur peeche usi ki dhundhli copy jagah bhar deti hai. Doosra option sirf tab chunein jab photo pehle se bohot chauri ho."',
    '    options:',
    '    - value: smart',
    '      label: Show the whole photo (recommended)',
    '    - value: cover',
    '      label: Fill the banner (top and bottom get cut off)',
    '  - name: focus',
    '    label: Which part to keep when filling',
    '    type: select',
    '    default: top',
    '    description: "Sirf tab kaam aata hai jab oopar \\"Fill the banner\\" chuna ho. Pahari photos mein \\"Top\\" behtar rehta hai - choti bach jati hai."',
    '    options:',
    '    - value: top',
    '      label: Top (best for mountains)',
    '    - value: center',
    '      label: Middle',
    '    - value: bottom',
    '      label: Bottom',
    '    - value: left',
    '      label: Left',
    '    - value: right',
    '      label: Right',
  ];

  lines.splice(at, 0, ...block);
  return lines.join(nl);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
console.log('YAAD RAHE: landing-hero.njk ka naya version bhi copy karna hai.');
