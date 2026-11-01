#!/usr/bin/env node
/**
 * fix-faq-skardu-vehicles.mjs   (website ke folder mein)
 *
 * Teen kaam. SAB KUCH YA KUCH BHI NAHI.
 *
 *  1. FAQ BANK — client ki do durustiyan:
 *       - permits ka jawab (aur sawal ka unwan)
 *       - visa ka jawab
 *     Script khud dhoondta hai ke yeh FAQ kis file mein hain — src ke
 *     andar har file mein. Na mile to kuch nahi likhta aur bata deta hai.
 *
 *  2. SKARDU KA JORA — blog aur destination safhe mein 15 dohre tukre.
 *     Blog ka "Getting there" hissa naya likha hai: ab woh raasta nahi
 *     batata (woh destination safhe ka kaam hai) balki yeh batata hai ke
 *     flight ki na-qabil-e-aitbaari mahine ke intikhab par kya asar
 *     daalti hai — jo us safhe ka asal mauzu hai.
 *
 *  3. TEEN VEHICLES KE SAFHE — 209, 215 aur 221 alfaaz, aur un mein 12
 *     se 15 tukre share ho rahe thay. Yani teen safhe, ek hi template.
 *     Teenon ka matan naya aur alag: Coaster bare group ka hisaab, Hiace
 *     khandan aur chhote group, Prado woh raaste jahan van nahi jati.
 *
 *   node tools/fix-faq-skardu-vehicles.mjs            -> sirf dikhana
 *   node tools/fix-faq-skardu-vehicles.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const CONTENT = path.join(SRC, 'content');
const WRITE = process.argv.includes('--write');

/* ==================================================================== */
/* 1. FAQ BANK                                                          */
/* ==================================================================== */

/* Bank ki file ab maloom hai. Pehle poore src mein dhoondta tha, aur us se
   do nuqsan huey: .bak backup files bhi badal raha tha, aur Gasherbrum II
   ke apne safhe ka alag sawal bhi pakar liya tha. */
const FAQ_FILE = 'src/_data/faqBank.json';

const FAQ_FIXES = [
  {
    name: 'permits — sawal ka unwan',
    find: 'What permits are needed?',
    to: 'What permits are required for trekking and climbing in Gilgit-Baltistan?',
  },
  {
    name: 'permits — jawab',
    find: 'A trekking permit for the Central Karakoram National Park is issued free, and a park fee is paid per trekker; the rate is set each year by the Gilgit-Baltistan tourism department. Restricted zones need their own permit. Peaks above 6,500m need a climbing permit from the Alpine Club of Pakistan, applied for about three months ahead, and the royalty differs from peak to peak. For our expeditions the royalty is included in the price. We handle the paperwork, the registration in Skardu and the roadhead arrangements.',
    to: 'For trekking and mountaineering in restricted areas of Gilgit-Baltistan, visitors are required to obtain the relevant permits and pay the applicable fees. A trekking permit is required for trekking up to 6,500 metres in restricted areas; it is issued by the Gilgit-Baltistan Tourism Department, and the applicable trekking fees must be paid. Visitors entering the Central Karakoram National Park are required to pay the applicable CKNP fee, which is deposited with the Central Karakoram National Park authorities. For climbing peaks above 6,500 metres a climbing permit is required, issued through the relevant government authorities, and the applicable peak royalty fees must also be paid. For our expeditions the royalty is included in the price. We handle the applications, the registration in Skardu and the roadhead arrangements.',
  },
  {
    name: 'visa — jawab',
    find: 'Most nationalities apply online through the official e-visa portal. A tourist application normally needs an invitation letter and tour confirmation from a licensed Pakistani operator, which we issue once your booking is confirmed. Apply four to six weeks ahead; the online process is often quicker, but flights and permits are easier to arrange with the visa already in hand.',
    to: 'Yes. Pakistan issues separate visa categories: a Tourist Visa for tourists, a Trekking Visa for trekkers and a Mountaineering Visa for climbers, and you should apply under the category that matches your trip. Most nationalities apply online through the official e-visa portal. An application normally needs an invitation letter and tour confirmation from a licensed Pakistani operator, which we issue once your booking is confirmed. Apply four to six weeks ahead.',
  },
];

