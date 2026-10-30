#!/usr/bin/env node
/**
 * check-site-health.mjs  — sirf parhta hai, kuch nahi badalta.
 *
 * Bani hui website (_site) ki jaanch, domain connect karne se pehle:
 *   1. tooti hui andarooni links (404)
 *   2. menu ke woh links jin ka safha hi nahi
 *   3. tooti hui tasveerein
 *   4. ek jaisa unwaan ya ek jaisi description do safhon par
 *   5. har safhe par ek hi <h1> hai ya nahi
 *   6. Google se chhupe hue safhe (noindex) ki fehrist
 *   7. bina alt ki tasveerein
 *   8. khali section pages
 *
 *   npm run build
 *   node tools/check-site-health.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = path.join(ROOT, '_site');

if (!fs.existsSync(SITE)) {
  console.log('XX  _site nahi mila. Pehle chalayein:  npm run build');
  process.exit(1);
}

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const CAP = 20;
const show = (list) => {
  for (const l of list.slice(0, CAP)) console.log('      ' + l);
  if (list.length > CAP) console.log('      … aur ' + (list.length - CAP) + ' aur');
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const all = walk(SITE);
const htmlFiles = all.filter((f) => f.endsWith('.html'));

/* har mojood pata */
const urls = new Set();
const assets = new Set();
for (const f of all) {
  const rel = '/' + path.relative(SITE, f).replace(/\\/g, '/');
  assets.add(rel);
  if (rel.endsWith('/index.html')) urls.add(rel.slice(0, -'index.html'.length));
  urls.add(rel);
}

console.log('\n=== Website ki jaanch ===');
console.log(htmlFiles.length + ' safhe, ' + all.length + ' files\n');

/* ---------------------------------------------------------- parse ------ */

const pages = [];
for (const f of htmlFiles) {
  const html = read(f) || '';
  const rel = '/' + path.relative(SITE, f).replace(/\\/g, '/');
  const url = rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
  pages.push({
    url,
    file: rel,
    title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || '',
    desc: (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1]?.trim() || '',
    robots: (html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) || [])[1] || '',
    h1s: (html.match(/<h1\b/gi) || []).length,
    links: [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]),
    imgs: [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]),
    html,
  });
}

/* ---------------------------------------------------------- 1 links ---- */

const clean = (href) => {
  let h = String(href || '').trim();
  if (!h || h.startsWith('#') || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(h)) return null;
  h = h.split('#')[0].split('?')[0];
  if (!h) return null;
  if (!h.startsWith('/')) return null;         // relative links alag se neeche
  return h;
};

const broken = new Map();
const relative = new Map();
for (const p of pages) {
  for (const href of p.links) {
    const h = String(href || '').trim();
    if (!h || h.startsWith('#') || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(h)) continue;
    if (!h.startsWith('/')) {
      const k = h + '   (' + p.url + ')';
      relative.set(k, true);
      continue;
    }
    const c = clean(h);
    if (!c) continue;
    const withSlash = c.endsWith('/') ? c : c + '/';
    if (urls.has(c) || urls.has(withSlash) || assets.has(c)) continue;
    const k = c + '   <- ' + p.url;
    broken.set(k, true);
  }
}

console.log('1) Tooti hui andarooni links');
if (!broken.size) console.log('   OK  koi nahi.');
else { console.log('   !!  ' + broken.size + ':'); show([...broken.keys()]); }

if (relative.size) {
  console.log('\n   !   adhoore pate (shuru ka "/" nahi) — yeh ghalat jagah le jate hain:');
  show([...relative.keys()]);
}

/* ---------------------------------------------------------- 2 menu ----- */

console.log('\n2) Menu ke links');
const menu = JSON.parse(read(path.join(ROOT, 'src', '_data', 'menu.json')) || '{}');
const badMenu = [];
const walkMenu = (list, trail = []) => {
  for (const item of list || []) {
    const u = String(item.url || '').trim();
    const where = [...trail, item.label].join(' > ');
    if (!u || u === '-') badMenu.push('(koi pata nahi)   ' + where);
    else if (u.startsWith('/') && !/^\/search/.test(u)) {
      const c = u.split('#')[0].split('?')[0];
      const withSlash = c.endsWith('/') ? c : c + '/';
      if (!urls.has(c) && !urls.has(withSlash)) badMenu.push(u + '   ' + where);
    }
    if (item.children) walkMenu(item.children, [...trail, item.label]);
  }
};
walkMenu(menu.items);
if (!badMenu.length) console.log('   OK  sab theek.');
else { console.log('   !!  ' + badMenu.length + ':'); show(badMenu); }

