#!/usr/bin/env node
/**
 * audit-a11y.mjs   (website ke folder mein, npm run build ke baad)
 *
 * PageSpeed ne jo ghaltiyan batayi hain, un ki asli tafseel nikalta hai
 * taake patch andaze se nahi, haqeeqat se bane:
 *
 *   1. Contrast — un selectors ke asli rang, aur WCAG ka hisaab
 *   2. ARIA — role aur aria-* kahan kahan likhe hain
 *   3. aria-hidden ke andar focusable cheezein
 *   4. llms.txt ka matan
 *
 * KUCH BADALTA NAHI. Sirf dekhta hai.
 *
 *   node tools/audit-a11y.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = path.join(ROOT, '_site');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

/* ---------- WCAG ka hisaab ---------- */
const srgb = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => {
  const l = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l[0] + 0.05) / (l[1] + 0.05);
};
const parseColor = (s) => {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  let m = t.match(/^#([0-9a-f]{3})$/);
  if (m) return m[1].split('').map((c) => parseInt(c + c, 16));
  m = t.match(/^#([0-9a-f]{6})$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = t.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (m) return [1, 2, 3].map((i) => Math.round(Number(m[i])));
  const named = { white: [255, 255, 255], black: [0, 0, 0], transparent: null };
  if (t in named) return named[t];
  return null;
};

say('\nACCESSIBILITY — ASLI TAFSEEL');
say('='.repeat(78));

/* ---------- CSS jama karo ---------- */
const cssFiles = [];
const walkCss = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkCss(f);
    else if (/\.css$/i.test(e.name) && !/\.bak/.test(e.name)) cssFiles.push(f);
  }
};
walkCss(path.join(ROOT, 'src'));
walkCss(path.join(SITE, 'assets'));

let css = '';
for (const f of cssFiles) { try { css += '\n' + fs.readFileSync(f, 'utf8'); } catch { } }
say('');
say('   CSS files: ' + cssFiles.length + '  (' + (css.length / 1024).toFixed(0) + ' KB)');

/* :root ke variables */
const vars = new Map();
for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)) {
  if (!vars.has(m[1])) vars.set(m[1], m[2].trim());
}
const resolve = (v, depth = 0) => {
  if (!v || depth > 5) return v;
  const m = String(v).match(/var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)/);
  if (!m) return v;
  const got = vars.get(m[1]);
  return resolve(got || m[2] || '', depth + 1);
};

/* ---------- 1. contrast ---------- */
say('');
say('1. CONTRAST — JIN PAR PAGESPEED NE UNGLI RAKHI');
say('-'.repeat(78));

const TARGETS = [
  '.bk-mobile-toggle',
  '.eyebrow',
  '.bk-home-contact',
  '.bk-footer-cta',
  '.bk-footer-rating-links',
  '.bk-footer-rating-links small',
  '.bk-footer-rating-links strong',
  '.bk-footer',
];

