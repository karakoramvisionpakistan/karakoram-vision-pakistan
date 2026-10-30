#!/usr/bin/env node
/**
 * fix-gallery-collision.mjs
 *
 * Masla: src/_data/gallery.js Eleventy mein "gallery" naam ka global banata hai.
 * Journey / trek / tour template mein likha hai:
 *     {% set journeyGallery = gallery or [] %}
 * Jis page ki apni front matter mein gallery nahi hoti, wahan yeh global
 * (album objects ki list) aa jata hai -> src="[object Object]".
 *
 * Hal: global ka naam photoGallery kar dein aur Photo Gallery safha naye naam par.
 *
 * Saath mein: base.njk ka assetVersion (cache) fix, agar chhoota hua ho.
 * Aur: baaqi _data naamon ki takkar ki jaanch (sirf report).
 *
 *   node tools/fix-gallery-collision.mjs            -> sirf dekhna
 *   node tools/fix-gallery-collision.mjs --write    -> save karna
 *
 * Dobara chalane se nuqsan nahi.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

const OLD_NAME = 'gallery';
const NEW_NAME = 'photoGallery';

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

const planned = [];   // { kind, from, to, text? }
let blocked = false;

/* ============================================ 1) data file rename ======= */

console.log('\n1) Global data file');

const oldData = path.join(ROOT, 'src', '_data', OLD_NAME + '.js');
const newData = path.join(ROOT, 'src', '_data', NEW_NAME + '.js');

if (fs.existsSync(newData)) {
  console.log('   OK   photoGallery.js pehle se mojood hai.');
} else if (!fs.existsSync(oldData)) {
  console.log('   !    src/_data/gallery.js nahi mili — shayad pehle hi badal chuki hai.');
} else {
  planned.push({ kind: 'rename', from: oldData, to: newData });
  console.log('   ->   src/_data/gallery.js  ==>  src/_data/photoGallery.js');
}

/* ============================================ 2) njk scan =============== */

console.log('\n2) Templates mein bare "gallery" ka istemaal');

/** sirf {{ }} aur {% %} ke andar, quotes aur .gallery ko chhoR kar */
const TAG_RE = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g;
const ID_RE = /'[^']*'|"[^"]*"|(?<![.\w-])gallery\b/g;

function tagsWithGallery(text) {
  const hits = [];
  for (const m of text.matchAll(TAG_RE)) {
    const tag = m[0];
    let found = false;
    tag.replace(ID_RE, (s, ...rest) => {
      if (s === 'gallery') found = true;
      return s;
    });
    if (found) hits.push(tag.trim());
  }
  return hits;
}

function renameInTags(text) {
  return text.replace(TAG_RE, (tag) =>
    tag.replace(ID_RE, (s) => (s === 'gallery' ? NEW_NAME : s))
  );
}

const njkFiles = walk(path.join(ROOT, 'src')).filter((f) => f.endsWith('.njk'));

const inGalleryPage = [];
const elsewhere = [];

for (const file of njkFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const hits = tagsWithGallery(text);
  if (!hits.length) continue;
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  (rel.startsWith('src/gallery/') ? inGalleryPage : elsewhere).push({ file, rel, hits, text });
}

if (!inGalleryPage.length) {
  console.log('   !    src/gallery/ mein bare "gallery" kahin nahi mila.');
} else {
  for (const f of inGalleryPage) {
    console.log('   ->   ' + f.rel + '  (' + f.hits.length + ' jagah)');
    for (const h of f.hits.slice(0, 8)) console.log('          ' + h);
    planned.push({ kind: 'edit', from: f.file, text: renameInTags(f.text) });
  }
}

console.log('\n   Baaqi files jahan "gallery" naam aata hai (yeh front matter wala hai, chheRa nahi ja raha):');
if (!elsewhere.length) {
  console.log('          (koi nahi)');
} else {
  for (const f of elsewhere) {
    console.log('          ' + f.rel);
    for (const h of f.hits.slice(0, 4)) console.log('              ' + h);
  }
}

/* ============================================ 3) aur takkarein ========== */

console.log('\n3) Baaqi _data naamon ki takkar');

const dataNames = fs.existsSync(path.join(ROOT, 'src', '_data'))
  ? fs.readdirSync(path.join(ROOT, 'src', '_data'))
      .filter((f) => f.endsWith('.js'))
      .map((f) => f.replace(/\.js$/, ''))
  : [];

const contentDirs = [path.join(ROOT, 'src', 'content'), path.join(ROOT, 'content')];
const mdFiles = contentDirs.flatMap((d) => walk(d)).filter((f) => f.endsWith('.md'));

const fmKeys = new Map(); // key -> count
for (const file of mdFiles) {
  const t = fs.readFileSync(file, 'utf8');
  if (!t.startsWith('---')) continue;
  const end = t.indexOf('\n---', 3);
  if (end === -1) continue;
  for (const line of t.slice(3, end).split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:/);
    if (m) fmKeys.set(m[1], (fmKeys.get(m[1]) || 0) + 1);
  }
}

const clashes = dataNames.filter((n) => fmKeys.has(n));
if (!clashes.length) {
  console.log('   OK   aur koi takkar nahi.');
} else {
  for (const c of clashes) {
    const flag = c === OLD_NAME ? '  (yahi theek ho raha hai)' : '  <-- dekhna paRega';
    console.log('   !    ' + c + '  — ' + fmKeys.get(c) + ' content files mein bhi hai' + flag);
  }
}

/* ============================================ 4) base.njk =============== */

console.log('\n4) base.njk cache fix');

const basePath = path.join(ROOT, 'src', '_includes', 'layouts', 'base.njk');
const assetData = path.join(ROOT, 'src', '_data', 'assetVersion.js');

if (!fs.existsSync(basePath)) {
  console.log('   !    base.njk nahi mili.');
} else if (!fs.existsSync(assetData)) {
  console.log('   !    assetVersion.js nahi mili — skip.');
} else {
  const t = fs.readFileSync(basePath, 'utf8');
  if (t.includes('assetVersion')) {
    console.log('   OK   pehle se theek hai.');
  } else {
    const next = t
      .replace(/(\/assets\/css\/site\.css\?v=)[^"']+/g, '$1{{ assetVersion }}')
      .replace(/(\/assets\/css\/theme-vars\.css\?v=)[^"']+/g, '$1{{ assetVersion }}');
    if (next === t) {
      console.log('   !    stylesheet line pehchani nahi gayi.');
    } else {
      planned.push({ kind: 'edit', from: basePath, text: next });
      console.log('   ->   site.css aur theme-vars.css ab {{ assetVersion }} par');
    }
  }
}

/* ============================================ 5) write ================== */

console.log('\n--------------------------------------------------');

if (!planned.length) {
  console.log('Kuch badalne ko nahi hai.');
  process.exit(0);
}

if (!WRITE) {
  console.log(planned.length + ' tabdeeli hogi. Save karne ke liye:');
  console.log('   node tools/fix-gallery-collision.mjs --write');
  process.exit(0);
}

for (const p of planned) {
  if (p.kind === 'rename') {
    fs.renameSync(p.from, p.to);
    console.log('RENAME: ' + path.relative(ROOT, p.from) + ' -> ' + path.relative(ROOT, p.to));
  } else {
    fs.writeFileSync(p.from, p.text, 'utf8');
    console.log('LIKHA : ' + path.relative(ROOT, p.from));
  }
}

console.log('\nHo gaya. Ab build kar ke dekh lein.');
