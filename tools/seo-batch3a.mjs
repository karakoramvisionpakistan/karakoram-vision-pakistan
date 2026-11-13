#!/usr/bin/env node
/**
 * seo-batch3a.mjs  —  K2 Base Camp Trek ke 10 naye FAQs + K2 aur Gondogoro La pages par permit ki durusti
 *
 *   node tools/seo-batch3a.mjs            dry-run
 *   node tools/seo-batch3a.mjs --write    lagata hai (.bak-seo3a backup ke sath)
 *   npm run build
 *   node tools/seo-batch3a.mjs --verify
 *
 * 1. K2 Base Camp Trek: 10 naye sawal-jawab. Har jawab isi page ke apne mazmoon se
 *    liya gaya hai (din, unchai, insurance, flight, khana, umar, signal, booking).
 *    Yeh page par aur Google ke FAQ data (schema) dono mein aate hain.
 * 2. K2 Base Camp Trek aur Gondogoro La pages: permit wala hissa durust. Baltoro
 *    restricted trekking zone hai; trekking permit aur licensed guide lazmi hain.
 *
 * All-or-nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const VERIFY = process.argv.includes('--verify');
const BAK = '.bak-seo3a';
const P = (r) => path.join(ROOT, r);
const fail = (problems) => {
  console.log('\nXX ' + problems.length + ' MASLA - KOI FILE NAHI BADLI\n');
  for (const p of problems) console.log('   - ' + p);
  console.log(''); process.exit(1);
};
let yaml;
try { yaml = createRequire(P('package.json'))('js-yaml'); } catch { fail(['js-yaml nahi mila. Website ke folder se chalayen.']); }

const K2 = 'src/content/trekking/k2-base-camp-baltoro-trek.md';
const FAQS = [
  ['How long is the K2 base camp trek?',
   'The programme is 21 days from Islamabad to Islamabad. Sixteen of those days are on foot, and eight of them are on the surface of the Baltoro Glacier.'],
  ['How high is K2 base camp?',
   'Base camp is on the Godwin-Austen Glacier at about 5,000 metres. You visit it on a day walk from Concordia, where the camp is at 4,600 metres.'],
  ['Do I need climbing experience or technical equipment?',
   'No. There is no pass to cross and no technical climbing, and ropes and crampons are not needed on the standard route in normal conditions. Experience of multi-day walking is close to essential.'],
  ['Is the K2 base camp trek harder than Everest base camp?',
   'Yes. It is longer, you camp every night, there are no villages after the fourth day and most of the walking is on rough moraine rather than a path. Everest base camp is higher, at 5,364 metres, but has lodges all the way.'],
  ['What travel insurance do I need for the K2 base camp trek?',
   'Travel insurance is compulsory. It must cover helicopter search and rescue at the altitude of the trek, medical treatment and repatriation. Send us your policy number and the insurer\'s 24-hour emergency line before you fly.'],
  ['What happens if the flight to Skardu is cancelled?',
   'We drive the Karakoram Highway instead, which takes two days with a night at Chilas. The reserve day in the itinerary absorbs the difference. Leave at least one day between the end of the programme and your international flight home.'],
  ['What are the food and camping like on the Baltoro?',
   'A cook travels with the group for the whole trek. Meals are rice, chapati, lentils, vegetables, eggs and soup, with meat in the early days. You sleep in two-person tents, with a mess tent, kitchen tent and toilet tent. Tell us about dietary needs when you book.'],
  ['Is there an age limit for the K2 base camp trek?',
   'There is no fixed limit. We have taken trekkers in their sixties to Concordia. Honest hill fitness and a willingness to go slowly matter far more than age.'],
  ['Is there phone signal or electricity on the trek?',
   'No. Mobile coverage ends before Askole and there is no electricity until you return. Every group carries a satellite phone and radios. Bring a power bank, and a small solar panel if you can.'],
  ['How do I book the K2 base camp trek and how do I pay?',
   'A deposit of 50 per cent confirms your place. The balance is paid after you arrive in Islamabad. The price depends on group size, so send us your dates and numbers for a written itinerary and cost breakdown.'],
];

const K2FILE = 'src/content/trekking/k2-base-camp-baltoro-trek.md';
const GLA = 'src/content/trekking/gondogoro-la-circuit-trek.md';
const GUIDE = ' For the full process see our <a href="/blog/pakistan-trekking-permits-visa/">trekking permit and visa guide</a>.';
const FIXES = [
  { file: K2FILE, name: 'K2 BC: permit wala hissa (restricted zone, permit, licensed guide)',
    find: '<strong>Park permit and trekker registration.</strong> The Baltoro lies inside the Central Karakoram National Park for the whole of this route. The permit itself is issued without charge; separately, each trekker pays a park fee, which the tourism authorities in Gilgit-Baltistan revise annually.',
    replace: '<strong>Trekking permit, park fee and registration.</strong> The Baltoro is a restricted trekking zone and lies inside the Central Karakoram National Park for the whole of this route. Foreign trekkers need a trekking permit, applied for through a licensed operator, and must trek with a licensed guide. A permit fee and a park fee are charged per trekker, and the tourism authorities in Gilgit-Baltistan revise both.' },
  { file: K2FILE, name: 'K2 BC: "no restricted-area permit" wala ghalat jumla',
    find: '<p>This route needs no restricted-area permit and no liaison officer; those apply to the climbing permits on the peaks above you, not to trekking.</p>',
    replace: '<p>No liaison officer is needed for trekking; that applies to the climbing permits on the peaks above you.' + GUIDE + '</p>' },
  { file: GLA, name: 'Gondogoro La: permit wala hissa (restricted zone, permit, licensed guide)',
    find: '<strong>Central Karakoram National Park permit and fee.</strong> The permit is issued free; a park fee is payable per trekker at a rate set each year by the Gilgit-Baltistan tourism department. The Gondogoro La route lies within the park for its whole length.',
    replace: '<strong>Trekking permit and park fee.</strong> The Baltoro and the Gondogoro La are in a restricted trekking zone inside the Central Karakoram National Park. Foreign trekkers need a trekking permit, applied for through a licensed operator, and must trek with a licensed guide. A permit fee and a park fee are charged per trekker, at rates set by the Gilgit-Baltistan tourism department.' },
  { file: GLA, name: 'Gondogoro La: "open zone" wala ghalat jumla',
    find: '<p>The Gondogoro La is in an open zone and does not require a restricted-area permit. There is a debriefing',
    replace: '<p>There is a debriefing' },
];

/* ------------------------------ VERIFY ---------------------------- */
if (VERIFY) {
  const f = P('_site/trekking/k2-base-camp-trek/index.html');
  if (!fs.existsSync(f)) fail(['_site mein K2 Base Camp page nahi mila. Pehle: npm run build']);
  const h = fs.readFileSync(f, 'utf8'); const bad = []; let ok = 0;
  let schemaQ = [];
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const j = JSON.parse(m[1]); for (const o of (j['@graph'] || [j])) if ([].concat(o['@type']).includes('FAQPage')) schemaQ = (o.mainEntity || []).map((q) => q.name); } catch { bad.push('JSON-LD toota hua hai'); }
  }
  for (const [q] of FAQS) {
    if (h.includes(q.replace(/&/g, '&amp;'))) ok++; else bad.push('page par nahi: ' + q);
    if (schemaQ.includes(q)) ok++; else bad.push('FAQ schema mein nahi: ' + q);
  }
  const g = fs.existsSync(P('_site/trekking/gondogoro-la-circuit-trek/index.html')) ? fs.readFileSync(P('_site/trekking/gondogoro-la-circuit-trek/index.html'), 'utf8') : '';
  if (/no restricted-area permit|issued without charge/.test(h)) bad.push('K2 BC par purana permit wala jumla ab bhi hai'); else ok++;
  if (/restricted trekking zone/.test(h)) ok++; else bad.push('K2 BC par "restricted trekking zone" nahi mila');
  if (/in an open zone|issued free/.test(g)) bad.push('Gondogoro La par purana permit wala jumla ab bhi hai'); else ok++;
  if (/restricted trekking zone/.test(g)) ok++; else bad.push('Gondogoro La par "restricted trekking zone" nahi mila');
  console.log('\n   ' + ok + ' check paas. FAQ schema mein kul ' + schemaQ.length + ' sawal.');
  if (bad.length) { console.log('\nXX ' + bad.length + ' MASLA (verify)\n'); for (const b of bad) console.log('   - ' + b); console.log(''); process.exit(1); }
  console.log('   Sab theek.\n'); process.exit(0);
}

