#!/usr/bin/env node
/**
 * deepen-biafo.mjs   (website ke folder mein)
 *
 * Biafo Hispar Pass Trek — 1,365 se taqreeban 2,000 alfaaz.
 *
 * Kya hota hai:
 *   - 22 dinon ke bayaan: ~43 se ~57 alfaaz har din
 *   - safhe ka matan nayi tarah: aap ki saari haqeeqat rakhi hai (116 km,
 *     5,151 m, Snow Lake, bhaloo, open zone, 10 hotel / 12 camping raatein,
 *     1 July se August ke aakhir) magar angrezi durust
 *   - Day 22 ka bayaan: wahan related links ka matan reh gaya tha
 *   - highlights ka khaana khaali tha, bhar diya
 *   - Askole 3,048 m -> 3,000 m, baqi safhon ke mutabiq
 *
 * KHUD JAANCHTA HAI — naya matan website ke HAR doosre safhe se milaya
 * jata hai. Das lafzon ka tukra jo do ya teen safhon par ho, woh masla
 * hai; jo chaar ya zyada par ho woh aap ka boilerplate hai aur chhora
 * jata hai. Kuch mila to likhta nahi, report deta hai.
 *
 *   node tools/deepen-biafo.mjs            -> sirf dikhana
 *   node tools/deepen-biafo.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CONTENT = path.join(ROOT, 'src', 'content');
const FILE = path.join(CONTENT, 'trekking', 'biafo-hisper-trek.md');

/* ===================== 22 DIN ========================================= */

