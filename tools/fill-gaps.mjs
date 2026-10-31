#!/usr/bin/env node
/**
 * fill-gaps.mjs   (website ke folder mein)
 *
 * DO KAAM:
 *
 * 1. UNWAN — teen expeditions mein unwan bayaan ke pehle jumle mein chhupa
 *    hua hai: "Drive to Askoli (3000m). By jeeps drive to Askole (6-7 hrs)
 *    ..." Pehla jumla hi unwan hai. Usay nikaal kar apni jagah rakh dete
 *    hain, bulandi bhi usi se mil jati hai, aur baqi bayaan reh jata hai.
 *
 *    Agar pehla jumla nikalne se bayaan taqreeban khatam ho jaye to bayaan
 *    chhoR dete hain aur sirf unwan rakh lete hain — adhoora bayaan us se
 *    bura hai.
 *
 * 2. RAAT — 37 khaali khaane, har ek apne unwan ke hisaab se. Jahan mera
 *    faisla pakka nahi hai wahan script alag se nishan laga kar bata degi,
 *    taake client sirf unhein dekhe.
 *
 * JO KHAANA PEHLE SE BHARA HO USAY CHHOOTA NAHI.
 *
 *   node tools/fill-gaps.mjs            -> sirf dikhana
 *   node tools/fill-gaps.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const ORDER = ['day', 'title', 'description', 'altitude', 'distance', 'hours', 'overnight', 'coords'];

/* Raat — har din apne unwan ke hisaab se.
   '?' lagaya hua matlab mera faisla pakka nahi, client dekh le. */
const NIGHTS = {
  'tours/autumn-hunza-skardu-tour.md': { '06': 'Hotel', '09': 'Hotel' },
  'tours/cycle-touring.md': { '07': 'Hotel' },
  'tours/deosai-khaplu-tour.md': { '03': 'Camping?', '05': 'Hotel' },
  'tours/gilgit-baltistan-grand-circuit.md': { '09': 'Hotel' },
  'tours/hunza-valley-heritage-tour.md': { '06': 'Hotel', '07': 'Hotel' },
  'tours/skardu-shigar-valley-explorer.md': { '03': 'Hotel', '04': 'Hotel', '05': 'Hotel?' },
  'trekking/fairy-meadows-nanga-parbat-base-camp-trek.md': { '06': 'Guesthouse', '07': 'Guesthouse' },
  'trekking/k2-base-camp-baltoro-trek.md': { '14': 'Camping' },
  'trekking/rakaposhi-base-camp-trek.md': { '02': 'Guesthouse?', '06': 'Guesthouse?' },
  'trekking/rush-lake-trek.md': { '03': 'Guesthouse?', '07': 'Camping', '08': 'Camping', '09': 'Camping', '10': 'Guesthouse?' },
  'trekking/thalle-la-trek.md': { '02': 'Camping?', '05': 'Camping' },
  'expeditions/broad-peak-expedition.md': { '47': 'Hotel' },
  'expeditions/trango-expedition.md': { '32': 'Hotel?' },
  'jeep-safaris/deosai-jeep-safari.md': { '03': 'Camping?' },
  'jeep-safaris/shigar-basho-khaplu-jeep-adventure.md': { '02': 'Hotel', '03': 'Camping?' },
  'jeep-safaris/untitled.md': { '09': 'Hotel?', '14': 'Hotel', '17': 'Hotel', '18': 'Hotel', '19': 'Hotel', '20': 'Hotel' },
  /* Yeh safar ke din hain hi nahi — kaghazi karwai hai, is liye koi raat nahi. */
  'hunting-services/permit-mountain-expedition-logistics.md': { '01': 'Not applicable', '02': 'Not applicable', '03': 'Not applicable' },
};

const ALT_IN_TITLE = /\s*\((\d[\d,]{2,5})\s*m\)\s*\.?/i;
const fmtAlt = (raw) => {
  const n = Number(String(raw).replace(/,/g, ''));
  if (!(n >= 500 && n <= 8700)) return '';
  return n.toLocaleString('en-US') + ' m';
};

/* Pehla jumla — unwan ke tor par istemaal hoga */
function firstSentence(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const m = s.match(/^(.{4,90}?[.!?])(\s|$)/);
  if (!m) return null;
  const head = m[1].replace(/[.\s]+$/, '').trim();
  if (!head || head.length < 4) return null;
  return { head, rest: s.slice(m[0].length).trim() };
}

