#!/usr/bin/env node
/**
 * rewrite-baltoro.mjs   (website ke folder mein)
 *
 * Baltoro ka raasta chaaron expeditions par bilkul ek jaisa tha — din 02
 * se 10 tak har lafz ek. Google aise safhon ko ek doosre ki nakal samajhta
 * hai aur chaaron ki ranking girti hai.
 *
 * Har din ki TAFSEEL wahi rehti hai — ghante, faasle, Dumurdo ka pul,
 * Liliwa, Khoburtse, army ki telephone wire, Urdukas ka haal. Sirf har
 * expedition apne pahaR ke hawale se likhi gayi hai, kyunke raasta ek hai
 * magar manzil alag.
 *
 * DO ASAL GHALTIYAN BHI THEEK HO RAHI HAIN:
 *
 *   Broad Peak ke safhe par K2 ka data tha — "Summit at 8611m" aur camps
 *   6000/6700/7400/8000. Broad Peak 8,051 m ka hai.
 *
 *   Gasherbrum I ke safhe par Gasherbrum II ka data tha — "Summit at
 *   8035m". Gasherbrum I (Hidden Peak) 8,080 m ka hai.
 *
 *   Summit ki bulandiyan yaqeeni hain. Camps ki bulandiyan shaye shuda
 *   zarail se hain — client in par nazar daal le.
 *
 *   node tools/rewrite-baltoro.mjs            -> sirf dikhana
 *   node tools/rewrite-baltoro.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

const TEXT = {

/* ==================================================== BROAD PEAK ====== */
'expeditions/broad-peak-expedition.md': {
'02': 'a) The PK-451 flight to Skardu, which runs only when the mountain weather allows; transfer to the hotel on arrival. b) If it is cancelled, the team drives instead — eleven to twelve hours and 480 kilometres by coach up the Karakoram Highway to Chilas, with a hotel night there. Expeditions plan for both outcomes.',
'03': 'a) A free day in Skardu for those who flew. b) For those on the road, eight to nine hours and 275 kilometres remain. The route passes the junction of the Indus where Nanga Parbat stands 8,125m above the river and the rapids run below. Hotel in Skardu.',
'04': 'Six to seven hours by jeep up the Braldu to Askole, the last village on the valley — about eighty houses whose people grow their own cereals, vegetables and fruit and keep large herds of sheep, goats and yaks. The road ends here; everything above is carried. First night under canvas.',
'05': 'Two to three hours across open wasteland, then the traverse of the Biafo glacier: two kilometres of moving boulders and crevasses that must be crossed rather than walked around. Lunch on the far side, then four to five hours on to Jhola over the Dumurdo river bridge. Camp among a few bushes beside a side stream.',
'06': 'Three to four hours on an easy trail past the Bardumal campsite and along two kilometres of sandy river beach. After lunch, two to three hours more to Paiju, the trail climbing to a vantage point over the snout of the Baltoro — and, far up the valley, the Cathedral Towers and the first triangle of K2. Paiju is a busy campsite in season.',
'07': 'The traditional rest day at Paiju. The team explores locally and checks loads while the low-altitude porters bake bread for the glacier stages. For a Broad Peak expedition this is the last day among trees and running water before six weeks on ice.',
'08': 'Seven to eight hours, climbing gradually onto the Baltoro along its southern edge. Two hours up, the path divides at the snout — the left branch leads to Trango base camp and the Sarpo Laggo pass. Keeping right, the route climbs onto a glacier 62 kilometres long and two wide, then takes a long two to three hour diagonal to the far side. Past Liliwa and Khoburtse, then four to five hours along the crest of the lateral moraine beneath Paiju Peak, Choricho, Uli Biaho and the Trango Towers. Urdukas is a spectacular site, though like Paiju it is heavily used.',
'09': 'Five to six hours on the ice. The first hour crosses awkward side crevasses before the centre of the glacier opens out and the walking eases. Two to three hours to Goro I, opposite the Yermanendu glacier falling from the Masherbrum pass, then two to three hours east, following the telephone wire that runs from the army post at Goro up to Gasherbrum IV. Camp at Goro II on rough stone and ice in mid-glacier, with meltwater for the kitchen.',
'10': 'Four to five hours of easier walking into the greatest mountain amphitheatre on earth — Muztagh Tower, Gasherbrum IV, Mitre Peak and K2 itself. Lunch at Concordia, named by Martin Conway after the Place de la Concorde in Paris. Some crevassed ground near the Godwin-Austen glacier, and then base camp beneath the west face of Broad Peak, home for the next six weeks.',
'11': 'Thirty-two days on the mountain. The normal route climbs the west face to the col, with camps at roughly 5,800m, 6,400m and 7,100m before the long summit ridge to 8,051m — a ridge that has turned back a great many teams a few hundred metres short of the true summit, at the lower central top. Base camp runs throughout with cook, kitchen and communications.',
},

