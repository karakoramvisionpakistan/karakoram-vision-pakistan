#!/usr/bin/env node
/**
 * count-words.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf ginti karta hai.
 *
 * Har trip ke alfaaz pehle kitne the aur ab kitne hain. Andaza nahi:
 * har file ki sab se purani .bak naqal dhoondh kar usi se muqabla karta
 * hai, is liye adad asli hain.
 *
 * Kya gina jata hai — wohi jo safhe par parha jata hai:
 *   matan (HTML ke tags hata kar) + summary + itinerary ke saare khaane
 *   + trip ke apne FAQ
 *
 * Jo nahi gina jata: sattarah aam sawalon ka bank, kyunke woh build ke
 * waqt har safhe par lagta hai, pehle bhi aur ab bhi. Usay ginti mein
 * daalna apni taraf se adad barhana hota.
 *
 *   node tools/count-words.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const strip = (html) => String(html || '')
  .replace(/<\/(p|li|h[1-6]|div|tr)>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' ');

const words = (s) => (String(s || '').match(/[A-Za-z0-9À-ɏ][A-Za-z0-9À-ɏ'’-]*/g) || []).length;

/* Kisi bhi gehrai ki string ginti mein aa jaye */
function deepWords(node, depth = 0) {
  if (node == null || depth > 6) return 0;
  if (typeof node === 'string') return words(node);
  if (typeof node === 'number') return 0;
  if (Array.isArray(node)) return node.reduce((n, x) => n + deepWords(x, depth + 1), 0);
  if (typeof node === 'object') return Object.values(node).reduce((n, x) => n + deepWords(x, depth + 1), 0);
  return 0;
}

function measure(raw) {
  const fm = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) return { body: words(strip(raw)), itin: 0, faq: 0, summary: 0, days: 0 };

  let data;
  try { data = yaml.load(fm[1]) || {}; } catch { data = {}; }
  const body = words(strip(raw.slice(fm[0].length)));

  const itin = Array.isArray(data.itinerary) ? deepWords(data.itinerary) : 0;
  const days = Array.isArray(data.itinerary) ? data.itinerary.length : 0;
  const faq = Array.isArray(data.faqs) ? deepWords(data.faqs) : 0;
  const summary = words(data.summary) + words(data.answer_summary);

  return { body, itin, faq, summary, days };
}

/* Sab se purani naqal — yani asal haalat ke sab se qareeb */
function oldestBackup(full) {
  const dir = path.dirname(full);
  const base = path.basename(full);
  let best = null;
  for (const n of fs.readdirSync(dir)) {
    if (!n.startsWith(base + '.bak')) continue;
    const p = path.join(dir, n);
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (!best || st.mtimeMs < best.m) best = { p, m: st.mtimeMs, n };
  }
  return best;
}

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

const rows = [];
let T = { before: 0, after: 0, itin: 0, days: 0, noBak: 0 };

for (const f of files) {
  const now = measure(fs.readFileSync(f.full, 'utf8'));
  const bak = oldestBackup(f.full);

  const after = now.body + now.itin + now.faq + now.summary;
  let before = null;
  if (bak) {
    const b = measure(fs.readFileSync(bak.p, 'utf8'));
    before = b.body + b.itin + b.faq + b.summary;
  } else T.noBak++;

  rows.push({ ref: f.ref, before, after, itin: now.itin, days: now.days, bak: bak && bak.n.replace(/^.*\.md\./, '') });
  T.after += after;
  T.before += before === null ? after : before;
  T.itin += now.itin;
  T.days += now.days;
}

rows.sort((a, b) => (b.after - (b.before ?? b.after)) - (a.after - (a.before ?? a.after)));

say('ALFAAZ — PEHLE AUR AB');
say('='.repeat(80));
say('');
say('   ' + 'trip'.padEnd(46) + 'pehle'.padStart(7) + '  ' + 'ab'.padStart(7) + '  ' + 'farq'.padStart(8) + '   din');
say('   ' + '-'.repeat(74));

for (const r of rows) {
  const before = r.before === null ? '   -  ' : String(r.before).padStart(7);
  const diff = r.before === null ? '      -' : (r.after - r.before >= 0 ? '+' : '') + String(r.after - r.before);
  say('   ' + r.ref.padEnd(46) + before + '  ' + String(r.after).padStart(7) + '  ' +
      diff.padStart(8) + '   ' + String(r.days).padStart(3));
}

say('');
say('   ' + '-'.repeat(74));
say('   ' + 'KUL'.padEnd(46) + String(T.before).padStart(7) + '  ' + String(T.after).padStart(7) + '  ' +
    ('+' + (T.after - T.before)).padStart(8) + '   ' + String(T.days).padStart(3));

const withBak = rows.filter((r) => r.before !== null);
const avgB = withBak.length ? Math.round(withBak.reduce((n, r) => n + r.before, 0) / withBak.length) : 0;
const avgA = withBak.length ? Math.round(withBak.reduce((n, r) => n + r.after, 0) / withBak.length) : 0;

say('');
say('KHULASA');
say('='.repeat(80));
say('   Kul alfaaz pehle:        ' + T.before);
say('   Kul alfaaz ab:           ' + T.after);
say('   Izafa:                   ' + (T.after - T.before) + '   (' +
    (T.before ? Math.round(((T.after - T.before) / T.before) * 100) : 0) + ' fi sad)');
say('');
say('   Ausat per trip pehle:    ' + avgB);
say('   Ausat per trip ab:       ' + avgA);
say('');
say('   In mein se itinerary ke: ' + T.itin + ' alfaaz, ' + T.days + ' din');
if (T.noBak) say('   (' + T.noBak + ' trips ki purani naqal nahi mili — un ka farq nahi gina ja saka)');

say('');
say('   Yaad rahe: har trip ke safhe par sattarah aam sawalon ka bank bhi');
say('   lagta hai, taqreeban ' + 1100 + ' alfaaz, magar woh pehle bhi lagta tha');
say('   aur ab bhi, is liye upar ki ginti mein shamil nahi.');

say('');
say('MUQABIL (pichle audit se)');
say('='.repeat(80));
say('   Adventure Pakistan   ~3,200 alfaaz per safha');
say('   Apricot Tours        ~9,000');
say('   Trango Adventure     ~9,500');

const top = rows.filter((r) => r.days > 0).sort((a, b) => b.after - a.after).slice(0, 8);
say('');
say('   Hamare aath sab se bare safhe ab:');
for (const r of top) say('      ' + String(r.after).padStart(6) + '   ' + r.ref);

fs.writeFileSync(path.join(ROOT, '_words.txt'), out.join('\n') + '\n', 'utf8');
console.log('');
console.log('LIKHA: _words.txt');
