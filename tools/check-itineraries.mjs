#!/usr/bin/env node
/**
 * check-itineraries.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf ginti karta hai.
 *
 * Meri pichli report mein kami thi: jab kuch na badalta to woh "sab pehle
 * se bhara hua hai" keh deti thi, chahe waja yeh ho ke bayaan waqai mojood
 * hai, ya yeh ke mere din ke number file se mel nahi khaye. Dono ka paigham
 * ek jaisa tha, is liye bharosa nahi kiya ja sakta.
 *
 * Yeh har din ka asal haal dikhata hai, aur khaas tor par woh chhe files
 * khol kar dikhata hai jin par shak tha.
 *
 *   node tools/check-itineraries.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

/* Jin par shak tha — inhein poora khol kar dikhate hain */
const SUSPECT = [
  'expeditions/broad-peak-expedition.md',
  'expeditions/gasherbrum-ii-expedition.md',
  'expeditions/ghasherbrum-1.md',
  'expeditions/k2-expediiton.md',
  'tours/autumn-hunza-skardu-tour.md',
  'tours/fairy-meadows-nanga-parbat-tour.md',
];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

let totalDays = 0, noDesc = 0, noNight = 0, noAlt = 0, noTitle = 0;
const nightGaps = [];
const descGaps = [];
const noItin = [];

for (const f of files) {
  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { say('XX  ' + f.ref + ': front matter nahi parhi gayi'); continue; }

  let data;
  try { data = yaml.load(fm[1]); }
  catch (e) { say('XX  ' + f.ref + ': YAML ' + String(e.message).split('\n')[0]); continue; }

  const itin = data && Array.isArray(data.itinerary) ? data.itinerary : null;
  if (!itin || !itin.length) { if (data && data.service_type) noItin.push(f.ref); continue; }

  totalDays += itin.length;
  const nd = itin.filter((d) => !d || !d.description).length;
  const nn = itin.filter((d) => !d || !d.overnight).length;
  noDesc += nd; noNight += nn;
  noAlt += itin.filter((d) => !d || !d.altitude).length;
  noTitle += itin.filter((d) => !d || !d.title).length;

  if (nd) descGaps.push({ ref: f.ref, n: nd, days: itin.filter((d) => !d || !d.description).map((d) => d && d.day) });
  if (nn) nightGaps.push({ ref: f.ref, n: nn, days: itin.filter((d) => !d || !d.overnight).map((d) => d && d.day) });
}

/* ============================================= shak wali files ======== */

say('JIN PAR SHAK THA — POORA HAAL');
say('='.repeat(72));

for (const ref of SUSPECT) {
  const f = files.find((x) => x.ref === ref);
  if (!f) { say('\n   ' + ref + ': file nahi mili'); continue; }
  const fm = fs.readFileSync(f.full, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let itin = null;
  try { itin = yaml.load(fm[1]).itinerary; } catch { /* neeche sambhal lenge */ }
  if (!Array.isArray(itin)) { say('\n   ' + ref + ': itinerary nahi mili'); continue; }

  say('');
  say('   ' + ref + '   (' + itin.length + ' din)');
  for (const d of itin) {
    const day = String((d && d.day) || '?').padEnd(8);
    const desc = (d && d.description) ? String(d.description).length + ' harf' : 'KHAALI';
    const night = (d && d.overnight) || '-';
    say('      Day ' + day + desc.padEnd(12) + night);
  }
}

/* ============================================= kul hisaab ============= */

say('');
say('KUL HISAAB');
say('='.repeat(72));
say('   Kul din:         ' + totalDays);
say('   Bayaan khaali:   ' + noDesc);
say('   Unwan khaali:    ' + noTitle);
say('   Raat khaali:     ' + noNight);
say('   Bulandi khaali:  ' + noAlt);

if (descGaps.length) {
  say('');
  say('BAYAAN JAHAN KHAALI HAI');
  say('-'.repeat(72));
  for (const g of descGaps) say('   ' + g.ref.padEnd(50) + g.n + ' din: ' + g.days.join(', '));
}

if (nightGaps.length) {
  say('');
  say('RAAT JAHAN KHAALI HAI');
  say('-'.repeat(72));
  for (const g of nightGaps) say('   ' + g.ref.padEnd(50) + g.n + ' din: ' + g.days.join(', '));
}

if (noItin.length) {
  say('');
  say('JIN MEIN ITINERARY HAI HI NAHI');
  say('-'.repeat(72));
  for (const r of noItin) say('   ' + r);
}

fs.writeFileSync(path.join(ROOT, '_check.txt'), out.join('\n') + '\n', 'utf8');
console.log('');
console.log('LIKHA: _check.txt');