const DAYS = {

1: { d:
`You are met in the arrivals hall at Islamabad and driven to the hotel, with the rest of the day to do nothing in particular. In the evening your guide walks the group through the traverse, checks your kit against the list we sent, and finishes the paperwork. Anything you still need can be bought here or in Skardu. Sleep is the useful work tonight.` },

2: { d:
`North out of the city on the Karakoram Highway, up through the Hazara hills and down into the Indus gorges, where the road is cut into the rock above the water. Somewhere short of Chilas the Himalaya, Karakoram and Hindu Kush meet within sight of one another, and there is a marker where you can stand and look at all three. About nine hours with stops.` },

3: { d:
`The Skardu road turns off the highway and climbs east beside the Indus through a gorge of bare rock, with the river grey-green and very large below. Seven to eight hours, and among the finest road journeys in Asia. Skardu arrives as a surprise: a wide sandy basin at 2,228 metres where the Shigar river joins the Indus, and the old capital of Baltistan.` },

4: { d:
`A working day in Skardu. Your trekker registration and the park permit are completed, the cook and the porter teams for both sides of the traverse are engaged, and the last supplies are bought in the bazaar. There is time for Kharpocho fort on the bluff above the town. Tonight is the last bed and the last mains electricity for a fortnight, so charge everything.` },

5: { alt: '3,000 m', d:
`A long day in four-wheel drives up the Braldu, on a track hacked out of the canyon wall with the river a long way below and nothing on the outside edge. Six to seven hours. Askole at 3,000 metres is the last village and the end of the road: barley terraces, apricot trees, irrigation channels cut by hand. Camp outside the village while loads are weighed.` },

6: { d:
`The first day on foot, five to six hours. The path crosses the snout of the Biafo, where the glacier pushes a grey wall of ice and rubble into the valley, then climbs onto the lateral moraine — loose, uneven and tiring in a way no path at home is. Namla is a grassy shelf above the ice with water nearby, which is the shape of most camps from here on.` },

7: { d:
`Six hours in the ablation valley on the north flank of the Biafo, the strip of ground caught between the moving ice and the mountainside. The walking alternates between turf and moraine and is easier than yesterday. Look back down the valley as you go: this is the last view out towards the inhabited world, and it closes behind you by evening.` },

8: { d:
`Six to seven hours, and the valley opens into Baintha. After forty kilometres of grey ice this is an oasis in the exact sense: grass, willow scrub, flowers in July and clean running water, set in a bay of the glacier. Himalayan brown bear live in this part of the Biafo and their tracks turn up near camp often enough that your guide will point them out.` },

9: { d:
`A full rest day at Baintha, and it is not spare time. You have come from 500 metres to 4,035 in eight days, and the upper glacier and the pass are still ahead. Short walks into the side valleys help more than lying in a tent. Wash, dry your kit, eat properly. Your guide looks the group over before committing to the crevassed ground above.` },

10: { d:
`The team moves out of the ablation valley onto the body of the glacier, and from here you walk roped together, because the crevasses begin. The surface changes to snow lying over ice and the pace drops: every step is placed rather than taken, and the rope sets the spacing. Morphogoro is camped on the glacier itself, with no ground anywhere that is not ice.` },

11: { d:
`A steady climb up the upper Biafo with the rim of Snow Lake widening ahead all day. The gradient is gentle and the altitude is not, so the hours feel longer than the distance. Camp is pitched on snow below the pass at 4,590 metres. It is a cold, bright, quiet place, and an early night, because tomorrow starts long before light.` },

12: { d:
`The big day. The route crosses Lukpe Lawo — Snow Lake — a white basin some sixteen kilometres across, ringed by peaks on every side and flat enough that early explorers took it for an inland ice cap. Martin Conway named it in 1892; Shipton and Tilman came to survey it in 1937. From its far rim the team climbs to the Hispar La at 5,151 metres and camps on the pass. The weather decides the timing, not the schedule.` },

13: { d:
`Down from the pass onto the Hispar glacier, which runs west towards Nagar — the second half of the traverse and a different mountain world. The first part is a snow descent; below that the surface breaks up badly and needs care and rope work. Kani Basa is the first camp on the Hunza side, and most people sleep extremely well in it.` },

14: { d:
`A long day westward along the Hispar, crossing the tributary glaciers that come in from the north: Yutmaru, Khanibasa and the others, each one a glacier in its own right joining the main stream. The ice is broken and the route winds constantly, so the distance covered feels much less than the hours spent. Camp at Jutan mal on the moraine.` },

15: { d:
`The glacier loses height and the first grass shows on the slopes above the ice. Bitanmal is a summer pasture used by Hispar herders, and after a week on snow and rubble the smell of vegetation and animals is startling — several people a season say it is the thing they remember most. Shepherds may be in residence; your guide will ask before camping.` },

16: { d:
`An easier day on pasture and old moraine with the valley opening steadily ahead. Stone huts, grazing goats and cut hay mark the return to country where people live. The Hispar wall stands behind you now rather than in front, and the peaks above the far side of the glacier — Kanjut Sar and the Hispar Sar group — hold the skyline.` },

17: { d:
`Off the ice for good. The path drops steeply to Hispar village at 2,302 metres, the first settlement on the Nagar side and the end of the traverse. Behind you are 116 kilometres of connected glacier and the entire width of the Karakoram, crossed on foot. It takes most people the rest of the afternoon to accept that the walking has finished.` },

18: { d:
`Jeeps down the Hispar valley to the Hunza river and on to Karimabad. The contrast is abrupt and slightly unreal: irrigated terraces, apricot and walnut trees, shops, tarmac, and a hotel with hot water, three weeks after Askole. Karimabad sits at 2,438 metres looking straight across at Rakaposhi, and the afternoon is yours to do very little with.` },

19: { d:
`A free day in Hunza. Baltit fort stands above the village and Altit fort below it, both several centuries old and both restored; the climb to either is worth it for the valley alone. The viewpoint above Duikar looks across the whole of central Hunza to Rakaposhi and Ultar Sar. Otherwise: the bazaar, apricot cake, and sleep.` },

20: { d:
`Back onto the Karakoram Highway and south through the Indus gorges. Where the group spends the night depends on the state of the road and the time of year — Besham on the highway itself, or east over the Babusar pass to Naran if the pass is open and the season allows. Your driver and guide settle it on the morning.` },

21: { d:
`The final run of highway into Islamabad, arriving through the afternoon. Whatever you left behind three weeks ago comes back out of the hotel store, bringing with it the small shock of clean cotton and a full-length mirror. Most groups spend the evening at a farewell dinner with the guide, the cook and the crew who carried them over the range; keep it free for them if you can.` },

22: { d:
`The airport transfer is set against your flight time, and we hold a day room for anyone not leaving until the evening. Behind you lie 116 kilometres of glacier, a pass at 5,151 metres, two valleys that share no road between them, and the full width of the Karakoram crossed on foot. Not many people can say that, and the ones who can tend to come back.` },

};

