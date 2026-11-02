#!/usr/bin/env node
/**
 * audit-weight.mjs   (website ke folder mein, npm run build ke baad)
 *
 * Do sawalon ka jawab deta hai jo pehli script nahi de saki:
 *
 *   1. Har safhe par 100 KB aakhir hai KYA? Kaun sa hissa har jagah
 *      dohraya ja raha hai? Woh ek jagah theek ho to 115 safhon par
 *      faida hota hai.
 *
 *   2. Woh bari tasweeren waqai DOWNLOAD hoti hain ya sirf disk par
 *      pari hain? srcset laga ho to mobile chhoti wali leta hai aur
 *      bari file kabhi mangwai hi nahi jati — yeh farq bohat bara hai.
 *
 * KUCH BADALTA NAHI. Sirf dekhta hai.
 *
 *   node tools/audit-weight.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = path.join(ROOT, '_site');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

say('\nWAZAN KAHAN SE AA RAHA HAI');
say('='.repeat(78));

if (!fs.existsSync(SITE)) { say('XX  _site nahi mila. Pehle "npm run build" chalayein.'); process.exit(1); }

const pages = [];
const files = new Map();      /* raasta -> size */
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    const size = fs.statSync(f).size;
    const r = '/' + path.relative(SITE, f).split(path.sep).join('/');
    files.set(r, size);
    if (/\.html$/.test(e.name)) pages.push({ f, r, size });
  }
};
walk(SITE);

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const sumLen = (arr) => (arr || []).reduce((s, x) => s + x.length, 0);

/* ---------- 1. har safhe ka hissa ---------- */
say('');
say('1. HAR SAFHE KA WAZAN KIS CHEEZ MEIN HAI');
say('-'.repeat(78));

const parts = [];
for (const p of pages) {
  const html = read(p.f);
  const ld = sumLen(html.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi));
  const style = sumLen(html.match(/<style\b[\s\S]*?<\/style>/gi));
  const inlineJs = sumLen((html.match(/<script\b(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/gi) || [])
    .filter((s) => !/application\/ld\+json/i.test(s)));
  const svg = sumLen(html.match(/<svg\b[\s\S]*?<\/svg>/gi));
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0].length;
  parts.push({ r: p.r, total: html.length, ld, style, inlineJs, svg, head });
}

const avg = (k) => parts.reduce((s, x) => s + x[k], 0) / parts.length;
const pct = (v, t) => (v / t * 100).toFixed(0) + '%';
const aTotal = avg('total');

say('   Har safhe ki aosat (' + parts.length + ' safhe):');
say('');
say('      kul HTML              ' + kb(aTotal).padStart(9));
for (const [k, label] of [['ld', 'structured data (JSON-LD)'], ['style', 'inline CSS'], ['inlineJs', 'inline JavaScript'], ['svg', 'inline SVG (icons)'], ['head', 'poora head']]) {
  const v = avg(k);
  if (v < 200) continue;
  say('      ' + label.padEnd(24) + kb(v).padStart(9) + '   ' + pct(v, aTotal).padStart(4));
}

/* sab se chhota safha = boilerplate ki farsh */
parts.sort((a, b) => a.total - b.total);
const floor = parts[0];
say('');
say('   Sab se chhota safha: ' + kb(floor.total) + '   ' + floor.r);
say('   (Is se neechay koi safha nahi ja sakta — yeh har safhe par');
say('    dohraya jane wala hissa hai)');
say('');
say('      us mein:  JSON-LD ' + kb(floor.ld) + ' | inline CSS ' + kb(floor.style)
    + ' | inline JS ' + kb(floor.inlineJs) + ' | SVG ' + kb(floor.svg));

/* ---------- 2. bari tasweeren: waqai download hoti hain? ---------- */
say('');
say('2. BARI TASWEEREN — KYA WOH WAQAI MANGWAI JATI HAIN?');
say('-'.repeat(78));

const inSrc = new Set();          /* src= mein seedha */
const inSrcset = new Set();       /* sirf srcset mein */
let imgsWithSrcset = 0, srcsetNoSizes = 0;
const noSizesEx = [];