const declsFor = (sel) => {
  const found = [];
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(^|[,}])\\s*([^{}]*' + esc + '[^{}]*)\\{([^}]*)\\}', 'g');
  for (const m of css.matchAll(re)) {
    const body = m[3];
    const color = (body.match(/(?:^|;)\s*color\s*:\s*([^;]+)/) || [])[1];
    const bg = (body.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/) || [])[1];
    const opacity = (body.match(/(?:^|;)\s*opacity\s*:\s*([^;]+)/) || [])[1];
    if (color || bg || opacity) found.push({ sel: m[2].trim().slice(0, 70), color, bg, opacity });
  }
  /* input.css aur site.css ek hi cheez hain (ek minified), is liye har
     rule do baar aata hai. Ek hi rakhte hain. */
  const seen = new Set();
  return found.filter((x) => {
    const k = x.sel + '|' + x.color + '|' + x.bg + '|' + x.opacity;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

for (const t of TARGETS) {
  const d = declsFor(t);
  if (!d.length) continue;
  say('');
  say('   ' + t);
  for (const x of d.slice(0, 5)) {
    const c = resolve(x.color), b = resolve(x.bg);
    let note = '';
    const ca = parseColor(c), ba = parseColor(b);
    if (ca && ba) {
      const r = ratio(ca, ba);
      note = '   ratio ' + r.toFixed(2) + (r < 4.5 ? '  XX kam hai (4.5 chahiye)' : '  OK');
    }
    say('      ' + x.sel);
    if (x.color) say('         color:      ' + x.color.trim() + (c !== x.color ? '  ->  ' + String(c).trim() : ''));
    if (x.bg) say('         background: ' + x.bg.trim() + (b !== x.bg ? '  ->  ' + String(b).trim() : ''));
    if (x.opacity) say('         opacity:    ' + x.opacity.trim() + '   (opacity contrast ghata deti hai)');
    if (note) say('        ' + note);
  }
}

say('');
say('   Note: yeh seedhe likhe hue rang hain. Cascade aur inherit ki wajah');
say('   se asli rang kuch aur bhi ho sakta hai — PageSpeed ka naap hi aakhri');
say('   hai. Magar jahan ratio 4.5 se kam dikhe, wahan masla yaqeeni hai.');

/* ---------- 2. ARIA ---------- */
say('');
say('2. ARIA — KAHAN KAHAN LIKHA HAI');
say('-'.repeat(78));

const srcFiles = [];
const walkSrc = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkSrc(f);
    else if (/\.(njk|html|md)$/.test(e.name)) srcFiles.push(f);
  }
};
walkSrc(path.join(ROOT, 'src'));
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

let roleCount = 0;
for (const f of srcFiles) {
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const lines = t.split(/\r?\n/);
  const hit = [];
  lines.forEach((l, i) => {
    if (l.length > 400) return;
    if (/\brole\s*=\s*["'][^"']+["']/.test(l) || /\baria-[a-z]+\s*=/.test(l)) hit.push([i + 1, l.trim()]);
  });
  if (!hit.length) continue;
  roleCount += hit.length;
  say('');
  say('   ' + rel(f));
  for (const [n, l] of hit.slice(0, 6)) say('      ' + String(n).padStart(4) + '  ' + l.slice(0, 125));
  if (hit.length > 6) say('      ... aur ' + (hit.length - 6));
}
if (!roleCount) say('   Kuch nahi mila.');

/* ---------- 3. aria-hidden ke andar focusable ---------- */
say('');
say('3. aria-hidden="true" KE ANDAR FOCUSABLE CHEEZEIN');
say('-'.repeat(78));
let ahFound = 0;
const pages = [];
const walkPages = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkPages(f);
    else if (/\.html$/.test(e.name)) pages.push(f);
  }
};
walkPages(SITE);
for (const p of pages.slice(0, 5)) {
  const html = fs.readFileSync(p, 'utf8');
  for (const m of html.matchAll(/<(\w+)([^>]*aria-hidden\s*=\s*["']true["'][^>]*)>([\s\S]{0,600}?)<\/\1>/gi)) {
    if (/<(a\s|button|input|select|textarea|iframe)/i.test(m[3]) || /tabindex\s*=\s*["']0/.test(m[3])) {
      ahFound++;
      if (ahFound <= 4) {
        say('   ' + path.relative(SITE, p));
        say('      <' + m[1] + m[2].slice(0, 70) + '>');
        say('         andar: ' + m[3].replace(/\s+/g, ' ').trim().slice(0, 100));
      }
    }
  }
}
if (!ahFound) say('   Pehle 5 safhon mein kuch nahi mila.');
else say('');

/* ---------- 4. llms.txt ---------- */
say('');
say('4. llms.txt');
say('-'.repeat(78));
const llms = path.join(SITE, 'llms.txt');
if (!fs.existsSync(llms)) say('   XX  _site/llms.txt nahi mila');
else {
  const t = fs.readFileSync(llms, 'utf8');
  const lines = t.split(/\r?\n/);
  say('   ' + t.length + ' harf, ' + lines.length + ' lines');
  say('');
  say('   Pehli 30 lines:');
  for (const l of lines.slice(0, 30)) say('      | ' + l.slice(0, 120));
  if (lines.length > 30) say('      ... aur ' + (lines.length - 30) + ' lines');
}

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein — phir ek hi patch mein sab theek kar dunga.');
say('');

fs.writeFileSync(path.join(ROOT, '_a11y.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _a11y.txt');
