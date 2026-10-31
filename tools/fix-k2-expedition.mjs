#!/usr/bin/env node
/**
 * fix-k2-expedition.mjs   (website ke folder mein)
 *
 * Do kaam:
 *
 * HISSA 1 — K2 Expedition ke safhe ki durustiyan
 *   - Day 3 ki bulandi 8,125 m (Nanga Parbat ki) -> 2,228 m (Skardu)
 *   - Day 59 ke unwan mein teen din ghus gaye the -> Day 59 aur Day 60 alag
 *   - Day 12 "40 days climbing" -> din ka range "12-53", bulandi base camp
 *     se summit tak (6,000 m sirf Camp 1 tha, 42 din ke row par ghalat tha)
 *   - Hijje: Askoli -> Askole, Urdokas -> Urdukas, Snow Doom -> Snow Dome,
 *     Mashabrum -> Masherbrum, unwanon ke aakhir ka nuqta, highlights ke
 *     aakhir ka khaali comma, "had all but failed" -> "had all failed"
 *
 * HISSA 2 — bulandi teenon safhon par ek jaisi
 *   Aap ke expedition safhe ke aankre chalte hain:
 *     Askole 3,000 | Paiju 3,600 | Urdukas 4,200 | Goro II 4,500 | K2 BC 5,000
 *   Yeh trek ke safhon par bhi lagte hain — bulandi ke khaane mein AUR
 *   bayaan ke matan mein, taake table aur alfaaz mein farq na rahe.
 *
 * 1934 ko nahi chheda. Woh client se poochhne ki baat hai.
 *
 *   node tools/fix-k2-expedition.mjs            -> sirf dikhana
 *   node tools/fix-k2-expedition.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const C = path.join(ROOT, 'src', 'content');

const EXP = path.join(C, 'expeditions', 'k2-expediiton.md');
const K2BC = path.join(C, 'trekking', 'k2-base-camp-baltoro-trek.md');
const GON = path.join(C, 'trekking', 'gondogoro-la-circuit-trek.md');

/* bulandi ke khaane mein — purani qeemat se nayi */
const ALT_MAP = [
  ['3,048 m', '3,000 m'],
  ['3,450 m', '3,600 m'],
  ['4,050 m', '4,200 m'],
  ['4,380 m', '4,500 m'],
  ['5,150 m', '5,000 m'],
];

/* bayaan ke matan mein — lambe pehle, chhote baad mein */
const PROSE = [
  ['to 3,930, 4,050 and 4,380 metres on successive days', 'to 3,930, 4,200 and 4,500 metres on successive days'],
  ['three to four hundred metres a day across the glacier section', 'around three hundred metres a day across the glacier section'],
  ['Four hundred metres of descent at this altitude is a perceptible gift', 'Losing height at this altitude is a perceptible gift'],
  ['Paiju at 3,450 with a full rest day', 'Paiju at 3,600 with a full rest day'],
  ['Askole at 3,048,', 'Askole at 3,000,'],
  ['3,450 in five days', '3,600 in five days'],
  ['3,048 metres', '3,000 metres'],
  ['3,450 metres', '3,600 metres'],
  ['4,050 metres', '4,200 metres'],
  ['4,380 metres', '4,500 metres'],
  ['5,150 metres', '5,000 metres'],
];

/* ------------------------------------------------------------------ */

const log = [];
const say = (s = '') => { log.push(s); console.log(s); };

const readFile = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };

const splitFm = (raw) => {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? { head: raw.slice(0, m[0].length), fm: m[1], body: raw.slice(m[0].length) } : null;
};

/* itinerary block ko line ke hisaab se dhoondna — baqi file chhoti na ho */
const findItin = (lines) => {
  let start = -1;
  for (let i = 0; i < lines.length; i++) if (/^itinerary:\s*$/.test(lines[i])) { start = i; break; }
  if (start === -1) return null;
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i]) || /^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[i])) { end = i; break; }
  }
  return end === -1 ? null : { start, end };
};

const loadItin = (lines, at) => {
  try { return yaml.load(lines.slice(at.start, at.end).join('\n')).itinerary; } catch { return null; }
};

const spliceItin = (lines, at, itin) => {
  const d = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
  while (d.length && d[d.length - 1] === '') d.pop();
  return [...lines.slice(0, at.start), ...d, ...lines.slice(at.end)];
};

const changes = { exp: 0, k2bc: 0, gon: 0 };
const out = {};

/* ============== HISSA 1 — expedition ka safha ===================== */

