#!/usr/bin/env node
/**
 * fix-gallery-src.mjs
 *
 * Masla: journey / trekking / tours ke detail page par gallery thumbnails
 * <img src="[object Object]"> ban rahe hain.
 *
 * Wajah: template sirf  (image.image or image.src or image)  dekhta hai,
 * lekin CMS gallery item ko kisi aur key naam se save karta hai.
 *
 * Yeh script:
 *   1. content files parh kar khud pata lagati hai ke asal key ka naam kya hai
 *   2. har .njk mein us key ko chain mein shaamil kar deti hai
 *   3. base.njk ka cache-busting fix (assetVersion) bhi laga deti hai, agar chhoot gaya ho
 *
 * Chalane ka tareeqa:
 *   node tools/fix-gallery-src.mjs            -> sirf dekhna (kuch likhta nahi)
 *   node tools/fix-gallery-src.mjs --write    -> tabdeeli save karna
 *
 * Dobara chalane se koi nuqsan nahi (idempotent).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

const C = {
  head: (s) => console.log('\n' + s),
  ok: (s) => console.log('  OK   ' + s),
  info: (s) => console.log('       ' + s),
  warn: (s) => console.log('  !    ' + s),
  bad: (s) => console.log('  XX   ' + s),
};

/* ---------------------------------------------------------- helpers ----- */

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function frontMatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  return text.slice(3, end);
}

/** gallery: ke neechay ke saare indented lines */
function galleryBlock(fm) {
  const lines = fm.split(/\r?\n/);
  const i = lines.findIndex((l) => /^gallery\s*:/.test(l));
  if (i === -1) return null;
  const out = [lines[i]];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^\S/.test(lines[j])) break;
    out.push(lines[j]);
  }
  return out;
}

const IMG_RE = /\.(webp|jpe?g|png|avif|gif|svg)(\?|$)/i;
const KEY_RE = /^\s*(?:-\s*)?([A-Za-z0-9_]+)\s*:\s*["']?([^"'\s][^"']*?)["']?\s*$/;

/* ------------------------------------------------- 1. content scan ------ */

C.head('1) Content files mein gallery ki shakal dekh rahe hain');

const contentDirs = [
  path.join(ROOT, 'src', 'content'),
  path.join(ROOT, 'content'),
];

const mdFiles = contentDirs.flatMap((d) => walk(d)).filter((f) => f.endsWith('.md'));
C.info(`${mdFiles.length} markdown files mili`);

const keyCount = new Map();       // key naam -> kitni baar mila
const samples = [];               // pehli chand misaalein
let withGallery = 0;

for (const file of mdFiles) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const fm = frontMatter(text);
  if (!fm) continue;
  const block = galleryBlock(fm);
  if (!block || block.length < 2) continue;

  withGallery++;
  const keysHere = new Set();

  for (const line of block.slice(1)) {
    const m = line.match(KEY_RE);
    if (!m) continue;
    const [, key, value] = m;
    if (IMG_RE.test(value) || value.startsWith('/assets/')) {
      keysHere.add(key);
      keyCount.set(key, (keyCount.get(key) || 0) + 1);
    }
  }

  if (samples.length < 3) {
    samples.push({
      file: path.relative(ROOT, file),
      keys: [...keysHere],
      block: block.slice(0, 14),
    });
  }
}

C.info(`${withGallery} files mein gallery mojood hai`);

if (!withGallery) {
  C.bad('Koi gallery wali file nahi mili. Content folder ka naam alag ho sakta hai.');
  C.info('Agar content kahin aur hai to mujhe bata dein, script ka raasta badal doonga.');
  process.exit(1);
}

C.head('   Misaal (raw front matter):');
for (const s of samples) {
  console.log('   --- ' + s.file);
  for (const l of s.block) console.log('   ' + l);
  console.log('       keys mile: ' + (s.keys.join(', ') || '(koi nahi)'));
}