/* ---------------------------------------------------------- 3 images --- */

console.log('\n3) Tasveerein');
const badImg = new Map();
let noAlt = 0;
for (const p of pages) {
  for (const tag of p.imgs) {
    if (!/\balt=/.test(tag)) noAlt++;
    const src = (tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1];
    if (!src || !src.startsWith('/')) continue;
    const c = src.split('?')[0];
    if (assets.has(c)) continue;
    badImg.set(c + '   <- ' + p.url, true);
  }
}
if (!badImg.size) console.log('   OK  saari tasveerein mojood hain.');
else { console.log('   !!  ' + badImg.size + ' tooti hui:'); show([...badImg.keys()]); }
console.log('   ' + (noAlt ? '!   ' + noAlt + ' tasveerein bina alt ke (Google aur screen reader ke liye)' : 'OK  sab mein alt hai'));

/* ---------------------------------------------------------- 4 titles --- */

console.log('\n4) Ek jaisa unwaan / description');
const group = (key) => {
  const m = {};
  for (const p of pages) {
    const v = (p[key] || '').trim();
    if (!v) continue;
    (m[v] = m[v] || []).push(p.url);
  }
  return Object.entries(m).filter(([, list]) => list.length > 1);
};
const dupT = group('title');
const dupD = group('desc');
if (!dupT.length) console.log('   OK  har safhe ka unwaan alag hai.');
else {
  console.log('   !!  ' + dupT.length + ' unwaan do ya zyada safhon par:');
  show(dupT.map(([v, list]) => '"' + v.slice(0, 60) + '"  ->  ' + list.join(', ')));
}
if (!dupD.length) console.log('   OK  har description alag hai.');
else {
  console.log('   !   ' + dupD.length + ' description do ya zyada safhon par:');
  show(dupD.map(([v, list]) => '"' + v.slice(0, 50) + '…"  ->  ' + list.join(', ')));
}

const noTitle = pages.filter((p) => !p.title).map((p) => p.url);
const noDesc = pages.filter((p) => !p.desc).map((p) => p.url);
if (noTitle.length) { console.log('   !!  bina unwaan: ' + noTitle.length); show(noTitle); }
if (noDesc.length) { console.log('   !   bina description: ' + noDesc.length); show(noDesc); }

/* ---------------------------------------------------------- 5 h1 ------- */

console.log('\n5) Har safhe par ek hi baRa unwaan (h1)');
const badH1 = pages.filter((p) => p.h1s !== 1).map((p) => p.url + '   (' + p.h1s + ' h1)');
if (!badH1.length) console.log('   OK  sab theek.');
else { console.log('   !   ' + badH1.length + ':'); show(badH1); }

/* ---------------------------------------------------------- 6 noindex -- */

console.log('\n6) Google se chhupe hue safhe');
const hidden = pages.filter((p) => /noindex/i.test(p.robots)).map((p) => p.url);
if (!hidden.length) console.log('   OK  koi nahi.');
else {
  console.log('   ' + hidden.length + ' (yeh woh section pages hone chahiyein jo abhi khali hain):');
  show(hidden);
}

/* ---------------------------------------------------------- 7 khali ---- */

console.log('\n7) Khali section pages');
const empty = pages
  .filter((p) => /No matching journeys are published yet/i.test(p.html))
  .map((p) => p.url);
if (!empty.length) console.log('   OK  koi khali nahi.');
else {
  console.log('   ' + empty.length + ' khali — in mein CMS se entries chunni hain:');
  show(empty);
}

console.log('\n=== Jaanch mukammal ===');
console.log('!! = foran theek karna  |  ! = dekh lena  |  OK = theek hai\n');