/* ==================================================== GASHERBRUM II === */
'expeditions/gasherbrum-ii-expedition.md': {
'02': 'a) PK 451 to Skardu, weather permitting — the flight threads between the ranges and is cancelled about as often as it operates. Hotel on arrival. b) Otherwise it is the road: eleven to twelve hours and 480 kilometres by coach along the Karakoram Highway to Chilas, with a hotel night there.',
'03': 'a) A free day in Skardu for those who flew. b) For those driving, eight to nine hours and 275 kilometres remain. The road passes the Indus junction where Nanga Parbat rises 8,125m above the water with the rapids below. Hotel in Skardu, and the final preparations.',
'04': 'The jeep road up the Braldu takes six to seven hours to Askole. Eighty or so houses, terraced plots of cereal and vegetables, fruit trees and big herds of sheep, goats and yaks — the last settlement before the glaciers. Camp beside the village while loads are weighed.',
'05': 'Two to three hours across stony wasteland and then the crossing of the Biafo, a two-kilometre tide of boulders and crevasses. Lunch beyond it, then four to five hours to Jhola over the Dumurdo river bridge. The campsite has bushes and a side stream, and both are welcome.',
'06': 'An easy three to four hours past Bardumal and along a long sandy beach beside the river, then two to three hours after lunch to Paiju. The trail lifts to a vantage point above the Baltoro snout where the Cathedral Towers appear and, far off, the triangle of K2. Paiju is crowded in season.',
'07': 'The traditional rest day at Paiju. Gasherbrum teams use it to reorganise loads for the glacier while the porters prepare their food. It is also the last green campsite — from here to base camp the ground is stone and ice.',
'08': 'A long day of seven to eight hours up the southern edge of the Baltoro. The path splits at the snout, the left branch heading for Trango base camp and the Sarpo Laggo; the route keeps right and climbs onto a glacier 62 kilometres long and two across, taking a diagonal of two to three hours to reach the far side. Liliwa, then Khoburtse, then four to five hours along the lateral moraine with Paiju Peak, Choricho, Uli Biaho and the Trango Towers above. Urdukas is a fine camp, if an overused one.',
'09': 'Five to six hours on the glacier. The first hour picks through side crevasses; after that the centre is smoother. Two to three hours brings Goro I, opposite the Yermanendu glacier coming down from the Masherbrum pass, and two to three more lead east along the telephone wire strung from the army post at Goro to Gasherbrum IV — which is, by now, the head of your own valley. Goro II is camped on stone and ice with glacier meltwater.',
'10': 'Four to five hours of easier going into the amphitheatre: Muztagh Tower, Gasherbrum IV, Mitre Peak and K2. Lunch at Concordia, and then the route turns away from the K2 valley and up the South Gasherbrum glacier. Chogolisa, Baltoro Kangri and Gasherbrum V come into view through the afternoon. Camp at Shaqring, which Baltis also call Shama.',
'12-42': 'Thirty-one days on the mountain. The normal route on Gasherbrum II places camps at roughly 6,000m, 6,500m and 7,300m before the summit slopes to 8,035m. It is considered one of the more approachable eight-thousanders, which is not the same thing as an easy one: the upper ridge is exposed and the weather window is short. Base camp runs throughout with cook, kitchen and communications.',
},

