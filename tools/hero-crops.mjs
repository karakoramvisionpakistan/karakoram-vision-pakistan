// Har banner photo se teen shaklon ki katai banata hai.
//
// Masla: ek hi photo ko bari screen par chaura patta banna parta hai aur mobile
// par lamba dabba. Ek hi file se dono kaam lena mumkin nahi - ya photo katti
// hai, ya khali jagah bachti hai. Bari websites yeh nahi karteen; woh har screen
// ke liye pehle se alag kati hui photo rakhti hain. Usey "art direction" kehte
// hain, aur yeh script wohi kaam khud ba khud karti hai.
//
// Teen shaklein:
//   wide  16:10   bari screen (1280 se oopar)
//   mid    5:4    tablet (768 se 1279)
//   tall   9:16   mobile (767 tak)
//
// Katai andhadhund nahi hoti - sharp khud dekhta hai ke photo mein ahem hissa
// kahan hai (choti, chehra, roshan hissa) aur usey bachata hai. Agar kisi slide
// par CMS mein "focus" chuna gaya ho to us ka kehna mana jata hai.
//
// Nateeja: src/assets/hero/ mein kati hui files, aur src/_data/heroImages.json
// mein un ki fehrist, jise template <picture> banane ke liye parhta hai.
//
// Pehle se bani files dobara nahi banteen, is liye har build mein sirf nayi
// photo par kaam hota hai.
//
//   node tools/hero-crops.mjs            -> jo kami hai woh bana deta hai
//   node tools/hero-crops.mjs --force    -> sab dobara banata hai
//   node tools/hero-crops.mjs --check    -> sirf batata hai, kuch nahi banata
import fs from 'node:fs';
import path from 'node:path';

const FORCE = process.argv.includes('--force');
const CHECK = process.argv.includes('--check');

const UPLOADS = 'src/assets/uploads';
const OUT_DIR = 'src/assets/hero';
const MANIFEST = 'src/_data/heroImages.json';
const PUBLIC_UPLOADS = '/assets/uploads';
const PUBLIC_OUT = '/assets/hero';

// w/h. Mobile ki shakal 0.5625 hai kyunke 390x690 ki screen par banner takreeban
// isi naap ka banta hai.
// Har shakal ke do naap: ek aam screen ke liye, ek us se dugni kasafat wali
// screen (retina) ke liye. Is se zyada naap rakhne ka faida aankh ko nahi
// hota, bas repo bhaari ho jata hai.
const SHAPES = {
  wide: { ratio: 16 / 10, widths: [1280, 1920] },
  mid: { ratio: 5 / 4, widths: [840, 1400] },
  tall: { ratio: 9 / 16, widths: [420, 840] },
};
const QUALITY = 76;

// CMS ka "focus" -> sharp ki gravity
const GRAVITY = {
  top: 'north', bottom: 'south', left: 'west', right: 'east', center: 'centre', centre: 'centre',
};

let sharp;
try { sharp = (await import('sharp')).default; }
catch {
  console.log('Hero crops: "sharp" nahi mila, chhor diya (banner phir bhi chalega).');
  process.exit(0);
}

// ------------------------------------------------------------------ helpers
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).flatMap((n) => {
  const p = path.join(dir, n);
  return fs.statSync(p).isDirectory() ? walk(p) : [p];
}) : []);

function frontMatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  return m ? m[1] : '';
}

function fmValue(fm, key) {
  const m = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(fm);
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '').trim();
}

// "/assets/uploads/foo.webp" -> "src/assets/uploads/foo.webp" (warna khali)
function sourceOf(publicPath) {
  const v = String(publicPath || '').trim();
  if (!v.startsWith(`${PUBLIC_UPLOADS}/`)) return '';
  if (/\.svg$/i.test(v)) return '';                      // SVG kaatne ka faida nahi
  const file = path.join(UPLOADS, v.slice(PUBLIC_UPLOADS.length + 1));
  return fs.existsSync(file) ? file : '';
}

const slugOf = (file) => path.basename(file, path.extname(file))
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ------------------------------------------------------------------ kaam ki photos jama karo
// Har entry: { image: "/assets/uploads/x.webp", focus: "top" | "" }
const wanted = new Map();
const add = (image, focus = '') => {
  const src = sourceOf(image);
  if (!src) return;
  const prev = wanted.get(image);
  if (!prev || (!prev.focus && focus)) wanted.set(image, { src, focus });
};

