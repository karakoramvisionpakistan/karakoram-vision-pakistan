#!/usr/bin/env node
/**
 * fill-itineraries-2.mjs   (website ke folder mein)
 *
 * Baqi paanch trips ka bayaan — Majrooh Top, Nangma Valley, Laila Peak,
 * Spantik aur Nanga Parbat (Diamir waley raaste se, jaisa client ne kaha).
 *
 * Aur do city tours ki itinerary shuru se, kyunke un mein thi hi nahi:
 * Islamabad aur Lahore. Dono ek ek din ke hain.
 *
 * SPRING BLOSSOM JAAN BOOJH KAR CHHOR DIYA. Woh solah din ka tour hai aur
 * mere paas uska raasta nahi — kaun se din kis wadi mein, kahan raat. Solah
 * din khud se ghaR dena matlab client ke naam par woh itinerary bechna jo
 * woh chalate hi nahi. Us ke din client se le lein, main bayaan likh doonga.
 *
 * JO KHAANA PEHLE SE BHARA HO USAY CHHOOTA NAHI.
 *
 *   node tools/fill-itineraries-2.mjs            -> sirf dikhana
 *   node tools/fill-itineraries-2.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

/* Jin bulandiyon ka main zimmedar hoon — client inhein dekh le. */
const MY_ALTITUDES = [];

/* ============================================= bayaan ================= */

