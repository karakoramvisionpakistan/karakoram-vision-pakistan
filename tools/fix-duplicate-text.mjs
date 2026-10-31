#!/usr/bin/env node
/**
 * fix-duplicate-text.mjs   (website ke folder mein)
 *
 * DO KAAM:
 *
 * 1. MERI GHALTI KI DURUSTI. fix-last-day.mjs ne rukhsat wale din par ek
 *    hi paragraph 21 safhon par laga diya — lafz ba lafz. Google isay
 *    nakal shuda matan samajhta hai aur sab safhon ko nuqsaan pohanchta
 *    hai. Ab har trip ka apna jumla.
 *
 *    Sirf wohi badalta hai jo bilkul mera likha hua paragraph ho. Agar
 *    client ne kuch likh diya ho to woh chhoota nahi.
 *
 * 2. BALTORO KA RAASTA DIKHANA. Din 02 se 10 tak chaaron expeditions par
 *    ek jaisa hai — Broad Peak, Gasherbrum I, Gasherbrum II aur K2. Yeh
 *    script woh matan dikhati hai taake usay theek se dobara likha ja
 *    sake. KUCH BADALTI NAHI, sirf dikhati hai — us matan mein client ki
 *    asli tafseel hai jo mitani nahi chahiye.
 *
 *   node tools/fix-duplicate-text.mjs            -> sirf dikhana
 *   node tools/fix-duplicate-text.mjs --write    -> rukhsat wale din lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

/* Jo maine 21 safhon par laga diya tha — isi ko dhoondh kar badalte hain */
const OLD = 'Transfer to the airport for your onward flight. A day room can be arranged if your departure is late in the day. This is where our services end — and where, we hope, the planning for the next trip begins.';

const NEW = {
  'tours/autumn-hunza-skardu-tour.md': 'A last morning in Islamabad before the transfer to the airport. If your flight is late we can hold a day room, and most people spend those hours sorting photographs from a fortnight of orchards and snow.',
  'tours/fairy-meadows-nanga-parbat-tour.md': 'Transfer to the airport for your flight home. A day room is available if you have hours to fill — and the Nanga Parbat photographs will take longer to sort than you expect.',
  'tours/gilgit-baltistan-grand-circuit.md': 'The transfer to the airport, and the end of the circuit. Fourteen days, three valleys and a good deal of road lie behind you. A day room can be arranged for a late departure.',
  'tours/hunza-valley-heritage-tour.md': 'Driven to the airport for your onward flight. Should your departure be late in the day, a room is kept for you until then.',
  'tours/skardu-shigar-valley-explorer.md': 'The last transfer, to Skardu or Islamabad airport depending on your routing. A day room is available if the wait is a long one.',
  'trekking/fairy-meadows-nanga-parbat-base-camp-trek.md': 'Transfer to the airport. After ten days of mountain air the city feels loud; a day room is there if you would rather wait somewhere quiet.',
  'trekking/gondogoro-la-circuit-trek.md': 'Three weeks and one 5,585-metre pass after you arrived, the transfer to the airport. A day room can be arranged for a late departure.',
  'trekking/k2-base-camp-baltoro-trek.md': 'Transfer to the airport. Three weeks ago K2 was a photograph; today it is a place you have stood beneath. A day room is available if your flight is late.',
  'trekking/rakaposhi-base-camp-trek.md': 'Transfer onward to Gilgit, Hunza or the airport, depending on what comes next for you. We can hold a room if the wait is long.',
  'trekking/rush-lake-trek.md': 'A morning run down to the airport for your flight out. A day room can be arranged if you are leaving late in the day.',
  'trekking/thalle-la-trek.md': 'The airport transfer, and the end of the trek. A day room is available for a late flight.',
  'expeditions/broad-peak-expedition.md': 'To the airport, and the end of fifty days. The expedition closes here, where it began. A day room can be arranged if you are flying late.',
  'expeditions/gasherbrum-ii-expedition.md': 'The final transfer to the airport. Seven weeks of permits, porters, glacier and altitude end at a departure gate. A room is available if your flight is late.',
  'expeditions/ghasherbrum-1.md': 'Transfer to the airport and the formal end of the expedition. If your flight leaves late in the day, a room is kept for you until then.',
  'expeditions/k2-expediiton.md': 'Two months on K2 end at a departure gate in Islamabad. A day room can be arranged if you are flying late.',
  'expeditions/laila-peak-expedition.md': 'Transfer to the airport. Thirty days after arriving, the expedition closes. A day room is available if you are leaving late in the day.',
  'expeditions/nanga-parbat-expedition.md': 'Transfer to the airport, and the end of our services. Six weeks on the Diamir face lie behind you. A room can be held for a late flight.',
  'expeditions/spantik-peak-expedition.md': 'We see you off at the airport. Five weeks, one seven-thousander and a long glacier walk end here; a day room is available if you need one.',
  'expeditions/trango-expedition.md': 'Driven to the airport for your flight home. The towers stay where they are, and teams come back for them. A day room can be arranged for a late departure.',
  'jeep-safaris/deosai-jeep-safari.md': 'The final transfer, by road or to the airport as your plans require. A room can be held if there are hours to fill.',
  'jeep-safaris/shigar-basho-khaplu-jeep-adventure.md': 'Transfer according to your onward plans, whether that is the airport or further travel in Baltistan. A day room is available if you need one.',
};

