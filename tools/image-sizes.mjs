// Har photo ke chand chhote naap bana deta hai, taake har jagah apni zaroorat
// ke mutabiq file utare.
//
// Masla: ek tour ka card screen par takreeban 400px chaura hota hai, magar us
// mein 2000px ki photo utarti hai - zaroorat se paanch guna bhaari. Aur aise
// card ek page par bees bees hote hain. Asal wazan yahi hai.
//
// Hal: har photo ke teen naap pehle se bana dete hain (400, 800, 1400).
// Shakal nahi badalti - sirf naap chhota hota hai, kuch katta nahi. Phir
// <img> par srcset laga kar browser ko bata dete hain ke kaun kaun se naap
// mojood hain; woh khud dekh kar sahi wala utar leta hai.
//
// Banner wali katai (tools/hero-crops.mjs) is se alag cheez hai - wahan shakal
// badalti hai, yahan sirf naap.
//
// Nateeja: src/assets/sized/ mein files, aur src/_data/imageSizes.json mein
// un ki fehrist jise template parhta hai.
//
//   node tools/image-sizes.mjs            -> jo kami hai woh bana deta hai
//   node tools/image-sizes.mjs --force    -> sab dobara banata hai
//   node tools/image-sizes.mjs --check    -> sirf batata hai, kuch nahi banata
import fs from 'node:fs';
import path from 'node:path';

const FORCE = process.argv.includes('--force');
const CHECK = process.argv.includes('--check');

const UPLOADS = 'src/assets/uploads';
const OUT_DIR = 'src/assets/sized';
const MANIFEST = 'src/_data/imageSizes.json';
const PUBLIC_UPLOADS = '/assets/uploads';
const PUBLIC_OUT = '/assets/sized';

// 400 - card aur thumbnail, 800 - mobile par poori chaurai ya bara card,
// 1400 - tour ke page ki bari photo. Is se zyada naap ka faida aankh ko nahi
// hota, bas files barh jati hain.
const WIDTHS = [400, 800, 1400];
const QUALITY = 78;
const RASTER = ['.webp', '.jpg', '.jpeg', '.png'];

let sharp;
try { sharp = (await import('sharp')).default; }
catch {
  console.log('Image sizes: "sharp" nahi mila, chhor diya (photos phir bhi chalengi).');
  process.exit(0);
}

if (!fs.existsSync(UPLOADS)) { console.log('Image sizes: uploads folder nahi mila.'); process.exit(0); }

const walk = (dir) => fs.readdirSync(dir).flatMap((n) => {
  const p = path.join(dir, n);
  return fs.statSync(p).isDirectory() ? walk(p) : [p];
});

// uploads/brand/logo.png -> brand-logo  (taake alag folderon ke ek naam na takrayein)
const slugOf = (file) => path.relative(UPLOADS, file)
  .replace(/\.[^.]+$/, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

if (!CHECK && !fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = {};
let made = 0, kept = 0, skipped = 0, failed = 0;

for (const file of walk(UPLOADS)) {
  if (!RASTER.includes(path.extname(file).toLowerCase())) continue;

  let meta;
  try { meta = await sharp(file).metadata(); }
  catch (e) { console.log(`chhora: ${file} (${String(e.message).split('\n')[0]})`); failed++; continue; }

  const srcW = meta.width || 0;
  if (!srcW) { failed++; continue; }

  // Photo pehle se chhoti hai to kuch banane ka faida nahi.
  if (srcW <= WIDTHS[0]) { skipped++; continue; }

  const publicPath = `${PUBLIC_UPLOADS}/${path.relative(UPLOADS, file).split(path.sep).join('/')}`;
  const slug = slugOf(file);

  const plan = [];
  for (const w of WIDTHS) {
    if (w >= srcW) continue;                       // photo se bari mat banao
    const name = `${slug}-${w}.webp`;
    plan.push({ name, out: path.join(OUT_DIR, name), w });
  }
  // Sab se bara naap asli photo ka apna bhi shamil karo, taake bari screen par
  // bhi srcset ke andar hi rahe aur browser ko bahar jana na pare.
  plan.push({ name: null, out: null, w: srcW, original: true });

  if (plan.length < 2) { skipped++; continue; }    // sirf asli photo bachi, faida nahi

  const srcTime = fs.statSync(file).mtimeMs;
  const entry = [];

  for (const { name, out, w, original } of plan) {
    if (original) { entry.push({ src: publicPath, w }); continue; }

    entry.push({ src: `${PUBLIC_OUT}/${name}`, w });

    if (!FORCE && fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcTime) { kept++; continue; }
    if (CHECK) { made++; continue; }

    try {
      await sharp(file, { failOn: 'none' })
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);
      made++;
    } catch (e) {
      console.log(`chhora: ${name} (${String(e.message).split('\n')[0]})`);
      failed++;
    }
  }

  entry.sort((a, b) => a.w - b.w);
  manifest[publicPath] = entry;
}

if (!CHECK) {
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  // Purane naap jo ab kisi photo ke nahi rahe - hata do.
  const alive = new Set(Object.values(manifest).flat()
    .map((v) => v.src).filter((s) => s.startsWith(`${PUBLIC_OUT}/`))
    .map((s) => path.basename(s)));
  let swept = 0;
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (name.endsWith('.webp') && !alive.has(name)) { fs.unlinkSync(path.join(OUT_DIR, name)); swept++; }
  }
  if (swept) console.log(`Image sizes: ${swept} purane naap hataye.`);
}

console.log(
  `Image sizes: ${Object.keys(manifest).length} photos${CHECK ? '' : ' taiyar'}`
  + `, ${made} ${CHECK ? 'banane hain' : 'naye bane'}, ${kept} pehle se theek`
  + (skipped ? `, ${skipped} pehle hi chhoti` : '')
  + (failed ? `, ${failed} chhori` : '')
  + (CHECK ? '  (check only, kuch nahi bana)' : '')
);
