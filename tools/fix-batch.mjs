#!/usr/bin/env node
/**
 * fix-batch.mjs   (website ke folder mein)
 *
 * Teen kaam ek saath. SAB KUCH YA KUCH BHI NAHI.
 *
 *  A. NANGA PARBAT — 758 se taqreeban 2,200 alfaaz. 9 dinon ke bayaan,
 *     safhe ka naya matan, highlights. Fact sheet ke do ghalat aankre bhi
 *     theek: "Days for Climbing: 34" (asal mein 31) aur "Camping Nights:
 *     03" (asal mein 36).
 *
 *  B. DAY 1 KA DOHRA MATAN — "Met at Islamabad airport and transferred to
 *     the hotel..." K2 expedition, Spantik aur Nanga Parbat par taqreeban
 *     ek hi tha. Teenon ke Day 1 alag likhe hain.
 *
 *  C. JEEP SAFARI KI BULANDI — Day 11 par 7,788 m (Rakaposhi ki bulandi)
 *     aur Day 17 par darre ki bulandi hotel ki raat par.
 *
 *  Saath hijje: Arival -> Arrival, Shandoor -> Shandur.
 *
 * KHUD JAANCHTA HAI: naya matan poori website se milaya jata hai. Ek bhi
 * das-lafzi tukra mila to koi file nahi likhti.
 *
 * JAAN KAR NAHI KIYA: jeep-safaris/untitled.md ka naam nahi badla. Woh
 * CMS ka record tor sakta hai, aur URL pehle se theek hai.
 *
 *   node tools/fix-batch.mjs            -> sirf dikhana
 *   node tools/fix-batch.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CONTENT = path.join(ROOT, 'src', 'content');

const H = (t) => '<h2><strong>' + t + '</strong></h2>';
const P = (t) => '<p>' + t + '</p>';
const UL = (a) => '<ul>' + a.map((i) => '<li><p>' + i + '</p></li>').join('') + '</ul>';

/* ==================================================================== */
/* A. NANGA PARBAT                                                      */
/* ==================================================================== */

const NP_DAYS = {
1: `Arrival at Islamabad and transfer to the hotel. Nanga Parbat is the one Pakistani eight-thousander not reached through Skardu, so the paperwork is the same but the road north is entirely different. Permit, royalty and liaison officer are settled in the city, and the team meets properly before leaving.`,

2: `North out of the capital on the Karakoram Highway, over the Hazara ranges and then alongside the Indus where it runs between bare rock walls &mdash; around nine hours to Chilas. The official briefing is held at the tourism office there rather than in Skardu. Somewhere along this stretch the mountain itself becomes visible from the road, which very few eight-thousanders are.`,

3: `A short run up the highway to Bunar, where the track for the Diamir side leaves the Indus. Loads are transferred from vehicle to porter here and the walk-in team is engaged. From this point the expedition is on foot and on its own resources.`,

'04-06': `Three days on foot up the Diamir valley to base camp at 4,200 metres. The route climbs through village terraces and then summer pasture before the valley narrows and turns, and the Diamir face fills the whole head of it. The mountain rises more than four vertical kilometres above the camp in a single uninterrupted sweep. Nowhere else on the Diamir side do you get a sense of the scale this quickly, and most teams spend the first evening at base camp simply looking at it.`,

'07-37': `Thirty-one days on the mountain. The Kinshofer route is the normal line on the Diamir face: fixing the rock band above Camp 1, establishing the higher camps, two or three acclimatisation cycles, and then the wait for the weather that a summit day on this mountain requires. Teams here are experienced and self-sufficient above base camp, and the expedition is run on that basis. Base camp is staffed throughout with a cook, kitchen and communications.`,

'38-39': `Two days to walk out to Bunar and drive down to Chilas, where the expedition is formally debriefed at the tourism office. Everything carried up the Diamir valley comes back down it, waste included. After five weeks at four thousand metres the descent into thick summer air at Chilas is a physical event in its own right.`,

40: `The road south to Islamabad, back along the Indus gorges and over the Hazara hills. Eight to nine hours with stops, and a last view of the mountain from the highway if the haze allows it.`,

41: `The closing briefing at the Ministry of Tourism in Islamabad, where the expedition's paperwork is signed off and the permit surrendered. The rest of the day belongs to you &mdash; a bazaar, a long bath, or nothing whatsoever.`,

42: `Transfer to the airport for your onward flight. Six weeks on the Diamir face lie behind you, on a mountain that killed thirty-one people before anybody stood on top of it. A room can be held for a late departure.`,
};