const writes = [];
const titleFixes = [];
const nightFixes = [];
const unsure = [];
const missed = [];

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
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

  let days;
  try { days = yaml.load(lines.slice(start, end).join('\n')).itinerary; } catch { continue; }
  if (!Array.isArray(days) || !days.length) continue;

  const nights = NIGHTS[f.ref] || {};
  const seenNights = new Set();
  let changed = 0;

  const fixed = days.map((d) => {
    const e = { ...(d || {}) };

    /* --- unwan bayaan ke pehle jumle se --- */
    let rec = null;
    if (!e.title && e.description) {
      const sp = firstSentence(e.description);
      if (sp) {
        /* Pehla jumla nikalne ke baad bayaan mein kuch baaqi bachna chahiye */
        const keepDesc = sp.rest.length >= 40;
        e.title = sp.head;
        if (keepDesc) e.description = sp.rest;
        rec = {
          ref: f.ref, day: e.day,
          kept: keepDesc ? sp.rest.length + ' harf bacha' : 'bayaan waisa hi chhoRa',
        };
        changed++;
      }
    }

    /* --- bulandi unwan se --- */
    if (e.title) {
      const m = String(e.title).match(ALT_IN_TITLE);
      if (m) {
        const a = fmtAlt(m[1]);
        if (a && !e.altitude) { e.altitude = a; changed++; }
        e.title = String(e.title).replace(ALT_IN_TITLE, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    /* Report ab likhte hain, taake wohi nazar aaye jo file mein jayega */
    if (rec) { rec.title = e.title; rec.alt = e.altitude || ''; titleFixes.push(rec); }

    /* --- raat --- */
    if (!e.overnight) {
      const want = nights[String(e.day)];
      if (want) {
        seenNights.add(String(e.day));
        const val = want.replace(/\?$/, '');
        e.overnight = val;
        changed++;
        const rec = { ref: f.ref, day: e.day, title: e.title || '', val };
        nightFixes.push(rec);
        if (want.endsWith('?')) unsure.push(rec);
      }
    }

    const out = {};
    for (const k of ORDER) if (e[k] !== undefined && e[k] !== '') out[k] = e[k];
    for (const k of Object.keys(e)) if (!(k in out) && e[k] !== undefined && e[k] !== '') out[k] = e[k];
    return out;
  });

  for (const k of Object.keys(nights)) if (!seenNights.has(k)) missed.push(f.ref + '  Day ' + k);
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

console.log('\nUNWAN JO BAYAAN SE NIKLE (' + titleFixes.length + ')');
console.log('='.repeat(76));
let last = '';
for (const t of titleFixes) {
  if (t.ref !== last) { console.log('   ' + t.ref); last = t.ref; }
  console.log('      Day ' + String(t.day).padEnd(8) + t.title.padEnd(36) +
              (t.alt ? t.alt.padEnd(10) : ''.padEnd(10)) + t.kept);
}

console.log('\nRAAT JO BHARI (' + nightFixes.length + ')');
console.log('='.repeat(76));
last = '';
for (const n of nightFixes) {
  if (n.ref !== last) { console.log('   ' + n.ref); last = n.ref; }
  console.log('      Day ' + String(n.day).padEnd(8) + n.title.padEnd(40) + n.val);
}

if (unsure.length) {
  console.log('\nIN PAR MERA FAISLA PAKKA NAHI (' + unsure.length + ') — client dekh le');
  console.log('='.repeat(76));
  for (const u of unsure) {
    console.log('   ' + u.ref.padEnd(50) + 'Day ' + String(u.day).padEnd(6) + u.title.padEnd(34) + u.val);
  }
  console.log('');
  console.log('   Minapin, Hoper aur Basho mein rehaish ghar ya camp dono ho sakti hai,');
  console.log('   aur Deosai mein camping ke elawa kuch hai nahi — magar yeh client ke');
  console.log('   apne intezaam par hai, mere andaze par nahi.');
}

if (missed.length) {
  console.log('\nJIN DINON KE LYE MAINE LIKHA MAGAR WOH NAHI MILE');
  console.log('='.repeat(76));
  for (const m of missed) console.log('   ' + m);
}

console.log('\n' + '-'.repeat(76));
if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/fill-gaps.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (!fs.existsSync(w.file + '.bakgaps')) fs.copyFileSync(w.file, w.file + '.bakgaps');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
console.log('Phir:        node tools/check-itineraries.mjs');