for (const p of pages) {
  const html = read(p.f);
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = (tag.match(/\ssrc\s*=\s*["']([^"']+)/i) || [])[1];
    const srcset = (tag.match(/\ssrcset\s*=\s*["']([^"']+)/i) || [])[1];
    if (src) inSrc.add(src.split('?')[0]);
    if (srcset) {
      imgsWithSrcset++;
      for (const cand of srcset.split(',')) {
        const u = cand.trim().split(/\s+/)[0];
        if (u) inSrcset.add(u.split('?')[0]);
      }
      if (!/\ssizes\s*=/.test(tag)) {
        srcsetNoSizes++;
        if (noSizesEx.length < 3) noSizesEx.push(p.r + '  ' + tag.slice(0, 100));
      }
    }
  }
}

const bigs = [...files.entries()]
  .filter(([r, s]) => /\.(jpe?g|png|webp|avif)$/i.test(r) && s > 300 * 1024)
  .sort((a, b) => b[1] - a[1]);

const servedBig = bigs.filter(([r]) => inSrc.has(r));
const onlyFallback = bigs.filter(([r]) => !inSrc.has(r) && inSrcset.has(r));
const unused = bigs.filter(([r]) => !inSrc.has(r) && !inSrcset.has(r));

say('   300 KB se bari tasweeren: ' + bigs.length);
say('');
say('   ' + (servedBig.length ? 'XX ' : 'OK ') + String(servedBig.length).padStart(4) + '  src= mein seedha likhi hain');
say('           (srcset na chale to yahi download hoti hain)');
say('   ' + '-- ' + String(onlyFallback.length).padStart(4) + '  sirf srcset mein hain');
say('   ' + '-- ' + String(unused.length).padStart(4) + '  kisi safhe par istemal hi nahi ho rahin');

if (servedBig.length) {
  say('');
  say('   src= wali bari tasweeren:');
  for (const [r, s] of servedBig.slice(0, 10)) say('      ' + kb(s).padStart(8) + '   ' + r);
  if (servedBig.length > 10) say('      ... aur ' + (servedBig.length - 10));
}
if (unused.length) {
  say('');
  say('   Istemal na hone wali (repo mein jagah lete hain, download nahi hotin):');
  for (const [r, s] of unused.slice(0, 6)) say('      ' + kb(s).padStart(8) + '   ' + r);
  if (unused.length > 6) say('      ... aur ' + (unused.length - 6));
}

say('');
say('3. srcset AUR sizes');
say('-'.repeat(78));
say('   srcset wali tasweeren: ' + imgsWithSrcset);
say('   ' + (srcsetNoSizes ? 'XX ' : 'OK ') + 'sizes ke bagair: ' + srcsetNoSizes);
if (srcsetNoSizes) {
  say('');
  say('   sizes na ho to browser maan leta hai ke tasweer poori chaurai');
  say('   leti hai, aur sab se bari file mangwa leta hai — srcset ka');
  say('   faida zaya ho jata hai. Misalein:');
  for (const e of noSizesEx) say('      ' + e);
}

/* ---------- khulasa ---------- */
say('');
say('='.repeat(78));
say('KHULASA');
say('');
say('   Har safha kam az kam ' + kb(floor.total) + ' ka hai. Us mein sab se bara hissa:');
const bits = [['JSON-LD', floor.ld], ['inline CSS', floor.style], ['inline JS', floor.inlineJs], ['inline SVG', floor.svg]]
  .sort((a, b) => b[1] - a[1]);
let named = 0;
for (const [label, v] of bits) if (v > 2048) { say('      ' + label.padEnd(14) + kb(v)); named++; }
const accounted = bits.reduce((s, [, v]) => s + v, 0);
if (floor.total - accounted > 10 * 1024) {
  say('      ' + 'baqi matan'.padEnd(14) + kb(floor.total - accounted) + '   (nav, footer, cards waghera)');
}
if (!named && floor.total - accounted <= 10 * 1024) say('      (kuch bhi bara nahi — safhe halke hain)');
say('');
say('   Yeh har safhe par dohraya jata hai. Ek jagah kam karein to');
say('   ' + parts.length + ' safhon par faida hota hai.');
if (servedBig.length) {
  say('');
  say('   ' + servedBig.length + ' bari tasweeren src= mein seedha likhi hain — inhein');
  say('   chhota karna sab se zyada asar dalega.');
} else {
  say('');
  say('   Koi bari tasweer src= mein seedha nahi hai — srcset apna kaam');
  say('   kar raha hai, aur mobile par chhoti file hi mangwai jati hai.');
}
say('');

fs.writeFileSync(path.join(ROOT, '_weight.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _weight.txt');
