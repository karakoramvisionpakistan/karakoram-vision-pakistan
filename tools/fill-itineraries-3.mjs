#!/usr/bin/env node
/**
 * fill-itineraries-3.mjs   (website ke folder mein)
 *
 * Aakhri 17 din. Yeh chhe trips ke wapsi wale din hain jo pehle audit mein
 * "thoRa sa khaali" nikle the — Broad Peak, dono Gasherbrum, K2 expedition,
 * Autumn Hunza aur Fairy Meadows tour.
 *
 * Is ke baad har trip ke har din ka bayaan maujood hoga, sirf Spring
 * Blossom ke elawa jiska raasta client se lena hai.
 *
 * JO KHAANA PEHLE SE BHARA HO USAY CHHOOTA NAHI.
 *
 *   node tools/fill-itineraries-3.mjs            -> sirf dikhana
 *   node tools/fill-itineraries-3.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

/* Baltoro ki wapsi teenon expeditions par ek jaisi hai, magar har ek ka
   apna bayaan likha hai taake Google ko teen safhon par ek hi matan na
   mile — nakal shuda matan dono ko nuqsaan deta hai. */
const FILL = {
  'expeditions/broad-peak-expedition.md': {
    '43-46': { overnight: 'Camping', description: 'Four days back down the Baltoro to Askole by the way the team came in. The loads are lighter, the camps familiar, and after seven weeks at altitude the thickening air does most of the work. Porters come up from Askole to meet the expedition at Goro.' },
    '48': { overnight: 'Hotel', description: 'The flight from Skardu to Islamabad when the weather allows. Expeditions keep a day in hand here, because the mountain decides this as well.' },
    '49': { overnight: 'Hotel', description: 'The official debriefing in Islamabad, where the expedition report is filed with the Ministry of Tourism and the permit is formally closed. The evening is free.' },
  },

  'expeditions/gasherbrum-ii-expedition.md': {
    '43-46': { overnight: 'Camping', description: 'Four days down the Baltoro from base camp to Askole, retracing the approach. Coming off the ice after a month and a half at altitude, most teams find these the easiest walking days of the whole expedition.' },
    '47': { overnight: 'Hotel', description: 'Jeeps down the Braldu valley from Askole to Skardu, six to seven hours on the rough road above the river. Hotel, hot water, and the first meal that somebody else shopped for.' },
    '48': { overnight: 'Hotel', description: 'The scheduled flight from Skardu to Islamabad, weather permitting. If it does not operate the alternative is the two-day drive, which is why the programme carries spare days at this end.' },
    '49': { overnight: 'Hotel', description: 'The official debriefing in Islamabad: the expedition report is filed with the Ministry of Tourism and the permit formally closed. The rest of the day is free.' },
  },

  'expeditions/ghasherbrum-1.md': {
    '43-46': { overnight: 'Camping', description: 'Four days back down the Baltoro to Askole. The route is the one the team walked in on, but in reverse and acclimatised it passes quickly, and the first grass at Paiju is a welcome sight after weeks of rock and ice.' },
    '47': { overnight: 'Hotel', description: 'By jeep from Askole down the Braldu to Skardu, the road clinging to the cliff above the river for most of the way. Hotel, a shower, and a proper bed.' },
    '48': { overnight: 'Hotel', description: 'The flight from Skardu to Islamabad if the weather allows; otherwise the road, and the spare days at this end of the programme are there for exactly that.' },
    '49': { overnight: 'Hotel', description: 'The official debriefing in Islamabad, filing the expedition report with the Ministry of Tourism and closing the permit. The evening is free.' },
  },

  'expeditions/k2-expediiton.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and transferred to the hotel. The climbing permit, royalty, park fees and liaison officer arrangements are completed, and the team meets before travelling north.' },
    '54-57': { overnight: 'Camping', description: 'Four days down the Godwin-Austen and the Baltoro to Askole, past Concordia, Goro and Urdukas. After two months on the mountain the descent into thicker air and the first green at Paiju is the part most climbers remember.' },
    '58': { overnight: 'Hotel', description: 'Jeeps from Askole down the Braldu valley to Skardu, six to seven hours. Hotel, hot water, and the end of camp life.' },
  },

  'tours/autumn-hunza-skardu-tour.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and driven to the hotel. The afternoon is free, and in the evening your guide goes through the plan for the fortnight and the way the autumn colour moves down the valleys as the weeks pass.' },
    '12': { overnight: 'Hotel', description: 'The road back from Khaplu to Skardu follows the Shyok and then the Indus, with a stop at Manthokha waterfall where it drops out of the side valley. An easy day with plenty of room for photographs, arriving in Skardu in the afternoon.' },
  },

  'tours/fairy-meadows-nanga-parbat-tour.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and driven to the hotel. The evening is for the briefing: the road north, the jeep ride at Raikot, and the walk up to Fairy Meadows that follows it.' },
  },
};

