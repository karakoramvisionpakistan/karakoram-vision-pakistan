#!/usr/bin/env node
/**
 * fill-itineraries-1.mjs   (website ke folder mein)
 *
 * TEEN KAAM:
 *
 * 1. Bulandi unwanon se — "Trek to Namla (3,566m)" se 3,566 m nikaal kar
 *    bulandi ke khaane mein, aur unwan saaf. Yeh client ka apna adad hai,
 *    mera andaza nahi. Har trip par lagta hai.
 *
 * 2. Raat ka khaana unwan se — Skardu aur Chilas hotel, "Trek to" camping,
 *    "base camp" base camp, "Fly out" par koi raat nahi. Har trip par.
 *
 * 3. Biafo Hispar aur Gondogoro La ka har khaali din ka bayaan. Yeh maine
 *    likha hai, aur client ko parhna chahiye.
 *
 * JO KHAANA PEHLE SE BHARA HO USAY CHHOOTA NAHI. Sirf khaali khaane bharte
 * hain, taake client ki likhai kabhi na mite.
 *
 *   node tools/fill-itineraries-1.mjs            -> sirf dikhana
 *   node tools/fill-itineraries-1.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

/* ============================================= raat ke qaayde ========== */

/* Tarteeb maayne rakhti hai: pehla jo mile wohi lagta hai. "Trek to base
   camp" base camp hai, camping nahi — is liye base camp pehle aata hai. */
const NIGHT_RULES = [
  [/fly out|fly to (your|on ?ward)|onward destination|own destination|transfer to (the )?airport|drop to the airport|goodbye|end of our services/i, 'Not applicable'],
  [/base camp|\bbc\b/i, 'Base camp'],
  [/climbing/i, 'Base camp'],
  [/fairy meadows|beyal/i, 'Guesthouse'],
  [/\bcamp(ing|s)?\b/i, 'Camping'],
  [/\btrek(king)?\b/i, 'Camping'],
  [/askol|arandu|hushe|shaicho|kanday|minglu|concordia|urdukas|paiju|jhola|jula/i, 'Camping'],
  [/islamabad|chilas|skardu|gilgit|karimabad|hunza|naran|besham|lahore|khaplu|raikot|bunar/i, 'Hotel'],
];

const guessNight = (title) => {
  const t = String(title || '');
  if (!t) return '';
  for (const [re, val] of NIGHT_RULES) if (re.test(t)) return val;
  return '';
};

/* "(3,048m)" ya "(3600m)" -> bulandi, aur unwan se hata do */
const ALT_IN_TITLE = /\s*\((\d[\d,]{2,5})\s*m\)\s*\.?/i;

const fmtAlt = (raw) => {
  const n = Number(String(raw).replace(/,/g, ''));
  if (!(n >= 500 && n <= 8700)) return '';
  return n.toLocaleString('en-US') + ' m';
};

/* ============================================= haath se likha bayaan === */

