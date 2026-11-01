#!/usr/bin/env node
/**
 * dump-design.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dikhata hai.
 *
 * Footer, "About Karakoram Vision" ka hissa, social icons aur CSS —
 * yeh sab kis file mein hain, aur un ka matan.
 *
 *   node tools/dump-design.mjs
 *
 * Yeh  _design.txt  bana dega. Wohi bhej dein.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const SKIP_DIR = new Set(['node_modules', '_site', 'content', 'assets']);
const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIR.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc);
    else if (/\.(njk|html|js|mjs|json|css)$/.test(e.name) && !/\.bak/.test(e.name)) acc.push(f);
  }
  return acc;
};

if (!fs.existsSync(SRC)) { console.log('XX  src nahi mili.'); process.exit(1); }

const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

/* ---- 1. kaun si file mein kya hai ---- */

const MARKERS = [
  ['footer ka bharosa wala jumla', 'Government licence'],
  ['AFFILIATED WITH', 'AFFILIATED WITH'],
  ['Plan & Prepare column',        'Plan &amp; Prepare'],
  ['Plan & Prepare (saada)',       'Plan & Prepare'],
  ['Travel updates column',        'Travel updates'],
  ['About Karakoram Vision',       'About Karakoram Vision'],
  ['social: facebook',             'facebook'],
  ['social: instagram',            'instagram'],
  ['social: tiktok',               'tiktok'],
  ['Tripadvisor',                  'Tripadvisor'],
  ['35 years wala jumla',          '35 years'],
  ['copyright',                    'All rights reserved'],
];

const files = walk(SRC);
const found = new Map();   /* file -> [marker names] */

say('DESIGN — KAUN SI FILE MEIN KYA HAI');
say('='.repeat(84));
say('   ' + files.length + ' files dekhi gayin (njk, html, js, json, css).');
say('');

for (const [name, needle] of MARKERS) {
  const hits = files.filter((f) => {
    try { return fs.readFileSync(f, 'utf8').includes(needle); } catch { return false; }
  });
  say('   ' + name.padEnd(32) + (hits.length ? hits.map(rel).join('  |  ') : '[nahi mila]'));
  for (const h of hits) {
    if (!found.has(h)) found.set(h, []);
    found.get(h).push(name);
  }
}

/* ---- 2. jin files mein kuch mila, un ka matan ---- */

const BIG = 60000;
for (const [f, names] of found) {
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  say('');
  say('#'.repeat(84));
  say('## ' + rel(f) + '    (' + t.length + ' harf)');
  say('##    mila: ' + names.join(', '));
  say('#'.repeat(84));
  if (t.length > BIG) {
    say('   [file bohat bari — sirf woh hissay jahan markers hain]');
    const lines = t.split(/\r?\n/);
    const keep = new Set();
    for (const [, needle] of MARKERS) {
      lines.forEach((l, i) => { if (l.includes(needle)) for (let j = i - 12; j <= i + 25; j++) keep.add(j); });
    }
    let last = -2;
    [...keep].filter((i) => i >= 0 && i < lines.length).sort((a, b) => a - b).forEach((i) => {
      if (i !== last + 1) say('   ...');
      say(String(i + 1).padStart(5) + ' | ' + lines[i]);
      last = i;
    });
  } else {
    t.split(/\r?\n/).forEach((l, i) => say(String(i + 1).padStart(5) + ' | ' + l));
  }
}

/* ---- 3. CSS ---- */

const CSS_TRY = [
  'src/assets/css/input.css',
  'src/assets/css/custom.css',
  'src/theme-vars.css.njk',
];
say('');
say('#'.repeat(84));
say('## CSS');
say('#'.repeat(84));
for (const c of CSS_TRY) {
  const f = path.join(ROOT, ...c.split('/'));
  if (!fs.existsSync(f)) { say('   [nahi mila] ' + c); continue; }
  const t = fs.readFileSync(f, 'utf8');
  say('');
  say('   --- ' + c + '   (' + t.length + ' harf) ---');
  if (t.length > 40000) {
    say('   [bari file — sirf footer aur link se mutalliq qawaid]');
    const lines = t.split(/\r?\n/);
    const keep = new Set();
    lines.forEach((l, i) => {
      if (/footer|social|\ba:hover|\.link|nav a|trust|affiliat/i.test(l))
        for (let j = i - 3; j <= i + 14; j++) keep.add(j);
    });
    let last = -2;
    [...keep].filter((i) => i >= 0 && i < lines.length).sort((a, b) => a - b).forEach((i) => {
      if (i !== last + 1) say('   ...');
      say(String(i + 1).padStart(5) + ' | ' + lines[i]);
      last = i;
    });
  } else {
    t.split(/\r?\n/).forEach((l, i) => say(String(i + 1).padStart(5) + ' | ' + l));
  }
}

/* ---- 4. includes ki list ---- */

say('');
say('#'.repeat(84));
say('## src ke andar ke template (sirf naam)');
say('#'.repeat(84));
for (const f of files) say('   ' + rel(f));

fs.writeFileSync(path.join(ROOT, '_design.txt'), out.join('\n') + '\n', 'utf8');
console.log('');
console.log('-'.repeat(84));
console.log('LIKHA: _design.txt');