/* --------------------------- TABDEELIYAN -------------------------- */
const problems = []; const writes = []; const plan = [];

// 1. FAQs
(() => {
  if (!fs.existsSync(P(K2))) { problems.push(K2 + ' nahi mili'); return; }
  const raw = fs.readFileSync(P(K2), 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const text = raw.replace(/\r\n/g, '\n');
  const end = text.indexOf('\n---', 4);
  if (!text.startsWith('---\n') || end < 0) { problems.push(K2 + ': front matter nahi mila'); return; }
  const lines = text.slice(4, end).split('\n');
  let before; try { before = yaml.load(lines.join('\n')); } catch (e) { problems.push(K2 + ': YAML parh nahi saka'); return; }
  const have = new Set((before.faqs || []).map((f) => String(f.question).trim()));
  const add = FAQS.filter(([q]) => !have.has(q));
  if (!add.length) { plan.push([K2, 'FAQs pehle se lage hue hain', false]); return; }
  const at = lines.findIndex((l) => /^faqs:\s*$/.test(l));
  if (at < 0) { problems.push(K2 + ': "faqs:" list nahi mili'); return; }
  let endAt = at + 1;
  while (endAt < lines.length && (/^\s/.test(lines[endAt]) || lines[endAt] === '')) endAt++;
  while (endAt > at + 1 && lines[endAt - 1] === '') endAt--;
  const wrap = (s) => { const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > 92) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };
  const block = add.flatMap(([q, a]) => ['  - question: ' + q, '    answer: >-', ...wrap(a).map((l) => '      ' + l)]);
  lines.splice(endAt, 0, ...block);
  let after; try { after = yaml.load(lines.join('\n')); } catch (e) { problems.push(K2 + ': tabdeeli ke baad YAML toot gaya (' + e.message.split('\n')[0] + ')'); return; }
  const want = [...(before.faqs || []), ...add.map(([question, answer]) => ({ question, answer }))];
  const rest = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.faqs; return c; };
  if (JSON.stringify(after.faqs) !== JSON.stringify(want) || JSON.stringify(rest(after)) !== JSON.stringify(rest(before))) { problems.push(K2 + ': FAQs theek nahi bane ya koi aur khana badal gaya — rok diya'); return; }
  const next = '---\n' + lines.join('\n') + text.slice(end);
  writes.push([K2, eol === '\r\n' ? next.replace(/\n/g, '\r\n') : next, raw]);
  plan.push([K2, add.length + ' naye FAQs (kul ' + want.length + ')', true]);
})();