const DATA = {
  'trekking/biafo-hisper-trek.md': {
    '01': { overnight: 'Hotel', description: 'Met at Islamabad airport and driven to the hotel, with the rest of the day free to recover from the flight. In the evening your guide goes through the route, checks personal kit against the list, and completes any outstanding paperwork for the trek.' },
    '02': { overnight: 'Hotel', description: 'North out of Islamabad on the Karakoram Highway, climbing out of the Hazara hills and into the gorges of the Indus. The road passes the point where the Himalaya, Karakoram and Hindu Kush ranges meet. Around nine hours of driving, with stops.' },
    '03': { overnight: 'Hotel', description: 'The Skardu road leaves the Karakoram Highway and follows the Indus upstream through a deep rock gorge, one of the most dramatic drives in Pakistan. Seven to eight hours to Skardu, the old capital of Baltistan, where the valley finally opens out.' },
    '04': { overnight: 'Hotel', description: 'A day in Skardu while trekker registration and park permits are completed. There is time for Kharpocho fort above the town and for the bazaar, where last supplies are bought. Your guide checks kit, and the cook and porter team for the traverse is assembled.' },
    '05': { overnight: 'Camping', description: 'A long jeep day up the Braldu valley on a road cut into the cliff above the river. Askole is the last village before the glaciers and the point where the road ends. Camp is set beside the village, and porter loads are weighed and distributed.' },
    '06': { overnight: 'Camping', hours: '5-6 hrs', description: 'The first day on foot. The path crosses the snout of the Biafo and climbs onto the lateral moraine, rough and loose underfoot. Namla is a small grassy shelf above the ice with water close by — the pattern for the days that follow.' },
    '07': { overnight: 'Camping', hours: '6 hrs', description: 'A day along the ablation valley on the north side of the Biafo, walking in the trough between the glacier and the mountain wall. The going alternates between grass and moraine, with the view opening back down the valley behind you.' },
    '08': { overnight: 'Camping', hours: '6-7 hrs', description: 'The valley widens into Baintha, an oasis of grass, willow and running water in the middle of forty kilometres of ice. Himalayan brown bear live in this part of the Biafo and their tracks are sometimes found near the camp.' },
    '09': { overnight: 'Camping', altitude: '4,035 m', description: 'A full day at Baintha to let the body catch up with the height before the upper glacier. Short walks into the side valleys help acclimatisation, and there is time to wash and dry kit. Your guide looks the group over before the crevassed ground ahead.' },
    '10': { overnight: 'Camping', description: 'The team moves out onto the body of the glacier and is roped together from here on, as crevasses begin to open. The surface is snow over ice and the walking becomes slower and more deliberate. Morphogoro is a camp pitched on the glacier itself.' },
    '11': { overnight: 'Camping', description: 'A steady climb up the upper Biafo towards the rim of Snow Lake, the great basin beginning to show ahead. Camp is pitched on snow below the pass, and it is an early night: tomorrow begins long before dawn.' },
    '12': { overnight: 'Camping', description: 'The big day. The route crosses Lukpe Lawo, the Snow Lake that captured the imagination of the early Karakoram explorers, a white basin ringed by peaks on every side. From its far rim the team climbs to the Hispar La and camps at the pass. Weather decides the timing.' },
    '13': { overnight: 'Camping', description: 'Down from the pass onto the Hispar glacier, which runs west towards Nagar. The descent is on snow at first and then onto a heavily crevassed surface that needs care and rope work. Kani Basa is the first camp on the Hispar side.' },
    '14': { overnight: 'Camping', description: 'A long day along the Hispar, crossing the side glaciers that come in from the north. The ice here is broken and the route winds rather than runs straight, so the ground covered feels less than the hours walked.' },
    '15': { overnight: 'Camping', description: 'The glacier begins to drop and the first grass appears on the slopes above. Bitanmal is a summer pasture used by Hispar herders, and after a week on snow and ice the smell of vegetation is startling.' },
    '16': { overnight: 'Camping', description: 'An easier day on pasture and moraine with the valley opening ahead. Shepherds’ huts and grazing animals mark the return to inhabited country, and the Hispar peaks stand behind you.' },
    '17': { overnight: 'Camping', description: 'Off the ice for good. The path drops steeply to Hispar, the first village on the Nagar side and the end of the traverse — 116 kilometres of connected glacier from Askole, and the whole width of the Karakoram crossed on foot.' },
    '18': { overnight: 'Hotel', description: 'Jeeps down the Hispar valley to the Hunza river and on to Karimabad. The change is abrupt: irrigated terraces, apricot orchards and tarmac after three weeks of rock and ice, and a hotel with hot water at the end of it.' },
    '19': { overnight: 'Hotel', altitude: '2,438 m', description: 'A free day in Hunza. Baltit and Altit forts stand above the village, both restored and worth the climb, and the viewpoint at Duikar looks across the whole valley to Rakaposhi and Ultar. A good day for the bazaar and for sleeping.' },
    '20': { overnight: 'Hotel', description: 'Back down the Karakoram Highway, retracing the Indus gorges. Where the group stops depends on the road and the season — Besham on the highway, or over the Babusar pass to Naran when it is open.' },
    '21': { overnight: 'Hotel', description: 'The last stretch to Islamabad, arriving in the afternoon. The evening is free, and there is usually a farewell dinner with the team that brought you across.' },
    '22': { overnight: 'Not applicable', description: 'Transfer to the airport for your onward flight. Day rooms can be arranged if your departure is late in the day.' },
  },

  'trekking/gondogoro-la-circuit-trek.md': {
    '02': { overnight: 'Hotel', description: 'The morning flight to Skardu runs along Nanga Parbat and over the Indus gorges when the weather allows, and is cancelled when it does not. If that happens the alternative is the road, two days along the Karakoram Highway, and the programme absorbs it.' },
    '03': { overnight: 'Hotel', description: 'A day in Skardu for the things that must be done before a Baltoro trek: trekker registration, Central Karakoram National Park permits, hiring any outstanding equipment in the bazaar, and the briefing with your guide. The porter and kitchen team is put together.' },
    '04': { overnight: 'Camping', altitude: '3,048 m', description: 'Six to seven hours by jeep up the Braldu valley, the road narrowing to a ledge cut above the river. Askole is the last village and the roadhead for the whole Baltoro. Camp beside the village; loads are weighed and porters registered.' },
    '05': { overnight: 'Camping', altitude: '3,200 m', hours: '4-5 hrs', description: 'An easy first day on foot along the Braldu, crossing the river by cable bridge. The ground is stony and the valley hot and dry at this height, which surprises people who came for a glacier trek.' },
    '06': { overnight: 'Camping', altitude: '3,450 m', hours: '6-7 hrs', description: 'A longer day up the valley with the Trango group coming into view ahead and the dirty snout of the Baltoro closing the head of the valley. Paiju has running water and the last trees you will see for a fortnight.' },
    '07': { overnight: 'Camping', altitude: '3,450 m', description: 'A day at Paiju for acclimatisation, while the porters bake bread for the glacier and loads are reorganised for the ice. Short walks up the hillside behind camp help the body adjust and give the first clear sight of the Baltoro.' },
    '08': { overnight: 'Camping', altitude: '3,800 m', description: 'On to the Baltoro. The climb over the glacier snout is awkward going, loose rubble lying on ice, and then the route follows the southern side of the glacier. Khoburtse is a small camp on a moraine shelf.' },
    '09': { overnight: 'Camping', altitude: '4,130 m', description: 'A short, steep day to Urdukas, a series of grassy ledges set high above the glacier and used as a camp for more than a century. The Trango Towers and the Cathedral spires stand directly across the ice.' },
    '10': { overnight: 'Camping', altitude: '4,300 m', description: 'Out onto the open glacier, walking on ice and moraine all day with Masherbrum rising to the south. The surroundings reduce to rock, ice and sky, and camp is pitched on the glacier.' },
    '11': { overnight: 'Camping', altitude: '4,600 m', description: 'The day the mountain appears. Where the Godwin-Austen glacier joins the Baltoro, K2 comes into view at the head of the valley with Broad Peak and the Gasherbrums around it. Concordia is a camp on the ice and one of the great mountain amphitheatres on earth.' },
    '12': { overnight: 'Camping', altitude: '4,600 m', description: 'A day at Concordia to acclimatise before the pass. Those with the legs for it can walk up the Godwin-Austen towards K2 base camp and back; the rest stay and watch the light move across the faces. Your guide assesses the group for the crossing.' },
    '13': { overnight: 'Camping', altitude: '5,000 m', description: 'A short day south towards the Gondogoro glacier to Ali Camp, the staging point for the pass. Everyone eats early and sleeps early — the crossing begins in the small hours, while the snow is still frozen hard.' },
    '14': { overnight: 'Camping', altitude: '5,585 m', description: 'An alpine start around one in the morning, climbing the snow slope to the Gondogoro La by first light. From the top, four of the world’s fourteen eight-thousanders are in sight at once. Fixed ropes are used on both sides and the descent to Khuspang is long and steep. The pass is crossed only if snow conditions and the group allow, and your guide’s decision on that is final.' },
    '15': { overnight: 'Camping', altitude: '4,650 m', description: 'A day at Khuspang beneath Laila Peak. Strong parties can attempt Gondogoro Peak from here; everyone else rests, and after yesterday most choose to.' },
    '16': { overnight: 'Camping', altitude: '3,400 m', description: 'Down the Gondogoro glacier and into the Hushe valley, and the first green since Paiju — juniper, birch and grazing animals. Shaicho is a meadow camp beside the river.' },
    '17': { overnight: 'Camping', altitude: '3,050 m', description: 'An easy last walk down the valley to Hushe, the village that many of Baltistan’s high-altitude porters and guides come from. The trek ends here.' },
    '18': { overnight: 'Hotel', description: 'Jeeps down the Hushe valley to the Shyok and on to Skardu, six to seven hours in all. Hotel, a shower, and the debriefing at the tourism office.' },
    '19': { overnight: 'Hotel', description: 'If the Skardu flight operates you are in Islamabad by lunchtime. If it does not, the group drives to Chilas and continues the following day — which is exactly why the reserve day is there.' },
    '20': { overnight: 'Hotel', description: 'A spare day held back for the Skardu flight, which is cancelled often enough that it should be planned for rather than hoped against. If it is not needed, it is a free day in Islamabad.' },
  },
};