/* ==================================================================== */
/* 2. SKARDU — blog ka "Getting there" hissa                            */
/* ==================================================================== */

const SKARDU_BLOG = 'blog/best-time-to-visit-skardu.md';
const SKARDU_FIXES = [
  {
    name: 'flight aur road ka jumla',
    find: 'Skardu is reached by air from Islamabad in under an hour, or by road in roughly eighteen to twenty-four hours along the Karakoram Highway and the Indus valley. The flight is spectacular but weather-dependent and cancellations happen in any season, most often in winter and during cloudy spells.',
    to: 'Skardu is an hour from Islamabad by air and the better part of two days from it by road. The flight is the quick option and also the unreliable one: it is flown on sight between the ranges rather than on instruments, so it is cancelled in every month of the year, and most often in winter and through cloudy spells.',
  },
  {
    name: 'road contingency wala jumla',
    find: 'For that reason we plan every itinerary with a road contingency, and we recommend keeping a spare day at the end of a trip before any international connection. If your dates are tight, the road journey in one direction and the flight in the other is often the most reliable combination.',
    to: 'This is why the month you pick matters more here than it would in most places. A cancellation in February can cost three days; the same cancellation in September usually costs one. Whatever season you travel in, leave a clear day in Islamabad before any international connection, and if your dates are tight, plan the road one way and the aircraft the other.',
  },
];

/* ==================================================================== */
/* 3. TEEN VEHICLES                                                     */
/* ==================================================================== */

const H = (t) => '<h2><strong>' + t + '</strong></h2>';
const P = (t) => '<p>' + t + '</p>';
const UL = (a) => '<ul>' + a.map((i) => '<li><p>' + i + '</p></li>').join('') + '</ul>';
const A = (h, t) => '<a href="' + h + '">' + t + '</a>';

const V_HIACE = '/vehicles/toyota-hiace-van/';
const V_PRADO = '/vehicles/toyota-prado-4x4/';
const V_COAST = '/vehicles/coaster-group-transport/';

const COASTER_BODY = [
H('When a Coaster is the right vehicle'),
P('There is a point at which splitting a party across three or four cars stops making sense. Convoys separate on long days, the group eats in shifts, nobody hears the same thing from the guide, and the cost of four drivers exceeds the cost of one bus. A Coaster solves all of that in a single decision.'),
P('It seats a full tour group, a university party, a corporate team or an extended family travelling together, typically in the twenty-plus range depending on the vehicle and how much luggage is going with it. On the long highway days between Islamabad, Gilgit, Hunza and Skardu it is usually both the cheaper option and the more sociable one.'),

H('Where it goes, and where it stops'),
P('A Coaster is a highway vehicle. It is comfortable on the Karakoram Highway and on the sealed valley roads, and it is the wrong vehicle the moment the tarmac ends.'),
P('Deosai, Basho, Hushe, the Askole track and most of the high side valleys cannot take a bus of this size &mdash; not because of the driver but because of the turning circle, the overhangs and the river crossings. For those days we move the group into jeeps and bring the Coaster round to meet them, and the whole arrangement sits inside one booking and one quotation rather than two.'),

H('The driver'),
P('Every Coaster comes with its driver. These are men who have run the Karakoram Highway for years and who know where the road habitually slides, where the fuel is, and how long a section really takes as opposed to how long the map suggests. Self-drive hire is not offered, and we would not recommend it on these roads to anyone who has not driven them before.'),
P('Driver duty hours are real and we plan around them. A fourteen-hour day with a tired man at the wheel on the Indus gorge road is not a saving.'),

H('Booking and cost'),
P('Hired by the day or for a complete itinerary. Fuel, the driver allowance, tolls and any night the vehicle spends away from base are set out in the written quotation before you commit, so there is nothing to negotiate at a roadside.'),
P('Large vehicles are the first thing to go in the summer season &mdash; July and August are booked out well in advance by domestic groups &mdash; so send us your dates as early as you can fix them.'),
P('Availability, driver duty hours, luggage space, fuel, road permissions and overnight charges are confirmed in the written transport quotation.'),

H('Related'),
UL([
A(V_HIACE, 'Toyota Hiace van') + ' &mdash; for eight to twelve people on the same roads',
A(V_PRADO, 'Toyota Prado 4x4') + ' &mdash; for the valleys a Coaster cannot enter',
A('/plan-a-trip/', 'Plan a group trip') + ' &mdash; tell us the numbers and we will work out the combination',
]),
].join('');