say('HISSA 1 — K2 EXPEDITION KE SAFHE KI DURUSTIYAN');
say('='.repeat(78));

{
  const raw = readFile(EXP);
  if (!raw) { say('XX  k2-expediiton.md nahi mili — hissa 1 chhora.'); }
  else {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    let lines = raw.split(/\r?\n/);
    const at = findItin(lines);
    if (!at) { say('XX  itinerary block nahi mila — hissa 1 chhora.'); }
    else {
      const itin = loadItin(lines, at);
      if (!Array.isArray(itin)) { say('XX  itinerary parh nahi saka — hissa 1 chhora.'); }
      else {
        const byDay = (v) => itin.findIndex((d) => String(d.day).trim() === String(v));

        /* Day 3 ki bulandi */
        const i3 = byDay('3');
        if (i3 >= 0) {
          const old = String(itin[i3].altitude || '[khaali]');
          if (old !== '2,228 m') {
            say('   Day 3 bulandi:   ' + old + '  ->  2,228 m        (Skardu, pehle Nanga Parbat ki thi)');
            itin[i3].altitude = '2,228 m'; changes.exp++;
          }
        } else say('   !! Day 3 nahi mila');

        /* unwanon ke hijje */
        const TITLES = [
          ['4', 'Drive to Askole'],
          ['8', 'Trek to Urdukas'],
          ['11', 'Trek to K2 Base Camp'],
          ['54-57', 'Return to Askole by the same route'],
        ];
        for (const [d, t] of TITLES) {
          const i = byDay(d);
          if (i < 0) { say('   !! Day ' + d + ' nahi mila'); continue; }
          if (itin[i].title !== t) {
            say('   Day ' + d.padEnd(6) + 'unwan:  "' + itin[i].title + '"');
            say('   ' + ' '.repeat(13) + '->      "' + t + '"');
            itin[i].title = t; changes.exp++;
          }
        }

        /* Day 12 — 42 din ka arsa */
        const i12 = byDay('12');
        if (i12 >= 0) {
          say('   Day 12 -> din ka range "12-53", unwan aur bulandi nayi:');
          say('      pehle:  Day 12  "' + itin[i12].title + '"  [' + (itin[i12].altitude || '') + ']');
          itin[i12].day = '12-53';
          itin[i12].title = 'Climbing period on the Abruzzi Spur';
          itin[i12].altitude = '5,000 m base camp to 8,611 m summit';
          say('      ab:     Day 12-53  "' + itin[i12].title + '"  [' + itin[i12].altitude + ']');
          changes.exp++;
        } else say('   !! Day 12 nahi mila');

        /* Day 59 ko do dinon mein alag karna */
        const i59 = byDay('59');
        if (i59 >= 0) {
          const old = itin[i59];
          say('   Day 59 ke unwan mein teen din thay — alag kar raha hoon:');
          say('      pehle:  "' + String(old.title).slice(0, 96) + '"');
          const d59 = {
            day: 59,
            title: 'Fly to Islamabad and expedition debriefing',
            altitude: '507 m',
            description: 'The flight from Skardu to Islamabad, weather permitting, or the road if not. The expedition debriefing is completed in the city, which closes out the climbing permit and the liaison officer report. Hotel in Islamabad, and the first evening in two months that does not involve a tent.',
            overnight: 'Hotel',
          };
          const d60 = {
            day: 60,
            title: 'Transfer to airport and departure',
            altitude: '507 m',
            description: String(old.description || '').trim() ||
              'Two months on K2 end at a departure gate in Islamabad. A day room can be arranged if you are flying late.',
            overnight: String(old.overnight || 'Not applicable'),
          };
          itin.splice(i59, 1, d59, d60);
          say('      ab:     Day 59  "' + d59.title + '"   (Hotel)');
          say('              Day 60  "' + d60.title + '"   (' + d60.overnight + ')');
          changes.exp++;
        } else say('   !! Day 59 nahi mila');

        lines = spliceItin(lines, at, itin);
        let text = lines.join(eol);

        /* front matter aur body ke chhote hijje */
        const SPELL = [
          ['Snow Doom peak', 'Snow Dome Peak'],
          ['Mashabrum Peak', 'Masherbrum Peak'],
          ['Mountains, Concordia, ', 'Mountains, Concordia'],
          ['had all but failed', 'had all failed'],
        ];
        say('');
        say('   Hijje aur chhoti ghaltiyan:');
        for (const [a, b] of SPELL) {
          const n = text.split(a).length - 1;
          if (n) { text = text.split(a).join(b); say('      ' + n + 'x  "' + a + '"  ->  "' + b + '"'); changes.exp += n; }
          else say('      --  "' + a + '"  nahi mila');
        }

        /* jaanch */
        const chk = splitFm(text);
        let ok = false;
        try {
          const v = yaml.load(chk.fm);
          ok = Array.isArray(v.itinerary) && v.itinerary.length === itin.length;
        } catch (e) { say('   XX  naya YAML parh nahi saka: ' + e.message); }
        if (!ok) { say('   XX  jaanch nakaam — is file ko nahi likhunga.'); }
        else { out[EXP] = text; say(''); say('   Din: 15 -> ' + itin.length + '   (Day 60 naya)'); }
      }
    }
  }
}