/* ===================== SAFHE KA MATAN ================================ */

const H = (t) => '<h2><strong>' + t + '</strong></h2>';
const P = (t) => '<p>' + t + '</p>';
const UL = (a) => '<ul>' + a.map((i) => '<li><p>' + i + '</p></li>').join('') + '</ul>';

const BODY = [

H('About this journey'),
P('Very few treks anywhere cross an entire mountain range on ice. The Biafo Hispar traverse links Baltistan with Hunza along 116 kilometres of connected glacier &mdash; the longest glacial system outside the polar regions &mdash; crossing the Hispar La at 5,151 metres and passing through Snow Lake, the great white basin that early Karakoram explorers could not account for.'),
P('The route starts at Askole, the roadhead for the Baltoro, and then turns north instead of east. Nine days go up the Biafo to the pass, with a rest day at the Baintha oasis; one long day crosses Snow Lake and reaches the Hispar La; and five days descend the Hispar glacier to the first village on the Nagar side. From there it is jeep and highway to Karimabad, Hunza and home.'),
P('There is no technical climbing. There is roped glacier travel for about a week, a pass to cross on snow, and no way out once the team is committed to the upper Biafo except forward or back the way it came. That is the character of the trek, and it is why people do it.'),

H('Snow Lake'),
P('Snow Lake &mdash; Lukpe Lawo in Balti &mdash; is the reason this traverse has a place in mountaineering history rather than just in brochures.'),
P('It is a basin of snow roughly sixteen kilometres across at around 4,900 metres, almost level, enclosed by peaks on every side, where the heads of the Biafo and Hispar glaciers meet and part. Martin Conway reached it in 1892, named it, and came home with the idea that it might be the remnant of an inland ice sheet. Eric Shipton and Bill Tilman came to survey it properly in 1937 and could not entirely explain it either.'),
P('Walking across it is a strange experience by any standard. There is no feature to measure distance against, no sound at all once the group stops, and the peaks around the rim stay the same size for hours. It is also a crevasse field under snow, which is why the team is roped and why the guide&rsquo;s line is followed exactly.'),

H('Who this trek suits'),
P('Experienced trekkers who are comfortable with long days on rough ground, with being roped on a glacier, and with three weeks away from roads, shops and mobile signal. No climbing skill is needed and none is taught; what is needed is hill fitness built over months rather than weeks, and a steady temperament.'),
P('The commitment is the part to think about honestly. From the day the team moves onto the upper Biafo, the nearest road is days away in either direction, and the only way to leave is on your own feet. Nothing about that is dangerous in itself. It does mean a blister ignored at Namla becomes a serious problem at Morphogoro.'),
P('Our own classification for this route is <strong>strenuous</strong>. Twenty-two days, a 5,151-metre pass, a week of roped travel and twelve nights under canvas are not a moderate undertaking, whatever the absence of technical climbing might suggest.'),

H('When to go'),
P('<strong>1 July to the end of August.</strong> The window is narrow and the reason is the snow.'),
P('Snow Lake and the upper Biafo are crossed on snow bridges over crevasses. Too early in the season and there is too much unconsolidated snow and the bridges are unreliable; too late and they have melted thin. July and August are when the surface is at its most dependable and the weather at its most settled. Outside those two months this traverse is not a trekking proposition.'),
P('Daytime walking in the lower Biafo is warm and the glare off the ice is severe. Nights above 4,000 metres are below freezing, and the camp on the pass is colder than anything else on the route.'),

H('What we handle'),
P('Permits and the park fee, trekker registration in Skardu, transport from Islamabad to Askole and from Hispar village back to Islamabad, porters for both sides of the traverse, all camp equipment, a cook and kitchen crew, and guides who have crossed the Hispar La before &mdash; which on this route matters more than on most, because the line across Snow Lake changes from season to season.'),
P('Porters are engaged separately for the two halves, since the Askole men do not cross to Nagar and the Hispar men do not come east. The changeover is arranged in advance, and it is one of the things that makes this traverse harder to organise than an out-and-back trek.'),
P('Every porter and staff member is insured through Alpha Insurance before the trek leaves Skardu, arranged and paid for by us.'),

H('Facts and figures'),
UL([
'<strong>Duration</strong> &mdash; 22 days, Islamabad to Islamabad',
'<strong>Nights</strong> &mdash; 10 in hotels, 12 under canvas',
'<strong>Highest point</strong> &mdash; Hispar La, 5,151 m',
'<strong>Glacier</strong> &mdash; 116 km of connected ice, Biafo and Hispar combined',
'<strong>Grade</strong> &mdash; strenuous; no technical climbing, roped glacier travel throughout the upper sections',
'<strong>Season</strong> &mdash; 1 July to the end of August',
'<strong>Zone</strong> &mdash; open; no restricted-area permit required',
]),

H('Wildlife'),
P('The Biafo is one of the better places in the Karakoram to see large animals, and Baintha in particular. <strong>Himalayan brown bear</strong> live in this section of the glacier&rsquo;s ablation valleys and their tracks are found near the camp regularly; actual sightings are a matter of luck and patience. Ibex are on the crags above the moraine, and snow leopard are present in these valleys although very few trekkers ever see one.'),
P('Flowers in the ablation valleys are at their best in July, and the Baintha bay carries willow, juniper scrub and alpine herbs in a place that is otherwise forty kilometres of rock and ice. Take nothing and leave nothing: this is inside the Central Karakoram National Park and the ground recovers slowly.'),

H('Equipment'),
P('A full list arrives with your booking confirmation. Four things matter more than the rest of it put together.'),
UL([
'<strong>Boots</strong> &mdash; stiff-soled, supportive, crampon-compatible, and worn in over months rather than weeks. On a route with no road access for a fortnight, a boot that does not fit is what ends a trek.',
'<strong>Sleeping bag and mat</strong> &mdash; the camp on the Hispar La is the coldest night of the trip and everything above Baintha is below freezing after dark. Rent a bag here if you would rather not fly with one.',
'<strong>Glacier glasses</strong> &mdash; side shields, not ordinary sunglasses. A week of reflected light off Snow Lake is precisely how snow blindness happens.',
'<strong>Sun cream, generously and often</strong> &mdash; under the nose, under the chin, inside the ears. At this altitude the glare arrives from below as well as above.',
]),
P('Harness, rope and the glacier hardware are issued and fitted in Skardu, and your guide takes the group through the technique during the rest day at Baintha. Bring your own harness if there is one you already trust. Finally, bring something to keep a phone or camera alive &mdash; a battery pack, and a folding panel if you own one. Nothing between Askole and Karimabad runs on mains electricity.'),

H('Insurance'),
P('<strong>Cover is mandatory on this traverse and arranging it falls to you, not to us.</strong> The policy has to reach helicopter rescue at these altitudes, hospital treatment, and repatriation. The cover bundled with an ordinary holiday reaches none of the three, and neither do most annual multi-trip policies without a specific mountaineering extension.'),
P('Pass us the policy number and whichever contact the insurer staffs around the clock, well ahead of departure. If something happens on the Hispar, that number is dialled before anything else, and no aircraft lifts off until the insurer has confirmed cover. Finding out at Kani Basa that a policy excludes rescue above 4,500 metres is the worst possible moment to learn it.'),

H('Getting there and getting back'),
P('This traverse is unusual in finishing five hundred road kilometres from where it began. The group travels out through Baltistan to Skardu and Askole, and returns from Hispar village and Karimabad down the Karakoram Highway through Hunza. It is a loop rather than an out-and-back, and it shows you two parts of Gilgit-Baltistan that have little in common beyond the mountains between them.'),
P('Both road sections are long, spectacular and at the mercy of conditions in their own way &mdash; the Braldu jeep track closes for rockfall, and the Babusar pass is a summer-only road. The programme is laid out with that built in. One request, though: give yourself a clear day in Islamabad at the end rather than connecting straight onto a long-haul flight the same night.'),

].join('');

