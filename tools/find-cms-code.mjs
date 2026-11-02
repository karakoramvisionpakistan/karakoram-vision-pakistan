#!/usr/bin/env node
/**
 * find-cms-code.mjs   (cms-dashboard ke folder mein chalayein)
 *
 * Us masle se juri files dhoondti hai jahan dashboard har file ke liye
 * alag se GitHub par request bhejta hai ("Too many subrequests").
 *
 * POORI FILE NAHI DIKHATI \u2014 sirf matching lines, aur chaabi jaisi har
 * cheez chhupa kar.
 *
 *   cd D:\\Websites\\cms-dashboard
 *   node D:\\Websites\\Karakoram_Vision_Pakistan\\tools\\find-cms-code.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const SKIP = new Set(['node_modules', 'dist', 'build', '.git', '.wrangler', '.next', 'coverage', '.vercel']);
const CODE = /\.(js|mjs|cjs|ts|tsx|jsx)$/;

const walk = (dir, acc = []) => {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.') continue;
    if (SKIP.has(e.name) || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc); else if (CODE.test(e.name)) acc.push(f);
  }
  return acc;
};
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

/* chaabi jaisi cheez chhupa do */
const mask = (s) => String(s)
  .replace(/(['"`])([A-Za-z0-9_\-+/=]{24,})\1/g, (m, q, v) => q + '[chhupaya: ' + v.length + ' harf]' + q)
  .replace(/(ghp_|github_pat_)[A-Za-z0-9_]+/g, '[chhupaya: token]');

/* jo dhoondna hai */
const MARKERS = [
  { re: /GitHubClient/, name: 'GitHubClient' },
  { re: /\bgetFile\b/, name: 'getFile' },
  { re: /onRequestGet/, name: 'onRequestGet' },
  { re: /\.map\s*\(\s*(async\s*)?\(?[A-Za-z_$]/, name: 'map(' },
  { re: /Promise\.all/, name: 'Promise.all' },
  { re: /api\.github\.com/, name: 'api.github.com' },
  { re: /git\/trees/, name: 'git/trees' },
  { re: /graphql/i, name: 'graphql' },
  { re: /\bKV\b|env\.CACHE/, name: 'KV cache' },
];

say('\nCMS DASHBOARD \u2014 SUBREQUEST WALA MASLA');
say('='.repeat(78));
say('   Folder: ' + ROOT);
say('   Poori file nahi dikhai jati, sirf kaam ki lines.');

const files = walk(ROOT);
say('');
say('   ' + files.length + ' code files dekhi gayin.');

if (!files.length) {
  say('');
  say('   XX  Koi code file nahi mili. Kya aap dashboard ke folder mein hain?');
  fs.writeFileSync(path.join(ROOT, '_cmscode.txt'), out.join('\n') + '\n', 'utf8');
  process.exit(1);
}

/* ---- 1. GitHub se baat karne wali files ---- */
const hits = [];
for (const f of files) {
  let t;
  try { if (fs.statSync(f).size > 1024 * 1024) continue; t = fs.readFileSync(f, 'utf8'); }
  catch { continue; }
  const found = MARKERS.filter((m) => m.re.test(t)).map((m) => m.name);
  if (!found.length) continue;
  const score = (t.includes('GitHubClient') ? 3 : 0) + (/\bgetFile\b/.test(t) ? 3 : 0)
    + (t.includes('api.github.com') ? 2 : 0) + found.length;
  hits.push({ f, t, found, score });
}
hits.sort((a, b) => b.score - a.score);

say('');
say('1. SAB SE ZYADA MUTALLIQ FILES');
say('-'.repeat(78));
if (!hits.length) say('   Kuch nahi mila.');
for (const h of hits.slice(0, 12)) {
  say('   ' + rel(h.f).padEnd(52) + fs.statSync(h.f).size + ' harf');
  say('      ' + h.found.join(', '));
}
if (hits.length > 12) say('   ... aur ' + (hits.length - 12));

/* ---- 2. loop ke andar GitHub call ---- */
say('');
say('2. JAHAN LOOP KE ANDAR GITHUB CALL HO RAHI HAI');
say('-'.repeat(78));
say('   Yahi asal masla hai: har file ke liye alag request.');
say('');
let shown = 0;
for (const h of hits.slice(0, 8)) {
  const lines = h.t.split(/\r?\n/);
  const interesting = [];
  lines.forEach((l, i) => {
    if (l.length > 300) return;
    if (/(getFile|getContent|fetchFile)\s*\(/.test(l)
      || (/\.map\s*\(/.test(l) && /await|async|get/i.test(l))
      || /Promise\.all/.test(l)
      || /git\/trees/.test(l)
      || /api\.github\.com/.test(l)) interesting.push([i + 1, l.trim()]);
  });
  if (!interesting.length) continue;
  say('   ' + rel(h.f));
  for (const [n, l] of interesting.slice(0, 10)) say('      ' + String(n).padStart(5) + '  ' + mask(l).slice(0, 120));
  if (interesting.length > 10) say('      ... aur ' + (interesting.length - 10) + ' lines');
  say('');
  shown++;
  if (shown >= 5) break;
}
if (!shown) say('   Kuch saaf nazar nahi aaya.');

/* ---- 3. content wale raaste ---- */
say('');
say('3. /api/content WALE RAASTE');
say('-'.repeat(78));
const routes = files.filter((f) => /\/(api|functions)\//.test(rel(f)) && /content/i.test(rel(f)));
if (!routes.length) say('   Is naam ki koi file nahi mili \u2014 raasta kahin aur bana hoga.');
for (const f of routes) say('   ' + rel(f).padEnd(52) + fs.statSync(f).size + ' harf');

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein. Us ke baad bataunga ke');
say('   ek hi request mein saara kaam kaise ho sakta hai.');
say('');

fs.writeFileSync(path.join(ROOT, '_cmscode.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _cmscode.txt   (dashboard ke folder mein)');