const FILL = {
  'trekking/majrooh-top-trek.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and driven to the hotel. The afternoon is free, and in the evening your guide runs through the plan, checks kit and answers questions before the journey north.' },
    '02': { overnight: 'Hotel', description: 'The morning flight to Skardu runs when the mountain weather allows and is cancelled when it does not. If it goes, you are in Baltistan by lunchtime; if not, the group drives to Chilas on the Karakoram Highway and continues the next day.' },
    '03': { overnight: 'Hotel', description: 'Either a free day in Skardu — Kharpocho fort, the bazaar, the Indus — or the drive up from Chilas if yesterday’s flight did not operate. Trekker registration and permits are completed, and the crew is assembled.' },
    '04': { overnight: 'Camping', description: 'By jeep up the Shyok and into the Hushe valley to Kanday, around five hours on a road that narrows and roughens as it climbs. Kanday is a farming village of apricot terraces and poplar, and the trek starts from its upper fields.' },
    '05': { overnight: 'Camping', description: 'The first day on foot, climbing steadily out of the cultivated valley onto open pasture. Karpo Braqbu is a summer grazing ground used by Kanday families, and the camp sits where there is water and level grass.' },
    '06': { overnight: 'Camping', description: 'The day the trek is named for. A long climb to Majrooh Top and back down to the same camp, carrying only a daypack. From the top the central Karakoram opens out — K2, Gasherbrum II, Broad Peak and Masherbrum in one sweep, which is a remarkable return for a short, non-technical trek.' },
    '07': { overnight: 'Camping', description: 'Back down the pasture to Kanday, an easy descent with the valley widening below and the first trees and irrigation channels reappearing. The trekking ends here.' },
    '08': { overnight: 'Hotel', description: 'Jeeps back down the Hushe valley to the Shyok and on to Skardu. Hotel, hot water, and the debriefing at the tourism office.' },
    '09': { overnight: 'Hotel', description: 'The long road day back down the Indus gorge and onto the Karakoram Highway. Where the group stops depends on the road and the season — Chilas on the highway, or over the Babusar pass to Naran when it is open.' },
    '10': { overnight: 'Not applicable', description: 'The last stretch to Islamabad, arriving in the evening, with a late transfer to the airport for onward flights. A day room can be arranged if there are hours to fill.' },
  },

  'trekking/nangma-valley-trek.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and driven to the hotel. The evening is for the briefing: route, kit and the plan for getting to Skardu.' },
    '02': { overnight: 'Hotel', description: 'The morning flight to Skardu along Nanga Parbat and over the Indus gorges, weather permitting. A free afternoon in Skardu while permits and registration are completed.' },
    '03': { overnight: 'Camping', description: 'Around five hours by road from Skardu into the Ghanche district and up the Hushe valley to Kanday, a village of apricot terraces below the granite. The jeep road ends here and the camp is pitched near the village.' },
    '04': { overnight: 'Camping', description: 'A short, steep walk up into the Nangma valley. The granite walls close in almost immediately — this is the valley people call the Yosemite of Pakistan, and the comparison makes sense within the first hour. Minglu Broq is a grazing camp on the valley floor.' },
    '05': { overnight: 'Base camp', description: 'A gentle day further up the valley to base camp, set on grass beneath the towers. Big-wall climbers use this as their base; for trekkers it is simply one of the finest places to sit in the Karakoram.' },
    '06': { overnight: 'Base camp', description: 'A full day in the valley with no load to carry. The light on the granite changes hour by hour, which is why photographers come here, and there are side walks up the moraine for anyone who wants height and a wider view.' },
    '07': { overnight: 'Camping', description: 'Back down the valley to Kanday, retracing the walk in. It is downhill almost throughout and takes most of a morning, leaving the afternoon in the village.' },
    '08': { overnight: 'Hotel', description: 'The road back to Skardu through the Hushe and Shyok valleys, about five hours. Hotel, a shower, and the evening free.' },
    '09': { overnight: 'Hotel', description: 'The flight to Islamabad if it operates. A spare day is wise here, because the Skardu flight is cancelled often enough to be planned for rather than hoped against.' },
    '10': { overnight: 'Not applicable', description: 'Transfer to the airport for your onward flight.' },
  },

  'expeditions/laila-peak-expedition.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and transferred to the hotel. Expedition paperwork and the climbing permit are finalised, and the team meets the liaison officer.' },
    '02': { overnight: 'Hotel', description: 'The flight to Skardu when the weather allows; otherwise the two-day drive by road, starting with Chilas on the Karakoram Highway. Expeditions build this uncertainty into the schedule.' },
    '03': { overnight: 'Hotel', description: 'A day in Skardu for the official briefing, final equipment checks and hiring whatever is still needed from the bazaar. Loads are packed for the porters and the kitchen team is assembled.' },
    '04': { overnight: 'Camping', description: 'By jeep up the Shyok and into the Hushe valley, a long rough drive ending at Hushe village beneath Masherbrum. Most of Baltistan’s high-altitude porters and guides come from here.' },
    '05': { overnight: 'Camping', altitude: '3,400 m', description: 'On foot up the Hushe valley to Shaicho, a meadow camp beside the river with birch and juniper on the slopes. An easy day that gets the team walking together before the glacier.' },
    '06': { overnight: 'Base camp', altitude: '4,200 m', description: 'Up onto the Gondogoro glacier and across to base camp below the peak. Laila stands directly above — a thin, leaning blade of rock and ice, one of the most photographed mountains in the Karakoram and one of the most committing of its size.' },
    '07-25': { overnight: 'Base camp', description: 'The climbing period. Nineteen days gives room to establish the route, acclimatise on the lower slopes, wait out weather and make an attempt — and to make a second one if the first is turned back. The face is sustained steep ice and teams are self-sufficient above base camp. Base camp runs throughout with cook, kitchen and communications.' },
    '26': { overnight: 'Camping', description: 'Down off the glacier and back to Hushe, the loads lighter and the valley green after weeks on ice.' },
    '27': { overnight: 'Hotel', description: 'Jeeps back to Skardu, then the debriefing at the tourism office, which closes the expedition formally.' },
    '28': { overnight: 'Hotel', description: 'The flight to Islamabad if it operates; otherwise the drive to Chilas and on the following day.' },
    '29': { overnight: 'Hotel', description: 'A day in Islamabad — spare if the flight was delayed, and sightseeing if it was not.' },
    '30': { overnight: 'Not applicable', description: 'Transfer to the airport for your onward flight.' },
  },

  'expeditions/spantik-peak-expedition.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and transferred to the hotel. The climbing permit, park fees and liaison officer arrangements are completed, and the team meets before travelling north.' },
    '02': { overnight: 'Hotel', description: 'The flight to Skardu when the weather allows, otherwise the road through Naran or Chilas. Expeditions plan for both, because the mountain weather decides and not the schedule.' },
    '03': { overnight: 'Hotel', description: 'Either the drive up from Naran or Chilas, or a preparation day in Skardu: the official briefing, final kit checks, food packed for base camp and porter loads made up.' },
    '04': { overnight: 'Camping', description: 'By jeep from Skardu up the Basha valley to Arandu, the last village before the Chogo Lungma glacier. The road is rough and the drive long. Camp is pitched beside the village and the porter team is registered.' },
    '05': { overnight: 'Camping', description: 'Onto the Chogo Lungma, one of the great Karakoram glaciers, following the lateral moraine with the ice spread out to one side and the valley walls rising on the other. Rough, slow ground, and the first real day of the expedition.' },
    '06': { overnight: 'Base camp', altitude: '4,300 m', description: 'Up the glacier to Spantik base camp. The peak, which Nagar people call Golden Peak for the colour the summit pyramid takes at sunset, stands above — with the Golden Pillar on its north-west face, one of the hardest lines in the range. The normal south-east ridge from this side is a non-technical but serious snow climb.' },
    '07-26': { overnight: 'Base camp', description: 'The climbing period. Twenty days allows the route to be fixed, camps established at around 5,000m and 5,900m, proper acclimatisation rotations, and a summit window with weather to spare. Spantik is often chosen as a first 7,000er because the ground is straightforward — but 7,027m is still 7,027m, and the long summit day is where most attempts turn back.' },
    '27-29': { overnight: 'Camping', description: 'Three days back down the Chogo Lungma to Arandu, retracing the approach with the porters who come back up to meet the team.' },
    '30': { overnight: 'Hotel', description: 'Jeeps down the Basha valley to Skardu. Hotel, a shower, and the first proper meal off the mountain.' },
    '31': { overnight: 'Hotel', description: 'The official debriefing in Skardu, where the expedition is formally closed and the summit report filed.' },
    '32': { overnight: 'Hotel', description: 'The flight to Islamabad if it operates.' },
    '34': { overnight: 'Hotel', description: 'A reserve day held back for the Skardu flight. If it is not needed it is a free day in Islamabad, and after five weeks on a glacier most people are glad of it.' },
    '35': { overnight: 'Not applicable', description: 'Transfer to the airport for your onward flight. End of our services.' },
  },

  'expeditions/nanga-parbat-expedition.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and transferred to the hotel. The climbing permit, royalty and liaison officer arrangements are completed, and the team meets before heading north.' },
    '02': { overnight: 'Hotel', description: 'North on the Karakoram Highway through the Hazara hills and into the Indus gorges, around nine hours to Chilas. The official briefing is held at the tourism office there.' },
    '03': { overnight: 'Camping', description: 'A short drive up the highway to Bunar, where the road to the Diamir side leaves the Indus. Loads are transferred and the porter team is engaged for the walk in.' },
    '04-06': { overnight: 'Base camp', altitude: '4,200 m', description: 'Three days on foot up the Diamir valley to base camp, climbing through village terraces and summer pasture before the valley narrows and the Diamir face fills the head of it. Nanga Parbat rises more than four kilometres above the camp in a single sweep — the largest mountain face on earth by that measure.' },
    '07-37': { overnight: 'Base camp', description: 'The climbing period. Thirty-one days on the Kinshofer route, the normal line on the Diamir face: fixing the rock band above camp one, establishing higher camps, acclimatisation rotations, and waiting for the weather window the summit day needs. Nanga Parbat has a reputation that is earned, and teams here are experienced and self-sufficient above base camp. Base camp runs throughout with cook, kitchen and communications.' },
    '38-39': { overnight: 'Hotel', description: 'Two days to walk out to Bunar and drive down to Chilas, where the expedition is formally debriefed at the tourism office.' },
    '40': { overnight: 'Hotel', description: 'The road south to Islamabad, retracing the Indus gorges and the Hazara hills.' },
    '41': { overnight: 'Hotel', description: 'The final briefing at the Ministry of Tourism in Islamabad, where the expedition report is filed. The rest of the day is free.' },
    '42': { overnight: 'Not applicable', description: 'Transfer to the airport for your onward flight — the end of our services.' },
  },
};