/* ==================================================== GASHERBRUM I ==== */
'expeditions/ghasherbrum-1.md': {
'02': 'a) The scheduled PK 451 to Skardu when the weather over the ranges allows, with transfer to the hotel on arrival. b) When it does not, the alternative is eleven to twelve hours by coach — 480 kilometres of Karakoram Highway to Chilas, and a night there.',
'03': 'a) Those who flew have the day free in Skardu. b) Those on the road have eight to nine hours and 275 kilometres still to cover, past the Indus junction where the 8,125m wall of Nanga Parbat stands over the river and its rapids. Hotel in Skardu.',
'04': 'Askole is six to seven hours away by jeep up the Braldu. It is the last village — eighty houses, terraced cereal and vegetable plots, fruit trees, and herds of sheep, goats and yaks. The road ends; from here everything moves on backs. Camp by the village.',
'05': 'The day opens with two to three hours over wasteland before the Biafo has to be crossed — two kilometres of tilted boulders and open crevasses. Lunch on the far bank, then four to five hours to Jhola across the Dumurdo bridge, where the camp sits in scrub beside a side stream.',
'06': 'Three to four hours of easy walking past Bardumal and along two kilometres of river beach, then two to three hours more to Paiju after lunch. Near the end the trail climbs to a viewpoint over the Baltoro snout; the Cathedral Towers stand up the valley and K2 shows its triangle for the first time. Paiju is a busy place in July.',
'07': 'The rest day at Paiju, kept by every Baltoro expedition. The porters bake for the glacier stages while the team walks locally, checks loads and sleeps. Hidden Peak is still a week away.',
'08': 'Seven to eight hours climbing gradually onto the Baltoro’s southern edge. After two hours the path divides at the snout — left for Trango base camp and the Sarpo Laggo pass, right for the glacier itself, 62 kilometres long and two wide. A diagonal of two to three hours crosses to the far side, then Liliwa and Khoburtse, then four to five hours along the moraine crest under Paiju Peak, Choricho, Uli Biaho and the Trango Towers. Urdukas is one of the great campsites of the range, and one of the busiest.',
'09': 'Five to six hours on ice. The first hour works through side crevasses before the middle of the glacier opens and the pace picks up. Goro I comes after two to three hours, opposite the Yermanendu glacier spilling from the Masherbrum pass; two to three hours more lead east beside the telephone wire strung from the army post at Goro to Gasherbrum IV. Camp at Goro II on stones and ice, with meltwater nearby.',
'10': 'Four to five hours of gentler walking, with Muztagh Tower, Gasherbrum IV, Mitre Peak and K2 around you. Lunch at Concordia, then the route leaves the K2 valley for the South Gasherbrum glacier, with Chogolisa, Baltoro Kangri and Gasherbrum V opening up ahead. Camp at Shaqring, known locally as Shama.',
'12-42': 'Thirty-one days on the mountain. The usual line is the Japanese Couloir on the north-west face, with camps at roughly 5,900m, 6,400m and 7,100m before the summit at 8,080m. Gasherbrum I is the eleventh highest mountain in the world and was the first eight-thousander climbed by an American team, in 1958. Base camp runs throughout with cook, kitchen and communications.',
},

/* ==================================================== K2 ============== */
'expeditions/k2-expediiton.md': {
'02': 'a) PK-451 to Skardu if the weather in the ranges allows, with transfer to the hotel on arrival. b) If it does not, the team takes the road — eleven to twelve hours and 480 kilometres of Karakoram Highway to Chilas, and a hotel night there. On a K2 expedition this uncertainty is built into the schedule from the first day.',
'03': 'a) A free day in Skardu for those who flew in. b) For those on the road, eight to nine hours and 275 kilometres remain, passing the Indus junction where Nanga Parbat stands 8,125m above the water. Hotel in Skardu.',
'04': 'Six to seven hours by jeep up the Braldu to Askole — eighty houses, their own cereals, vegetables and fruit, and large herds of sheep, goats and yaks. The last village, and the last wheels. Camp beside it while the porter loads are made up.',
'05': 'Two to three hours across wasteland, then the Biafo: two kilometres of boulders and crevasses that have to be crossed rather than walked around. Lunch beyond it, then four to five hours to Jhola over the Dumurdo bridge, camping in scrub beside a side stream.',
'06': 'Three to four hours of easy trail past Bardumal and two kilometres of sandy beach beside the river, then two to three hours to Paiju. The climb to the vantage point above the Baltoro snout gives the Cathedral Towers — and, far up the valley, the first sight of the mountain you have come for. Paiju is crowded, and nobody minds.',
'07': 'The rest day at Paiju. The porters prepare food for the glacier stages while the team rests and goes through equipment. From here the expedition leaves vegetation behind for two months.',
'08': 'Seven to eight hours up the southern edge of the Baltoro. The path forks at the snout — left to Trango and the Sarpo Laggo, right onto the glacier, 62 kilometres long and two wide. A two to three hour diagonal reaches the far side, then Liliwa and Khoburtse, then four to five hours along the moraine crest below Paiju Peak, Choricho, Uli Biaho and the Trango Towers. Urdukas, on its grassy ledges, is spectacular and heavily used.',
'09': 'Five to six hours on the glacier, the first of them awkward among side crevasses before the centre smooths out. Two to three hours to Goro I, opposite the Yermanendu glacier from the Masherbrum pass; two to three hours east after that, following the army telephone wire that runs from Goro to Gasherbrum IV. Goro II is a camp on stone and ice in mid-glacier, with meltwater for the kitchen.',
'10': 'Four to five hours of easier walking into Concordia, named by Martin Conway after the Place de la Concorde — and with reason, since this is where the Baltoro and Godwin-Austen glaciers meet beneath Muztagh Tower, Gasherbrum IV, Mitre Peak and K2. Lunch here, then some crevassed ground near the Godwin-Austen and camp at Broad Peak base camp.',
'12': 'Forty days on the mountain. The Abruzzi Spur is the normal route, with camps at roughly 6,000m, 6,700m, 7,400m and 8,000m, and the Bottleneck beneath the summit serac at around 8,200m. The summit is 8,611m. K2 offers fewer weather windows than any other eight-thousander, and more expeditions go home without one than with. Base camp runs throughout with cook, kitchen and communications.',
},
};