const HIACE_BODY = [
H('The default vehicle for families and small groups'),
P('Most of our guests travel in a Hiace, and for a group of eight to twelve it is almost always the right answer. It seats the party together with room behind for suitcases, camera bags and trekking duffles, which a car cannot do and a Coaster does at a cost nobody needs to pay.'),
P('On the long highway stretches &mdash; Islamabad to Gilgit, Gilgit to Hunza, the Skardu road &mdash; it is comfortable enough for a ten-hour day, and small enough to stop where a bus could not: a viewpoint, a roadside tea shop, a bridge somebody wants to photograph.'),

H('Airport transfers and short hops'),
P('A Hiace is also what meets most arrivals. Islamabad airport to a city hotel at three in the morning, Skardu airport to the hotel on a flight day, a half-day around the Hunza forts &mdash; these are hired by the transfer or by the day rather than as part of a full itinerary, and they are quoted the same way.'),

H('Luggage, and being honest about it'),
P('The seat count and the luggage count are not the same number. Twelve people with twelve trekking duffles and twelve daypacks do not fit in one Hiace, whatever the brochure seating says, and a vehicle packed to the roof is uncomfortable for a ten-hour day.'),
P('Tell us the group size <em>and</em> what each person is carrying. For expedition teams with heavy kit we add a cargo jeep or a second vehicle and quote the pair together. It is better to find this out at the quotation stage than in a hotel car park at six in the morning.'),

H('Where it does not go'),
P('Sealed roads and main valley routes, yes. Deosai, Basho, Hushe and the rough tracks, no. For those sections the group transfers into jeeps and we arrange it inside the same booking, so you are not making two arrangements with two suppliers.'),

H('Driver and quotation'),
P('A driver who knows the highway and the mountain sections comes with the vehicle; self-drive hire is not offered. Seat count, luggage capacity, driver hours, fuel, tolls and any overnight allowance are set out in writing before anything is confirmed.'),

H('Related'),
UL([
A(V_PRADO, 'Toyota Prado 4x4') + ' &mdash; four to five people and the rough valleys',
A(V_COAST, 'Coaster') + ' &mdash; for parties too large for a van',
A('/tours/gilgit-baltistan-grand-circuit/', 'Gilgit-Baltistan grand circuit') + ' &mdash; a long road itinerary this vehicle suits',
]),
].join('');