/* ============================================= kaam =================== */

const report = [];
const writes = [];

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

for (const f of files) {
  const own = FILL[f.ref];
  if (!own) continue;

  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { report.push({ ref: f.ref, fail: 'front matter nahi parhi gayi' }); continue; }

  const head = fm[1];
  const rest = raw.slice(fm[0].length);
  const lines = head.split('\n');
  const start = lines.findIndex((l) => /^itinerary:\s*$/.test(l));
  if (start < 0) { report.push({ ref: f.ref, fail: 'itinerary ka khaana nahi mila' }); continue; }

  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end++;

  let days;
  try { days = yaml.load(lines.slice(start, end).join('\n')).itinerary; }
  catch (e) { report.push({ ref: f.ref, fail: 'YAML: ' + e.message }); continue; }
  if (!Array.isArray(days)) { report.push({ ref: f.ref, fail: 'itinerary list nahi hai' }); continue; }

  const c = { desc: 0, night: 0 };
  const seen = new Set();

  const fixed = days.map((d) => {
    const e = { ...(d || {}) };
    const mine = own[String(e.day)];
    if (mine) {
      seen.add(String(e.day));
      if (mine.description && !e.description) { e.description = mine.description; c.desc++; }
      if (mine.overnight && !e.overnight) { e.overnight = mine.overnight; c.night++; }
    }
    const out = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') out[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in out) && e[k] !== undefined && e[k] !== '') out[k] = e[k];
    return out;
  });

  const extra = Object.keys(own).filter((k) => !seen.has(k));
  if (!c.desc && !c.night) { report.push({ ref: f.ref, skip: 'sab pehle se bhara hua hai', extra }); continue; }

  const dumped = yaml.dump({ itinerary: fixed }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
  try {
    const chk = yaml.load(dumped);
    if (!Array.isArray(chk.itinerary) || chk.itinerary.length !== days.length) throw new Error('din ki ginti badal gayi');
  } catch (e) { report.push({ ref: f.ref, fail: 'jaanch fail: ' + e.message }); continue; }

  const newHead = [...lines.slice(0, start), ...dumped.split('\n'), ...lines.slice(end)].join('\n');
  writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + rest });
  report.push({ ref: f.ref, c, days: days.length, extra });
}

/* ============================================= baqi ginti ============= */

let emptyDesc = 0, emptyNight = 0, totalDays = 0;
const stillEmpty = [];

for (const f of files) {
  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) continue;
  let data;
  try { data = yaml.load(fm[1]); } catch { continue; }
  const itin = data && Array.isArray(data.itinerary) ? data.itinerary : null;
  if (!itin) { if (data && data.service_type) stillEmpty.push(f.ref + '  (koi itinerary nahi)'); continue; }

  const w = writes.find((x) => x.file === f.full);
  const after = w ? yaml.load(w.text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]).itinerary : itin;

  totalDays += after.length;
  const nd = after.filter((d) => !d || !d.description).length;
  const nn = after.filter((d) => !d || !d.overnight).length;
  emptyDesc += nd; emptyNight += nn;
  if (nd) stillEmpty.push(f.ref + '  ' + nd + ' din bayaan khaali');
}

/* ============================================= report ================ */

console.log('\nKYA BADLEGA');
console.log('-'.repeat(72));
for (const r of report) {
  if (r.fail) { console.log('XX  ' + r.ref.padEnd(46) + r.fail); continue; }
  if (r.skip) { console.log('--  ' + r.ref.padEnd(46) + r.skip); continue; }
  const bits = [];
  if (r.c.desc) bits.push(r.c.desc + ' bayaan');
  if (r.c.night) bits.push(r.c.night + ' raat');
  console.log('    ' + r.ref.padEnd(46) + bits.join(', '));
  if (r.extra && r.extra.length) {
    console.log('        !   yeh din file mein nahi mile: ' + r.extra.join(', '));
  }
}

console.log('\nIS KE BAAD POORI WEBSITE KA HISAAB');
console.log('-'.repeat(72));
console.log('   Kul din: ' + totalDays);
console.log('   Bayaan khaali: ' + emptyDesc);
console.log('   Raat khaali:   ' + emptyNight);
if (stillEmpty.length) {
  console.log('');
  for (const s of stillEmpty) console.log('   ' + s);
}

console.log('\n' + '-'.repeat(72));
if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/fill-itineraries-3.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bakfill3')) fs.copyFileSync(w.file, w.file + '.bakfill3');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