/* ===================== highlights ===================================== */

const HIGHLIGHTS = [
  'Snow Lake (Lukpe Lawo)',
  'Hispar La, 5,151 m',
  '116 km of connected glacier',
  'Baltistan to Hunza on foot',
  'Baintha oasis and brown bear country',
  'Baltit and Altit forts, Karimabad',
];

/* ===================== kaam =========================================== */

const words = (s) => (String(s || '')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
  .match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;

const normWords = (s) => String(s || '')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
  .toLowerCase().match(/[a-z0-9]+/g) || [];

const runs = (t, n = 10) => {
  const w = normWords(t); const s = new Set();
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' '));
  return s;
};

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc); else if (e.name.endsWith('.md')) acc.push(f);
  }
  return acc;
};

const raw = (() => { try { return fs.readFileSync(FILE, 'utf8'); } catch { return null; } })();
if (!raw) { console.log('XX  biafo-hisper-trek.md nahi mili.'); process.exit(1); }

const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);

/* Khaana dhoondna — "highlights:" aur "highlights: []" dono. Pehle sirf
   khaali-wali shakl dhoondta tha, is liye "highlights: []" chhoot gaya aur
   doosra khaana ban gaya. */
const findKey = (key) => {
  for (let i = 0; i < lines.length; i++) {
    if (!new RegExp('^' + key + ':').test(lines[i])) continue;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^---\s*$/.test(lines[j]) || /^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[j])) return { start: i, end: j };
    }
    return { start: i, end: i + 1 };
  }
  return null;
};