const PRADO_BODY = [
H('The vehicle we use most in the mountains'),
P('If a journey involves leaving the tarmac, it involves a Prado. It takes the Karakoram Highway at highway speed and then keeps going where the surface stops being a road at all &mdash; the Deosai tracks, Shigar and Basho, the Hushe road, the Astore side &mdash; carrying four or five people and their luggage in reasonable comfort.'),
P('That combination is rarer than it sounds. A saloon car manages the highway and nothing beyond it; a jeep manages the tracks and punishes you on the highway. The Prado does both, which is why most of our private itineraries are built around one.'),

H('Where the road stops being a road'),
P('It is worth being specific about what these valleys actually involve, because &ldquo;4x4 required&rdquo; covers a wide range of things.'),
UL([
'<strong>Loose surfaces cut into cliffs</strong> &mdash; single track in places, with a long drop and no barrier. The Braldu road to Askole is the extreme example.',
'<strong>Unbridged stream crossings</strong> &mdash; passable in the morning and running much higher by afternoon as the glaciers melt. Timing matters more than ground clearance.',
'<strong>Snow and mud on the high plateaus</strong> &mdash; Deosai in early and late season, where the question is not whether the vehicle can do it but whether the track is open at all.',
]),

H('Why we do not offer self-drive'),
P('We say this plainly because we are asked regularly. We do not hire these vehicles out without a driver in these valleys, and no visiting driver should attempt the high roads alone on a first trip.'),
P('It is not a question of skill at the wheel. It is local knowledge: which crossing is safe at which hour, which section slides after rain, where the road has moved since last season, and who to call when something goes wrong a hundred kilometres from the nearest workshop. Our drivers are from these valleys and have driven them for years.'),

H('How it is hired'),
P('By the day, for a single transfer such as Skardu airport, or for a full itinerary running several weeks. Fuel, the driver allowance and tolls are set out in the written quote, so nothing is settled at the roadside.'),
P('For larger parties we mix vehicles &mdash; a van or a Coaster on the main highway and jeeps for the rough sections &mdash; so that nobody is paying for a 4x4 on days that do not need one. What the hire includes, including driver hours, fuel, tolls, road permissions and any night away from base, is stated in the written quotation.'),

H('Related'),
UL([
A(V_HIACE, 'Toyota Hiace van') + ' &mdash; when the party is larger and the surface stays sealed',
A('/jeep-safaris/deosai-jeep-safari/', 'Deosai jeep safari') + ' &mdash; a trip built on exactly this ground',
A('/destinations/skardu/', 'Skardu travel guide') + ' &mdash; where most of these journeys begin',
]),
].join('');

const VEHICLES = [
  { ref: 'vehicles/coaster-group-transport.md', name: 'Coaster',         body: COASTER_BODY },
  { ref: 'vehicles/toyota-hiace-van.md',        name: 'Toyota Hiace',    body: HIACE_BODY },
  { ref: 'vehicles/toyota-prado-4x4.md',        name: 'Toyota Prado',    body: PRADO_BODY },
];

/* ===================== auzaar ======================================== */

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

const walkAll = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkAll(f, acc); else acc.push(f);
  }
  return acc;
};

const walkMd = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(f, acc); else if (e.name.endsWith('.md')) acc.push(f);
  }
  return acc;
};

const problems = [];
const result = {};          /* absolute path -> naya matan */

