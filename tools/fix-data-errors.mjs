#!/usr/bin/env node
/**
 * fix-data-errors.mjs   (website ke folder mein)
 *
 * Kal ka script aadha laga tha. Wajah: safhon par din "03", "04", "08"
 * likhe hain aur main unhein "3", "4", "8" se mila raha tha. Ab din Number
 * se milte hain, aur jo target na mile woh ooper KHULASA mein alag likha
 * jata hai — chup chaap nahi guzarta.
 *
 * Teen kaam, poori website par:
 *
 *  1. BULANDI — 8,125 m (Nanga Parbat ki bulandi) chaar expedition safhon
 *     par Day 3 ke Skardu wale din par lagi hui hai. 2,228 m hogi.
 *
 *  2. HIJJE — Askoli, Urdokas, Dumurdo, Mashabrum, Intersting, Bloosom,
 *     Hisper, Khorbortze. Sirf matan mein; file ke naam nahi chhuye jate,
 *     warna URL toot jate hain.
 *
 *  3. UNWAN — jo nuqte par khatam hote hain, aur "on ward" -> "onward".
 *
 * jeep-safaris/untitled.md ka 7,788 m jaan kar nahi chhua — woh Rakaposhi
 * ki bulandi hai aur mujhe us din ka sahi aankra nahi maloom. Report mein
 * likha jata hai.
 *
 *   node tools/fix-data-errors.mjs            -> sirf dikhana
 *   node tools/fix-data-errors.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CONTENT = path.join(ROOT, 'src', 'content');

/* ---- Day 3 ki bulandi: kaun se safhe, kya hona chahiye ---------------- */
const ALT_FIX = [
  ['expeditions/broad-peak-expedition.md',   3, '2,228 m', 'Skardu'],
  ['expeditions/gasherbrum-ii-expedition.md', 3, '2,228 m', 'Skardu'],
  ['expeditions/ghasherbrum-1.md',           3, '2,228 m', 'Skardu'],
  ['expeditions/k2-expediiton.md',           3, '2,228 m', 'Skardu'],
];

/* ---- hijje: sirf matan mein, case ka khayal rakh kar ------------------ */
const SPELL = [
  ['Askoli', 'Askole'],
  ['Urdokas', 'Urdukas'],
  ['Dumurdo', 'Dumordo'],
  ['Mashabrum', 'Masherbrum'],
  ['Intersting', 'Interesting'],
  ['Bloosom', 'Blossom'],
  ['Hisper', 'Hispar'],
  ['Khorbortze', 'Khoburtse'],
  ['on ward destination', 'onward destination'],
];

/* ------------------------------------------------------------------ */

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

/* din milane ka sahi tareeqa — "03" aur 3 ek hi hain, "54-57" alag */
const sameDay = (a, b) => {
  const x = String(a).trim(), y = String(b).trim();
  if (x === y) return true;
  const nx = Number(x), ny = Number(y);
  return Number.isFinite(nx) && Number.isFinite(ny) && nx === ny;
};

const findItin = (lines) => {
  let s = -1;
  for (let i = 0; i < lines.length; i++) if (/^itinerary:\s*$/.test(lines[i])) { s = i; break; }
  if (s === -1) return null;
  for (let i = s + 1; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i]) || /^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[i])) return { start: s, end: i };
  }
  return null;
};

const files = walk(CONTENT);
const rel = (f) => path.relative(CONTENT, f).split(path.sep).join('/');
const pending = new Map(files.map((f) => [rel(f), f]));

const result = {};          /* ref -> naya matan */
const misses = [];
let nAlt = 0, nSpell = 0, nDot = 0;

say('MAUJOODA GHALTIYAN — DURUSTI');
say('='.repeat(84));

/* ========== 1. bulandi ========== */

say('');
say('1. BULANDI — Day 3, Skardu');
say('-'.repeat(84));

for (const [ref, dayNo, want, where] of ALT_FIX) {
  const file = pending.get(ref);
  if (!file) { say('   XX  ' + ref + ' nahi mili'); misses.push(ref + ' (file)'); continue; }

  const raw = result[ref] ?? fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const at = findItin(lines);
  if (!at) { say('   XX  ' + ref + ': itinerary block nahi mila'); misses.push(ref + ' (block)'); continue; }

  let itin;
  try { itin = yaml.load(lines.slice(at.start, at.end).join('\n')).itinerary; }
  catch (e) { say('   XX  ' + ref + ': YAML ' + e.message); misses.push(ref + ' (yaml)'); continue; }
  if (!Array.isArray(itin)) { say('   XX  ' + ref + ': itinerary list nahi'); misses.push(ref + ' (list)'); continue; }

  const i = itin.findIndex((d) => sameDay(d.day, dayNo));
  if (i < 0) { say('   XX  ' + ref + ': Day ' + dayNo + ' nahi mila'); misses.push(ref + ' Day ' + dayNo); continue; }

  const old = String(itin[i].altitude || '[khaali]');
  if (old === want) { say('   -- ' + ref.padEnd(42) + 'pehle se theek'); continue; }

  say('   OK ' + ref);
  say('        Day ' + String(itin[i].day).padEnd(5) + old + '  ->  ' + want + '   (' + where + ')');
  itin[i].altitude = want;
  nAlt++;

  const d = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
  while (d.length && d[d.length - 1] === '') d.pop();
  const rebuilt = [...lines.slice(0, at.start), ...d, ...lines.slice(at.end)].join(eol);

  const fm = rebuilt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let ok = false;
  try { ok = yaml.load(fm[1]).itinerary.length === itin.length; } catch { /* */ }
  if (!ok) { say('        XX  jaanch nakaam — nahi badla'); misses.push(ref + ' (verify)'); continue; }
  result[ref] = rebuilt;
}

