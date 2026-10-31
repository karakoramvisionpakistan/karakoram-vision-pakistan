#!/usr/bin/env node
/**
 * fill-thin.mjs   (website ke folder mein)
 *
 * Jin dinon ka bayaan sirf ek line ka tha — kahin to unwan aur bayaan
 * bilkul ek hi jumla, jo safhe par do baar nazar aata hai.
 *
 * Teen expeditions ke shuru aur base camp wale din, aur poora Autumn Hunza
 * tour aur Fairy Meadows tour, jin mein har din 14 se 60 harf ka tha.
 *
 * YEH SCRIPT PURANA BAYAAN BADALTI HAI — baqi sab ne sirf khaali khaane
 * bhare the. Is liye hifazat ki shart: sirf us din badalta hai jiska bayaan
 * abhi 90 harf se chhota ho. Agar client ne darmiyan mein kuch likh diya ho
 * to woh mehfooz rehta hai.
 *
 *   node tools/fill-thin.mjs            -> sirf dikhana
 *   node tools/fill-thin.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

/* Is se lamba bayaan chhoota nahi */
const LIMIT = 90;

const TEXT = {
  /* Teenon ka Day 01 alag lafzon mein — yeh safhe pehle hi bohot milte hain */
  'expeditions/broad-peak-expedition.md': {
    '01': 'Met at Islamabad airport and driven to the hotel. Permit papers, royalty, park fees and the liaison officer are all settled in the city before anyone travels north, and the team meets properly over dinner.',
    '47': 'Jeeps down the Braldu valley from Askole to Skardu, six to seven hours on a road cut into the cliff above the river. Hotel, hot water, and the first meal nobody had to carry up a glacier.',
  },
  'expeditions/gasherbrum-ii-expedition.md': {
    '01': 'Collected from Islamabad airport and taken to the hotel. The climbing permit and royalty, the park fees and the liaison officer are arranged here, and the team has its first full briefing that evening.',
    '11': 'The last walking day. Up the South Gasherbrum glacier to base camp, with Gasherbrum II, Gasherbrum I and Broad Peak standing around the basin. Tents go up, the kitchen is built, and this is home for the next month.',
  },
  'expeditions/ghasherbrum-1.md': {
    '01': 'Met on arrival at Islamabad and transferred to the hotel. This is where the paperwork is done — permit, royalty, park fees and liaison officer — and where the team gathers before the journey to Baltistan.',
    '11': 'The final approach day, up the South Gasherbrum glacier to the base camp the Gasherbrum peaks share. Hidden Peak earns its name here: it stays out of sight until you are almost beneath it. Camp is built for a month’s stay.',
  },
  'expeditions/k2-expediiton.md': {
    '11': 'The last walking day, up the Godwin-Austen glacier from Broad Peak base camp to K2 base camp, directly beneath the south face. The Gilkey Memorial stands on the ridge above the tents. This is home for the next six weeks.',
  },

  'tours/autumn-hunza-skardu-tour.md': {
    '02': 'North on the Karakoram Highway through the Indus gorges, with the Nanga Parbat viewpoint at Raikot on the way. Around ten hours of driving, broken wherever the light is worth stopping for. Gilgit by evening.',
    '03': 'A short morning drive up the Hunza river to Karimabad, the road climbing past Rakaposhi until the valley opens below Ultar. The afternoon is free to walk the village — the orchards are at their best in slanting light.',
    '04': 'Baltit and Altit forts, both restored and both worth the climb, and the old lanes between them. Late in the day the viewpoint at Duikar looks down the whole valley, where the terraces run gold and red against bare rock.',
    '05': 'Up the Karakoram Highway past Attabad lake, whose turquoise is startling against the dry hills, to Gulmit and Passu. The Passu Cones rise straight from the roadside, and the Hussaini bridge is worth the walk for steady nerves.',
    '06': 'A day with no fixed schedule, spent wherever the colour is best that week. Autumn moves down the valley rather than arriving all at once, so your guide decides the night before — which is the whole point of keeping a day free.',
    '07': 'Back down the valley to Gilgit, stopping at the Rakaposhi viewpoint and in the roadside villages. An easy half day that leaves the afternoon free for the bazaar.',
    '08': 'East from Gilgit and then up the Indus on the Skardu road, one of the most dramatic drives in Pakistan — seven to eight hours through a rock gorge that finally opens into the wide Skardu valley.',
    '09': 'Across the Indus into Shigar, where the restored fort sits among apricot orchards and the old wooden mosques are among the finest in Baltistan. In autumn the valley floor turns yellow under the poplars.',
    '10': 'Kharpocho fort above the town, Satpara lake, and the cold desert at Katpana, where sand dunes sit at well over two thousand metres with snow peaks behind them. The bazaar is good for dried apricots and walnuts.',
    '11': 'Up the Shyok valley to Khaplu, once the seat of a Baltistan kingdom, where the restored palace looks across to the Masherbrum range. Quieter than Skardu, and a good place to end on.',
    '13': 'The morning flight to Islamabad along Nanga Parbat when the weather allows; otherwise the road, which is why a spare day sits at this end of the itinerary. The afternoon is free.',
  },

  'tours/fairy-meadows-nanga-parbat-tour.md': {
    '02': 'North on the Karakoram Highway into the Indus gorges, around nine hours with stops. Where the night is spent depends on the season and the road — Chilas on the highway, or closer to the Raikot bridge.',
    '03': 'A jeep from Raikot bridge up one of the more alarming roads in Pakistan, then an hour or two on foot or by pony to Fairy Meadows. The meadow opens suddenly, and the Raikot face of Nanga Parbat fills the head of the valley.',
    '04': 'A day walk up the meadow to Beyal camp and on towards the Nanga Parbat viewpoint, three to four hours each way on an easy path through birch and pasture. The face is closest here, and the ice falls audibly through the afternoon.',
    '05': 'A free day. Most people walk a little, photograph a great deal and sleep in the afternoon. The light on the Raikot face at dawn and at dusk is the reason to stay the second night.',
    '06': 'Down to the Raikot bridge on foot and by jeep, and back onto the Karakoram Highway. Where the group stops depends on the season — Chilas, or over the Babusar pass to Naran when it is open.',
    '07': 'The last stretch south through the Hazara hills, arriving in Islamabad in the afternoon. The evening is free.',
  },
};