/* ============== HISSA 2 — bulandi ek jaisi ======================== */

say('');
say('HISSA 2 — BULANDI TEENON SAFHON PAR EK JAISI');
say('='.repeat(78));
say('   Aap ke expedition safhe ke aankre:');
say('      Askole 3,000 m | Paiju 3,600 m | Urdukas 4,200 m | Goro II 4,500 m | K2 BC 5,000 m');
say('');

for (const [name, file, key] of [['K2 Base Camp Trek', K2BC, 'k2bc'], ['Gondogoro La', GON, 'gon']]) {
  const raw0 = out[file] || readFile(file);
  if (!raw0) { say('   XX  ' + name + ': file nahi mili'); continue; }

  const eol = raw0.includes('\r\n') ? '\r\n' : '\n';
  let lines = raw0.split(/\r?\n/);
  const at = findItin(lines);

  say('   ' + name);
  say('   ' + '-'.repeat(74));

  /* bulandi ke khaane */
  if (at) {
    const itin = loadItin(lines, at);
    if (Array.isArray(itin)) {
      let n = 0;
      for (const d of itin) {
        let a = String(d.altitude || '');
        if (!a) continue;
        const before = a;
        for (const [o, w] of ALT_MAP) if (a.includes(o)) a = a.split(o).join(w);
        if (a !== before) {
          say('      Day ' + String(d.day).padEnd(7) + before + '  ->  ' + a);
          d.altitude = a; n++;
        }
      }
      if (n) { lines = spliceItin(lines, at, itin); changes[key] += n; }
      else say('      bulandi ke khaane mein kuch badalna nahi tha');
    } else say('      !! itinerary parh nahi saka — bulandi ke khaane nahi chhuye');
  } else say('      !! itinerary block nahi mila — bulandi ke khaane nahi chhuye');

  /* bayaan ka matan */
  let text = lines.join(eol);
  let pn = 0;
  for (const [a, b] of PROSE) {
    const n = text.split(a).length - 1;
    if (n) { text = text.split(a).join(b); say('      matan: ' + n + 'x  "' + a.slice(0, 52) + (a.length > 52 ? '...' : '') + '"'); pn += n; }
  }
  if (!pn) say('      matan mein kuch badalna nahi tha');
  changes[key] += pn;

  /* jaanch */
  const chk = splitFm(text);
  let ok = false;
  try { ok = Array.isArray(yaml.load(chk.fm).itinerary); } catch (e) { say('      XX  naya YAML: ' + e.message); }
  if (!ok) say('      XX  jaanch nakaam — is file ko nahi likhunga.');
  else if (text !== raw0) out[file] = text;
  say('');
}

/* ============== likhna =========================================== */

say('-'.repeat(78));
say('   badlav:  expedition ' + changes.exp + '  |  K2 BC trek ' + changes.k2bc + '  |  Gondogoro ' + changes.gon);
say('');
say('   NOTE — yeh maine jaan kar nahi chheda:');
say('      - attempts ki list mein 1934. K2 ki 1934 koshish ki tasdeeq nahi milti;');
say('        1934 Nanga Parbat ka saal hai. Client se poochh lein.');
say('      - best_season ka khaana. Woh field kisi safhe par mojood nahi, to lagta hai');
say('        CMS ke schema mein hi nahi hai. Body mein "20 June to 15 August" pehle se hai.');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-k2-expedition.mjs --write');
  process.exit(0);
}

let wrote = 0;
for (const [file, text] of Object.entries(out)) {
  if (!fs.existsSync(file + '.bakalt')) fs.copyFileSync(file, file + '.bakalt');
  fs.writeFileSync(file, text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, file));
  wrote++;
}
console.log('');
console.log(wrote + ' file likhi gayi. backup: *.bakalt');
console.log('');
console.log('Agla qadam:  npm run build');