const NP_BODY = [

H('About this journey'),
P('Nanga Parbat, 8,126 metres, stands alone at the western end of the Himalaya with nothing of comparable height within two hundred kilometres. It is the ninth highest mountain on earth, the westernmost eight-thousander, and the only one in Pakistan that is not approached through Skardu and the Karakoram.'),
P('Forty-two days door to door: the drive north, three days on foot up the Diamir valley, thirty-one days at or above base camp, and the journey home. Most teams climb the Kinshofer route on the Diamir face, and base camp sits at 4,200 metres with the face rising more than four kilometres directly above it.'),
P('It is also the mountain with the worst name in high-altitude climbing, and the name was earned rather than invented.'),

H('The Killer Mountain'),
P('Thirty-one people died on Nanga Parbat before anyone reached its summit. No other eight-thousander has a prelude like it.'),
P('The German expeditions of the 1930s went at it repeatedly and were destroyed by it twice. In 1934 a storm caught the team high on the Rakhiot side and the retreat turned into a week-long disaster in which Willy Merkl, the leader, and several Sherpas and climbers died of exhaustion and exposure strung out along the ridge. In 1937 a single avalanche hit Camp IV in the night and killed sixteen men while they slept &mdash; seven Germans and nine Sherpas, the largest loss of life in a single mountaineering accident up to that point.'),
P('The reputation stuck. German climbing between the wars had invested something close to national prestige in this mountain, and it kept paying for it. By the time a successful expedition arrived in 1953 the phrase <em>Killer Mountain</em> was already attached to it in English, and the Germans had their own: <em>Schicksalsberg</em> &mdash; mountain of destiny.'),
P('Modern Nanga Parbat is a different proposition from the Rakhiot-side attempts of the 1930s, and the Diamir route is better understood than anything the pre-war expeditions had. The mountain remains among the most serious of the fourteen, and the history is worth knowing rather than being sold around.'),

H('Hermann Buhl, 3 July 1953'),
P('The first ascent of Nanga Parbat is one of the most remarkable things anybody has done at altitude, and it was not supposed to happen the way it did.'),
P('The Austro-German expedition had been ordered off the mountain by its leader. Hermann Buhl left the top camp alone at two in the morning, against instructions, and climbed on. He had no supplementary oxygen and no rope partner. He reached the summit at seven in the evening, seventeen hours after setting out, and then found himself too late and too high to get down.'),
P('He spent the night standing on a narrow ledge at around eight thousand metres, holding a rock with one hand, without a tent, a bag or a stove. It was a still night, which is the only reason he survived it. He reached camp the following afternoon &mdash; forty-one hours after leaving &mdash; having aged visibly, and having made the only first ascent of an eight-thousander ever completed solo.'),
P('He lost toes to frostbite. Four years later he died on Chogolisa, above the Baltoro, when a cornice collapsed in poor visibility. If you walk the Baltoro on any of our other programmes, you pass beneath the mountain that killed him.'),

H('The Diamir face and the Kinshofer route'),
P('Nanga Parbat has three enormous faces &mdash; Rakhiot to the north, Rupal to the south, Diamir to the west &mdash; and expeditions today use the Diamir.'),
P('The normal line is the <strong>Kinshofer route</strong>, named for Toni Kinshofer, who found the way through the lower rock band on the second ascent in 1962. That band is the technical crux: steep rock and mixed ground above Camp 1, fixed with rope each season and climbed on every rotation and carry. Above it the route works up snow and ice slopes and a long ramp to the summit plateau, with the summit day itself long, exposed and cold.'),
P('It is harder than the normal routes on Gasherbrum II or Broad Peak and it is not the place to attempt a first eight-thousander. What makes it serious is less any single pitch than the combination: a technical lower section that has to be passed repeatedly, a long upper mountain, and weather that arrives from the west with very little warning because there is nothing standing in front of this mountain to slow it down.'),

H('The Rupal face'),
P('The south side of Nanga Parbat is not climbed on this programme, but it should be mentioned, because it is the reason mountaineers talk about this mountain at all.'),
P('The Rupal face rises roughly 4,600 metres from its base to the summit and is generally described as the highest mountain wall on earth. Reinhold and G&uuml;nther Messner climbed it in 1970, which is still regarded as one of the great ascents of the century &mdash; and the expedition cost G&uuml;nther his life on the descent down the Diamir side, in circumstances that were disputed for the following thirty-five years until his remains emerged from the glacier in 2005.'),
P('If you would like to see the Rupal face rather than climb from Diamir, the Rupal valley is reachable from Astore and we can arrange it as a separate trek.'),

H('Winter, 2016'),
P('Nanga Parbat held out against winter ascent longer than every other eight-thousander except K2, and more than thirty attempts failed on it.'),
P('It finally fell on 26 February 2016 to a party of three: Simone Moro, Alex Txikon and <strong>Muhammad Ali Sadpara</strong>. Ali Sadpara was from Sadpara, the village above Skardu, and he was the first Pakistani to make a winter first ascent of an eight-thousand-metre peak &mdash; on the mountain that overlooks the road to his own home.'),
P('He died on K2 in the winter of 2021, high on the Abruzzi Spur. In Gilgit-Baltistan he is a national figure, and the men who work on these expeditions &mdash; porters, high-altitude workers, guides &mdash; talk about him as one of their own, because he was. We mention him on this page because this is his mountain, and because the Pakistani contribution to Himalayan climbing is routinely written out of the English-language accounts.'),

H('Why this expedition does not go through Skardu'),
P('Every other eight-thousander in Pakistan is approached from Skardu, up the Baltoro or the Gasherbrum glaciers, with a week or more of walking to base camp. Nanga Parbat is not in the Karakoram at all &mdash; it is the western anchor of the Himalaya, on the far side of the Indus.'),
P('That has real advantages for an expedition. The approach is the Karakoram Highway rather than the Skardu flight, which removes the single most unreliable element of any Pakistani expedition&rsquo;s schedule. Base camp is three days on foot from the road instead of seven. And in an emergency the road is days closer than it would be at Concordia.'),
P('It also means the mountain is visible from the highway for a long stretch of the drive, which almost no eight-thousander is, and it means the whole character of the trip is different: a drive, a short walk in, and then five weeks on one very large face.'),

H('Who this expedition is for'),
P('Experienced high-altitude climbers. In practice almost everyone who comes here has already climbed an eight-thousander, and that is the right order to do things in; the Kinshofer route is not a suitable first.'),
P('Our services run to base camp. We provide the climbing permit and liaison officer, the invitation letter for the mountaineering visa, transport along the Karakoram Highway, hotels, porters for the walk in, and a fully staffed base camp with kitchen and dining. High-altitude support above base camp and supplementary oxygen are arranged on request and quoted separately, so each team pays for what it actually uses.'),
P('<strong>Travel and rescue insurance is compulsory and is yours to arrange.</strong> It must extend to helicopter rescue at the altitude of this mountain. Send us the policy number and the insurer&rsquo;s emergency line before you fly; in a serious situation that call is made before anything else moves.'),

H('Season'),
P('<strong>15 May to 1 July.</strong> Nanga Parbat runs earlier than the Karakoram eight-thousanders, which is useful for anyone planning two peaks in a year: a Nanga Parbat expedition in May and June can be followed by a Baltoro permit in July and August.'),
P('The mountain is also lower in latitude and further west than the Karakoram, and the weather behaves accordingly &mdash; warmer and wetter early, with the monsoon&rsquo;s western edge reaching this far in some years and not others.'),

H('Facts and figures'),
UL([
'<strong>Summit</strong> &mdash; 8,126 m; ninth highest mountain on earth; westernmost eight-thousander',
'<strong>Duration</strong> &mdash; 42 days, Islamabad to Islamabad',
'<strong>Days at or above base camp</strong> &mdash; 31',
'<strong>Nights</strong> &mdash; 5 in hotels, 36 under canvas',
'<strong>Base camp</strong> &mdash; 4,200 m, Diamir valley, three days on foot from the road',
'<strong>Normal route</strong> &mdash; Kinshofer, Diamir face',
'<strong>Season</strong> &mdash; 15 May to 1 July',
'<strong>Type</strong> &mdash; unguided; our services run to base camp',
'<strong>Minimum team</strong> &mdash; 4 climbers',
]),

H('Planning notes'),
P('This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.'),

H('Responsible travel'),
P('Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.'),

].join('');

