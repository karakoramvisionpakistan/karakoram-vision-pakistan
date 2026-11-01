#!/usr/bin/env node
/**
 * audit-content.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dekhta hai.
 *
 * Teen cheezein:
 *
 *  1. DOHRA MATAN — har safhe ka har safhe se muqabla. Das lafzon ka jo
 *     tukra do ya teen safhon par ho, woh asli masla hai. Jo tukra chaar
 *     ya zyada safhon par ho, woh aap ka boilerplate hai (planning notes
 *     wagera) — usay alag ginta hai, masla nahi samajhta.
 *
 *  2. BULANDI KA KHAANA — woh aankre jo jagah ke hisaab se mumkin nahi.
 *     Hotel ki raat par 3,000 m se ooper, ya kisi bhi camp par 7,000 m se
 *     ooper. Day 3 par 8,125 m isi tarah pakra gaya tha.
 *
 *  3. HIJJE AUR UNWAN — maloom ghaltiyan aur woh unwan jo nuqte par khatam
 *     hote hain.
 *
 *   node tools/audit-content.mjs
 *
 * Yeh  _audit.txt  bana dega.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'src', 'content');
const N = 10;                 /* das lafzon ka tukra */
const BOILER_AT = 4;          /* itne safhon par ho to boilerplate */

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc);
    else if (e.name.endsWith('.md')) acc.push(f);
  }
  return acc;
};

if (!fs.existsSync(CONTENT)) { console.log('XX  src/content nahi mili.'); process.exit(1); }

const normWords = (s) => String(s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .toLowerCase().match(/[a-z0-9]+/g) || [];

const runs = (txt) => {
  const w = normWords(txt);
  const s = new Set();
  for (let i = 0; i + N <= w.length; i++) s.add(w.slice(i, i + N).join(' '));
  return s;
};

/* ---- sab safhe parho ---------------------------------------------------- */

const pages = [];
for (const file of walk(CONTENT)) {
  const ref = path.relative(CONTENT, file).split(path.sep).join('/');
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { continue; }
  let d; try { d = yaml.load(fm[1]) || {}; } catch { continue; }
  const itin = Array.isArray(d.itinerary) ? d.itinerary : [];
  const text = itin.map((x) => String(x.description || '')).join(' \n ') + ' \n ' + raw.slice(fm[0].length);
  pages.push({ ref, d, itin, text, runs: runs(text) });
}

say('MATAN KA AUDIT');
say('='.repeat(86));
say('   safhe: ' + pages.length + '   |   tukre ki lambai: ' + N + ' lafz');
say('');

/* ---- 1. dohra matan ----------------------------------------------------- */

const freq = new Map();
for (const p of pages) for (const r of p.runs) freq.set(r, (freq.get(r) || 0) + 1);

const boiler = new Set();
for (const [r, c] of freq) if (c >= BOILER_AT) boiler.add(r);

say('1. DOHRA MATAN');
say('-'.repeat(86));
say('');
say('   Boilerplate (' + BOILER_AT + '+ safhon par): ' + boiler.size + ' tukre.');
say('   Yeh aap ka apna matan hai — planning notes, responsible travel wagera.');
say('   Masla nahi samjha gaya, magar yaad rahe ke har safhe par bilkul ek');
say('   jaisa matan Google ki nazar mein kamzori hai.');
say('');

const pairs = [];
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const a = pages[i], b = pages[j];
    const shared = [];
    for (const r of a.runs) if (b.runs.has(r) && !boiler.has(r)) shared.push(r);
    if (shared.length) pairs.push({ a: a.ref, b: b.ref, n: shared.length, shared });
  }
}
pairs.sort((x, y) => y.n - x.n);

if (!pairs.length) say('   Do safhon ke darmiyan koi dohra tukra nahi. Saaf.');
else {
  say('   Do ya teen safhon par dohra: ' + pairs.length + ' jore.');
  say('');
  for (const p of pairs) {
    say('   ' + String(p.n).padStart(4) + ' tukre');
    say('        ' + p.a);
    say('        ' + p.b);
    for (const r of p.shared.slice(0, 4)) say('           "' + r + '"');
    if (p.shared.length > 4) say('           ... aur ' + (p.shared.length - 4));
    say('');
  }
}

/* ---- 2. bulandi --------------------------------------------------------- */

say('');
say('2. BULANDI KA KHAANA');
say('-'.repeat(86));

const metres = (s) => {
  const t = String(s || '');
  if (/summit/i.test(t)) return null;          /* summit wale range chhor do */
  const m = t.replace(/,/g, '').match(/(\d{3,5})\s*m\b/i);
  return m ? Number(m[1]) : null;
};

let altBad = 0;
for (const p of pages) {
  const bad = [];
  for (const day of p.itin) {
    const v = metres(day.altitude);
    if (v === null) continue;
    const night = String(day.overnight || '').toLowerCase();
    if (v >= 7000) bad.push([day, 'koi camp itna ooper nahi hota']);
    else if (night.includes('hotel') && v > 3000) bad.push([day, 'hotel ki raat par itni bulandi nahi']);
  }
  if (bad.length) {
    say('');
    say('   ' + p.ref);
    for (const [day, why] of bad) {
      say('      Day ' + String(day.day).padEnd(8) + String(day.altitude).padEnd(16) +
          String(day.title || '').slice(0, 34).padEnd(36) + why);
      altBad++;
    }
  }
}
if (!altBad) say('   Sab theek lagti hain.');

/* ---- 3. hijje aur unwan -------------------------------------------------- */

say('');
say('');
say('3. HIJJE AUR UNWAN');
say('-'.repeat(86));

const SPELL = ['Askoli', 'Urdokas', 'Mashabrum', 'Snow Doom', 'Intersting', 'Diamir',
               'Hisper', 'Bloosom', 'Khorbortze', 'Dumurdo', 'Expediiton', 'Ghasherbrum'];

let spellHits = 0;
for (const p of pages) {
  const hay = JSON.stringify(p.d) + ' ' + p.text;
  const found = SPELL.filter((w) => hay.includes(w));
  const dotty = p.itin.filter((x) => /[a-z]\.\s*$/i.test(String(x.title || '')));
  const longTitle = p.itin.filter((x) => String(x.title || '').length > 70);
  if (!found.length && !dotty.length && !longTitle.length) continue;
  say('');
  say('   ' + p.ref);
  if (found.length) { say('      hijje:  ' + found.join(', ')); spellHits += found.length; }
  for (const x of dotty) say('      unwan nuqte par khatam:  Day ' + x.day + '  "' + x.title + '"');
  for (const x of longTitle) say('      unwan bohat lamba (' + String(x.title).length + '):  Day ' + x.day + '  "' + String(x.title).slice(0, 72) + '..."');
}
if (!spellHits) say('');

/* ---- khulasa ------------------------------------------------------------ */

say('');
say('');
say('KHULASA');
say('='.repeat(86));
say('   dohre jore:        ' + pairs.length);
say('   boilerplate tukre: ' + boiler.size);
say('   bulandi ke masle:  ' + altBad);
say('');

fs.writeFileSync(path.join(ROOT, '_audit.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(86));
console.log('LIKHA: _audit.txt');
