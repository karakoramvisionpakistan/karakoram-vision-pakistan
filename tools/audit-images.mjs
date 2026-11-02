#!/usr/bin/env node
/**
 * audit-images.mjs   (website ke folder mein, npm run build ke baad)
 *
 * Asli sawal ka jawab: mobile par har safhe ki SAB SE BARI tasweer ka
 * wazan kitna hai? Wahi LCP banti hai.
 *
 * Pichhli script ne do ghaltiyan ki thin, dono yahan theek hain:
 *
 *   1. "src= mein bari tasweer" ginti thi, magar yeh nahi dekhti thi ke
 *      usi tag par srcset bhi hai ya nahi. srcset ho to browser src ko
 *      haath hi nahi lagata, aur bari file kabhi download nahi hoti.
 *
 *   2. "sab se chhota safha" mein redirect ke tukre bhi shamil the, jo
 *      safhe hote hi nahi. Us se farsh 0 KB nikal aati thi.
 *
 * Mobile ka andaza: 390px chaurai, DPR 2, yani taqreeban 780px. sizes
 * mein "100vw" ho to browser 780w se bari pehli candidate leta hai.
 * Yeh andaza hai, naap nahi — asli number PageSpeed batata hai.
 *
 * KUCH BADALTA NAHI.
 *
 *   node tools/audit-images.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = path.join(ROOT, '_site');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

const MOBILE_PX = 780;          /* 390 CSS px x DPR 2 */
const STUB = 5 * 1024;          /* is se chhoti "HTML" redirect hoti hai */

say('\nTASWEEREN — MOBILE PAR KYA DOWNLOAD HOTA HAI');
say('='.repeat(78));

if (!fs.existsSync(SITE)) { say('XX  _site nahi mila. Pehle "npm run build" chalayein.'); process.exit(1); }

const sizes = new Map();
const pages = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    const s = fs.statSync(f).size;
    const r = '/' + path.relative(SITE, f).split(path.sep).join('/');
    sizes.set(r, s);
    if (/\.html$/.test(e.name)) pages.push({ f, r, size: s });
  }
};
walk(SITE);

const real = pages.filter((p) => p.size >= STUB);
const stubs = pages.length - real.length;

/* ---------- 1. safhon ki farsh ---------- */
say('');
say('1. SAFHON KA ASLI WAZAN');
say('-'.repeat(78));
say('   ' + real.length + ' asli safhe' + (stubs ? '  (+' + stubs + ' redirect ke tukre, shumar se bahar)' : ''));
real.sort((a, b) => a.size - b.size);
say('');
say('   Sab se halke:');
for (const p of real.slice(0, 4)) say('      ' + kb(p.size).padStart(8) + '   ' + p.r);
say('');
say('   Sab se bhari:');
for (const p of real.slice(-4).reverse()) say('      ' + kb(p.size).padStart(8) + '   ' + p.r);

/* ---------- har tasweer ka faisla ---------- */
const LOGOish = /logo|favicon|icon|sprite|placeholder/i;
const parseSrcset = (ss) => (ss || '').split(',').map((c) => {
  const bits = c.trim().split(/\s+/);
  const w = (bits[1] || '').match(/^(\d+)w$/);
  return { url: (bits[0] || '').split('?')[0], w: w ? Number(w[1]) : null };
}).filter((x) => x.url);

