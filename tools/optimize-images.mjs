// Shrinks oversized images that editors upload (src/assets/uploads).
// - Only touches jpg/png/webp that are wider than 2000px or bigger than 500 KB
// - Keeps the same file name and format, so no links ever break
// - Never fails the build: if "sharp" is missing or a file can't be read, it is skipped
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, extname, relative } from 'node:path';

const root = resolve(process.argv[2] || 'src/assets/uploads');
const MAX_WIDTH = 2000, MAX_BYTES = 500 * 1024;

let sharp;
try { sharp = (await import('sharp')).default; }
catch { console.log('Image optimizer skipped (package "sharp" not installed).'); process.exit(0); }
if (!existsSync(root)) { console.log('Image optimizer: no uploads folder.'); process.exit(0); }

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

let done = 0, saved = 0;
for (const file of walk(root)) {
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
  try {
    const size = statSync(file).size;
    const input = readFileSync(file);
    const meta = await sharp(input).metadata();
    if (size <= MAX_BYTES && (meta.width || 0) <= MAX_WIDTH) continue;
    let img = sharp(input, { failOn: 'none' }).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
    if (ext === '.png') img = img.png({ compressionLevel: 9 });
    else if (ext === '.webp') img = img.webp({ quality: 82 });
    else img = img.jpeg({ quality: 82, mozjpeg: true });
    const out = await img.toBuffer();
    if (out.length < size) {
      writeFileSync(file, out); done++; saved += size - out.length;
      console.log(`optimized: ${relative(process.cwd(), file)}  ${(size / 1024) | 0} KB -> ${(out.length / 1024) | 0} KB`);
    }
  } catch (e) { console.log(`skipped: ${relative(process.cwd(), file)} (${String(e.message).split('\n')[0]})`); }
}
console.log(done ? `Optimized ${done} image(s), saved ${(saved / 1024 / 1024).toFixed(1)} MB.` : 'Images OK.');