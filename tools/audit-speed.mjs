#!/usr/bin/env node
/**
 * audit-speed.mjs   (website ke folder mein, npm run build ke baad)
 *
 * Poori bani hui site ko ek sath dekhta hai aur wahi cheezein dhoondta
 * hai jo Core Web Vitals ko torti hain:
 *
 *   LCP  2.5s   - sab se bari tasweer kitni jaldi aati hai
 *   CLS  0.1    - safha khulte waqt cheezein hilti to nahi
 *   INP  200ms  - click ka jawab kitni jaldi milta hai
 *
 * PageSpeed Insights ek waqt mein ek safha dekhta hai. Yeh 122 safhe
 * ek sath dekhta hai, aur woh ghaltiyan batata hai jo har safhe par
 * dohrayi gayi hain.
 *
 * KUCH BADALTA NAHI. Sirf dekhta hai.
 *
 *   node tools/audit-speed.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = path.join(ROOT, '_site');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

say('\nSPEED KI JAANCH — POORI SITE');
say('='.repeat(78));

if (!fs.existsSync(SITE)) {
  say('XX  _site nahi mila. Pehle "npm run build" chalayein.');
  process.exit(1);
}

/* ---------- files jama karo ---------- */
const pages = [];
const assets = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    const size = fs.statSync(f).size;
    if (/\.html$/.test(e.name)) pages.push({ f, size });
    else if (/\.(jpe?g|png|webp|avif|gif|svg|css|js|woff2?|mp4|webm)$/i.test(e.name)) assets.push({ f, size });
  }
};
walk(SITE);
const rel = (f) => path.relative(SITE, f).split(path.sep).join('/');

say('');
say('   ' + pages.length + ' safhe, ' + assets.length + ' assets');

/* ---------- 1. safhon ka wazan ---------- */
say('');
say('1. SAB SE BHARI SAFHE (HTML ka apna wazan)');
say('-'.repeat(78));
pages.sort((a, b) => b.size - a.size);
for (const p of pages.slice(0, 8)) {
  const flag = p.size > 150 * 1024 ? 'XX ' : p.size > 100 * 1024 ? '!! ' : 'OK ';
  say('   ' + flag + kb(p.size).padStart(8) + '   ' + rel(p.f));
}
const heavy = pages.filter((p) => p.size > 150 * 1024).length;
say('');
say('   100 KB se oopar: ' + pages.filter((p) => p.size > 100 * 1024).length + ' safhe');
say('   150 KB se oopar: ' + heavy + ' safhe');
if (heavy) say('   (HTML khud 150 KB se bara ho to mobile par pehli nazar der se banti hai)');

/* ---------- 2. tasweeron ki files ---------- */
say('');
say('2. SAB SE BARI FILES');
say('-'.repeat(78));
assets.sort((a, b) => b.size - a.size);
for (const a of assets.slice(0, 12)) {
  const img = /\.(jpe?g|png|webp|avif|gif)$/i.test(a.f);
  const flag = img && a.size > 300 * 1024 ? 'XX ' : a.size > 200 * 1024 ? '!! ' : 'OK ';
  say('   ' + flag + kb(a.size).padStart(8) + '   ' + rel(a.f));
}
const bigImgs = assets.filter((a) => /\.(jpe?g|png|webp|avif)$/i.test(a.f) && a.size > 300 * 1024);
say('');
say('   300 KB se bari tasweeren: ' + bigImgs.length);
if (bigImgs.length) say('   (mobile par ek tasweer 300 KB se bari ho to LCP mushkil se 2.5s mein aata hai)');

const css = assets.filter((a) => /\.css$/i.test(a.f)).reduce((s, a) => s + a.size, 0);
const js = assets.filter((a) => /\.js$/i.test(a.f)).reduce((s, a) => s + a.size, 0);
say('');
say('   kul CSS: ' + kb(css) + '    kul JS: ' + kb(js));

/* ---------- 3. har safhe ki jaanch ---------- */
say('');
say('3. HTML KI GHALTIYAN (har safhe par)');
say('-'.repeat(78));

const LOGOish = /logo|favicon|icon|sprite|placeholder/i;
let noDim = 0, noAlt = 0, lazyHero = 0, noPriority = 0, blockingJs = 0, totalImgs = 0;
const examples = { noDim: [], lazyHero: [], blocking: [] };
/* Fonts bhi isi ek chakkar mein dekh lete hain. Pehle sirf ek safha
   dekha jata tha, aur woh sort ke baad sab se bari file hoti thi — jis
   mein fonts the hi nahi, to jawab ghalat aata tha. */
const font = { gf: 0, pre: 0, swap: 0 };

