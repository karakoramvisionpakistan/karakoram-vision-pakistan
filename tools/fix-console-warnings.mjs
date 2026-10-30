#!/usr/bin/env node
/**
 * fix-console-warnings.mjs
 *
 * 1) Faaltu preload:
 *    base.njk har safhe par pageImage preload karta hai, aur jis safhe ki
 *    apni cover photo nahi hoti wahan social-sharing wali og.jpg utha leta
 *    hai — jo safhe par dikhti hi nahi. Natija: har visitor ke paas ek
 *    bilawajah tasveer jaati hai aur asli hero photo peechay reh jaati hai.
 *    Hal: preload sirf tab jab safhe ki apni cover photo mojood ho.
 *
 * 2) CSP:
 *    Cloudflare ka apna analytics script (static.cloudflareinsights.com)
 *    block ho raha hai. Agar repo mein CSP mili to us pate ki ijazat de dein.
 *
 *   node tools/fix-console-warnings.mjs            -> sirf dekhna
 *   node tools/fix-console-warnings.mjs --write    -> save karna
 *
 * Dobara chalane se nuqsan nahi.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const planned = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git') || e.name === '_site') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/* ============================================ 1) preload =============== */

console.log('\n1) Faaltu preload (base.njk)');

const BASE = path.join(ROOT, 'src', '_includes', 'layouts', 'base.njk');

const OLD_PRELOAD =
  `{% if pageImage %}<link rel="preload" as="image" href="{{ pageImage }}" fetchpriority="high">{% endif %}`;

const NEW_PRELOAD =
  `{% set preloadImage = cover_image | safeMedia(cover_source, '') %}` +
  `{% if preloadImage and preloadImage != site.seo.default_social_image %}` +
  `<link rel="preload" as="image" href="{{ preloadImage }}" fetchpriority="high">{% endif %}`;

if (!fs.existsSync(BASE)) {
  console.log('   XX  base.njk nahi mili.');
} else {
  const t = fs.readFileSync(BASE, 'utf8');
  if (t.includes('preloadImage')) {
    console.log('   OK  pehle se theek hai.');
  } else if (t.includes(OLD_PRELOAD)) {
    planned.push({ file: BASE, text: t.replace(OLD_PRELOAD, NEW_PRELOAD) });
    console.log('   ->  preload ab sirf us safhe par jiski apni cover photo ho.');
  } else {
    console.log('   !   preload wali line pehchani nahi gayi — chhoR rahe hain.');
  }
}

/* ============================================ 2) CSP =================== */

console.log('\n2) CSP — Cloudflare analytics');

const CF = 'https://static.cloudflareinsights.com';
const candidates = walk(ROOT).filter((f) => {
  const b = path.basename(f);
  return (
    b === '_headers' ||
    b === 'netlify.toml' ||
    b === 'wrangler.toml' ||
    /\.(njk|js|mjs|json|toml|txt)$/.test(b)
  );
});

const cspFiles = [];
for (const f of candidates) {
  let t;
  try {
    t = fs.readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  if (t.includes('script-src')) cspFiles.push({ f, t });
}

if (!cspFiles.length) {
  console.log('   !   Repo mein CSP kahin nahi mili.');
  console.log('       Matlab yeh Cloudflare dashboard se aa rahi hai —');
  console.log('       wahan Web Analytics band kar dein ya pata allow karein.');
} else {
  for (const { f, t } of cspFiles) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    if (t.includes('static.cloudflareinsights.com')) {
      console.log('   OK  ' + rel + '  (ijazat pehle se mojood)');
      continue;
    }
    const next = t.replace(/script-src ([^;"'\n]*)/g, (m, rest) =>
      `script-src ${rest.trim()} ${CF}`
    );
    if (next === t) {
      console.log('   !   ' + rel + '  — script-src line badli nahi ja saki.');
    } else {
      planned.push({ file: f, text: next });
      console.log('   ->  ' + rel + '  mein ' + CF + ' allow kiya ja raha hai.');
    }
  }
}

/* ============================================ write ==================== */

console.log('\n--------------------------------------------------');

if (!planned.length) {
  console.log('Kuch badalne ko nahi hai.');
  process.exit(0);
}

if (!WRITE) {
  console.log(planned.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/fix-console-warnings.mjs --write');
  process.exit(0);
}

for (const p of planned) {
  fs.writeFileSync(p.file, p.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, p.file));
}
console.log('\nHo gaya. Ab build kar ke dekh lein.');