const foundKeys = [...keyCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
C.head('2) Jo key naam istemaal ho rahe hain');
if (!foundKeys.length) {
  C.bad('Image path kisi key ke saath nahi mila.');
  C.info('Oopar wali raw misaal mujhe bhej dein, main haath se theek kar doonga.');
  process.exit(1);
}
for (const k of foundKeys) C.info(`${k}  (${keyCount.get(k)} jagah)`);

const extra = foundKeys.filter((k) => k !== 'image' && k !== 'src' && k !== 'alt');
if (!extra.length) {
  C.ok('Keys to theek hain (image/src). Matlab masla kahin aur hai.');
} else {
  C.warn('Template in keys ko nahi dekhta: ' + extra.join(', '));
}

/* ------------------------------------------------- 2. njk patch --------- */

C.head('3) Templates theek kar rahe hain');

const OLD_CHAIN = 'image.image or image.src or image';
const newChain = ['image.image', 'image.src', ...extra.map((k) => 'image.' + k), 'image'].join(' or ');

const njkFiles = walk(path.join(ROOT, 'src')).filter((f) => f.endsWith('.njk'));
const edits = [];

for (const file of njkFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(OLD_CHAIN)) continue;
  if (text.includes(newChain) && newChain !== OLD_CHAIN) continue; // pehle se laga hua
  const hits = text.split(OLD_CHAIN).length - 1;
  edits.push({ file, hits, next: text.split(OLD_CHAIN).join(newChain) });
}

if (!extra.length) {
  C.info('Chain badalne ki zaroorat nahi.');
} else if (!edits.length) {
  C.ok('Saare templates pehle se theek hain.');
} else {
  for (const e of edits) {
    C.info(`${path.relative(ROOT, e.file)}  (${e.hits} jagah)`);
  }
  C.info('Nayi chain: (' + newChain + ')');
}

/* ------------------------------------------------- 3. base.njk ---------- */

C.head('4) base.njk ka cache fix');

const basePath = path.join(ROOT, 'src', '_includes', 'layouts', 'base.njk');
const assetDataPath = path.join(ROOT, 'src', '_data', 'assetVersion.js');
let baseEdit = null;

if (!fs.existsSync(basePath)) {
  C.warn('base.njk nahi mili, chhoR rahe hain.');
} else if (!fs.existsSync(assetDataPath)) {
  C.warn('src/_data/assetVersion.js mojood nahi — cache fix skip.');
} else {
  const baseText = fs.readFileSync(basePath, 'utf8');
  if (baseText.includes('assetVersion')) {
    C.ok('base.njk pehle se theek hai.');
  } else {
    const next = baseText
      .replace(/(\/assets\/css\/site\.css\?v=)[^"']+/g, '$1{{ assetVersion }}')
      .replace(/(\/assets\/css\/theme-vars\.css\?v=)[^"']+/g, '$1{{ assetVersion }}');
    if (next === baseText) {
      C.warn('Stylesheet ki line pehchani nahi gayi — haath se dekhna paRega.');
    } else {
      baseEdit = { file: basePath, next };
      C.warn('base.njk mein abhi purana v=11.15.0 laga hai, theek kiya ja raha hai.');
    }
  }
}

/* ------------------------------------------------- 4. write ------------- */

const total = edits.length + (baseEdit ? 1 : 0);

C.head('--------------------------------------------------');
if (!total) {
  console.log('Kuch badalne ko nahi hai.');
  process.exit(0);
}

if (!WRITE) {
  console.log(`${total} file(s) badlengi.`);
  console.log('Save karne ke liye dobara chalayein:');
  console.log('   node tools/fix-gallery-src.mjs --write');
  process.exit(0);
}

for (const e of edits) {
  fs.writeFileSync(e.file, e.next, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, e.file));
}
if (baseEdit) {
  fs.writeFileSync(baseEdit.file, baseEdit.next, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, baseEdit.file));
}
console.log('\nHo gaya. Ab: npm run build  (ya seedha commit + push)');
