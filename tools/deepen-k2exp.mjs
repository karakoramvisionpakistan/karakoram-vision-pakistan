#!/usr/bin/env node
/**
 * deepen-k2exp.mjs   (website ke folder mein)
 *
 * K2 Expedition — safhe ka matan 337 se taqreeban 1,700 alfaaz.
 *
 * Din ke bayaan NAHI chhuye ja rahe. Woh pehle se tafseeli hain (825
 * alfaaz) aur audit ke mutabiq kisi doosre safhe se nahi takra rahe.
 *
 * Is safhe ki apni cheez CHARHAI hai, pahar ki kahani nahi — woh K2 Base
 * Camp Trek ke safhe par 10,777 alfaaz mein hai. Is liye yahan Abruzzi
 * Spur hissa ba hissa hai: House's Chimney, Black Pyramid, Shoulder,
 * Bottleneck.
 *
 * AAP KE OPERATIONAL FACTS LAFZ BA LAFZ RAKHE HAIN — permit, liaison
 * officer, base camp ka saman, aur woh cheezein jo alag quote hoti hain.
 * Script khud jaanchta hai.
 *
 * HATAYA JA RAHA HAI:
 *   - "The giant Pyramid Peak towers in isolation 12,000 feet..." wala
 *     paragraph. Woh purani guidebook ki zubaan hai, kisi ne likha nahi.
 *   - Us mein 1934 ka saal hai. K2 ki maloom koshishein 1902, 1909, 1938,
 *     1939 aur 1953 hain. 1934 Nanga Parbat ka saal hai.
 *
 *   node tools/deepen-k2exp.mjs            -> sirf dikhana
 *   node tools/deepen-k2exp.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CONTENT = path.join(ROOT, 'src', 'content');
const FILE = path.join(CONTENT, 'expeditions', 'k2-expediiton.md');

const H = (t) => '<h2><strong>' + t + '</strong></h2>';
const P = (t) => '<p>' + t + '</p>';
const UL = (a) => '<ul>' + a.map((i) => '<li><p>' + i + '</p></li>').join('') + '</ul>';
const BCLINK = '<a href="/trekking/k2-base-camp-trek/">K2 base camp trek page</a>';
const BPLINK = '<a href="/expeditions/broad-peak-expedition/">Broad Peak</a>';

const BODY = [

H('About this journey'),
P('K2 needs no introduction to climbers. It rises to 8,611 metres, second only to Everest, and is widely held to be the most difficult of the fourteen peaks above eight thousand metres &mdash; steep from the glacier upward, badly exposed to weather arriving off the west, and offering summit chances that are sometimes counted in hours.'),
P('<strong>What this programme is.</strong> Sixty days, Islamabad to Islamabad. Travel and preparation at the start, the seven-day Baltoro trek to base camp, then forty-two days at or above base camp for rotations and whatever window the season produces, and finally the walk and drive out. The schedule is built for the weather that actually occurs on the Baltoro, not the weather anyone hopes for.'),
P('<strong>Who it is for.</strong> Experienced high-altitude climbers: previous eight-thousand-metre experience, or at minimum a successful 7,000-metre peak with proper rotations above six thousand. We ask about your record before confirming a place, and we say so plainly if we think this mountain is ahead of it.'),

H('The Abruzzi Spur, section by section'),
P('Almost every ascent of K2 uses the Abruzzi Spur, the south-east ridge reconnoitred by the Duke of the Abruzzi in 1909 and climbed by the Italians in 1954. It is worth knowing what the route actually consists of, because the summary &mdash; four camps and a summit day &mdash; conceals where the work and the danger sit.'),
P('<strong>Base camp to Camp 1 (around 6,000 m).</strong> The spur begins straight out of the glacier with no gentle lower section. Mixed ground, loose rock, and a long day of steep ground on fixed rope. There is stonefall here in the afternoon and parties aim to be off it before the sun is on the face.'),
P('<strong>Camp 1 to Camp 2 (around 6,700 m), via House&rsquo;s Chimney.</strong> The chimney is a rock pitch of some thirty metres, found in 1938 by Bill House, and it is the gateway to the upper mountain. It is fixed every season and climbed with jumars, and every load that reaches the high camps goes through it. Camp 2 sits in a cramped position above.'),
P('<strong>Camp 2 to Camp 3 (around 7,400 m), through the Black Pyramid.</strong> This is the hardest sustained climbing on the route: five or six hundred metres of steep rock and mixed ground at around seven thousand metres, technical enough that it would be a serious alpine route at sea level. Most climbers describe it as the section that decides whether K2 suits them.'),
P('<strong>Camp 3 to Camp 4, the Shoulder (around 8,000 m).</strong> Above the Black Pyramid the angle eases onto snow slopes and then the Shoulder, a broad snow plateau where the last camp goes. This is already higher than all but a handful of mountains on earth, and the Shoulder is a very exposed place to sit out a change in the weather.'),

H('The Bottleneck'),
P('Everything about K2 concentrates at one point about four hundred metres below the summit, and it deserves its own description.'),
P('The Bottleneck is a steep couloir at roughly 8,200 metres, and directly above it hangs a band of serac &mdash; a wall of glacial ice, hundreds of metres across, that calves without warning and cannot be predicted, avoided or negotiated with. The route climbs the couloir and then traverses left beneath that ice to reach the summit snowfields.'),
P('There is no alternative line. There is no way to climb K2 by the Abruzzi without spending time underneath the serac, twice, at the end of a summit day that has already taken ten or twelve hours. The only variables a team controls are how fast it moves and what time it is when it gets there.'),
P('In August 2008, eleven climbers died on K2 over roughly twenty-four hours. The sequence began when serac collapse swept away fixed rope in the Bottleneck, stranding descending climbers above it in the dark. It is the worst single accident in the mountain&rsquo;s history and it happened in that one place.'),
P('We set this out plainly because the Bottleneck is not a risk that fitness, acclimatisation or logistics address. It is addressed by a disciplined turnaround time, and by a team that will honour one.'),

H('The Cesen route'),
P('The other line in regular use is the <strong>Cesen</strong> &mdash; also called the Basque route &mdash; on the south-south-east spur, which joins the Abruzzi at the Shoulder.'),
P('It avoids House&rsquo;s Chimney and the Black Pyramid and is generally considered safer from stonefall, at the cost of sustained steep snow and ice lower down and a base camp position slightly further along the glacier. Teams choose between the two on the season&rsquo;s conditions, and in some years the rope-fixing effort goes up one rather than the other. Both finish through the Bottleneck.'),
P('Tell us at the planning stage which line your team intends, because it affects where base camp sits and how the loads are organised.'),

H('Why K2 gives fewer chances than any other eight-thousander'),
P('Expeditions to Everest or Cho Oyu plan around a reasonably reliable pattern of late-season windows. K2 offers nothing comparable, and it is the single most important thing to understand about committing sixty days to it.'),
P('The mountain stands further north than the Nepalese eight-thousanders and gets its weather from the west with very little standing in front of it. Systems arrive quickly. Summit windows in a given season may amount to two or three days in total, sometimes fewer, and in some years none at all: there are seasons in which every expedition on the mountain went home without a summit despite everything being done correctly.'),
P('This is why the programme is sixty days rather than forty-five. The extra fortnight is not comfort. It is the difference between being on the mountain when a window opens and reading about it afterwards.'),

H('Oxygen, high-altitude support and rope fixing'),
P('Three things are decided by each team rather than by us, and they are the three that most affect what a K2 attempt costs.'),
UL([
'<strong>Supplementary oxygen.</strong> Most commercial ascents use it from Camp 3 or Camp 4 upward; a minority climb without. Bottle count, masks and regulators are quoted separately once your plan is settled.',
'<strong>High-altitude porters.</strong> Pakistani high-altitude workers carry loads and fix rope above base camp and are hired per expedition, not bundled into a package. The best of them are from the Shigar and Hushe valleys and are booked early in the season.',
'<strong>Rope fixing.</strong> The Abruzzi is fixed each season, usually by a cooperative effort between the expeditions in residence, with cost and labour shared. Where your team sits in that arrangement is agreed at base camp, and we handle the coordination.',
]),
P('<strong>What we provide.</strong> Climbing permit and the invitation letter for the Pakistan mountaineering visa, liaison officer, transport and hotels in Islamabad and Skardu, porters to base camp, and a full base camp with kitchen, dining tent, shower tent and generator. Oxygen, climbing gear, high-altitude porters above base camp and helicopter rescue arrangements are quoted separately so each team pays only for what it uses.'),

H('The approach'),
P('The seven-day walk from Askole to base camp is the standard Baltoro route &mdash; Jhola, Paiju, Urdukas, Goro, Concordia, and then north up the Godwin-Austen glacier. It is described stage by stage in the itinerary below.'),
P('Anyone wanting the ground in advance will find it set out at length on our ' + BCLINK + ' &mdash; the glacier surface, each camp, and what the days actually demand. Expedition members read it more often than trekkers do, because seven days of moraine with sixty days of loads moving behind you is not the same undertaking as a trekking holiday.'),
P('Base camp sits at about 5,150 metres on the Godwin-Austen, with the Gilkey Memorial on the rock above the tents. Your team will live there for six weeks.'),

H('Combining with Broad Peak'),
P('Both mountains are reached from the same stretch of the Godwin-Austen, a few hours&rsquo; walk between them, and putting the pair into a single season is common practice here.'),
P('A climber who has already stood on ' + BPLINK + ' comes to a K2 window with acclimatisation that rotations on K2 alone rarely produce, and the extra cost is largely the second royalty rather than a whole second expedition. Either order can be made to work. Say so while we are still planning, because the paperwork, the officer assigned to the party and the stores laid in at base camp all have to account for two objectives from the start.'),

H('Facts and figures'),
UL([
'<strong>Summit</strong> &mdash; 8,611 m, second only to Everest',
'<strong>Base camp</strong> &mdash; about 5,150 m on the Godwin-Austen glacier, below the Gilkey Memorial',
'<strong>Abruzzi Spur</strong> &mdash; camps at roughly 6,000 m, 6,700 m, 7,400 m and 8,000 m',
'<strong>House&rsquo;s Chimney</strong> &mdash; about 6,600 m, the rock pitch every load passes through',
'<strong>The Black Pyramid</strong> &mdash; roughly 6,700 to 7,100 m; the hardest sustained climbing on the route',
'<strong>The Bottleneck</strong> &mdash; about 8,200 m, under the hanging serac',
'<strong>Cesen (Basque) route</strong> &mdash; the alternative line, joining the Abruzzi at the Shoulder',
'<strong>Time on the mountain</strong> &mdash; forty-two days at or above base camp, inside a sixty-day programme',
]),

H('Planning notes'),
P('This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.'),

H('Responsible travel'),
P('Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.'),
P('Seventy years of expeditions have left a visible mark on the Godwin-Austen, and base camp rubbish is now a genuine problem rather than a talking point. Our teams take out everything they take in, the unburnable and unburiable included, and we hold every climber on the permit to that standard.'),

].join('');

/* Aap ke operational facts — lafz ba lafz rehna chahiyein */
const KEEP = [
  'K2 needs no introduction to climbers.',
  'Climbing permit and the invitation letter for the Pakistan mountaineering visa, liaison officer, transport and hotels in Islamabad and Skardu, porters to base camp, and a full base camp with kitchen, dining tent, shower tent and generator.',
  'Oxygen, climbing gear, high-altitude porters above base camp and helicopter rescue arrangements are quoted separately so each team pays only for what it uses.',
  'The schedule is built for the weather that actually occurs on the Baltoro, not the weather anyone hopes for.',
  'This is a starter itinerary rather than a binding quotation.',
  'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules.',
];