/* ============================================= nayi itinerary ========= */

const CREATE = {
  'tours/islamabad-city-tour.md': [
    { day: '01', title: 'Islamabad in a day', overnight: 'Not applicable',
      description: 'Collected from your hotel in the morning. The day takes in the Faisal Mosque, set against the Margalla Hills and one of the largest mosques in the world, and the Pakistan Monument on the Shakarparian ridge, whose petals open towards the city. The viewpoint at Daman-e-Koh looks down over the whole grid of Islamabad, and is best in the late afternoon when the light softens. Along the way there is time for the bazaars and for tea. A full day, or a half day if you have a flight to catch, and easily combined with Taxila for anyone interested in the Gandhara sites.' },
  ],

  'tours/lahore-city-tour.md': [
    { day: '01', title: 'Mughal Lahore and the Walled City', overnight: 'Not applicable',
      description: 'A full day through the old city. The Lahore Fort and the Badshahi Mosque face each other across the Hazuri Bagh, and together they are the centrepiece of Mughal Lahore — the Sheesh Mahal and the Naulakha pavilion are inside the fort, and the mosque’s courtyard holds a hundred thousand people. The Wazir Khan Mosque, deep in the Walled City, is the finest tilework in Pakistan and the walk to it through Delhi Gate and the Shahi Hammam is half the pleasure. Shalimar Gardens and the tomb of Jahangir sit a short drive out. The day ends with Lahori food on Fort Road, and in the evening the flag-lowering ceremony at the Wagah border can be added for those who want it.' },
  ],
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
  const make = CREATE[f.ref];
  if (!own && !make) continue;

  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { report.push({ ref: f.ref, fail: 'front matter nahi parhi gayi' }); continue; }

  const head = fm[1];
  const rest = raw.slice(fm[0].length);
  const lines = head.split('\n');
  const start = lines.findIndex((l) => /^itinerary:\s*$/.test(l));

  /* --- nayi itinerary banani hai --- */
  if (make) {
    if (start >= 0) { report.push({ ref: f.ref, skip: 'itinerary pehle se maujood hai' }); continue; }
    const blk = yaml.dump({ itinerary: make }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
    const newHead = head.replace(/\s*$/, '') + '\n' + blk;
    try {
      const d = yaml.load(newHead);
      if (!Array.isArray(d.itinerary) || d.itinerary.length !== make.length) throw new Error('ginti');
    } catch (e) { report.push({ ref: f.ref, fail: 'jaanch fail: ' + e.message }); continue; }
    writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + rest });
    report.push({ ref: f.ref, made: make.length });
    continue;
  }

  /* --- mojooda dinon mein bayaan bharna --- */
  if (start < 0) { report.push({ ref: f.ref, fail: 'itinerary ka khaana nahi mila' }); continue; }

  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end++;

  let days;
  try { days = yaml.load(lines.slice(start, end).join('\n')).itinerary; }
  catch (e) { report.push({ ref: f.ref, fail: 'YAML: ' + e.message }); continue; }
  if (!Array.isArray(days)) { report.push({ ref: f.ref, fail: 'itinerary list nahi hai' }); continue; }

  const c = { desc: 0, night: 0, alt: 0 };
  const seen = new Set();

  const fixed = days.map((d) => {
    const e = { ...(d || {}) };
    const mine = own[String(e.day)];
    if (mine) {
      seen.add(String(e.day));
      if (mine.description && !e.description) { e.description = mine.description; c.desc++; }
      if (mine.overnight && !e.overnight) { e.overnight = mine.overnight; c.night++; }
      if (mine.altitude && !e.altitude) {
        e.altitude = mine.altitude; c.alt++;
        MY_ALTITUDES.push(f.ref + '  Day ' + e.day + '  ' + mine.altitude);
      }
    }
    const out = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') out[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in out) && e[k] !== undefined && e[k] !== '') out[k] = e[k];
    return out;
  });

  const extra = Object.keys(own).filter((k) => !seen.has(k));
  if (!c.desc && !c.night && !c.alt) { report.push({ ref: f.ref, skip: 'sab pehle se bhara hua hai' }); continue; }

  const dumped = yaml.dump({ itinerary: fixed }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
  try {
    const chk = yaml.load(dumped);
    if (!Array.isArray(chk.itinerary) || chk.itinerary.length !== days.length) throw new Error('din ki ginti badal gayi');
  } catch (e) { report.push({ ref: f.ref, fail: 'jaanch fail: ' + e.message }); continue; }

  const newHead = [...lines.slice(0, start), ...dumped.split('\n'), ...lines.slice(end)].join('\n');
  writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + rest });
  report.push({ ref: f.ref, c, days: days.length, extra });
}