/* browser kaun si file legi */
const pick = (tag) => {
  const src = ((tag.match(/\ssrc\s*=\s*["']([^"']+)/i) || [])[1] || '').split('?')[0];
  const cands = parseSrcset((tag.match(/\ssrcset\s*=\s*["']([^"']+)/i) || [])[1]);
  const withW = cands.filter((c) => c.w);
  if (!withW.length) return { url: src, how: 'src' };
  withW.sort((a, b) => a.w - b.w);
  const chosen = withW.find((c) => c.w >= MOBILE_PX) || withW[withW.length - 1];
  return { url: chosen.url, how: 'srcset ' + chosen.w + 'w' };
};

let noSrcsetBig = [];
let heroes = [];
let totalDownload = 0;

for (const p of real) {
  let html;
  try { html = fs.readFileSync(p.f, 'utf8'); } catch { continue; }
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  let first = null;

  for (const tag of imgs) {
    const chosen = pick(tag);
    const size = sizes.get(chosen.url) || 0;
    if (chosen.how === 'src' && size > 150 * 1024) {
      noSrcsetBig.push({ page: p.r, url: chosen.url, size });
    }
    if (!first) {
      const src = ((tag.match(/\ssrc\s*=\s*["']([^"']+)/i) || [])[1] || '');
      if (src && !LOGOish.test(src)) {
        first = { page: p.r, url: chosen.url, how: chosen.how, size, lazy: /loading\s*=\s*["']lazy/i.test(tag) };
      }
    }
  }
  if (first) { heroes.push(first); totalDownload += first.size; }
}

/* ---------- 2. LCP wali tasweer ---------- */
say('');
say('2. HAR SAFHE KI PEHLI TASWEER (yahi aksar LCP hoti hai)');
say('-'.repeat(78));
say('   Mobile ka andaza: ' + MOBILE_PX + 'px chaurai');
say('');
heroes.sort((a, b) => b.size - a.size);
const avgHero = heroes.length ? heroes.reduce((s, h) => s + h.size, 0) / heroes.length : 0;
say('   aosat wazan: ' + kb(avgHero));
say('');
say('   Sab se bhari:');
for (const h of heroes.slice(0, 10)) {
  const flag = h.size > 200 * 1024 ? 'XX ' : h.size > 120 * 1024 ? '!! ' : 'OK ';
  say('   ' + flag + kb(h.size).padStart(8) + '  ' + (h.lazy ? '[lazy] ' : '       ') + h.page);
  say('            ' + h.how + '  ' + h.url);
}
const over200 = heroes.filter((h) => h.size > 200 * 1024).length;
const lazyOnes = heroes.filter((h) => h.lazy).length;
say('');
say('   ' + (over200 ? 'XX ' : 'OK ') + over200 + ' safhon par pehli tasweer 200 KB se bari hai');
say('   ' + (lazyOnes ? 'XX ' : 'OK ') + lazyOnes + ' safhon par pehli tasweer lazy hai');

/* ---------- 3. srcset ke bagair bari tasweeren ---------- */
say('');
say('3. srcset KE BAGAIR BARI TASWEEREN');
say('-'.repeat(78));
const uniq = new Map();
for (const x of noSrcsetBig) if (!uniq.has(x.url)) uniq.set(x.url, x);
const list = [...uniq.values()].sort((a, b) => b.size - a.size);
if (!list.length) say('   OK  Koi nahi — har bari tasweer par srcset laga hua hai.');
else {
  say('   XX  ' + list.length + ' tasweeren poore naap mein download hoti hain:');
  for (const x of list.slice(0, 10)) {
    say('       ' + kb(x.size).padStart(8) + '   ' + x.url);
    say('                  ' + x.page);
  }
  if (list.length > 10) say('       ... aur ' + (list.length - 10));
}

/* ---------- 4. be-kaar files ---------- */
say('');
say('4. WOH TASWEEREN JO KAHIN ISTEMAL NAHI HO RAHIN');
say('-'.repeat(78));
const used = new Set();
for (const p of real) {
  const html = fs.readFileSync(p.f, 'utf8');
  for (const m of html.matchAll(/["'(]([^"'()\s]+\.(?:jpe?g|png|webp|avif|gif|svg))/gi)) {
    used.add(m[1].split('?')[0]);
  }
}
const unused = [...sizes.entries()]
  .filter(([r, s]) => /^\/assets\/uploads\//.test(r) && /\.(jpe?g|png|webp|avif)$/i.test(r) && !used.has(r))
  .sort((a, b) => b[1] - a[1]);
const unusedMb = unused.reduce((s, [, v]) => s + v, 0) / 1024 / 1024;
say('   ' + unused.length + ' files, kul ' + unusedMb.toFixed(1) + ' MB');
if (unused.length) {
  for (const [r, s] of unused.slice(0, 6)) say('      ' + kb(s).padStart(8) + '   ' + r);
  if (unused.length > 6) say('      ... aur ' + (unused.length - 6));
  say('');
  say('   Yeh download nahi hotin, to speed par asar nahi. Magar repo');
  say('   aur Media Library mein jagah leti hain. Kuch ek hi tasweer ki');
  say('   kai copies ho sakti hain — CMS se ek hi cheez kai baar upload');
  say('   hui hogi.');
}

/* ---------- khulasa ---------- */
say('');
say('='.repeat(78));
say('KHULASA');
say('');
if (!list.length && over200 === 0 && !lazyOnes) {
  say('   Tasweeron ki taraf se koi bara masla nahi. srcset theek chal');
  say('   raha hai aur mobile par chhoti files hi mangwai jati hain.');
} else {
  let n = 1;
  if (lazyOnes) say('   ' + n++ + '. ' + lazyOnes + ' safhon par pehli tasweer lazy hai — LCP par seedha asar');
  if (over200) say('   ' + n++ + '. ' + over200 + ' safhon par pehli tasweer 200 KB se bari hai');
  if (list.length) say('   ' + n++ + '. ' + list.length + ' tasweeren srcset ke bagair, poore naap mein aati hain');
}
say('');
say('   Yeh andaza hai. Asli number PageSpeed Insights ke "Largest');
say('   Contentful Paint element" wale hisse mein milta hai.');
say('');

fs.writeFileSync(path.join(ROOT, '_images.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _images.txt');