/* Yeh safhe se nikal jana chahiye */
const GONE = [
  'The giant Pyramid Peak towers in isolation',
  'Attempts in 1902, 1909, 1934, 1938, 1939 and 1953',
  'The sheer icy summit is flanked by six equally steep ridges',
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

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc); else if (e.name.endsWith('.md')) acc.push(f);
  }
  return acc;
};

const STRIP = [...KEEP,
  'Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.',
  'The operating plan prioritizes realistic travel times and local services.',
];
const strip = (t) => { let s = t; for (const b of STRIP) s = s.split(b).join(' '); return s; };

/* ===================== kaam ========================================== */

const raw = (() => { try { return fs.readFileSync(FILE, 'utf8'); } catch { return null; } })();
if (!raw) { console.log('XX  k2-expediiton.md nahi mili.'); process.exit(1); }

const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
if (!fm) { console.log('XX  front matter nahi parhi gayi.'); process.exit(1); }

const bodyOld = raw.slice(fm[0].length);
let itin = [];
try { itin = yaml.load(fm[1]).itinerary || []; } catch { /* chalne do */ }

console.log('\nK2 EXPEDITION — SAFHE KA MATAN');
console.log('='.repeat(80));
console.log('   matan:      ' + String(words(bodyOld)).padStart(5) + '  ->  ' + words(BODY));
console.log('   itinerary:  ' + String(itin.reduce((n, d) => n + words(d.description), 0)).padStart(5) + '  ->  wahi (nahi chhua)');
console.log('   KUL:        ' + String(words(bodyOld) + itin.reduce((n, d) => n + words(d.description), 0)).padStart(5) +
            '  ->  ' + (words(BODY) + itin.reduce((n, d) => n + words(d.description), 0)));
