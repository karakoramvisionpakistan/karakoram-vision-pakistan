#!/usr/bin/env node
/**
 * audit-itineraries.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dekhta hai.
 *
 * Purani trips ki itinerary matan mein kis andaz mein likhi hui hai? Agar
 * koi qaayda hai to usay parh kar naye khaanon mein khud ba khud daala ja
 * sakta hai, aur sau trips haath se bharne ki zaroorat nahi rahegi.
 *
 *   node tools/audit-itineraries.mjs
 *
 * Yeh  _itineraries.txt  bana dega. Wohi file mujhe bhej dein.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

/* Matan mein "Day" kis shakal mein likha hai — har shakal ka apna nishan. */
const STYLES = [
  { id: 'heading',   label: '## Day 1 / ### Day 1 (heading)',    re: /^#{1,6}\s*day\s*\d/im },
  { id: 'bold',      label: '**Day 1** (mota likha hua)',        re: /^\s*\*\*\s*day\s*\d/im },
  { id: 'colon',     label: 'Day 1: ... (line ke shuru mein)',   re: /^\s*day\s*\d+\s*[:\-–]/im },
  { id: 'tablerow',  label: '| Day 1 | ... | (table ki qatar)',  re: /^\s*\|\s*day\s*\d/im },
  { id: 'listitem',  label: '- Day 1 ... (fehrist ka nuqta)',    re: /^\s*[-*]\s*\*?\*?\s*day\s*\d/im },
];

const files = [];
for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    files.push({ service, name, full: path.join(dir, name) });
  }
}

say('ITINERARY AUDIT');
say('Kul ' + files.length + ' trips');
say('');

const tally = {};
for (const s of STYLES) tally[s.id] = [];
const none = [];
const already = [];
const dayCounts = [];

for (const f of files) {
  const raw = fs.readFileSync(f.full, 'utf8');

  // front matter alag karein
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const head = fm ? fm[1] : '';
  const body = fm ? raw.slice(fm[0].length) : raw;

  if (/^itinerary:/m.test(head)) { already.push(f.service + '/' + f.name); continue; }

  let hit = null;
  for (const s of STYLES) if (s.re.test(body)) { hit = s; break; }

  if (!hit) { none.push(f.service + '/' + f.name); continue; }

  // kitne din mile
  const days = (body.match(/\bday\s*\d+/gi) || []).length;
  tally[hit.id].push({ ref: f.service + '/' + f.name, days, body, full: f.full });
  dayCounts.push(days);
}

say('KAUN SA ANDAZ, KITNI TRIPS');
say('-'.repeat(50));
for (const s of STYLES) {
  if (!tally[s.id].length) continue;
  say(String(tally[s.id].length).padStart(4) + '  ' + s.label);
}
if (none.length)    say(String(none.length).padStart(4) + '  koi "Day" ka nishan nahi mila');
if (already.length) say(String(already.length).padStart(4) + '  naye khaane mein pehle se data hai');
say('');

if (dayCounts.length) {
  dayCounts.sort((a, b) => a - b);
  say('Din ki ginti: kam se kam ' + dayCounts[0] +
      ', zyada se zyada ' + dayCounts[dayCounts.length - 1] +
      ', darmiyana ' + dayCounts[Math.floor(dayCounts.length / 2)]);
  say('');
}

/* Har andaz ka ek asli namoona — isi se maloom hoga ke parhna mumkin hai ya nahi. */
say('ASLI NAMOONE');
say('='.repeat(50));

for (const s of STYLES) {
  const list = tally[s.id];
  if (!list.length) continue;

  // sab se zyada din wali file, kyunke usme poora qaayda nazar aata hai
  list.sort((a, b) => b.days - a.days);
  const pick = list[0];

  say('');
  say('--- ' + s.label);
  say('--- ' + pick.ref + '  (' + pick.days + ' din)');
  say('');

  // pehla "Day" kahan se shuru hota hai, wahan se thoRa sa hissa
  const at = pick.body.search(s.re);
  const chunk = pick.body.slice(Math.max(0, at - 120), at + 1400);
  for (const line of chunk.split('\n')) say('   ' + line);
  say('');
  say('   [' + list.length + ' trips isi andaz mein]');
  say('');
}

if (none.length) {
  say('');
  say('--- Jin mein "Day" ka nishan nahi mila (pehli 15)');
  for (const n of none.slice(0, 15)) say('   ' + n);
  if (none.length > 15) say('   ... aur ' + (none.length - 15));
  say('');
}

/* ======================================================= likhna ======== */

const FILE = path.join(ROOT, '_itineraries.txt');
fs.writeFileSync(FILE, out.join('\n') + '\n', 'utf8');

console.log('');
console.log('-'.repeat(50));
console.log('LIKHA: _itineraries.txt');
console.log('');
console.log('Yeh file mujhe bhej dein. Us se maloom hoga ke purani');
console.log('itineraries khud ba khud naye khaanon mein daali ja sakti');
console.log('hain ya nahi — aur sau trips haath se bharne ki zaroorat');
console.log('bachti hai ya nahi.');