// 2. permit ki durusti (FAQ wali tabdeeli ke upar)
for (const e of FIXES) {
  if (!fs.existsSync(P(e.file))) { problems.push(e.file + ' nahi mili'); continue; }
  let w = writes.find((x) => x[0] === e.file);
  const raw = w ? w[2] : fs.readFileSync(P(e.file), 'utf8');
  const cur = w ? w[1] : raw;
  if (cur.includes(e.replace) && !cur.includes(e.find)) { plan.push([e.file, e.name + ' — pehle se theek', false]); continue; }
  if (cur.split(e.find).length - 1 !== 1) { problems.push(e.file + ': "' + e.name + '" — jumla nahi mila (shayad CMS mein badal gaya)'); continue; }
  const next = cur.replace(e.find, e.replace);
  if (w) w[1] = next; else writes.push([e.file, next, raw]);
  plan.push([e.file, e.name, true]);
}

if (problems.length) fail(problems);

console.log('\n================ SEO BATCH 3a ' + (WRITE ? '(WRITE)' : '(DRY-RUN)') + ' ================\n');
for (const [f, m, ch] of plan) console.log('   ' + (ch ? '>>' : '==') + ' ' + f + '\n        ' + m);
console.log('\n' + writes.length + ' file badlegi.');
if (!WRITE) { console.log('Yeh dry-run tha. Lagane ke liye:  node tools/seo-batch3a.mjs --write\n'); process.exit(0); }
if (!writes.length) { console.log('Kuch badalne ko nahi.\n'); process.exit(0); }
const done = [];
try {
  for (const [r, , raw] of writes) if (!fs.existsSync(P(r) + BAK)) fs.writeFileSync(P(r) + BAK, raw);
  for (const [r, t] of writes) { fs.writeFileSync(P(r), t); done.push(r); }
} catch (err) {
  for (const [r, , raw] of writes) if (done.includes(r)) fs.writeFileSync(P(r), raw);
  fail(['likhte waqt ghalti: ' + err.message + ' — files wapas kar di gayin']);
}
console.log('Lag gaya. Ab:  npm run build   phir   node tools/seo-batch3a.mjs --verify\n');