/* ========== 2. hijje ========== */

say('');
say('2. HIJJE');
say('-'.repeat(84));

for (const file of files) {
  const ref = rel(file);
  let text = result[ref] ?? fs.readFileSync(file, 'utf8');
  const hits = [];
  for (const [a, b] of SPELL) {
    const n = text.split(a).length - 1;
    if (n) { text = text.split(a).join(b); hits.push(n + 'x ' + a + ' -> ' + b); nSpell += n; }
  }
  if (hits.length) {
    say('   ' + ref);
    for (const h of hits) say('        ' + h);
    result[ref] = text;
  }
}
if (!nSpell) say('   Kuch nahi mila.');

/* ========== 3. unwan ========== */

say('');
say('3. UNWAN KE AAKHIR KA NUQTA');
say('-'.repeat(84));

for (const file of files) {
  const ref = rel(file);
  const raw = result[ref] ?? fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const at = findItin(lines);
  if (!at) continue;

  let itin;
  try { itin = yaml.load(lines.slice(at.start, at.end).join('\n')).itinerary; } catch { continue; }
  if (!Array.isArray(itin)) continue;

  const changed = [];
  for (const d of itin) {
    const t = String(d.title || '');
    if (/[A-Za-z0-9)]\.\s*$/.test(t)) {
      const nt = t.replace(/\s*\.\s*$/, '');
      changed.push('Day ' + String(d.day).padEnd(7) + '"' + t + '"  ->  "' + nt + '"');
      d.title = nt; nDot++;
    }
  }
  if (!changed.length) continue;

  say('   ' + ref);
  for (const c of changed) say('        ' + c);

  const dmp = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
  while (dmp.length && dmp[dmp.length - 1] === '') dmp.pop();
  const rebuilt = [...lines.slice(0, at.start), ...dmp, ...lines.slice(at.end)].join(eol);

  const fm = rebuilt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let ok = false;
  try { ok = yaml.load(fm[1]).itinerary.length === itin.length; } catch { /* */ }
  if (!ok) { say('        XX  jaanch nakaam — is file ke unwan nahi badle'); misses.push(ref + ' (titles)'); continue; }
  result[ref] = rebuilt;
}
if (!nDot) say('   Kuch nahi mila.');

/* ========== khulasa ========== */

say('');
say('='.repeat(84));
say('KHULASA');
say('   bulandi theek ki:    ' + nAlt);
say('   hijje theek kiye:    ' + nSpell);
say('   unwan theek kiye:    ' + nDot);
say('   files badlengi:      ' + Object.keys(result).length);
say('');

if (misses.length) {
  say('   XX XX XX  YEH NAHI HO SAKA — ' + misses.length + ' jagah:');
  for (const m of misses) say('             ' + m);
  say('');
} else {
  say('   Koi target chhoota nahi.');
  say('');
}

say('   Jaan kar nahi chhua:');
say('      jeep-safaris/untitled.md  Day 11  7,788 m  "Fairy Meadow to Karimabad"');
say('         7,788 m Rakaposhi ki bulandi hai. Karimabad taqreeban 2,500 m par hai,');
say('         magar mujhe aap ke us din ka sahi aankra nahi maloom. Aap batayein to');
say('         badal dun.');
say('      jeep-safaris/untitled.md  Day 17  3,700 m  "Phander - Chitral via Shandoor Pass"');
say('         3,700 m darre ki bulandi hai, raat Chitral mein hai jo bohat neechay hai.');
say('      expeditions/nanga-parbat-expedition.md  "Diamir" — yeh ghalat nahi, Diamir aur');
say('         Diamer dono chalte hain. Chhora hai.');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-data-errors.mjs --write');
  fs.writeFileSync(path.join(ROOT, '_fix.txt'), out.join('\n') + '\n', 'utf8');
  process.exit(0);
}

let wrote = 0;
for (const [ref, text] of Object.entries(result)) {
  const file = pending.get(ref);
  if (!fs.existsSync(file + '.bakfix')) fs.copyFileSync(file, file + '.bakfix');
  fs.writeFileSync(file, text, 'utf8');
  console.log('LIKHA: ' + ref);
  wrote++;
}
fs.writeFileSync(path.join(ROOT, '_fix.txt'), out.join('\n') + '\n', 'utf8');
console.log('');
console.log(wrote + ' files likhi gayi. backup: *.bakfix');
console.log('');
console.log('Agla qadam:  npm run build');
console.log('Phir:        node tools/audit-content.mjs');