/* ============================================= kaam =================== */

const writes = [];
const rows = [];

for (const [ref, days] of Object.entries(TEXT)) {
  const full = path.join(ROOT, 'src', 'content', ...ref.split('/'));
  if (!fs.existsSync(full)) { console.log('XX  ' + ref + ': file nahi mili'); continue; }

  const raw = fs.readFileSync(full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { console.log('XX  ' + ref + ': front matter nahi parhi gayi'); continue; }

  const lines = fm[1].split('\n');
  const start = lines.findIndex((l) => /^itinerary:\s*$/.test(l));
  if (start < 0) { console.log('XX  ' + ref + ': itinerary nahi mili'); continue; }

  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end++;

  let itin;
  try { itin = yaml.load(lines.slice(start, end).join('\n')).itinerary; }
  catch (e) { console.log('XX  ' + ref + ': YAML ' + e.message); continue; }
  if (!Array.isArray(itin)) continue;

  const seen = new Set();
  let changed = 0;

  const out = itin.map((d) => {
    const e = { ...(d || {}) };
    const mine = days[String(e.day)];
    if (mine && String(e.description || '') !== mine) {
      seen.add(String(e.day));
      rows.push({ ref, day: e.day, title: e.title || '', was: String(e.description || '').length, now: mine.length });
      e.description = mine;
      changed++;
    } else if (mine) seen.add(String(e.day));

    const o = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') o[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in o) && e[k] !== undefined && e[k] !== '') o[k] = e[k];
    return o;
  });

  for (const k of Object.keys(days)) if (!seen.has(k)) console.log('   !   ' + ref + ': Day ' + k + ' file mein nahi mila');
  if (!changed) continue;

  const dumped = yaml.dump({ itinerary: out }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
  try {
    const chk = yaml.load(dumped);
    if (!Array.isArray(chk.itinerary) || chk.itinerary.length !== itin.length) throw new Error('ginti badal gayi');
  } catch (e) { console.log('XX  ' + ref + ': jaanch fail — ' + e.message); continue; }

  const newHead = [...lines.slice(0, start), ...dumped.split('\n'), ...lines.slice(end)].join('\n');
  writes.push({ file: full, ref, text: '---\n' + newHead + '\n---\n' + raw.slice(fm[0].length) });
}

/* ============================================= report ================ */

console.log('\nBALTORO KA RAASTA — har expedition apne pahaR ke hawale se');
console.log('='.repeat(76));
let last = '';
for (const r of rows) {
  if (r.ref !== last) { console.log('\n   ' + r.ref); last = r.ref; }
  console.log('      Day ' + String(r.day).padEnd(8) + r.title.padEnd(34) +
              String(r.was).padStart(4) + ' -> ' + r.now + ' harf');
}

console.log('\n\nDO GHALTIYAN JO THEEK HO RAHI HAIN — CLIENT KO BATAYEN');
console.log('='.repeat(76));
console.log('   Broad Peak ke safhe par K2 ka data tha:');
console.log('      purana: "Summit at 8611m", camps 6000 / 6700 / 7400 / 8000');
console.log('      yeh K2 ke adad hain. Broad Peak 8,051 m ka hai.');
console.log('      naya:   summit 8,051 m, camps taqreeban 5,800 / 6,400 / 7,100');
console.log('');
console.log('   Gasherbrum I ke safhe par Gasherbrum II ka data tha:');
console.log('      purana: "Summit at 8035m"  — woh GII ki bulandi hai');
console.log('      naya:   summit 8,080 m, Japanese Couloir, camps 5,900 / 6,400 / 7,100');
console.log('');
console.log('   Summit ki bulandiyan yaqeeni hain. Camps ki bulandiyan shaye shuda');
console.log('   zarail se hain — client in par nazar daal le, kyunke har team');
console.log('   apne camps thoRe alag lagati hai.');

console.log('\n' + '-'.repeat(76));
if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/rewrite-baltoro.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bakbaltoro')) fs.copyFileSync(w.file, w.file + '.bakbaltoro');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + w.ref);
}
console.log('\nAgla qadam:  npm run build');
