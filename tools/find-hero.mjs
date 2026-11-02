#!/usr/bin/env node
/**
 * find-hero.mjs   (website ke folder mein, npm run build ke baad)
 *
 * Teen cheezein dhoondta hai, taake hero par srcset jora ja sake:
 *
 *   1. hero ki kitni naap mojood hain (hero-crops kya kya banata hai)
 *   2. kaun si template hero ki tasweer likhti hai
 *   3. baqi 539 tasweeron par srcset kaun banata hai — wahi nizam
 *      hero par bhi lagana hai, naya banane ki zaroorat nahi
 *
 * KUCH BADALTA NAHI. Sirf dekhta hai.
 *
 *   node tools/find-hero.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = path.join(ROOT, '_site');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

say('\nHERO KA NIZAM');
say('='.repeat(78));

/* ---------- 1. hero ki naap ---------- */
say('');
say('1. HERO KI KITNI NAAP MOJOOD HAIN');
say('-'.repeat(78));

const HERO = path.join(SITE, 'assets', 'hero');
if (!fs.existsSync(HERO)) say('   -- _site/assets/hero nahi mila');
else {
  const all = [];
  const w = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) w(f); else all.push({ name: e.name, size: fs.statSync(f).size });
  } };
  w(HERO);

  /* base naam -> naap */
  const groups = new Map();
  for (const f of all) {
    const m = f.name.match(/^(.*?)--([a-z]+)-(\d+)\.(\w+)$/i);
    if (!m) continue;
    const base = m[1];
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ shape: m[2], w: Number(m[3]), size: f.size, name: f.name });
  }
  say('   ' + all.length + ' files, ' + groups.size + ' asal tasweeren');

  /* ek misaal poori dikhao — wahi jo homepage par hai */
  const pick = [...groups.entries()].find(([b]) => /biafo/i.test(b)) || [...groups.entries()][0];
  if (pick) {
    say('');
    say('   Misaal: ' + pick[0]);
    for (const v of pick[1].sort((a, b) => a.shape.localeCompare(b.shape) || a.w - b.w)) {
      say('      ' + v.shape.padEnd(10) + String(v.w).padStart(5) + 'px   ' + kb(v.size).padStart(8) + '   ' + v.name);
    }
  }

  const shapes = new Map();
  for (const [, vs] of groups) for (const v of vs) {
    if (!shapes.has(v.shape)) shapes.set(v.shape, new Set());
    shapes.get(v.shape).add(v.w);
  }
  say('');
  say('   Har shakal ki mojooda naap:');
  for (const [shape, ws] of shapes) say('      ' + shape.padEnd(10) + [...ws].sort((a, b) => a - b).join(', '));
}

/* ---------- source files ---------- */
const SKIP = new Set(['node_modules', '_site', '.git', 'assets']);
const walkSrc = (dir, acc = []) => {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name) || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkSrc(f, acc);
    else if (/\.(njk|js|mjs|html|md)$/.test(e.name)) acc.push(f);
  }
  return acc;
};
const files = [...walkSrc(path.join(ROOT, 'src')), ...walkSrc(path.join(ROOT, 'tools'))];
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

const hits = (re, label, limit = 8) => {
  say('');
  say(label);
  say('-'.repeat(78));
  let n = 0;
  for (const f of files) {
    let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const lines = t.split(/\r?\n/);
    const found = [];
    lines.forEach((l, i) => { if (l.length < 400 && re.test(l)) found.push([i + 1, l.trim()]); });
    if (!found.length) continue;
    say('   ' + rel(f));
    for (const [ln, l] of found.slice(0, 5)) say('      ' + String(ln).padStart(5) + '  ' + l.slice(0, 130));
    if (found.length > 5) say('      ... aur ' + (found.length - 5) + ' lines');
    if (++n >= limit) { say('   ...'); break; }
  }
  if (!n) say('   Kuch nahi mila.');
};

hits(/assets\/hero|--wide-|heroCrop|hero_crop|heroImage/i, '2. HERO KI TASWEER KAUN LIKHTA HAI');
hits(/srcset/i, '3. srcset KAUN BANATA HAI (yahi nizam hero par lagana hai)');

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein. Us ke baad hero par srcset jor dunga,');
say('   wahi nizam istemal kar ke jo baqi 539 tasweeron par pehle se hai.');
say('');

fs.writeFileSync(path.join(ROOT, '_hero2.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _hero2.txt');