const NP_HIGHLIGHTS = [
  'Ninth highest mountain on earth',
  'Diamir valley approach, three days on foot',
  'Diamir base camp, 4,200 m',
  'Kinshofer route on the Diamir face',
  'Chilas and the Indus gorges',
  'Babusar Top',
];

const NP_KEEP = [
  'This is a starter itinerary rather than a binding quotation.',
  'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules.',
];

/* ==================================================================== */
/* B. DAY 1 — dohra matan khatam                                        */
/* ==================================================================== */

const DAY1 = {
  'expeditions/k2-expediiton.md': {
    day: 1,
    text: `You are met at Islamabad airport and driven to the hotel. Everything that cannot be done once the team leaves the city is done today: the K2 climbing permit and its royalty, the park fee, and the liaison officer who will travel with the expedition. The team then sits down together for the first time, which on a sixty-day expedition matters more than it sounds.`,
  },
  'expeditions/spantik-peak-expedition.md': {
    day: 1,
    text: `Arrival at Islamabad and transfer to the hotel. Spantik is a seven-thousand-metre peak, so it carries a climbing permit and a royalty of its own, and both are completed in the city along with the liaison officer arrangements. The afternoon is free to recover from the flight; the briefing follows in the evening.`,
  },
};

/* ==================================================================== */
/* C. JEEP SAFARI KI BULANDI                                            */
/* ==================================================================== */