/* Jin safhon par Baltoro ka raasta ek jaisa hai */
const BALTORO = [
  'expeditions/broad-peak-expedition.md',
  'expeditions/gasherbrum-ii-expedition.md',
  'expeditions/ghasherbrum-1.md',
  'expeditions/k2-expediiton.md',
];
const APPROACH = ['02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12-42'];

/* ============================================= kaam =================== */

const writes = [];
const fixed = [];
const skipped = [];
const notFound = [];

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

const readItin = (full) => {
  const raw = fs.readFileSync(full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) return null;
  const lines = fm[1].split('\n');
  const start = lines.findIndex((l) => /^itinerary:\s*$/.test(l));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end++;
  let days;
  try { days = yaml.load(lines.slice(start, end).join('\n')).itinerary; } catch { return null; }
  if (!Array.isArray(days)) return null;
  return { raw, fm, lines, start, end, days, rest: raw.slice(fm[0].length) };
};

for (const f of files) {
  const mine = NEW[f.ref];
  if (!mine) continue;

  const it = readItin(f.full);
  if (!it) { notFound.push(f.ref + '  (itinerary nahi parhi gayi)'); continue; }

  let changed = 0;
  const out = it.days.map((d) => {
    const e = { ...(d || {}) };
    if (String(e.description || '').trim() === OLD) {
      e.description = mine;
      fixed.push({ ref: f.ref, day: e.day });
      changed++;
    }
    const o = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') o[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in o) && e[k] !== undefined && e[k] !== '') o[k] = e[k];
    return o;
  });

  if (!changed) { skipped.push(f.ref + '  (mera purana paragraph nahi mila — shayad badal diya gaya)'); continue; }

  const dumped = yaml.dump({ itinerary: out }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
  try {
    const chk = yaml.load(dumped);
    if (!Array.isArray(chk.itinerary) || chk.itinerary.length !== it.days.length) throw new Error('ginti badal gayi');
  } catch (e) { console.log('XX  ' + f.ref + ': jaanch fail — ' + e.message); continue; }

  const newHead = [...it.lines.slice(0, it.start), ...dumped.split('\n'), ...it.lines.slice(it.end)].join('\n');
  writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + it.rest });
}

/* ============================================= report ================ */

console.log('\n1) RUKHSAT WALE DIN — ek jaisa paragraph hata kar har trip ka apna');
console.log('='.repeat(76));
for (const x of fixed) console.log('   ' + x.ref.padEnd(54) + 'Day ' + x.day);
console.log('');
console.log('   ' + fixed.length + ' safhe theek honge.');
for (const s of skipped) console.log('   --  ' + s);
for (const n of notFound) console.log('   XX  ' + n);

/* ============================================= dump ================== */

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say('');
say('');
say('2) BALTORO KA RAASTA — chaaron expeditions ka matan');
say('='.repeat(76));
say('(kuch badla nahi gaya; yeh sirf dikhane ke liye hai)');

for (const ref of BALTORO) {
  const f = files.find((x) => x.ref === ref);
  if (!f) { say('\n   ' + ref + ': file nahi mili'); continue; }
  const it = readItin(f.full);
  if (!it) { say('\n   ' + ref + ': itinerary nahi parhi gayi'); continue; }

  say('');
  say('#'.repeat(76));
  say('## ' + ref);
  say('#'.repeat(76));
  for (const d of it.days) {
    if (!APPROACH.includes(String(d && d.day))) continue;
    say('');
    say('   Day ' + String(d.day) + '   ' + (d.title || '[unwan nahi]') +
        (d.altitude ? '   [' + d.altitude + ']' : ''));
    const t = String(d.description || '');
    for (let i = 0; i < t.length; i += 96) say('      ' + t.slice(i, i + 96));
  }
}

fs.writeFileSync(path.join(ROOT, '_baltoro.txt'), out.join('\n') + '\n', 'utf8');

console.log('');
console.log('-'.repeat(76));
console.log('LIKHA: _baltoro.txt');

if (!writes.length) { console.log('\nRukhsat wale din mein kuch badalne ko nahi.'); process.exit(0); }

if (!WRITE) {
  console.log('\n' + writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/fix-duplicate-text.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bakdup')) fs.copyFileSync(w.file, w.file + '.bakdup');
  fs.writeFileSync(w.file, w.text, 'utf8');
}
console.log('\n' + writes.length + ' file likhi gayin.');
console.log('Agla qadam:  npm run build');
console.log('Aur  _baltoro.txt  mujhe bhej dein.');