/* ============================================= kaam =================== */

const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

const report = [];
const writes = [];

const files = [];
for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: service + '/' + n, full: path.join(dir, n) });
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

  const block = lines.slice(start, end).join('\n');
  let days;
  try { days = yaml.load(block).itinerary; } catch { continue; }
  if (!Array.isArray(days) || !days.length) continue;

  const own = DATA[f.ref] || {};
  const changes = { alt: 0, night: 0, desc: 0, hours: 0, titles: 0 };

  const fixed = days.map((d) => {
    const e = { ...(d || {}) };

    // 1) bulandi unwan se
    if (e.title) {
      const m = String(e.title).match(ALT_IN_TITLE);
      if (m) {
        const a = fmtAlt(m[1]);
        if (a && !e.altitude) { e.altitude = a; changes.alt++; }
        e.title = String(e.title).replace(ALT_IN_TITLE, ' ').replace(/\s+/g, ' ').trim();
        changes.titles++;
      }
    }

    // 2) haath se likha hua
    const mine = own[String(e.day)];
    if (mine) {
      if (mine.description && !e.description) { e.description = mine.description; changes.desc++; }
      if (mine.altitude && !e.altitude) { e.altitude = mine.altitude; changes.alt++; }
      if (mine.hours && !e.hours) { e.hours = mine.hours; changes.hours++; }
      if (mine.overnight && !e.overnight) { e.overnight = mine.overnight; changes.night++; }
    }

    // 3) raat unwan se
    if (!e.overnight) {
      const g = guessNight(e.title);
      if (g) { e.overnight = g; changes.night++; }
    }

    const out = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') out[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in out) && e[k] !== undefined && e[k] !== '') out[k] = e[k];
    return out;
  });

  const total = changes.alt + changes.night + changes.desc + changes.hours + changes.titles;
  if (!total) continue;

  const dumped = yaml.dump({ itinerary: fixed }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');

  // jaanch: naya block parse hota hai aur itne hi din hain
  let check;
  try { check = yaml.load(dumped); } catch (e) {
    report.push({ ref: f.ref, fail: 'naya YAML parse nahi hua: ' + e.message });
    continue;
  }
  if (!Array.isArray(check.itinerary) || check.itinerary.length !== days.length) {
    report.push({ ref: f.ref, fail: 'din ki ginti badal gayi, chhoR diya' });
    continue;
  }

  const newHead = [...lines.slice(0, start), ...dumped.split('\n'), ...lines.slice(end)].join('\n');
  writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + rest });
  report.push({ ref: f.ref, changes, days: days.length, mine: !!DATA[f.ref] });
}

