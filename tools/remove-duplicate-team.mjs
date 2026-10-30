#!/usr/bin/env node
/**
 * remove-duplicate-team.mjs
 *
 * Our Team ka safha do jagah ban raha hai:
 *   /our-team/            <- src/our-team/index.njk        (naya, CMS wala)
 *   /about-us/our-team/   <- src/content/pages/our-team.md  (purana)
 *
 * Yeh script purani file hata kar uske pate par redirect laga deti hai,
 * taake koi purana link na toote aur Google ko ek hi safha nazar aaye.
 *
 * Saath hi poori website mein aise aur duplicate safhe dhoondti hai.
 *
 *   node tools/remove-duplicate-team.mjs            -> sirf dekhna
 *   node tools/remove-duplicate-team.mjs --write    -> karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const deletes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

const OLD_FILE = path.join(ROOT, 'src', 'content', 'pages', 'our-team.md');
const FROM = '/about-us/our-team/';
const TO = '/our-team/';

/* ======================================================= 1) duplicates = */

console.log('\n1) Poori website mein duplicate safhe');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const pages = [];   // { url, title, file }
for (const f of walk(path.join(ROOT, 'src'))) {
  if (!/\.(njk|md)$/.test(f)) continue;
  if (f.includes('_includes')) continue;
  const t = read(f) || '';
  if (!t.startsWith('---')) continue;
  const end = t.indexOf('\n---', 3);
  if (end < 0) continue;
  const fm = t.slice(3, end);
  const url = ((fm.match(/^permalink:\s*(.+)$/m) || [])[1] || '').trim().replace(/^["']|["']$/g, '');
  const title = ((fm.match(/^title:\s*(.+)$/m) || [])[1] || '').trim().replace(/^["']|["']$/g, '');
  if (!url) continue;
  pages.push({ url, title, file: path.relative(ROOT, f).replace(/\\/g, '/') });
}

const byUrl = {};
for (const p of pages) (byUrl[p.url] = byUrl[p.url] || []).push(p);
const clashes = Object.entries(byUrl).filter(([, list]) => list.length > 1);
if (!clashes.length) console.log('   OK  ek pata do files se nahi ban raha.');
else for (const [url, list] of clashes) {
  console.log('   !!  ' + url);
  for (const p of list) console.log('        ' + p.file);
}

const byTitle = {};
for (const p of pages) {
  const key = p.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!key) continue;
  (byTitle[key] = byTitle[key] || []).push(p);
}
const sameTitle = Object.entries(byTitle).filter(([, list]) => list.length > 1);
if (!sameTitle.length) console.log('   OK  ek hi unwaan do safhon par nahi.');
else for (const [, list] of sameTitle) {
  console.log('   !   ek hi unwaan: "' + list[0].title + '"');
  for (const p of list) console.log('        ' + p.url.padEnd(28) + p.file);
}

/* ======================================================= 2) delete ===== */

console.log('\n2) Purani Our Team file');

if (!fs.existsSync(OLD_FILE)) {
  console.log('   OK  pehle hi hat chuki hai.');
} else {
  deletes.push(OLD_FILE);
  console.log('   ->  hatayi jayegi: src/content/pages/our-team.md');
}

/* ======================================================= 3) redirect === */

console.log('\n3) Redirect');

/* (a) Cloudflare ka _redirects — asli 301, sab se behtar */
let done = false;
for (const name of ['_redirects', 'src/_redirects']) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) continue;
  const t = read(file) || '';
  if (t.includes(FROM)) { console.log('   OK  ' + name + ' mein pehle se hai.'); done = true; break; }
  const line = `${FROM}  ${TO}  301\n`;
  writes.push({ file, text: t.endsWith('\n') || !t ? t + line : t + '\n' + line });
  console.log('   ->  ' + name + ' mein 301 laga');
  done = true;
  break;
}

/* (b) warna project ki apni redirects.json */
if (!done) {
  const file = path.join(ROOT, 'src', '_data', 'redirects.json');
  const raw = read(file);
  if (raw === null) {
    console.log('   !   na _redirects mili na redirects.json — redirect nahi lag saka.');
    console.log('       File hatane se purana pata 404 dega. Mujhe bata dein.');
  } else {
    let obj;
    try { obj = JSON.parse(raw); }
    catch (e) { console.log('   XX  redirects.json parse nahi hui: ' + e.message); process.exit(1); }

    console.log('   maujooda shakal: ' + JSON.stringify(obj).slice(0, 120));

    if (Array.isArray(obj)) {
      if (obj.some((r) => r && (r.from === FROM || r.source === FROM))) {
        console.log('   OK  pehle se hai.');
      } else {
        const sample = obj[0] || {};
        const entry = ('source' in sample) ? { source: FROM, destination: TO }
                    : ('to' in sample || !obj.length) ? { from: FROM, to: TO }
                    : { from: FROM, to: TO };
        obj.push(entry);
        writes.push({ file, text: JSON.stringify(obj, null, 2) + '\n' });
        console.log('   ->  redirects.json mein juR gaya');
      }
    } else if (obj && typeof obj === 'object') {
      if (obj[FROM]) console.log('   OK  pehle se hai.');
      else {
        obj[FROM] = TO;
        writes.push({ file, text: JSON.stringify(obj, null, 2) + '\n' });
        console.log('   ->  redirects.json mein juR gaya');
      }
    }
  }
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length && !deletes.length) { console.log('Kuch karne ko nahi hai.'); process.exit(0); }

console.log(writes.length + ' file badlegi, ' + deletes.length + ' hategi.');

if (!WRITE) {
  console.log('\nKarne ke liye:');
  console.log('   node tools/remove-duplicate-team.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bak5') && fs.existsSync(w.file)) fs.copyFileSync(w.file, w.file + '.bak5');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
for (const d of deletes) {
  fs.rmSync(d);
  console.log('HATAYI: ' + path.relative(ROOT, d).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