const atItin = findKey('itinerary');
if (!atItin) { console.log('XX  itinerary block nahi mila.'); process.exit(1); }

let itin;
try { itin = yaml.load(lines.slice(atItin.start, atItin.end).join('\n')).itinerary; }
catch (e) { console.log('XX  itinerary YAML: ' + e.message); process.exit(1); }
if (!Array.isArray(itin)) { console.log('XX  itinerary list nahi hai.'); process.exit(1); }

const sameDay = (a, b) => {
  const x = String(a).trim(), y = String(b).trim();
  if (x === y) return true;
  const nx = Number(x), ny = Number(y);
  return Number.isFinite(nx) && Number.isFinite(ny) && nx === ny;
};

const fmOld = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
const bodyOld = raw.slice(fmOld[0].length);

let w0 = words(bodyOld), w1 = words(BODY), i0 = 0, i1 = 0;
const misses = [];

for (const d of itin) {
  i0 += words(d.description);
  const o = DAYS[String(Number(d.day))];
  if (o) i1 += words(o.d); else { i1 += words(d.description); misses.push(d.day); }
}

console.log('\nBIAFO HISPAR — 2,000 ALFAAZ KA KAAM');
console.log('='.repeat(80));
console.log('   safhe ka matan:  ' + w0 + '  ->  ' + w1);
console.log('   itinerary:       ' + i0 + '  ->  ' + i1);
console.log('   KUL:             ' + (w0 + i0) + '  ->  ' + (w1 + i1));
console.log('');
if (misses.length) console.log('   XX  in dinon ka bayaan nahi likha: ' + misses.join(', '));

console.log('   Sections:');
for (const m of BODY.matchAll(/<h2><strong>([^<]+)<\/strong><\/h2>/g)) console.log('      ' + m[1]);
console.log('');
console.log('   Din ke bayaan ki lambai:');
for (const d of itin) {
  const o = DAYS[String(Number(d.day))];
  console.log('      Day ' + String(d.day).padEnd(5) + String(d.title || '').slice(0, 36).padEnd(38) +
    (o ? String(words(o.d)).padStart(4) + ' alfaaz' : '  [nahi badla]') +
    (o && o.alt ? '   bulandi: ' + String(d.altitude || '') + ' -> ' + o.alt : ''));
}

/* ---- duplicate jaanch: poori website ---- */
const all = walk(CONTENT).filter((f) => path.resolve(f) !== path.resolve(FILE));
const NEW = BODY + ' \n ' + Object.values(DAYS).map((x) => x.d).join(' \n ');

