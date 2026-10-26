// Har <img> ko bata deta hai ke photo ke kaun kaun se naap maujood hain.
//
// Ab tak har jagah wohi ek bari photo utarti thi - card mein bhi, jahan woh
// sirf 400px chauri dikhti hai. Ek page par aise card bees bees hote hain, to
// mobile par bekaar ka bojh kai megabyte tak pohanch jata hai.
//
// Ab har <img> par "srcset" lag jata hai - yani photo ke sab naap ki fehrist -
// aur "sizes", yani us jagah photo kitni chauri dikhegi. Browser dono dekh kar
// khud sahi file utarta hai. Shakal mein koi farq nahi parta.
//
// Naap tools/image-sizes.mjs banata hai. Jis photo ke naap na bane hon (ya jo
// pehle hi chhoti ho) us par kuch nahi lagta aur woh pehle ki tarah chalti hai.
//
// PEHLE tools/image-sizes.mjs copy karein, phir yeh script chalayein.
//
//   node tools/apply-srcset.mjs           -> sirf dikhata hai
//   node tools/apply-srcset.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
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

// Ek hi dafa, warna ruk jao - andhere mein badalne se behtar hai batana.
function once(text, old, neu, what) {
  const parts = text.split(old);
  if (parts.length === 1) throw new Error(`${what}: yeh hissa nahi mila`);
  if (parts.length > 2) throw new Error(`${what}: yeh hissa ek se zyada dafa hai, haath se dekhna hoga`);
  return parts.join(neu);
}

// ---------------------------------------------- 0. tool maujood hai?
if (!fs.existsSync('tools/image-sizes.mjs')) {
  console.log('MISSING FILE  tools/image-sizes.mjs  (naap banane wala tool)');
  console.log('   Pehle woh file copy karein, phir yeh script chalayein.');
  process.exit(1);
}

// ---------------------------------------------- 1. Eleventy filter
patch('eleventy.config.js', 'Eleventy: srcsetAttr filter', (t) => {
  if (t.includes('"srcsetAttr"')) return null;

  const nl = nlOf(t);
  let out = t;

  // fs ka apna naam, taake file mein pehle se jo kuch ho us se na takraye
  if (!out.includes('__readFileForSizes')) {
    out = `import { readFileSync as __readFileForSizes } from "node:fs";${nl}${out}`;
  }

  const anchor = '  eleventyConfig.addFilter("json", v => JSON.stringify(v));';
  if (!out.includes(anchor)) throw new Error('eleventy.config.js mein json filter wali line nahi mili');

  const block = [
    '  // Har photo ke naap ki fehrist - tools/image-sizes.mjs build ke waqt banata',
    '  // hai. Yahan ek dafa parh lete hain taake har <img> ko alag se dena na pare.',
    '  const __imageSizes = (() => {',
    '    try { return JSON.parse(__readFileForSizes("src/_data/imageSizes.json", "utf8")); }',
    '    catch { return {}; }',
    '  })();',
    '  // Photo ka pata do, srcset aur sizes wapas milte hain. Naap na bane hon to',
    '  // khali - us surat mein <img> waisa hi rehta hai jaisa pehle tha.',
    '  eleventyConfig.addFilter("srcsetAttr", (imagePath, sizes) => {',
    '    const list = __imageSizes[String(imagePath || "").trim()];',
    '    if (!list || list.length < 2) return "";',
    '    const srcset = list.map(v => `${v.src} ${v.w}w`).join(", ");',
    '    return ` srcset="${srcset}" sizes="${sizes || "100vw"}"`;',
    '  });',
    anchor,
  ].join(nl);

  return out.replace(anchor, block);
});

// ---------------------------------------------- 2. card wali photos
// Teenon card ek jaise hain. Card bari screen par ~420px, tablet par aadhi
// chaurai, mobile par poori chaurai.
const CARD_SIZES = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 420px';
const CARD_OLD = '<img src="{{ cardImage }}" alt="{{ item.data.title }}" width="800" height="500" loading="lazy" decoding="async">';
const CARD_NEW = `<img src="{{ cardImage }}"{{ cardImage | srcsetAttr('${CARD_SIZES}') | safe }} alt="{{ item.data.title }}" width="800" height="500" loading="lazy" decoding="async">`;