console.log('\nFAQ + SKARDU + VEHICLES');
console.log('='.repeat(82));
console.log('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

/* ---------- 1. FAQ ---------- */

console.log('1. FAQ BANK — CLIENT KI DURUSTIYAN');
console.log('-'.repeat(82));

{
  const f = path.join(ROOT, ...FAQ_FILE.split('/'));
  if (!fs.existsSync(f)) { console.log('   XX  ' + FAQ_FILE + ' nahi mili.'); problems.push('faqBank nahi mili'); }
  else {
    console.log('   file: ' + FAQ_FILE);
    let cur = fs.readFileSync(f, 'utf8');
    let ok = true;
    for (const fix of FAQ_FIXES) {
      const n = cur.split(fix.find).length - 1;
      if (n === 0) {
        console.log('   XX  "' + fix.name + '" is file mein nahi mila.');
        console.log('       dhoonda gaya: "' + fix.find.slice(0, 64) + '..."');
        problems.push('FAQ: ' + fix.name + ' nahi mila'); ok = false; continue;
      }
      if (n > 1) {
        console.log('   XX  "' + fix.name + '" ' + n + ' baar mila — ek hi baar hona chahiye.');
        problems.push('FAQ: ' + fix.name + ' x' + n); ok = false; continue;
      }
      console.log('   OK  ' + fix.name + '   ' + words(fix.find) + ' alfaaz  ->  ' + words(fix.to));
      cur = cur.split(fix.find).join(fix.to);
    }
    /* JSON abhi bhi parh hoti hai? */
    let n0 = 0, n1 = 0;
    try { n0 = JSON.stringify(JSON.parse(fs.readFileSync(f, 'utf8'))).length; } catch (e) { console.log('   XX  purani JSON hi parh nahi hoti: ' + e.message); ok = false; }
    try { n1 = JSON.stringify(JSON.parse(cur)).length; } catch (e) { console.log('   XX  nayi JSON parh nahi hoti: ' + e.message); problems.push('faqBank JSON'); ok = false; }
    if (ok) { console.log('   JSON theek hai (' + n0 + ' -> ' + n1 + ' harf).'); result[f] = cur; }
  }
}

/* ---------- 2. Skardu ---------- */

console.log('');
console.log('2. SKARDU KA JORA');
console.log('-'.repeat(82));

{
  const f = path.join(CONTENT, ...SKARDU_BLOG.split('/'));
  if (!fs.existsSync(f)) { console.log('   XX  ' + SKARDU_BLOG + ' nahi mili.'); problems.push('skardu: file'); }
  else {
    let cur = result[f] ?? fs.readFileSync(f, 'utf8');
    for (const fix of SKARDU_FIXES) {
      if (!cur.includes(fix.find)) {
        console.log('   XX  "' + fix.name + '" nahi mila.');
        console.log('       dhoonda gaya: "' + fix.find.slice(0, 60) + '..."');
        problems.push('skardu: ' + fix.name);
        continue;
      }
      console.log('   OK  ' + fix.name + '   ' + words(fix.find) + ' alfaaz  ->  ' + words(fix.to));
      cur = cur.split(fix.find).join(fix.to);
    }
    result[f] = cur;
  }
}

/* ---------- 3. vehicles ---------- */

console.log('');
console.log('3. TEEN VEHICLES KE SAFHE');
console.log('-'.repeat(82));

for (const v of VEHICLES) {
  const f = path.join(CONTENT, ...v.ref.split('/'));
  if (!fs.existsSync(f)) { console.log('   XX  ' + v.ref + ' nahi mili.'); problems.push(v.name + ': file'); continue; }
  const raw = result[f] ?? fs.readFileSync(f, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { console.log('   XX  ' + v.ref + ': front matter nahi parhi gayi'); problems.push(v.name + ': fm'); continue; }
  const old = raw.slice(fm[0].length);
  console.log('   ' + v.name.padEnd(16) + String(words(old)).padStart(4) + '  ->  ' + words(v.body) +
              '   sections: ' + [...v.body.matchAll(/<h2>/g)].length);
  result[f] = raw.slice(0, fm[0].length) + '\n' + v.body + '\n';
}

/* ---------- dohra matan ---------- */

console.log('');
console.log('DOHRA MATAN KI JAANCH');
console.log('-'.repeat(82));

const changedMd = new Set(Object.keys(result).filter((f) => f.endsWith('.md')).map((f) => path.resolve(f)));
const others = walkMd(CONTENT).filter((f) => !changedMd.has(path.resolve(f)));
const freq = new Map(); const sets = [];
for (const f of others) {
  const s = runs(fs.readFileSync(f, 'utf8'));
  sets.push({ ref: path.relative(CONTENT, f).split(path.sep).join('/'), s });
  for (const x of s) freq.set(x, (freq.get(x) || 0) + 1);
}
const boiler = new Set(); for (const [x, c] of freq) if (c >= 4) boiler.add(x);
console.log('   ' + others.length + ' doosre safhe parhe, ' + boiler.size + ' boilerplate tukre chhore gaye.');

/* naya matan: teen vehicles + skardu blog ka badla hua matan */
const check = [];
for (const v of VEHICLES) check.push({ name: v.name, text: v.body, own: path.resolve(path.join(CONTENT, ...v.ref.split('/'))) });
check.push({
  name: 'Skardu blog (naye jumle)',
  text: SKARDU_FIXES.map((x) => x.to).join(' \n '),
  own: path.resolve(path.join(CONTENT, ...SKARDU_BLOG.split('/'))),
});

let clashTotal = 0;
for (const { name, text: t, own } of check) {
  const mine = runs(t);
  const hits = [];
  for (const { ref, s } of sets) {
    const h = []; for (const x of mine) if (s.has(x) && !boiler.has(x)) h.push(x);
    if (h.length) hits.push({ ref, h });
  }
  for (const c2 of check) {
    if (c2.name === name) continue;
    const s2 = runs(c2.text); const h = [];
    for (const x of mine) if (s2.has(x) && !boiler.has(x)) h.push(x);
    if (h.length) hits.push({ ref: '(naya) ' + c2.name, h });
  }
  /* Badli hui .md files ke naye matan se bhi — magar APNI file se nahi,
     warna naya matan apne aap se takrata hai. Yahi 115 jhoote tukron ki
     wajah thi. */
  for (const f of changedMd) {
    if (path.resolve(f) === own) continue;
    if (check.some((c) => c.own === path.resolve(f))) continue;
    const refName = path.relative(CONTENT, f).split(path.sep).join('/');
    const s = runs(result[f] ?? fs.readFileSync(f, 'utf8'));
    const h = []; for (const x of mine) if (s.has(x) && !boiler.has(x)) h.push(x);
    if (h.length) hits.push({ ref: '(badla hua) ' + refName, h });
  }
  if (!hits.length) { console.log('   OK  ' + name + ' — saaf'); continue; }
  console.log('   XX  ' + name + ':');
  for (const x of hits) {
    console.log('         ' + String(x.h.length).padStart(3) + '  ' + x.ref);
    for (const r of x.h) console.log('                 "' + r + '"');
    clashTotal += x.h.length;
  }
  problems.push(name + ': ' + hits.reduce((n, x) => n + x.h.length, 0) + ' dohre tukre');
}

/* ---------- faisla ---------- */

console.log('');
console.log('='.repeat(82));
if (problems.length) {
  console.log('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) console.log('          ' + m);
  console.log('');
  console.log('   Yeh list mujhe bhej dein, badal dunga.');
  process.exit(1);
}

console.log('   Sab saaf. Dohre tukre: ' + clashTotal + '   |   files badlengi: ' + Object.keys(result).length);
console.log('');
console.log('   YEH AAP KE FAISLE KI BAATEIN HAIN:');
console.log('      1. Visa ka jawab: client ka jumla (teen categories) rakha hai, aur us ke');
console.log('         saath e-visa portal, invitation letter aur "4-6 hafte" bhi rakhe hain.');
console.log('         Client sirf apna jumla chahta hai to bata dein.');
console.log('      2. Permits ka jawab: "For our expeditions the royalty is included in the');
console.log('         price" RAKHA gaya hai, aap ke kehne par.');
console.log('      3. Sawal ka unwan sentence case mein rakha, baqi 20 sawalon ke mutabiq.');
console.log('');

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/fix-faq-skardu-vehicles.mjs --write');
  process.exit(0);
}

for (const [f, text] of Object.entries(result)) {
  if (!fs.existsSync(f + '.bakfsv')) fs.copyFileSync(f, f + '.bakfsv');
  fs.writeFileSync(f, text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, f).split(path.sep).join('/'));
}
console.log('');
console.log(Object.keys(result).length + ' files likhi gayi. backup: *.bakfsv');
console.log('');
console.log('Agla qadam:  npm run build');
console.log('Phir:        node tools/count-words.mjs  aur  node tools/audit-content.mjs');
