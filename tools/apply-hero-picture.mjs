// Banner ko "art direction" par le jata hai - har screen ke liye pehle se
// kati hui photo.
//
// Ab tak ek hi photo har screen par chalti thi. Bari screen par woh chaura
// patta banti thi, mobile par lamba dabba - ek hi file se dono kaam lena
// mumkin nahi, is liye ya photo katti thi ya khali patti bachti thi.
//
// Ab tools/hero-crops.mjs har banner photo ki teen katayein pehle se bana
// deta hai, aur browser <picture> ke zariye apni screen wali uthata hai:
//
//   mobile (767 tak)     lambi katai   9:16
//   tablet (768-1279)    darmiyani     5:4
//   bari screen (1280+)  chauri        16:10
//
// Do faide: patti ka sawal hi khatam, aur mobile par 1920px ki bhaari photo
// ki jagah chhoti file utarti hai - page nazar aane wali had tak tez hota hai.
//
// PEHLE YEH DO FILES COPY KAREIN:
//   tools/hero-crops.mjs
//   src/_includes/components/landing-hero.njk
// Us ke baad yeh script chalayein.
//
//   node tools/apply-hero-picture.mjs           -> sirf dikhata hai
//   node tools/apply-hero-picture.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.8.0';
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

// ---------------------------------------------- 0. zaroori files mojood hain?
for (const [file, hint] of [
  ['tools/hero-crops.mjs', 'katai banane wala tool'],
  ['src/_includes/components/landing-hero.njk', 'banner ka naya template'],
]) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}  (${hint})`); problems++; }
}
if (!problems && !fs.readFileSync('src/_includes/components/landing-hero.njk', 'utf8').includes('heroPicture')) {
  console.log('!! landing-hero.njk ka naya version copy nahi hua.');
  console.log('   Pehle woh file copy karein, phir yeh script chalayein.');
  problems++;
}
if (problems) {
  console.log(`\n0 tabdeeliyan, 0 pehle se theek, ${problems} problem.`);
  process.exit(1);
}

// ---------------------------------------------- 1. Eleventy filter
patch('eleventy.config.js', 'Eleventy: heroPicture filter', (t) => {
  if (t.includes('"heroPicture"')) return null;

  const anchor = '  eleventyConfig.addFilter("json", v => JSON.stringify(v));';
  if (!t.includes(anchor)) throw new Error('eleventy.config.js mein json filter wali line nahi mili');
  const nl = nlOf(t);

  const block = [
    '  // Banner ki photo ke liye har shakal ka srcset. tools/hero-crops.mjs ne jo',
    '  // katai banai hai, yeh us ki fehrist (src/_data/heroImages.json) mein se us',
    '  // photo ka hissa nikal kar deta hai. Kuch na mile to null - template phir',
    '  // asli photo laga deta hai, to kuch toota nahi.',
    '  eleventyConfig.addFilter("heroPicture", (images, imagePath) => {',
    '    const entry = (images || {})[String(imagePath || "").trim()];',
    '    if (!entry) return null;',
    '    const line = (list) => (list || []).map(v => `${v.src} ${v.w}w`).join(", ");',
    '    const wide = entry.wide || [];',
    '    const big = wide[wide.length - 1];',
    '    if (!big) return null;',
    '    return {',
    '      wide: line(entry.wide), mid: line(entry.mid), tall: line(entry.tall),',
    '      fallback: big.src, w: big.w, h: big.h,',
    '    };',
    '  });',
    anchor,
  ].join(nl);

  return t.replace(anchor, block);
});

// ---------------------------------------------- 2. CSS
patch('src/assets/css/input.css', 'CSS: <picture> ko banner jitni jagah', (t) => {
  if (t.includes('.bk-hero-slide picture')) return null;

  const nl = nlOf(t);
  const anchor = '.bk-hero-slide img {';
  if (!t.includes(anchor)) throw new Error('input.css mein .bk-hero-slide img wali line nahi mili');

  const block = [
    '/* <picture> khud koi jagah nahi gherta, is liye usey banner jitna kar dete',
    '   hain - warna andar ki photo ko naap hi nahi milta. */',
    '.bk-hero-slide picture { position: absolute; inset: 0; display: block; }',
    anchor,
  ].join(nl);

  return t.replace(anchor, block);
});

// ---------------------------------------------- 3. build ki tarteeb
patch('package.json', 'Build: katai banana optimize-images ke baad', (t) => {
  if (t.includes('tools/hero-crops.mjs')) return null;

  const old = 'node tools/optimize-images.mjs &&';
  if (!t.includes(old)) throw new Error('package.json mein optimize-images wali line nahi mili');
  // Katai hamesha optimize ke BAAD banti hai, taake source pehle hi 2000px
  // tak chhoti ho chuki ho.
  return t.replace(old, 'node tools/optimize-images.mjs && node tools/hero-crops.mjs &&');
});

// ---------------------------------------------- 4. CSS version
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

// ---------------------------------------------- 5. CMS ke fazool khane
patch('.pages.yml', 'CMS: slide se "fit" hatana, "focus" ko khud-kar banana', (t) => {
  if (t.includes('label: Which part of the photo matters most')) return null;

  const nl = nlOf(t);
  const lines = t.split(/\r?\n/);

  const start = lines.findIndex((l) => l === '- name: sliders');
  if (start === -1) throw new Error('.pages.yml mein sliders wala hissa nahi mila');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^- name: \S/.test(lines[i])) { end = i; break; }
  }

  // Ek khane ka poora block kahan se kahan tak hai
  const blockOf = (name) => {
    const at = lines.findIndex((l, i) => i > start && i < end && l === `  - name: ${name}`);
    if (at === -1) return null;
    let stop = end;
    for (let j = at + 1; j < end; j++) {
      if (/^  - name: /.test(lines[j]) || /^\S/.test(lines[j])) { stop = j; break; }
    }
    return [at, stop];
  };

  // "fit" ab bemaani hai - photo hamesha poora banner bharti hai.
  const fit = blockOf('fit');
  if (fit) lines.splice(fit[0], fit[1] - fit[0]);

  // "focus" rehta hai, lekin ab zaroori nahi - default "khud pehchano".
  const focus = blockOf('focus');
  if (!focus) throw new Error('.pages.yml ke sliders mein focus wala khana nahi mila');
  lines.splice(focus[0], focus[1] - focus[0], ...[
    '  - name: focus',
    '    label: Which part of the photo matters most',
    '    type: select',
    '    default: auto',
    '    description: "Ise chhor dein. Website khud pehchan leti hai ke photo mein ahem hissa kahan hai aur usey bachati hai. Sirf tab badlein jab kisi photo mein galat hissa nazar aaye."',
    '    options:',
    '    - value: auto',
    '      label: Work it out automatically (recommended)',
    '    - value: top',
    '      label: Top',
    '    - value: center',
    '      label: Middle',
    '    - value: bottom',
    '      label: Bottom',
    '    - value: left',
    '      label: Left',
    '    - value: right',
    '      label: Right',
  ]);

  return lines.join(nl);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
if (WRITE && changed) console.log('\nAb "npm run build" chalayein - pehli dafa katai banne mein ek do minute lag sakte hain.');