for (const file of [
  'src/_includes/components/journey-card.njk',
  'src/_includes/components/post-card.njk',
  'src/_includes/components/vehicle-card.njk',
]) {
  patch(file, `Card ki photo: ${file.split('/').pop()}`, (t) => {
    if (t.includes('srcsetAttr')) return null;
    return once(t, CARD_OLD, CARD_NEW, 'card ki img');
  });
}

// ---------------------------------------------- 3. tour ka page
patch('src/_includes/layouts/journey.njk', 'Tour page ki photos (bari, thumbnail, gallery, leader)', (t) => {
  if (t.includes('srcsetAttr')) return null;
  let out = t;

  // bari photo
  out = once(out,
    '<img data-trip-main-image src="{{ journeyImage }}" alt="{{ title }}"',
    `<img data-trip-main-image src="{{ journeyImage }}"{{ journeyImage | srcsetAttr('(max-width: 1023px) 100vw, 900px') | safe }} alt="{{ title }}"`,
    'bari photo');

  // pehla thumbnail
  out = once(out,
    '<img src="{{ journeyImage }}" alt="{{ title }} thumbnail"',
    `<img src="{{ journeyImage }}"{{ journeyImage | srcsetAttr('180px') | safe }} alt="{{ title }} thumbnail"`,
    'pehla thumbnail');

  // gallery ke thumbnails
  out = once(out,
    '<img src="{{ gallerySrc }}" alt="{{ galleryAlt }}"',
    `<img src="{{ gallerySrc }}"{{ gallerySrc | srcsetAttr('180px') | safe }} alt="{{ galleryAlt }}"`,
    'gallery ke thumbnail');

  // poori gallery
  out = once(out,
    `<img src="{{ gallerySrc }}" alt="{{ image.alt or (title + ' gallery image ' + loop.index) }}"`,
    `<img src="{{ gallerySrc }}"{{ gallerySrc | srcsetAttr('(max-width: 639px) 100vw, 400px') | safe }} alt="{{ image.alt or (title + ' gallery image ' + loop.index) }}"`,
    'poori gallery');

  // trip leader
  const leaderSrc = "{{ trip_leader.image | safeMedia('', '/assets/uploads/placeholder.svg') }}";
  out = once(out,
    `<img src="${leaderSrc}"`,
    `<img src="${leaderSrc}"{{ trip_leader.image | safeMedia('', '/assets/uploads/placeholder.svg') | srcsetAttr('320px') | safe }}`,
    'trip leader');

  // Lightbox wali photo jaan boojh kar chhori hai - wahan poori bari photo hi
  // chahiye, kyunke user usey bara kar ke dekhta hai.
  return out;
});

// ---------------------------------------------- 4. blog aur vehicle ke page
patch('src/_includes/layouts/post.njk', 'Blog page ki bari photo', (t) => {
  if (t.includes('srcsetAttr')) return null;
  return once(t,
    'src="{{ postImage }}" alt="{{ title }}"',
    `src="{{ postImage }}"{{ postImage | srcsetAttr('(max-width: 1023px) 100vw, 1000px') | safe }} alt="{{ title }}"`,
    'blog ki photo');
});

patch('src/_includes/layouts/vehicle.njk', 'Vehicle page ki bari photo', (t) => {
  if (t.includes('srcsetAttr')) return null;
  return once(t,
    'src="{{ vehicleImage }}" alt="{{ title }}"',
    `src="{{ vehicleImage }}"{{ vehicleImage | srcsetAttr('(max-width: 1023px) 100vw, 1000px') | safe }} alt="{{ title }}"`,
    'vehicle ki photo');
});

// ---------------------------------------------- 5. build ki tarteeb
patch('package.json', 'Build: naap banana hero-crops ke baad', (t) => {
  if (t.includes('tools/image-sizes.mjs')) return null;
  const old = 'node tools/hero-crops.mjs &&';
  if (!t.includes(old)) throw new Error('package.json mein hero-crops wali line nahi mili');
  return t.replace(old, 'node tools/hero-crops.mjs && node tools/image-sizes.mjs &&');
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