console.log('');
console.log('   Sections:');
for (const m of BODY.matchAll(/<h2><strong>([^<]+)<\/strong><\/h2>/g)) console.log('      ' + m[1]);

let problems = 0;

console.log('');
console.log('   AAP KE JUMLE JO RAKHE GAYE:');
for (const k of KEEP) {
  const ok = BODY.includes(k);
  if (!ok) problems++;
  console.log('      ' + (ok ? 'OK ' : 'XX ') + k.slice(0, 60) + (k.length > 60 ? '...' : ''));
}

console.log('');
console.log('   JO HAT RAHA HAI:');
for (const g of GONE) {
  const wasThere = bodyOld.includes(g);
  const stillThere = BODY.includes(g);
  if (stillThere) problems++;
  console.log('      ' + (stillThere ? 'XX bacha hai: ' : (wasThere ? 'OK hat gaya: ' : '-- pehle bhi nahi tha: ')) + '"' + g.slice(0, 54) + '..."');
}

/* andar ke link */
console.log('');
console.log('   ANDAR KE LINK:');
for (const m of BODY.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)) {
  const target = path.join(ROOT, '_site', m[1].replace(/^\/|\/$/g, ''), 'index.html');
  console.log('      ' + (fs.existsSync(target) ? 'OK ' : '?? ') + m[1] + '   "' + m[2] + '"');
}