// 1. CMS ki banai hui slides
for (const file of walk('src/content/sliders')) {
  if (!file.endsWith('.md')) continue;
  const fm = frontMatter(file);
  add(fmValue(fm, 'image'), fmValue(fm, 'focus'));
}

// 2. Jin pages par slider band hai lekin ek photo lagi hai
try {
  const hero = JSON.parse(fs.readFileSync('src/_data/heroSettings.json', 'utf8'));
  for (const v of Object.values(hero)) if (v && typeof v === 'object') add(v.image);
} catch { /* file na ho to koi baat nahi */ }

// 3. Khud-kar slider journeys ki cover photos uthata hai
for (const folder of ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services', 'vehicles']) {
  for (const file of walk(path.join('src/content', folder))) {
    if (!file.endsWith('.md')) continue;
    add(fmValue(frontMatter(file), 'cover_image'));
  }
}

if (!wanted.size) { console.log('Hero crops: koi banner photo nahi mili.'); process.exit(0); }

// ------------------------------------------------------------------ katai
if (!CHECK && !fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = {};
let made = 0, kept = 0, failed = 0;

for (const [publicPath, { src, focus }] of wanted) {
  let meta;
  try { meta = await sharp(src).metadata(); }
  catch (e) { console.log(`chhora: ${publicPath} (${String(e.message).split('\n')[0]})`); failed++; continue; }

  const srcW = meta.width || 0, srcH = meta.height || 0;
  if (!srcW || !srcH) { console.log(`chhora: ${publicPath} (naap nahi mila)`); failed++; continue; }

  const slug = slugOf(src);

  // Pehle poora naqsha banao, banana baad mein. Agar koi ek shakal bhi na ban
  // sake to is photo ko haath hi nahi lagana - warna hum aisi files bana denge
  // jo fehrist mein nahi aatin aur agli safai mein hat jati hain.
  const entry = {};
  const plan = [];
  for (const [shape, { ratio, widths }] of Object.entries(SHAPES)) {
    const seen = new Set();
    entry[shape] = [];

    for (const want of widths) {
      let w = want, h = Math.round(want / ratio);
      // Photo se bari katai mat banao - warna dhundhli ho jayegi.
      const fit = Math.min(srcW / w, srcH / h, 1);
      if (fit < 1) { w = Math.round(w * fit); h = Math.round(h * fit); }
      if (w < 160 || h < 160) continue;
      const key = `${w}x${h}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const name = `${slug}--${shape}-${w}.webp`;
      entry[shape].push({ src: `${PUBLIC_OUT}/${name}`, w, h });
      plan.push({ name, out: path.join(OUT_DIR, name), w, h });
    }
  }

  const thin = Object.entries(entry).filter(([, list]) => !list.length).map(([s]) => s);
  if (thin.length) {
    console.log(`chhora: ${publicPath} (photo itni chhoti hai ke ${thin.join(', ')} wali katai nahi ban sakti)`);
    failed++;
    continue;
  }

  const srcTime = fs.statSync(src).mtimeMs;
  for (const { name, out, w, h } of plan) {
    if (!FORCE && fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcTime) { kept++; continue; }
    if (CHECK) { made++; continue; }

    try {
      await sharp(src, { failOn: 'none' })
        .rotate()
        .resize(w, h, {
          fit: 'cover',
          position: GRAVITY[focus] || sharp.strategy.attention,
        })
        .webp({ quality: QUALITY })
        .toFile(out);
      made++;
    } catch (e) {
      console.log(`chhora: ${name} (${String(e.message).split('\n')[0]})`);
      failed++;
    }
  }

  manifest[publicPath] = entry;
}

if (!CHECK) {
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  // Purani katai jo ab kisi photo ki nahi rahi - hata do, warna folder barhta jayega.
  const alive = new Set(Object.values(manifest).flatMap((e) => Object.values(e).flat().map((v) => path.basename(v.src))));
  let swept = 0;
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (name.endsWith('.webp') && !alive.has(name)) { fs.unlinkSync(path.join(OUT_DIR, name)); swept++; }
  }
  if (swept) console.log(`Hero crops: ${swept} purani katai hatai.`);
}

console.log(
  `Hero crops: ${Object.keys(manifest).length} photos${CHECK ? '' : ' taiyar'}`
  + `, ${made} ${CHECK ? 'banani hain' : 'nayi bani'}, ${kept} pehle se theek`
  + (failed ? `, ${failed} chhori` : '')
  + (CHECK ? '  (check only, kuch nahi bana)' : '')
);