for (const p of pages) {
  let html;
  try { html = fs.readFileSync(p.f, 'utf8'); } catch { continue; }

  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  totalImgs += imgs.length;

  for (const tag of imgs) {
    const hasW = /\swidth\s*=/.test(tag), hasH = /\sheight\s*=/.test(tag);
    if (!hasW || !hasH) {
      noDim++;
      if (examples.noDim.length < 4) examples.noDim.push(rel(p.f) + '  ' + tag.slice(0, 95));
    }
    if (!/\salt\s*=/.test(tag)) noAlt++;
  }

  /* pehli asli tasweer — yahi aksar LCP hoti hai */
  const hero = imgs.find((t) => {
    const src = (t.match(/\ssrc\s*=\s*["']([^"']+)/i) || [])[1] || '';
    return src && !LOGOish.test(src);
  });
  if (hero) {
    if (/loading\s*=\s*["']lazy/i.test(hero)) {
      lazyHero++;
      if (examples.lazyHero.length < 4) examples.lazyHero.push(rel(p.f) + '  ' + hero.slice(0, 95));
    }
    if (!/fetchpriority\s*=\s*["']high/i.test(hero)) noPriority++;
  }

  /* head mein rukawat dalne wali script */
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];

  if (/fonts\.googleapis\.com/.test(head)) {
    font.gf++;
    if (/rel\s*=\s*["']preconnect["'][^>]*fonts\.gstatic/i.test(head)) font.pre++;
    if (/display=swap/.test(head)) font.swap++;
  }

  for (const s of head.match(/<script\b[^>]*>/gi) || []) {
    if (/\ssrc\s*=/.test(s) && !/\s(defer|async|type\s*=\s*["']module)/i.test(s)) {
      blockingJs++;
      if (examples.blocking.length < 3) examples.blocking.push(rel(p.f) + '  ' + s.slice(0, 95));
    }
  }
}

const row = (flag, label, n, note) =>
  say('   ' + flag + String(n).padStart(5) + '  ' + label.padEnd(42) + (note || ''));

say('   kul tasweeren: ' + totalImgs);
say('');
row(noDim ? 'XX ' : 'OK ', 'width/height ke bagair', noDim, 'CLS');
row(lazyHero ? 'XX ' : 'OK ', 'pehli tasweer lazy hai', lazyHero, 'LCP');
row(noPriority > pages.length / 2 ? '!! ' : 'OK ', 'pehli tasweer par fetchpriority nahi', noPriority, 'LCP');
row(blockingJs ? '!! ' : 'OK ', 'head mein rukawat wali script', blockingJs, 'LCP');
row(noAlt ? '!! ' : 'OK ', 'alt ke bagair tasweeren', noAlt, 'SEO');

if (examples.noDim.length) {
  say('');
  say('   width/height ke bagair — misalein:');
  for (const e of examples.noDim) say('      ' + e);
  say('');
  say('   Jab tasweer ka naap pehle se na ho, browser us ke liye jagah nahi');
  say('   chhorta. Tasweer aate hi neechay ka matan khisak jata hai — yeh CLS');
  say('   hai, aur parhne wale ko sab se zyada khalta hai.');
}
if (examples.lazyHero.length) {
  say('');
  say('   pehli tasweer lazy — misalein:');
  for (const e of examples.lazyHero) say('      ' + e);
  say('');
  say('   Sab se ooper wali tasweer par loading="lazy" nahi hona chahiye.');
  say('   Browser us ka intezaar karta hai, aur LCP kharab ho jata hai.');
  say('   Us par loading="eager" aur fetchpriority="high" hona chahiye.');
}
if (examples.blocking.length) {
  say('');
  say('   head mein rukawat wali script — misalein:');
  for (const e of examples.blocking) say('      ' + e);
}

/* ---------- 4. fonts ---------- */
say('');
say('4. FONTS');
say('-'.repeat(78));
const gf = font.gf > 0;
const pre = gf && font.pre === font.gf;
const swap = gf && font.swap === font.gf;
const selfHosted = assets.some((a) => /\.woff2?$/i.test(a.f));
say('   Google Fonts: ' + (gf ? font.gf + ' safhon par' : 'kahin nahi'));
if (gf) {
  say('   ' + (pre ? 'OK ' : '!! ') + 'preconnect: ' + font.pre + '/' + font.gf
      + (pre ? '' : ' safhon par — baqi par font 100-300ms der se aata hai'));
  say('   ' + (swap ? 'OK ' : '!! ') + 'display=swap: ' + font.swap + '/' + font.gf
      + (swap ? '' : ' safhon par — baqi par matan der tak gayab rehta hai'));
}
say('   Apne font (woff2): ' + (selfHosted ? 'haan — yeh Google Fonts se tez hai' : 'nahi'));

/* ---------- khulasa ---------- */
say('');
say('='.repeat(78));
say('PEHLE KYA THEEK KAREIN');
say('');
const todo = [];
if (lazyHero) todo.push([1, lazyHero + ' safhon par sab se ooper wali tasweer lazy hai — LCP par sab se bara asar']);
if (bigImgs.length) todo.push([2, bigImgs.length + ' tasweeren 300 KB se bari hain']);
if (noDim) todo.push([3, noDim + ' tasweeron par width/height nahi — safha hilta hai']);
if (heavy) todo.push([4, heavy + ' safhe 150 KB se bhari hain']);
if (blockingJs) todo.push([5, blockingJs + ' jagah head mein script rukawat dal rahi hai']);
if (gf && !pre) todo.push([6, 'Google Fonts par preconnect nahi hai']);

if (!todo.length) say('   Koi bari kami nazar nahi aayi. PageSpeed Insights par tasdeeq kar lein.');
else for (const [n, t] of todo) say('   ' + n + '. ' + t);

say('');
say('   Is ke baad in chaar safhon ko pagespeed.web.dev par dekh lein');
say('   (Mobile wala hissa — asli visitors zyada tar mobile par hote hain):');
say('');
say('      /                                  hero wali tasweer');
say('      /trekking/k2-base-camp-trek/       sab se lamba safha');
say('      /tours/                            bohat saare cards');
say('      /plan-a-trip/                      form');
say('');

fs.writeFileSync(path.join(ROOT, '_speed.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _speed.txt');
