#!/usr/bin/env node
/**
 * dump-hero.mjs   (website ke folder mein)
 *
 * Hero slider ka poora matan nikalta hai — template aur woh JS jo dots
 * aur slides ko chalati hai. Patch isi par banega.
 *
 * KUCH BADALTA NAHI.
 *
 *   node tools/dump-hero.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

say('\nHERO SLIDER KA MATAN');
say('='.repeat(78));

/* ---------- 1. template ---------- */
say('');
say('1. TEMPLATE');
say('-'.repeat(78));

const T = path.join(ROOT, 'src', '_includes', 'components', 'landing-hero.njk');
if (!fs.existsSync(T)) say('   XX  landing-hero.njk nahi mili');
else {
  const lines = fs.readFileSync(T, 'utf8').split(/\r?\n/);
  say('   src/_includes/components/landing-hero.njk  (' + lines.length + ' lines)');
  say('');
  /* sirf woh hissay jahan dots, slides, role ya aria hai — aas paas 4 lines */
  const marks = new Set();
  lines.forEach((l, i) => {
    if (/hero-dot|hero-slide|role=|aria-|is-active|is-next|is-prev|data-index/.test(l)) {
      for (let j = Math.max(0, i - 4); j <= Math.min(lines.length - 1, i + 4); j++) marks.add(j);
    }
  });
  let prev = -2;
  for (const i of [...marks].sort((a, b) => a - b)) {
    if (i > prev + 1) say('        ....');
    say('   ' + String(i + 1).padStart(4) + ' | ' + lines[i].slice(0, 150));
    prev = i;
  }
}

/* ---------- 2. JS ---------- */
say('');
say('2. JS JO IN KO CHALATI HAI');
say('-'.repeat(78));

const jsFiles = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.(js|mjs)$/.test(e.name) && !/\.min\./.test(e.name)) jsFiles.push(f);
  }
};
walk(path.join(ROOT, 'src'));

const KEY = /hero-dot|heroDot|bk-hero-slide|heroSlide|aria-selected|ariaSelected|data-hero/;
let found = 0;
for (const f of jsFiles) {
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (!KEY.test(t)) continue;
  found++;
  const lines = t.split(/\r?\n/);
  say('');
  say('   ' + rel(f) + '   (' + lines.length + ' lines, ' + (t.length / 1024).toFixed(1) + ' KB)');
  say('   ' + '-'.repeat(72));
  /* agar file choti hai to poori, warna sirf mutalliqa hissay */
  if (lines.length <= 160) {
    lines.forEach((l, i) => say('   ' + String(i + 1).padStart(4) + ' | ' + l.slice(0, 150)));
  } else {
    const marks = new Set();
    lines.forEach((l, i) => {
      if (KEY.test(l) || /aria-hidden|inert|tabindex|classList|setAttribute/.test(l)) {
        for (let j = Math.max(0, i - 6); j <= Math.min(lines.length - 1, i + 6); j++) marks.add(j);
      }
    });
    let prev = -2;
    for (const i of [...marks].sort((a, b) => a - b)) {
      if (i > prev + 1) say('        ....');
      say('   ' + String(i + 1).padStart(4) + ' | ' + lines[i].slice(0, 150));
      prev = i;
    }
  }
}
if (!found) say('   XX  koi JS nahi mili jo hero ko chhooti ho — shayad inline <script> mein hai');

/* ---------- 3. inline script? ---------- */
say('');
say('3. INLINE <script> MEIN TO NAHI?');
say('-'.repeat(78));
const njk = [];
const walkN = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkN(f);
    else if (/\.njk$/.test(e.name)) njk.push(f);
  }
};
walkN(path.join(ROOT, 'src'));
let inl = 0;
for (const f of njk) {
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  for (const m of t.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (!KEY.test(m[1])) continue;
    inl++;
    say('');
    say('   ' + rel(f) + '   (inline script, ' + m[1].split('\n').length + ' lines)');
    say('   ' + '-'.repeat(72));
    m[1].split('\n').forEach((l, i) => say('   ' + String(i + 1).padStart(4) + ' | ' + l.slice(0, 150)));
  }
}
if (!inl) say('   Koi inline script nahi mila.');

/* ---------- 4. dots ka CSS (touch target ke liye) ---------- */
say('');
say('4. DOTS KA CSS  (PageSpeed kehta hai bohat chhote hain)');
say('-'.repeat(78));
const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
if (!fs.existsSync(CSS)) say('   XX  input.css nahi mili');
else {
  const lines = fs.readFileSync(CSS, 'utf8').split(/\r?\n/);
  const marks = new Set();
  lines.forEach((l, i) => {
    if (/bk-hero-dots|bk-hero-dot\b|hero-dot|bk-finder-submit/.test(l)) {
      for (let j = Math.max(0, i - 1); j <= Math.min(lines.length - 1, i + 14); j++) marks.add(j);
    }
  });
  if (!marks.size) say('   Kuch nahi mila.');
  let prev = -2;
  for (const i of [...marks].sort((a, b) => a - b)) {
    if (i > prev + 1) say('        ....');
    say('   ' + String(i + 1).padStart(5) + ' | ' + lines[i].slice(0, 150));
    prev = i;
  }
}

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein.');
say('');

fs.writeFileSync(path.join(ROOT, '_hero3.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _hero3.txt');
