// Har hero, cover aur slider photo se ek share image (og:image) banata hai.
//
// Masla: Google, WhatsApp aur Facebook link ke sath jo tasweer dikhate hain
// woh og:image se aati hai. SVG woh nahi dikhate, aur logo ya likhai wali
// tasweer Google pasand nahi karta. Har safhe ko us ki apni asli photo chahiye,
// aur woh bhi un ki pasand ki shakal mein: 1200x630 (1.91:1) JPG.
//
// Katai hero-crops jaisi hai: sharp khud dekhta hai photo ka ahem hissa kahan
// hai aur usey bachata hai. Slider par CMS ka "focus" chuna ho to us ka kehna
// mana jata hai. Photo se bari katai nahi banti - dhundli ho jati.
//
// Nateeja: src/assets/og/ mein JPG, aur src/_data/ogImages.json mein fehrist,
// jise template ka "ogPick" filter parhta hai.
//
// Saath mein report: kaun si photo itni chhoti hai ke banner par khinch kar
// dhundli ("zoom") nazar aati hai, aur woh kis safhe par lagi hai.
//
//   node tools/og-images.mjs            -> jo kami hai woh bana deta hai
//   node tools/og-images.mjs --force    -> sab dobara banata hai
//   node tools/og-images.mjs --check    -> sirf batata hai, kuch nahi banata
//   node tools/og-images.mjs --report   -> chhoti photos ki poori fehrist
//   node tools/og-images.mjs --verify   -> build ke baad: har safha kya de raha hai
import fs from 'node:fs';
import path from 'node:path';

const FORCE = process.argv.includes('--force');
const CHECK = process.argv.includes('--check');
const REPORT = process.argv.includes('--report');
const VERIFY = process.argv.includes('--verify');

const UPLOADS = 'src/assets/uploads';
const OUT_DIR = 'src/assets/og';
const MANIFEST = 'src/_data/ogImages.json';
const PUBLIC_UPLOADS = '/assets/uploads';
const PUBLIC_OUT = '/assets/og';

const W = 1200, H = 630;          // Google, Facebook, WhatsApp sab ki pasand
const MIN_W = 400;                // is se chhoti ho to share image nahi banti
const QUALITY = 80;
const HERO_OK = 1600;             // banner ke liye kam az kam itni chaurai
const COVER_OK = 1200;            // tour page ki bari photo ke liye

const GRAVITY = { top: 'north', bottom: 'south', left: 'west', right: 'east', center: 'centre', centre: 'centre' };

/* ---------------------------------------------------------------- verify */
if (VERIFY) {
  const pages = [];
  const walkP = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walkP(f); else if (e.name === 'index.html') pages.push(f); } };
  if (!fs.existsSync('_site')) { console.log('_site nahi mila - pehle npm run build'); process.exit(1); }
  walkP('_site');
  const k = { jpg: [], other: [], svg: [], banner: [] };
  for (const p of pages) {
    const h = fs.readFileSync(p, 'utf8');
    if (h.length < 3000 && /http-equiv="refresh"/i.test(h)) continue;
    const og = (h.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '';
    const url = '/' + path.relative('_site', p).split(path.sep).join('/').replace(/index\.html$/, '');
    if (/karakoram-vision-og\./.test(og)) k.banner.push(url);
    else if (/\.svg(\?|$)/i.test(og)) k.svg.push(url);
    else if (og.includes(PUBLIC_OUT + '/')) {
      const f = path.join('_site', new URL(og).pathname);
      k.jpg.push(url + (fs.existsSync(f) ? '' : '   XX file _site mein nahi'));
    } else k.other.push(url + '   ' + og.split('/').pop());
  }
  console.log(`\nShare image: ${k.jpg.length} nayi JPG, ${k.other.length} doosri photo, ${k.banner.length} default banner, ${k.svg.length} SVG\n`);
  for (const [name, list] of Object.entries(k)) {
    if (!list.length || name === 'jpg') continue;
    console.log('--- ' + name + ' ---'); list.forEach((u) => console.log('   ' + u)); console.log('');
  }
  const missing = k.jpg.filter((u) => /XX/.test(u));
  if (missing.length) { console.log('XX ' + missing.length + ' safhon ki JPG _site mein nahi pohnchi:'); missing.forEach((u) => console.log('   ' + u)); process.exit(1); }
  if (k.svg.length) process.exit(1);
  process.exit(0);
}

let sharp;
try { sharp = (await import('sharp')).default; }
catch {
  console.log('OG images: "sharp" nahi mila, chhor diya (site phir bhi chalegi).');
  process.exit(0);
}