/* ============================================= report ================ */

console.log('\nKYA BADLEGA');
console.log('-'.repeat(72));

for (const r of report) {
  if (r.fail) { console.log('XX  ' + r.ref.padEnd(50) + r.fail); continue; }
  if (r.skip) { console.log('--  ' + r.ref.padEnd(50) + r.skip); continue; }
  if (r.made) { console.log('NEW ' + r.ref.padEnd(50) + r.made + ' din ki nayi itinerary'); continue; }
  const bits = [];
  if (r.c.desc) bits.push(r.c.desc + ' bayaan');
  if (r.c.night) bits.push(r.c.night + ' raat');
  if (r.c.alt) bits.push(r.c.alt + ' bulandi');
  console.log('    ' + r.ref.padEnd(50) + bits.join(', ') + '  (' + r.days + ' din)');
  if (r.extra && r.extra.length) {
    console.log('        !   maine jin dinon ke lye likha magar woh file mein nahi: ' + r.extra.join(', '));
  }
}

if (MY_ALTITUDES.length) {
  console.log('\nBULANDI JO MAINE DAALI — client dekh le');
  console.log('-'.repeat(72));
  for (const a of MY_ALTITUDES) console.log('   ' + a);
  console.log('   (shaye shuda zarail se, client ke GPS se nahi)');
}

console.log('\nJO CHHOR DIYA');
console.log('-'.repeat(72));
console.log('   tours/spring-bloosom-tour.md   16 din — raasta maloom nahi');
console.log('   Us ke din client se lein (kaun se din kis wadi mein, kahan raat),');
console.log('   main bayaan likh doonga. Khud se solah din ghaRna theek nahi hoga.');

console.log('\n' + '-'.repeat(72));
if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/fill-itineraries-2.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bakfill2')) fs.copyFileSync(w.file, w.file + '.bakfill2');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