const JEEP = 'jeep-safaris/untitled.md';
const JEEP_ALT = [
  { day: 11, from: '7,788 m', to: '2,438 m',
    why: '7,788 m Rakaposhi ki bulandi hai. Karimabad 2,438 m par hai — wahi aankra Biafo ke safhe par bhi hai.' },
  { day: 17, from: '3,700 m', to: '3,700 m (Shandur Pass) / Chitral 1,500 m',
    why: '3,700 m darre ki bulandi hai, raat Chitral mein hai. Ab dono likhe hain.' },
];

/* ==================================================================== */
/* D. hijje                                                             */
/* ==================================================================== */

const SPELL = [['Arival', 'Arrival'], ['Shandoor', 'Shandur']];

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

const sameDay = (a, b) => {
  const x = String(a).trim(), y = String(b).trim();
  if (x === y) return true;
  const nx = Number(x), ny = Number(y);
  return Number.isFinite(nx) && Number.isFinite(ny) && nx === ny;
};

const findKey = (lines, key) => {
  for (let i = 0; i < lines.length; i++) {
    if (!new RegExp('^' + key + ':').test(lines[i])) continue;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^---\s*$/.test(lines[j]) || /^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[j])) return { start: i, end: j };
    }
    return { start: i, end: i + 1 };
  }
  return null;
};

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc); else if (e.name.endsWith('.md')) acc.push(f);
  }
  return acc;
};

const STRIP = [
  'This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.',
  'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.',
  'Base camp is staffed throughout with a cook, kitchen and communications.',
];
const strip = (t) => { let s = t; for (const b of STRIP) s = s.split(b).join(' '); return s; };

/* ===================== kaam ========================================== */

const problems = [];
const result = {};            /* ref -> naya matan */
const touched = new Set();

const read = (ref) => {
  const f = path.join(CONTENT, ...ref.split('/'));
  if (!fs.existsSync(f)) return null;
  return { f, raw: result[ref] ?? fs.readFileSync(f, 'utf8') };
};