/* ============================================= report ================== */

console.log('\nKYA BADLEGA');
console.log('-'.repeat(72));

let T = { alt: 0, night: 0, desc: 0, hours: 0, titles: 0 };
for (const r of report) {
  if (r.fail) { console.log('XX  ' + r.ref + ': ' + r.fail); continue; }
  const c = r.changes;
  for (const k of Object.keys(T)) T[k] += c[k];
  const bits = [];
  if (c.desc) bits.push(c.desc + ' bayaan');
  if (c.night) bits.push(c.night + ' raat');
  if (c.alt) bits.push(c.alt + ' bulandi');
  if (c.hours) bits.push(c.hours + ' ghante');
  if (c.titles) bits.push(c.titles + ' unwan saaf');
  console.log('   ' + r.ref.padEnd(50) + bits.join(', ') + (r.mine ? '   <- bayaan maine likha' : ''));
}

console.log('');
console.log('   Kul: ' + T.desc + ' bayaan, ' + T.night + ' raat, ' + T.alt + ' bulandi, ' +
            T.hours + ' ghante, ' + T.titles + ' unwan saaf');

console.log('');
console.log('-'.repeat(72));

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' trips. Lagane ke liye:');
  console.log('   node tools/fill-itineraries-1.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bakfill')) fs.copyFileSync(w.file, w.file + '.bakfill');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}

console.log('\nAgla qadam:  npm run build');
console.log('\nPhir Biafo Hispar aur Gondogoro La ke safhe khol kar parh lein.');
console.log('Bulandi ke adad shaye shuda zarail se hain, client ke GPS se nahi —');
console.log('un par ek nazar daal lein. Baqi paanch trips ka bayaan agle qadam mein.');
