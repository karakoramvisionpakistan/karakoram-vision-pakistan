#!/usr/bin/env node
/**
 * dump-for-bundle.mjs   (website ke folder mein)
 *
 * Chaar baqi kaamon ke liye zaroori matan ek hi baar mein nikalta hai:
 *
 *   1. CSS files kis tarteeb se load hoti hain  -> contrast wali paheli
 *   2. src/theme-vars.css.njk ka poora matan    -> contrast wali paheli
 *   3. CSP kahan likhi hai                      -> cloudflareinsights jorne ke liye
 *   4. _headers / _redirects / functions ka dhancha -> pages.dev 301 ke liye
 *   5. uploads ki ginti aur naap                -> safai ke liye
 *
 * KUCH BADALTA NAHI. Jahan koi key ya password jaisa matan mile, use
 * XXXXX kar deta hai.
 *
 *   node tools/dump-for-bundle.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

/* ---------- secrets chhupao ---------- */
const SENSITIVE = /(pass|secret|token|key|auth|bearer|credential)/i;
const mask = (line) => {
  let l = line;
  /* lambi random si cheezein jin mein adad bhi hon */
  l = l.replace(/(['"`])([A-Za-z0-9_\-+/=.]{20,})\1/g, (m, q, v) =>
    (/\d/.test(v) && !/^[\w-]+\.(com|net|org|dev|io|txt|js|css|json)$/i.test(v) && !/^https?:/.test(v))
      ? q + 'XXXXX' + q : m);
  /* sensitive lafz wali line par har quoted qeemat */
  if (SENSITIVE.test(l) && !/env\./.test(l)) {
    l = l.replace(/(['"`])([^'"`]{6,})\1/g, (m, q, v) =>
      (/^https?:/.test(v) || /^[\w./-]+$/.test(v) && v.length < 40) ? m : q + 'XXXXX' + q);
  }
  return l;
};

const dumpFile = (p, label, maskIt = true, limit = 200) => {
  say('');
  say(label || rel(p));
  say('-'.repeat(78));
  if (!fs.existsSync(p)) { say('   (file nahi hai)'); return false; }
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  say('   ' + lines.length + ' lines');
  lines.slice(0, limit).forEach((l, i) =>
    say('   ' + String(i + 1).padStart(4) + ' | ' + (maskIt ? mask(l) : l).slice(0, 165)));
  if (lines.length > limit) say('   ... aur ' + (lines.length - limit) + ' lines');
  return true;
};

say('');
say('CHAAR KAAMON KE LIYE MALOOMAT');
say('='.repeat(78));

/* ==================================================================== */
say('');
say('1. CSS KIS TARTEEB SE LOAD HOTI HAI');
say('='.repeat(78));
say('   (jo baad mein aaye woh ghalib hoti hai — contrast ki paheli yahin ho sakti hai)');

const layouts = [];
const walkNjk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkNjk(f);
    else if (/\.njk$/.test(e.name)) layouts.push(f);
  }
};
walkNjk(path.join(ROOT, 'src', '_includes'));
walkNjk(path.join(ROOT, 'src', '_layouts'));

let found = 0;
for (const f of layouts) {
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (!/<link[^>]*stylesheet|<style/i.test(t)) continue;
  const lines = t.split(/\r?\n/);
  const hits = [];
  lines.forEach((l, i) => { if (/<link[^>]*stylesheet|\.css/i.test(l)) hits.push([i + 1, l.trim()]); });
  if (!hits.length) continue;
  found++;
  say('');
  say('   ' + rel(f));
  for (const [n, l] of hits.slice(0, 12)) say('      ' + String(n).padStart(4) + '  ' + l.slice(0, 150));
  if (hits.length > 12) say('      ... aur ' + (hits.length - 12));
}
if (!found) say('   Kuch nahi mila.');

/* _site se asli tarteeb */
say('');
say('   _site/index.html mein asli tarteeb:');
const idx = path.join(ROOT, '_site', 'index.html');
if (fs.existsSync(idx)) {
  const html = fs.readFileSync(idx, 'utf8');
  let n = 0;
  for (const m of html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*>|<style[^>]*>/gi)) {
    say('      ' + (++n) + '. ' + m[0].replace(/\s+/g, ' ').slice(0, 150));
  }
  if (!n) say('      (koi stylesheet link nahi mila)');
} else say('      (_site/index.html nahi hai — npm run build chala lein)');

/* ==================================================================== */
say('');
say('2. theme-vars.css.njk');
say('='.repeat(78));
dumpFile(path.join(ROOT, 'src', 'theme-vars.css.njk'), '   src/theme-vars.css.njk', true, 150);

say('');
say('   build ke baad asli file — _site/assets/css/theme-vars.css:');
const tv = path.join(ROOT, '_site', 'assets', 'css', 'theme-vars.css');
if (fs.existsSync(tv)) {
  const lines = fs.readFileSync(tv, 'utf8').split(/\r?\n/);
  say('   ' + lines.length + ' lines');
  lines.slice(0, 80).forEach((l, i) => say('   ' + String(i + 1).padStart(4) + ' | ' + l.slice(0, 165)));
  if (lines.length > 80) say('   ... aur ' + (lines.length - 80));
} else say('   (nahi mili)');

/* ==================================================================== */
say('');
say('3. CSP KAHAN LIKHI HAI');
say('='.repeat(78));

const cspHits = [];
const walkAll = (dir, depth = 0) => {
  if (!fs.existsSync(dir) || depth > 6) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '_site', '.git'].includes(e.name) || e.name.startsWith('.') && e.name !== '.well-known') continue;
    if (/\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walkAll(f, depth + 1); continue; }
    if (!/\.(js|mjs|njk|html|json|toml|txt)$|^_headers$|^_redirects$/.test(e.name) && e.name !== '_headers' && e.name !== '_redirects') continue;
    let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (!/content-security-policy/i.test(t)) continue;
    t.split(/\r?\n/).forEach((l, i) => {
      if (/content-security-policy/i.test(l)) cspHits.push([rel(f), i + 1, l.trim()]);
    });
  }
};
walkAll(ROOT);
if (!cspHits.length) say('   Kahin nahi mili — shayad Cloudflare dashboard se lagti hai (Transform Rules).');
for (const [f, n, l] of cspHits) {
  say('');
  say('   ' + f + '  : line ' + n);
  say('      ' + mask(l).slice(0, 400));
}