console.log('\nTEEN KAAM EK SAATH');
console.log('='.repeat(80));
console.log('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

/* ---------- A. Nanga Parbat ---------- */

const NP = 'expeditions/nanga-parbat-expedition.md';
console.log('A. NANGA PARBAT');
console.log('-'.repeat(80));

{
  const r = read(NP);
  if (!r) { console.log('   XX  file nahi mili'); problems.push('NP: file'); }
  else {
    const eol = r.raw.includes('\r\n') ? '\r\n' : '\n';
    let lines = r.raw.split(/\r?\n/);
    const at = findKey(lines, 'itinerary');
    if (!at) { console.log('   XX  itinerary block nahi mila'); problems.push('NP: block'); }
    else {
      let itin;
      try { itin = yaml.load(lines.slice(at.start, at.end).join('\n')).itinerary; }
      catch (e) { console.log('   XX  YAML: ' + e.message); problems.push('NP: yaml'); itin = null; }

      if (Array.isArray(itin)) {
        const miss = [];
        for (const d of itin) if (!Object.keys(NP_DAYS).some((k) => sameDay(k, d.day))) miss.push(String(d.day));
        const extra = Object.keys(NP_DAYS).filter((k) => !itin.some((d) => sameDay(k, d.day)));
        if (miss.length) { console.log('   XX  in dinon ka naya bayaan nahi: ' + miss.join(', ')); problems.push('NP: din ' + miss.join(',')); }
        if (extra.length) { console.log('   XX  yeh din safhe par nahi: ' + extra.join(', ')); problems.push('NP: fazool ' + extra.join(',')); }

        for (const k of NP_KEEP) if (!NP_BODY.includes(k)) { console.log('   XX  aap ka jumla naye matan mein nahi'); problems.push('NP: keep'); }

        const fmOld = r.raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        const b0 = words(r.raw.slice(fmOld[0].length));
        let i0 = 0, i1 = 0;
        for (const d of itin) {
          i0 += words(d.description);
          const k = Object.keys(NP_DAYS).find((x) => sameDay(x, d.day));
          i1 += words(k ? NP_DAYS[k] : d.description);
        }
        console.log('   matan:      ' + String(b0).padStart(5) + '  ->  ' + words(NP_BODY));
        console.log('   itinerary:  ' + String(i0).padStart(5) + '  ->  ' + i1);
        console.log('   KUL:        ' + String(b0 + i0).padStart(5) + '  ->  ' + (words(NP_BODY) + i1));
        console.log('   sections:   ' + [...NP_BODY.matchAll(/<h2>/g)].length);
        console.log('');
        console.log('   Din ke bayaan:');
        for (const d of itin) {
          const k = Object.keys(NP_DAYS).find((x) => sameDay(x, d.day));
          console.log('      Day ' + String(d.day).padEnd(8) + String(d.title || '').slice(0, 42).padEnd(44) +
            (k ? String(words(NP_DAYS[k])).padStart(4) + ' alfaaz' : '  [nahi badla]'));
        }

        /* front matter banao */
        for (const d of itin) {
          const k = Object.keys(NP_DAYS).find((x) => sameDay(x, d.day));
          if (k) d.description = NP_DAYS[k].replace(/\s*\n\s*/g, ' ').trim();
        }
        const dI = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
        while (dI.length && dI[dI.length - 1] === '') dI.pop();
        lines = [...lines.slice(0, at.start), ...dI, ...lines.slice(at.end)];

        const atH = findKey(lines, 'highlights');
        const dH = yaml.dump({ highlights: NP_HIGHLIGHTS }, { lineWidth: -1, noRefs: true }).split('\n');
        while (dH.length && dH[dH.length - 1] === '') dH.pop();
        if (atH) { console.log('');
          console.log('   highlights: line ' + (atH.start + 1) + '  "' + lines[atH.start].trim().slice(0, 50) + '"  -> nayi');
          lines = [...lines.slice(0, atH.start), ...dH, ...lines.slice(atH.end)]; }
        else { console.log(''); console.log('   highlights ka khaana nahi mila — itinerary se pehle naya');
          const a2 = findKey(lines, 'itinerary');
          lines = [...lines.slice(0, a2.start), ...dH, ...lines.slice(a2.start)]; }

        for (const key of ['highlights', 'itinerary']) {
          const n = lines.filter((l) => new RegExp('^' + key + ':').test(l)).length;
          if (n !== 1) { console.log('   XX  "' + key + ':" ' + n + ' baar hai'); problems.push('NP: ' + key + ' x' + n); }
        }

        let text = lines.join(eol);
        const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        let ok = false;
        try { const v = yaml.load(fm[1]);
          ok = Array.isArray(v.itinerary) && v.itinerary.length === itin.length &&
               Array.isArray(v.highlights) && v.highlights.length === NP_HIGHLIGHTS.length; }
        catch (e) { console.log('   XX  naya YAML: ' + e.message); problems.push('NP: verify'); }
        if (!ok) { console.log('   XX  jaanch nakaam'); problems.push('NP: verify'); }
        else { result[NP] = text.slice(0, fm[0].length) + '\n' + NP_BODY + '\n'; touched.add(NP); }
      }
    }
  }
}

/* ---------- B. Day 1 ---------- */

console.log('');
console.log('B. DAY 1 KA DOHRA MATAN');
console.log('-'.repeat(80));

for (const [ref, spec] of Object.entries(DAY1)) {
  const r = read(ref);
  if (!r) { console.log('   XX  ' + ref + ' nahi mili'); problems.push(ref + ': file'); continue; }
  const eol = r.raw.includes('\r\n') ? '\r\n' : '\n';
  let lines = r.raw.split(/\r?\n/);
  const at = findKey(lines, 'itinerary');
  if (!at) { console.log('   XX  ' + ref + ': itinerary block nahi mila'); problems.push(ref + ': block'); continue; }
  let itin;
  try { itin = yaml.load(lines.slice(at.start, at.end).join('\n')).itinerary; }
  catch (e) { console.log('   XX  ' + ref + ': YAML ' + e.message); problems.push(ref + ': yaml'); continue; }
  const i = itin.findIndex((d) => sameDay(d.day, spec.day));
  if (i < 0) { console.log('   XX  ' + ref + ': Day ' + spec.day + ' nahi mila'); problems.push(ref + ': Day ' + spec.day); continue; }

  console.log('   ' + ref);
  console.log('      Day ' + String(itin[i].day) + '   ' + words(itin[i].description) + '  ->  ' + words(spec.text) + ' alfaaz');
  itin[i].description = spec.text.replace(/\s*\n\s*/g, ' ').trim();

  const d = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
  while (d.length && d[d.length - 1] === '') d.pop();
  const text = [...lines.slice(0, at.start), ...d, ...lines.slice(at.end)].join(eol);
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let ok = false;
  try { ok = yaml.load(fm[1]).itinerary.length === itin.length; } catch (e) { console.log('      XX  ' + e.message); }
  if (!ok) { console.log('      XX  jaanch nakaam'); problems.push(ref + ': verify'); continue; }
  result[ref] = text; touched.add(ref);
}

/* ---------- C. jeep safari ---------- */

console.log('');
console.log('C. JEEP SAFARI KI BULANDI');
console.log('-'.repeat(80));

{
  const r = read(JEEP);
  if (!r) { console.log('   XX  ' + JEEP + ' nahi mili'); problems.push(JEEP + ': file'); }
  else {
    const eol = r.raw.includes('\r\n') ? '\r\n' : '\n';
    let lines = r.raw.split(/\r?\n/);
    const at = findKey(lines, 'itinerary');
    if (!at) { console.log('   XX  itinerary block nahi mila'); problems.push(JEEP + ': block'); }
    else {
      let itin;
      try { itin = yaml.load(lines.slice(at.start, at.end).join('\n')).itinerary; }
      catch (e) { console.log('   XX  YAML: ' + e.message); problems.push(JEEP + ': yaml'); itin = null; }
      if (Array.isArray(itin)) {
        let n = 0;
        for (const fix of JEEP_ALT) {
          const i = itin.findIndex((d) => sameDay(d.day, fix.day));
          if (i < 0) { console.log('   XX  Day ' + fix.day + ' nahi mila'); problems.push(JEEP + ': Day ' + fix.day); continue; }
          const old = String(itin[i].altitude || '[khaali]');
          console.log('   Day ' + String(fix.day).padEnd(4) + String(itin[i].title || '').slice(0, 34).padEnd(36) + old + '  ->  ' + fix.to);
          console.log('        ' + fix.why);
          itin[i].altitude = fix.to; n++;
        }
        if (n) {
          const d = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
          while (d.length && d[d.length - 1] === '') d.pop();
          const text = [...lines.slice(0, at.start), ...d, ...lines.slice(at.end)].join(eol);
          const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
          let ok = false;
          try { ok = yaml.load(fm[1]).itinerary.length === itin.length; } catch (e) { console.log('   XX  ' + e.message); }
          if (!ok) { console.log('   XX  jaanch nakaam'); problems.push(JEEP + ': verify'); }
          else { result[JEEP] = text; touched.add(JEEP); }
        }
      }
    }
  }
}

/* ---------- D. hijje ---------- */

console.log('');
console.log('D. HIJJE');
console.log('-'.repeat(80));

let nSpell = 0;
for (const file of walk(CONTENT)) {
  const ref = path.relative(CONTENT, file).split(path.sep).join('/');
  let text = result[ref] ?? fs.readFileSync(file, 'utf8');
  const hits = [];
  for (const [a, b] of SPELL) {
    const n = text.split(a).length - 1;
    if (n) { text = text.split(a).join(b); hits.push(n + 'x ' + a + ' -> ' + b); nSpell += n; }
  }
  if (hits.length) { console.log('   ' + ref + '   ' + hits.join(', ')); result[ref] = text; touched.add(ref); }
}
if (!nSpell) console.log('   Kuch nahi mila.');

/* ---------- dohra matan ---------- */

console.log('');
console.log('DOHRA MATAN KI JAANCH');
console.log('-'.repeat(80));

const mineSet = new Set([...touched].map((ref) => path.resolve(path.join(CONTENT, ...ref.split('/')))));
const others = walk(CONTENT).filter((f) => !mineSet.has(path.resolve(f)));
const freq = new Map(); const otherSets = [];
for (const f of others) {
  const s = runs(fs.readFileSync(f, 'utf8'));
  otherSets.push({ ref: path.relative(CONTENT, f).split(path.sep).join('/'), s });
  for (const x of s) freq.set(x, (freq.get(x) || 0) + 1);
}
const boiler = new Set(); for (const [x, c] of freq) if (c >= 4) boiler.add(x);
console.log('   ' + others.length + ' doosre safhe parhe, ' + boiler.size + ' boilerplate tukre chhore gaye.');

const newTexts = {
  'Nanga Parbat': NP_BODY + ' \n ' + Object.values(NP_DAYS).join(' \n '),
};
for (const [ref, spec] of Object.entries(DAY1)) newTexts['Day 1: ' + ref] = spec.text;

let clashTotal = 0;
for (const [name, t] of Object.entries(newTexts)) {
  const mine = runs(strip(t));
  const hits = [];
  for (const { ref, s } of otherSets) {
    const h = []; for (const x of mine) if (s.has(x) && !boiler.has(x)) h.push(x);
    if (h.length) hits.push({ ref, h });
  }
  for (const [n2, t2] of Object.entries(newTexts)) {
    if (n2 === name) continue;
    const s2 = runs(strip(t2)); const h = [];
    for (const x of mine) if (s2.has(x) && !boiler.has(x)) h.push(x);
    if (h.length) hits.push({ ref: '(naya) ' + n2, h });
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
console.log('='.repeat(80));
if (problems.length) {
  console.log('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) console.log('          ' + m);
  console.log('');
  console.log('   Yeh list mujhe bhej dein, badal dunga.');
  process.exit(1);
}

console.log('   Sab saaf. Dohre tukre: ' + clashTotal + '   |   files badlengi: ' + Object.keys(result).length);
console.log('');
console.log('   JAAN KAR NAHI KIYA:');
console.log('      jeep-safaris/untitled.md ka naam nahi badla. URL pehle se');
console.log('      /jeep-safaris/mountains-villages-safari/ hai, aur file ka naam');
console.log('      badalna CMS ka record tor sakta hai. Aap kahein to kar dunga.');
console.log('      Nanga Parbat ke fact sheet ke ghalat aankre (34 climbing days,');
console.log('      03 camping nights) naye matan mein durust hain: 31 aur 36.');
console.log('');

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/fix-batch.mjs --write');
  process.exit(0);
}

for (const [ref, text] of Object.entries(result)) {
  const f = path.join(CONTENT, ...ref.split('/'));
  if (!fs.existsSync(f + '.bakbatch')) fs.copyFileSync(f, f + '.bakbatch');
  fs.writeFileSync(f, text, 'utf8');
  console.log('LIKHA: ' + ref);
}
console.log('');
console.log(Object.keys(result).length + ' files likhi gayi. backup: *.bakbatch');
console.log('');
console.log('Agla qadam:  npm run build');
console.log('Phir:        node tools/count-words.mjs  aur  node tools/audit-content.mjs');