const freq = new Map();
const perFile = [];
for (const f of all) {
  const r = fs.readFileSync(f, 'utf8');
  const s = runs(r);
  perFile.push({ ref: path.relative(CONTENT, f).split(path.sep).join('/'), s });
  for (const x of s) freq.set(x, (freq.get(x) || 0) + 1);
}
const boiler = new Set(); for (const [x, c] of freq) if (c >= 4) boiler.add(x);

const mine = runs(NEW);
const clashes = [];
for (const { ref, s } of perFile) {
  const hit = [];
  for (const x of mine) if (s.has(x) && !boiler.has(x)) hit.push(x);
  if (hit.length) clashes.push({ ref, hit });
}
clashes.sort((a, b) => b.hit.length - a.hit.length);

console.log('');
console.log('   DOHRA MATAN — ' + all.length + ' doosre safhon se muqabla');
console.log('   ' + '-'.repeat(76));
if (!clashes.length) console.log('      Saaf. Koi das-lafzi tukra kisi doosre safhe par nahi.');
else {
  for (const c of clashes) {
    console.log('      ' + String(c.hit.length).padStart(3) + '  ' + c.ref);
    for (const x of c.hit) console.log('              "' + x + '"');
  }
}

console.log('');
console.log('-'.repeat(80));

if (clashes.length || misses.length) {
  console.log('XX  Likha nahi gaya. Ooper ki list mujhe bhej dein, badal dunga.');
  process.exit(1);
}

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/deepen-biafo.mjs --write');
  process.exit(0);
}

/* ---- likhna ---- */

for (const d of itin) {
  const o = DAYS[String(Number(d.day))];
  if (!o) continue;
  d.description = o.d.replace(/\s*\n\s*/g, ' ').trim();
  if (o.alt) d.altitude = o.alt;
}

const dumpItin = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
while (dumpItin.length && dumpItin[dumpItin.length - 1] === '') dumpItin.pop();
lines = [...lines.slice(0, atItin.start), ...dumpItin, ...lines.slice(atItin.end)];

/* highlights */
const atH = findKey('highlights');
const dumpH = yaml.dump({ highlights: HIGHLIGHTS }, { lineWidth: -1, noRefs: true }).split('\n');
while (dumpH.length && dumpH[dumpH.length - 1] === '') dumpH.pop();
if (atH) {
  console.log('   highlights ka khaana mila: line ' + (atH.start + 1) + '  "' + lines[atH.start].trim() + '"  -> badla ja raha hai');
  lines = [...lines.slice(0, atH.start), ...dumpH, ...lines.slice(atH.end)];
} else {
  console.log('   highlights ka khaana mojood nahi — itinerary se pehle naya daala ja raha hai');
  const at2 = findKey('itinerary');
  lines = [...lines.slice(0, at2.start), ...dumpH, ...lines.slice(at2.start)];
}

/* do highlights na ban jayein — likhne se pehle ginti */
const nH = lines.filter((l) => /^highlights:/.test(l)).length;
if (nH !== 1) {
  console.log('XX  front matter mein ' + nH + ' baar "highlights:" hai — kuch nahi likha.');
  process.exit(1);
}

let text = lines.join(eol);
const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

let ok = false;
try {
  const v = yaml.load(fm[1]);
  ok = Array.isArray(v.itinerary) && v.itinerary.length === itin.length &&
       Array.isArray(v.highlights) && v.highlights.length === HIGHLIGHTS.length;
} catch (e) { console.log('XX  naya YAML: ' + e.message); }
if (!ok) { console.log('XX  jaanch nakaam — kuch nahi likha.'); process.exit(1); }

text = text.slice(0, fm[0].length) + '\n' + BODY + '\n';

if (!fs.existsSync(FILE + '.bakbiafo')) fs.copyFileSync(FILE, FILE + '.bakbiafo');
fs.writeFileSync(FILE, text, 'utf8');

console.log('LIKHA: src/content/trekking/biafo-hisper-trek.md');
console.log('   backup: biafo-hisper-trek.md.bakbiafo');
console.log('');
console.log('Agla qadam:  npm run build');
console.log('Phir:        node tools/count-words.mjs');