/* ============================================= kaam =================== */

const writes = [];
const done = [];
const kept = [];
const missed = [];

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

for (const f of files) {
  const own = TEXT[f.ref];
  if (!own) continue;

  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { console.log('XX  ' + f.ref + ': front matter nahi parhi gayi'); continue; }

  const head = fm[1];
  const rest = raw.slice(fm[0].length);
  const lines = head.split('\n');
  const start = lines.findIndex((l) => /^itinerary:\s*$/.test(l));
  if (start < 0) { console.log('XX  ' + f.ref + ': itinerary nahi mili'); continue; }

  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end++;

  let days;
  try { days = yaml.load(lines.slice(start, end).join('\n')).itinerary; } catch (e) {
    console.log('XX  ' + f.ref + ': YAML ' + e.message); continue;
  }
  if (!Array.isArray(days)) continue;

  const seen = new Set();
  let changed = 0;

  const fixed = days.map((d) => {
    const e = { ...(d || {}) };
    const mine = own[String(e.day)];
    if (mine) {
      seen.add(String(e.day));
      const cur = String(e.description || '');
      if (cur.length <= LIMIT) {
        done.push({ ref: f.ref, day: e.day, title: e.title || '', was: cur.length, now: mine.length });
        e.description = mine;
        changed++;
      } else {
        kept.push({ ref: f.ref, day: e.day, len: cur.length });
      }
    }
    const out = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') out[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in out) && e[k] !== undefined && e[k] !== '') out[k] = e[k];
    return out;
  });

  for (const k of Object.keys(own)) if (!seen.has(k)) missed.push(f.ref + '  Day ' + k);
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

console.log('\nBAYAAN JO LIKHA JAYEGA (' + done.length + ')');
console.log('='.repeat(76));
let last = '';
for (const t of done) {
  if (t.ref !== last) { console.log('   ' + t.ref); last = t.ref; }
  console.log('      Day ' + String(t.day).padEnd(8) + t.title.padEnd(42) +
              String(t.was).padStart(4) + ' -> ' + t.now + ' harf');
}

if (kept.length) {
  console.log('\nJO CHHOR DIYE (' + kept.length + ') — pehle se ' + LIMIT + ' harf se lambe hain');
  console.log('='.repeat(76));
  for (const k of kept) console.log('   ' + k.ref.padEnd(50) + 'Day ' + String(k.day).padEnd(6) + k.len + ' harf');
}

if (missed.length) {
  console.log('\nJIN DINON KE LYE LIKHA MAGAR WOH NAHI MILE');
  console.log('='.repeat(76));
  for (const m of missed) console.log('   ' + m);
}

console.log('\n' + '-'.repeat(76));
if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/fill-thin.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bakthin')) fs.copyFileSync(w.file, w.file + '.bakthin');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