/* dohra matan */
console.log('');
console.log('   DOHRA MATAN KI JAANCH');
console.log('   ' + '-'.repeat(74));
const others = walk(CONTENT).filter((f) => path.resolve(f) !== path.resolve(FILE));
const freq = new Map(); const sets = [];
for (const f of others) {
  const s = runs(fs.readFileSync(f, 'utf8'));
  sets.push({ ref: path.relative(CONTENT, f).split(path.sep).join('/'), s });
  for (const x of s) freq.set(x, (freq.get(x) || 0) + 1);
}
const boiler = new Set(); for (const [x, c] of freq) if (c >= 4) boiler.add(x);
console.log('      ' + others.length + ' doosre safhe parhe, ' + boiler.size + ' boilerplate tukre chhore gaye.');

/* naya matan + is safhe ke apne din (woh nahi badal rahe, magar matan unse na takraye) */
const mine = runs(strip(BODY));
const ownDays = runs(itin.map((d) => String(d.description || '')).join(' \n '));
const hits = [];
for (const { ref, s } of sets) {
  const h = []; for (const x of mine) if (s.has(x) && !boiler.has(x)) h.push(x);
  if (h.length) hits.push({ ref, h });
}
{
  const h = []; for (const x of mine) if (ownDays.has(x) && !boiler.has(x)) h.push(x);
  if (h.length) hits.push({ ref: '(isi safhe ke din)', h });
}
hits.sort((a, b) => b.h.length - a.h.length);
if (!hits.length) console.log('      OK — saaf');
else {
  for (const x of hits) {
    console.log('      XX  ' + String(x.h.length).padStart(3) + '  ' + x.ref);
    for (const r of x.h) console.log('                  "' + r + '"');
    problems += x.h.length;
  }
}

console.log('');
console.log('='.repeat(80));
if (problems) {
  console.log('XX XX XX  ' + problems + ' masle — KUCH NAHI LIKHA.');
  console.log('   Ooper ki list mujhe bhej dein, badal dunga.');
  process.exit(1);
}
console.log('   Sab saaf.');
console.log('');
console.log('   NOTE: din ke bayaan nahi chhuye. Woh pehle se tafseeli hain aur');
console.log('         audit ke mutabiq kisi doosre safhe se nahi takra rahe.');
console.log('');

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/deepen-k2exp.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bakk2exp')) fs.copyFileSync(FILE, FILE + '.bakk2exp');
fs.writeFileSync(FILE, raw.slice(0, fm[0].length) + '\n' + BODY + '\n', 'utf8');

console.log('LIKHA: src/content/expeditions/k2-expediiton.md');
console.log('   backup: k2-expediiton.md.bakk2exp');
console.log('');
console.log('Agla qadam:  npm run build');
console.log('Phir:        node tools/count-words.mjs  aur  node tools/audit-content.mjs');
