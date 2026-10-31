#!/usr/bin/env node
/**
 * fix-last-day.mjs   (website ke folder mein)
 *
 * MERI GHALTI, DURUSTI KE SATH.
 *
 * Migration ne kuch trips ke AAKHRI din ke bayaan mein itinerary ke baad
 * ka matan bhi kheench liya — qeematein, notes wagera. Nateeja:
 *
 *   Day 50   525 harf   Camping    <- "Transfer to airport ... goodbye"
 *   Day 14   569 harf   Hotel      <- "Fly Out"
 *
 * Jaane wale din par 500 harf ka bayaan aur "Camping" dono ghalat hain.
 *
 * Yeh un dinon ko pehchanta hai jin ka unwan rukhsat ka hai, aur jahan
 * bayaan bahut lamba ho wahan usay saaf bayaan se badal deta hai aur raat
 * ko "Not applicable" kar deta hai.
 *
 * JO MATAN HATEGA WOH KAHIN GUM NAHI HOTA — woh safhe ke matan mein apni
 * jagah par maujood rehta hai, kyunke --trim-body usay nahi hataata.
 *
 * Sath hi woh 37 din aur 19 unwan gina deta hai jo abhi khaali hain, taake
 * unhein bhara ja sake.
 *
 *   node tools/fix-last-day.mjs            -> sirf dikhana
 *   node tools/fix-last-day.mjs --write    -> theek karna
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

/* Rukhsat ka din — in alfaaz se pehchana jata hai */
const DEPART = /fly out|fly to (your|on ?ward)|onward destination|own destination|transfer to (the )?airport|drop to (the )?airport|goodbye|end of our services|departure|fly to your/i;

/* Bahut lamba bayaan rukhsat ke din par iska matlab hai ke baad ka matan
   kheench liya gaya. Teen sau harf ka hadd kaafi hai: asli rukhsat ka
   bayaan is se chhota hota hai. */
const TOO_LONG = 300;

const CLEAN = 'Transfer to the airport for your onward flight. A day room can be arranged if your departure is late in the day. This is where our services end — and where, we hope, the planning for the next trip begins.';

const writes = [];
const fixes = [];
const nightGaps = [];
const titleGaps = [];

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

for (const f of files) {
  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) continue;

  const head = fm[1];
  const rest = raw.slice(fm[0].length);
  const lines = head.split('\n');
  const start = lines.findIndex((l) => /^itinerary:\s*$/.test(l));
  if (start < 0) continue;

  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end++;

  let days;
  try { days = yaml.load(lines.slice(start, end).join('\n')).itinerary; } catch { continue; }
  if (!Array.isArray(days) || !days.length) continue;

  let changed = 0;

  const fixed = days.map((d, i) => {
    const e = { ...(d || {}) };
    const isLast = i === days.length - 1;
    const depart = DEPART.test(String(e.title || ''));

    if (depart || isLast) {
      const len = String(e.description || '').length;
      const badNight = e.overnight && e.overnight !== 'Not applicable';

      if (depart && (len > TOO_LONG || badNight)) {
        fixes.push({
          ref: f.ref, day: e.day, title: e.title,
          was: String(e.description || '').slice(0, 110),
          len, night: e.overnight || '-',
        });
        e.description = CLEAN;
        e.overnight = 'Not applicable';
        changed++;
      }
    }

    if (!e.overnight) nightGaps.push({ ref: f.ref, day: e.day, title: e.title || '[unwan nahi]' });
    if (!e.title) titleGaps.push({ ref: f.ref, day: e.day, desc: String(e.description || '').slice(0, 70) });

    const out = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') out[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in out) && e[k] !== undefined && e[k] !== '') out[k] = e[k];
    return out;
  });

  if (!changed) continue;

  const dumped = yaml.dump({ itinerary: fixed }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
  try {
    const chk = yaml.load(dumped);
    if (!Array.isArray(chk.itinerary) || chk.itinerary.length !== days.length) throw new Error('ginti badal gayi');
  } catch (e) { console.log('XX  ' + f.ref + ': jaanch fail — ' + e.message); continue; }

  const newHead = [...lines.slice(0, start), ...dumped.split('\n'), ...lines.slice(end)].join('\n');
  writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + rest });
}

/* ============================================= report ================ */

console.log('\nRUKHSAT WALE DIN JO THEEK HONGE');
console.log('='.repeat(76));
if (!fixes.length) console.log('   Koi nahi mila.');
for (const x of fixes) {
  console.log('   ' + x.ref);
  console.log('      Day ' + String(x.day).padEnd(8) + x.title);
  console.log('      abhi: ' + x.len + ' harf, raat "' + x.night + '"');
  console.log('      "' + x.was.replace(/\s+/g, ' ') + ' ..."');
  console.log('');
}

console.log('\nRAAT ABHI BHI KHAALI (' + nightGaps.length + ') — unwan ke sath');
console.log('='.repeat(76));
let last = '';
for (const g of nightGaps) {
  if (g.ref !== last) { console.log('   ' + g.ref); last = g.ref; }
  console.log('      Day ' + String(g.day).padEnd(8) + g.title);
}

if (titleGaps.length) {
  console.log('\nUNWAN KHAALI (' + titleGaps.length + ') — bayaan ka shuru');
  console.log('='.repeat(76));
  last = '';
  for (const g of titleGaps) {
    if (g.ref !== last) { console.log('   ' + g.ref); last = g.ref; }
    console.log('      Day ' + String(g.day).padEnd(8) + g.desc.replace(/\s+/g, ' ') + ' ...');
  }
}

console.log('\n' + '-'.repeat(76));
if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Theek karne ke liye:');
  console.log('   node tools/fix-last-day.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.baklast')) fs.copyFileSync(w.file, w.file + '.baklast');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