/* ==================================================================== */
say('');
say('4. _headers / _redirects / functions');
say('='.repeat(78));

for (const name of ['_headers', '_redirects']) {
  for (const base of [ROOT, path.join(ROOT, 'src'), path.join(ROOT, 'public'), path.join(ROOT, 'static')]) {
    const p = path.join(base, name);
    if (fs.existsSync(p)) dumpFile(p, '   ' + rel(p), true, 120);
  }
}

say('');
say('   functions/ ka dhancha:');
say('-'.repeat(78));
const fnRoot = path.join(ROOT, 'functions');
if (!fs.existsSync(fnRoot)) say('   (functions/ nahi hai)');
else {
  const listFn = (dir, pre = '   ') => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (/\.bak/.test(e.name)) continue;
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { say(pre + e.name + '/'); listFn(f, pre + '   '); }
      else { const kb = (fs.statSync(f).size / 1024).toFixed(1); say(pre + e.name + '   (' + kb + ' KB)'); }
    }
  };
  listFn(fnRoot);
  for (const n of ['_middleware.js', '_middleware.ts']) {
    const p = path.join(fnRoot, n);
    if (fs.existsSync(p)) dumpFile(p, '   functions/' + n, true, 150);
  }
}

/* ==================================================================== */
say('');
say('5. UPLOADS');
say('='.repeat(78));
const up = path.join(ROOT, 'src', 'assets', 'uploads');
if (!fs.existsSync(up)) say('   (uploads folder nahi hai)');
else {
  const files = fs.readdirSync(up, { withFileTypes: true }).filter((e) => e.isFile());
  let total = 0;
  const byExt = new Map();
  for (const e of files) {
    const s = fs.statSync(path.join(up, e.name)).size;
    total += s;
    const ext = path.extname(e.name).toLowerCase() || '(koi nahi)';
    const v = byExt.get(ext) || { n: 0, b: 0 };
    v.n++; v.b += s; byExt.set(ext, v);
  }
  say('   kul files: ' + files.length + '   naap: ' + (total / 1024 / 1024).toFixed(1) + ' MB');
  say('');
  for (const [ext, v] of [...byExt].sort((a, b) => b[1].b - a[1].b)) {
    say('   ' + ext.padEnd(10) + String(v.n).padStart(5) + ' files   ' + (v.b / 1024 / 1024).toFixed(1) + ' MB');
  }
  /* hero-crops / image-sizes se bane hue alag folder mein hain? */
  say('');
  say('   src/assets ke andar doosre folders:');
  const as = path.join(ROOT, 'src', 'assets');
  for (const e of fs.readdirSync(as, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    let n = 0, b = 0;
    const w = (d) => { for (const x of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, x.name); if (x.isDirectory()) w(f); else { n++; b += fs.statSync(f).size; } } };
    try { w(path.join(as, e.name)); } catch { }
    say('      ' + e.name.padEnd(16) + String(n).padStart(5) + ' files   ' + (b / 1024 / 1024).toFixed(1) + ' MB');
  }
}

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein.');
say('');

fs.writeFileSync(path.join(ROOT, '_bundle.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _bundle.txt');