/* ---------------------------------------------------------------- helpers */
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).flatMap((n) => {
  const p = path.join(dir, n);
  return fs.statSync(p).isDirectory() ? walk(p) : [p];
}) : []);
const frontMatter = (file) => {
  const t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---/.exec(t);
  return m ? m[1] : '';
};
const fmValue = (fm, key) => {
  const m = new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm').exec(fm);
  return m ? m[1].trim().replace(/^["']|["']$/g, '').trim() : '';
};
const sourceOf = (publicPath) => {
  const v = String(publicPath || '').trim();
  if (!v.startsWith(`${PUBLIC_UPLOADS}/`) || /\.svg$/i.test(v)) return '';
  const f = path.join(UPLOADS, v.slice(PUBLIC_UPLOADS.length + 1));
  return fs.existsSync(f) ? f : '';
};
const slugOf = (file) => path.relative(UPLOADS, file).replace(/\.[^.]+$/, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ---------------------------------------------------------------- photos jama karo */
// image -> { src, focus, uses: Set("hero: tours", "cover: tours/x.md") }
const wanted = new Map();
const add = (image, use, focus = '') => {
  const src = sourceOf(image);
  if (!src) return;
  const e = wanted.get(image) || { src, focus: '', uses: new Set() };
  if (!e.focus && focus) e.focus = focus;
  e.uses.add(use);
  wanted.set(image, e);
};

try {
  const hero = JSON.parse(fs.readFileSync('src/_data/heroSettings.json', 'utf8'));
  for (const [key, v] of Object.entries(hero)) if (v && typeof v === 'object') add(v.image, 'hero: ' + key);
} catch { /* koi baat nahi */ }

for (const file of walk('src/content')) {
  if (!file.endsWith('.md')) continue;
  const fm = frontMatter(file);
  const short = path.relative('src/content', file).split(path.sep).join('/');
  if (short.startsWith('sliders/')) { add(fmValue(fm, 'image'), 'slide: ' + short, fmValue(fm, 'focus')); continue; }
  add(fmValue(fm, 'cover_image'), 'cover: ' + short);
  add(fmValue(fm, 'social_image'), 'og: ' + short);
}
for (const file of walk('src')) {
  if (!file.endsWith('.njk') || /[\\/]_includes[\\/]|[\\/]_layouts[\\/]/.test(file)) continue;
  const fm = frontMatter(file);
  const short = path.relative('src', file).split(path.sep).join('/');
  add(fmValue(fm, 'cover_image'), 'cover: ' + short);
  add(fmValue(fm, 'social_image'), 'og: ' + short);
}

if (!wanted.size) { console.log('OG images: koi photo nahi mili.'); process.exit(0); }
if (!CHECK && !fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ---------------------------------------------------------------- banao */
const manifest = {};
const small = [];
let made = 0, kept = 0, failed = 0, tiny = 0;

for (const [publicPath, { src, focus, uses }] of wanted) {
  let meta;
  try { meta = await sharp(src).metadata(); }
  catch (e) { console.log(`chhora: ${publicPath} (${String(e.message).split('\n')[0]})`); failed++; continue; }
  // EXIF rotation ke baad ki asli chaurai
  const rotated = (meta.orientation || 1) >= 5;
  const srcW = (rotated ? meta.height : meta.width) || 0, srcH = (rotated ? meta.width : meta.height) || 0;
  if (!srcW || !srcH) { failed++; continue; }

  const usesList = [...uses];
  const asHero = usesList.some((u) => /^(hero|slide):/.test(u));
  const asCover = usesList.some((u) => /^cover:/.test(u));
  if ((asHero && srcW < HERO_OK) || (asCover && srcW < COVER_OK)) small.push({ publicPath, srcW, srcH, uses: usesList });

  const fit = Math.min(srcW / W, srcH / H, 1);
  const w = Math.round(W * fit), h = Math.round(H * fit);
  if (w < MIN_W) { tiny++; continue; }

  const name = `${slugOf(src)}.jpg`;
  const out = path.join(OUT_DIR, name);
  manifest[publicPath] = { src: `${PUBLIC_OUT}/${name}`, w, h };

  if (!FORCE && fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) { kept++; continue; }
  if (CHECK) { made++; continue; }
  try {
    await sharp(src, { failOn: 'none' })
      .rotate()
      .resize(w, h, { fit: 'cover', position: GRAVITY[focus] || sharp.strategy.attention })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(out);
    made++;
  } catch (e) {
    console.log(`chhora: ${name} (${String(e.message).split('\n')[0]})`);
    delete manifest[publicPath];
    failed++;
  }
}

if (!CHECK) {
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const alive = new Set(Object.values(manifest).map((v) => path.basename(v.src)));
  let swept = 0;
  for (const n of fs.readdirSync(OUT_DIR)) if (n.endsWith('.jpg') && !alive.has(n)) { fs.unlinkSync(path.join(OUT_DIR, n)); swept++; }
  if (swept) console.log(`OG images: ${swept} purani hatai.`);
}

console.log(
  `OG images: ${Object.keys(manifest).length} photos${CHECK ? '' : ' taiyar'}`
  + `, ${made} ${CHECK ? 'banani hain' : 'nayi bani'}, ${kept} pehle se theek`
  + (tiny ? `, ${tiny} bohat chhoti (share image nahi bani)` : '')
  + (failed ? `, ${failed} chhori` : '')
  + (small.length ? `, ${small.length} photos banner ke liye chhoti` : '')
  + (CHECK ? '  (check only)' : ''),
);

if (REPORT || CHECK) {
  if (!small.length) console.log('\nSab photos kaafi bari hain.');
  else {
    console.log(`\nCHHOTI PHOTOS - banner/cover par khinch kar dhundli ("zoom") nazar aati hain.`);
    console.log(`Banner ke liye kam az kam ${HERO_OK}px, tour ki bari photo ke liye ${COVER_OK}px chauri chahiye.\n`);
    for (const s of small.sort((a, b) => a.srcW - b.srcW)) {
      console.log(`  ${String(s.srcW).padStart(5)} x ${String(s.srcH).padEnd(5)}  ${s.publicPath}`);
      for (const u of s.uses) console.log(`                 ${u}`);
    }
  }
}
