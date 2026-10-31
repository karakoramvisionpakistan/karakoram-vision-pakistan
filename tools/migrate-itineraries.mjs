#!/usr/bin/env node
/**
 * migrate-itineraries.mjs   (website ke folder mein)
 *
 * Purani itinerary matan ke HTML mein hai:
 *
 *   <p><strong>Day 1: Arrival in Islamabad</strong></p>
 *   <ul><li><p>Arrival at Islamabad International Airport.</p></li>...</ul>
 *
 * Yeh usay parh kar naye khaanon mein daal deti hai — din ka number, us
 * din ka unwan, bayaan, aur jahan likha ho wahan bulandi, faasla, ghante
 * aur raat kahan guzri.
 *
 * MATAN KO HAATH NAHI LAGATI. Pehle naya data aata hai, aap do teen safhe
 * aankhon se dekh lete hain, aur tasalli ke BAAD --trim-body chalta hai jo
 * purana hissa matan se nikalta hai. Warna itinerary do baar nazar aayegi.
 *
 *   node tools/migrate-itineraries.mjs              -> sirf dikhana
 *   node tools/migrate-itineraries.mjs --write      -> naye khaanon mein daalna
 *   node tools/migrate-itineraries.mjs --trim-body  -> (baad mein) purana hissa hataana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const TRIM = process.argv.includes('--trim-body');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

/* ============================================= HTML ko saada likhai ==== */

const ENTITIES = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '"', '&rdquo;': '"',
  '&ndash;': '–', '&mdash;': '—', '&hellip;': '...', '&deg;': '°',
};
const decode = (s) => String(s || '')
  .replace(/&[a-z#0-9]+;/gi, (e) => (e in ENTITIES ? ENTITIES[e] : e))
  .replace(/\s+/g, ' ')
  .trim();

/* Har <li> aur <p> ek alag jumla. Tags hat jate hain. */
function htmlToLines(html) {
  return String(html || '')
    .replace(/<\/(p|li|h[1-6]|div|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map(decode)
    .filter((l) => l.length > 1);
}

function linesToText(lines) {
  return lines
    .map((l) => (/[.!?:]$/.test(l) ? l : l + '.'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================= din dhoondhna =========== */

/* <strong>Day 1: Arrival in Islamabad</strong>  ya  <h3>Day 4-5 ...</h3> */
const DAY_RE = /<(strong|b|h[1-6])[^>]*>\s*((?:day|days)\s*\d+[^<]*)<\/\1>/gi;

const two = (n) => String(n).padStart(2, '0');

function parseDayLabel(text) {
  const t = decode(text);
  const m = t.match(/^(?:days?)\s*(\d+)\s*(?:(?:[-–—]|to|&)\s*(\d+))?\s*[:.–—-]?\s*(.*)$/i);
  if (!m) return null;
  const day = m[2] ? two(m[1]) + '-' + two(m[2]) : two(m[1]);
  return { day, num: Number(m[1]), title: (m[3] || '').trim().replace(/[:–—-]\s*$/, '') };
}

/* Aakhri din ke baad matan khatam nahi hota — aage qeematein, FAQ wagera
   hote hain. Un ko aakhri din ke bayaan mein jane se rokna parta hai. */
function trimLastChunk(chunk) {
  const list = chunk.match(/^[\s\S]*?<\/(ul|ol)>/i);
  if (list) return list[0];
  const brk = chunk.search(/<h[1-6][^>]*>|<p>\s*<strong>/i);
  if (brk > 0) return chunk.slice(0, brk);
  return chunk.slice(0, 1200);
}

/* ============================================= tafseel nikalna ========= */

function findOvernight(text) {
  const t = text.toLowerCase();
  if (/\bbase\s*camp\b/.test(t) && /\b(overnight|night|stay|sleep|camp at)\b/.test(t)) return 'Base camp';
  if (/\b(guest\s*house|guesthouse)\b/.test(t)) return 'Guesthouse';
  if (/\b(camp|camping|tented|tents?)\b/.test(t)) return 'Camping';
  if (/\bhotel\b/.test(t)) return 'Hotel';
  return '';                       // andaza nahi lagate — client bhar dega
}

function findAltitude(text) {
  // sirf wahan jahan saaf tor par metre likha ho
  const m = text.match(/\b(\d[\d,]{2,5})\s*m(?:etre|eter)?s?\b/i);
  if (!m) return '';
  const n = Number(m[1].replace(/,/g, ''));
  if (!(n >= 500 && n <= 8700)) return '';
  return m[1].replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' m';
}

/* Faasla aur ghante SIRF paidal chalne wale dinon se.

   Udne ya gaRi ke din par "318 km" likhna ghalat tasveer deta hai —
   parhne wala samjhega ke itna paidal chalna hai. Is liye pehle dekhte
   hain ke us din mein chalne ka zikr hai ya nahi. */
const ON_FOOT = /\b(trek|trekking|walk|walking|hike|hiking|climb|climbing|ascen|descen|march|on foot)\w*/i;
const BY_VEHICLE = /\b(fly|flight|flown|drive|driving|jeep|road|airport|transfer)\w*/i;

function findDistance(text) {
  if (!ON_FOOT.test(text)) return '';
  if (BY_VEHICLE.test(text) && !ON_FOOT.test(text)) return '';
  const m = text.match(/\b(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?)\s*k(?:ilo)?m(?:s|etres|eters)?\b/i);
  return m ? m[1].replace(/\s*[-–]\s*/, '-') + ' km' : '';
}

function findHours(text) {
  if (!ON_FOOT.test(text)) return '';
  const m = text.match(/\b(\d+(?:\s*[-–]\s*\d+)?)\s*(?:hrs?|hours?)\b/i);
  if (!m) return '';
  const v = m[1].replace(/\s*[-–]\s*/, '-');
  return v + (v === '1' ? ' hr' : ' hrs');
}

/* ============================================= files parhna ============ */

const files = [];
for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.md')) files.push({ service, name, full: path.join(dir, name) });
  }
}

say('ITINERARY MIGRATION' + (WRITE ? '  [--write]' : TRIM ? '  [--trim-body]' : '  [sirf dikhana]'));
say('Kul ' + files.length + ' trips');
say('');

const done = [];
const skipNoDays = [];
const skipHasField = [];
const skipNoFm = [];
const dupKeys = [];
const writes = [];

for (const f of files) {
  const raw = fs.readFileSync(f.full, 'utf8');
  const ref = f.service + '/' + f.name;

  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { skipNoFm.push(ref); continue; }

  const head = fm[1];
  const headEnd = fm[0].length;
  const body = raw.slice(headEnd);

  // ek hi khaana do baar? CMS ki purani ghalti ho sakti hai, batana zaroori hai
  const seenKeys = new Map();
  for (const line of head.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:/);
    if (!m) continue;
    seenKeys.set(m[1], (seenKeys.get(m[1]) || 0) + 1);
  }
  for (const [k, n] of seenKeys) if (n > 1) dupKeys.push(ref + '  ->  ' + k + ' (' + n + ' baar)');

  if (/^itinerary:/m.test(head)) { skipHasField.push(ref); continue; }

  /* --- din dhoondhein --- */
  DAY_RE.lastIndex = 0;
  const marks = [];
  let m;
  while ((m = DAY_RE.exec(body)) !== null) {
    const parsed = parseDayLabel(m[2]);
    if (!parsed) continue;
    marks.push({ ...parsed, at: m.index, after: m.index + m[0].length });
  }

  if (marks.length < 2) { skipNoDays.push(ref); continue; }

  /* din ke number barhte hue hone chahiyein, warna yeh itinerary nahi kuch aur hai */
  let rising = true;
  for (let i = 1; i < marks.length; i++) if (marks[i].num < marks[i - 1].num) { rising = false; break; }
  if (!rising) { skipNoDays.push(ref + '  (din ki tarteeb oopar neechay hai)'); continue; }

  /* --- har din ka hissa --- */
  const days = [];
  for (let i = 0; i < marks.length; i++) {
    const last = i + 1 === marks.length;
    let chunk = body.slice(marks[i].after, last ? undefined : marks[i + 1].at);
    if (last) chunk = trimLastChunk(chunk);
    const lines = htmlToLines(chunk);

    // agar agla hissa bohot lamba hai to woh itinerary ke baad ka matan hai
    const text = linesToText(lines.slice(0, 12));

    const entry = { day: marks[i].day, title: marks[i].title };
    if (text) entry.description = text;

    const hay = marks[i].title + ' ' + text;
    const alt = findAltitude(hay);   if (alt) entry.altitude = alt;
    const dis = findDistance(hay);   if (dis) entry.distance = dis;
    const hrs = findHours(hay);      if (hrs) entry.hours = hrs;
    const night = findOvernight(hay); if (night) entry.overnight = night;

    days.push(entry);
  }

  const blanks = {
    desc: days.filter((d) => !d.description).length,
    night: days.filter((d) => !d.overnight).length,
    alt: days.filter((d) => !d.altitude).length,
  };

  done.push({ ref, full: f.full, raw, head, headEnd, body, days, blanks, firstAt: marks[0].at });
}

/* ============================================= report ================== */

say('KYA MILA');
say('-'.repeat(60));
say('   ' + String(done.length).padStart(3) + '  trips mein itinerary mili');
if (skipNoDays.length)   say('   ' + String(skipNoDays.length).padStart(3) + '  mein koi din nahi mila');
if (skipHasField.length) say('   ' + String(skipHasField.length).padStart(3) + '  mein naya khaana pehle se bhara hua hai');
if (skipNoFm.length)     say('   ' + String(skipNoFm.length).padStart(3) + '  ki front matter nahi parhi gayi');
say('');

if (done.length) {
  say('HAR TRIP SE KITNE DIN');
  say('-'.repeat(60));
  const sorted = [...done].sort((a, b) => b.days.length - a.days.length);
  for (const d of sorted) {
    const gaps = [];
    if (d.blanks.night) gaps.push(d.blanks.night + ' din raat khaali');
    if (d.blanks.desc) gaps.push(d.blanks.desc + ' din bayaan khaali');
    say('   ' + String(d.days.length).padStart(3) + ' din   ' + d.ref.padEnd(52) +
        (gaps.length ? '  (' + gaps.join(', ') + ')' : ''));
  }
  say('');

  /* Jin files mein sirf din ke unwan hain, un par likhai ka kaam hai —
     migration unke liye kuch nahi kar sakti, matan mein kuch hai hi nahi. */
  const titleOnly = done.filter((d) => d.blanks.desc >= d.days.length - 1);
  if (titleOnly.length) {
    say('IN MEIN SIRF UNWAN HAIN, BAYAAN NAHI');
    say('-'.repeat(60));
    say('   (matan mein bayaan maujood hi nahi — yeh likhai ka kaam hai)');
    for (const d of titleOnly) say('   ' + String(d.days.length).padStart(3) + ' din   ' + d.ref);
    say('');
  }
}

if (skipNoDays.length) {
  say('JIN MEIN KOI DIN NAHI MILA');
  say('-'.repeat(60));
  for (const r of skipNoDays) say('   ' + r);
  say('');
}

if (dupKeys.length) {
  say('KHABARDAR: EK HI KHAANA DO BAAR');
  say('-'.repeat(60));
  for (const d of dupKeys) say('   ' + d);
  say('   (yeh purani CMS ki ghalti lagti hai — alag se dekhna parega)');
  say('');
}

/* --- do trips ka poora natija, taake aankhon se dekha ja sake --- */
if (done.length) {
  say('NAMOONA: KYA KYA NIKLA');
  say('='.repeat(60));

  const samples = [...done].sort((a, b) => b.days.length - a.days.length).slice(0, 2);
  for (const d of samples) {
    say('');
    say('## ' + d.ref + '   (' + d.days.length + ' din)');
    say('');
    for (const day of d.days.slice(0, 4)) {
      say('   Day:        ' + day.day);
      say('   Programme:  ' + (day.title || '[khaali]'));
      if (day.altitude) say('   Altitude:   ' + day.altitude);
      if (day.distance) say('   Distance:   ' + day.distance);
      if (day.hours)    say('   Hours:      ' + day.hours);
      say('   Over night: ' + (day.overnight || '[khaali — client bharega]'));
      const txt = day.description || '[khaali]';
      say('   Bayaan:     ' + txt.slice(0, 300) + (txt.length > 300 ? ' ...' : ''));
      say('');
    }
    if (d.days.length > 4) say('   ... aur ' + (d.days.length - 4) + ' din');
    say('');
  }
}

/* ============================================= likhna ================== */

const PREVIEW = path.join(ROOT, '_migration.txt');

if (TRIM) {
  /* Purana hissa matan se nikalna — sirf un trips se jin mein naya khaana ab bhara hua hai */
  say('');
  say('PURANA HISSA MATAN SE NIKALNA');
  say('-'.repeat(60));

  let n = 0;
  for (const f of files) {
    const raw = fs.readFileSync(f.full, 'utf8');
    const ref = f.service + '/' + f.name;
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!fm || !/^itinerary:/m.test(fm[1])) continue;

    const body = raw.slice(fm[0].length);

    /* Wahi tareeqa jo oopar data nikalte waqt chala — taake dono ek hi
       hissa samjhein, aur jo bacha liya gaya hai wohi hate. */
    DAY_RE.lastIndex = 0;
    const marks = [];
    let mm;
    while ((mm = DAY_RE.exec(body)) !== null) {
      if (parseDayLabel(mm[2])) marks.push({ at: mm.index, after: mm.index + mm[0].length });
    }
    if (marks.length < 2) continue;

    /* Pehla din aksar <p><strong>Day 1...</strong></p> hota hai. Hum
       <strong> se shuru karte hain, is liye khulne wala <p> tanha reh
       jata hai — usay bhi sath le jaate hain. */
    let from = marks[0].at;
    const openP = body.slice(0, from).match(/<p[^>]*>\s*$/i);
    if (openP) from -= openP[0].length;

    const lastMark = marks[marks.length - 1];
    const to = lastMark.after + trimLastChunk(body.slice(lastMark.after)).length;

    const removed = body.slice(from, to);
    if (removed.length < 50) continue;

    /* Hissa nikalne ke baad jo tanha sarkhi aur khaali paragraph bachte
       hain, woh bhi saaf kar dete hain. */
    let newBody = body.slice(0, from) + body.slice(to);
    newBody = newBody
      .replace(/<p>\s*<strong>[^<]{0,60}itinerary[^<]{0,20}<\/strong>\s*<\/p>/gi, '')
      .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/\n{3,}/g, '\n\n');
    say('   ' + ref.padEnd(52) + '  ' + removed.length + ' harf nikalenge');
    writes.push({ file: f.full, text: raw.slice(0, fm[0].length) + newBody, bak: '.bakitin2' });
    n++;
  }
  say('');
  say('   ' + n + ' trips se purana hissa nikalega.');

} else if (done.length) {
  for (const d of done) {
    const block = yaml.dump({ itinerary: d.days }, { lineWidth: -1, noRefs: true });
    const newHead = d.head.replace(/\s*$/, '') + '\n' + block.replace(/\s*$/, '');
    const text = '---\n' + newHead + '\n---\n' + d.body;

    // jaanch: naya front matter parh to hota hai, aur itne hi din hain
    let check;
    try { check = yaml.load(newHead); }
    catch (e) { say('XX  ' + d.ref + ': naya YAML parse nahi hua — chhoR diya. ' + e.message); continue; }
    if (!check || !Array.isArray(check.itinerary) || check.itinerary.length !== d.days.length) {
      say('XX  ' + d.ref + ': jaanch fail — chhoR diya.');
      continue;
    }
    writes.push({ file: d.full, text, bak: '.bakitin' });
  }
}

say('');
say('-'.repeat(60));

if (!writes.length) {
  say('Kuch badalne ko nahi hai.');
} else if (!WRITE && !TRIM) {
  say(writes.length + ' trips mein data daalne ko tayar hai.');
  say('');
  say('Lagane ke liye:  node tools/migrate-itineraries.mjs --write');
} else {
  for (const w of writes) {
    if (!fs.existsSync(w.file + w.bak)) fs.copyFileSync(w.file, w.file + w.bak);
    fs.writeFileSync(w.file, w.text, 'utf8');
  }
  say(writes.length + ' trips likhi gayin.  (purani naqal ' + writes[0].bak + ' mein mehfooz hai)');
  say('');
  say('Agla qadam:  npm run build');
  say('');
  if (!TRIM) {
    say('Phir do teen safhe khol kar dekh lein. Itinerary ab DO baar');
    say('nazar aayegi — ek naya table, ek purana matan. Jab table theek');
    say('lage tab purana hissa nikalne ke liye:');
    say('   node tools/migrate-itineraries.mjs --trim-body');
  }
}

fs.writeFileSync(PREVIEW, out.join('\n') + '\n', 'utf8');
console.log('');
console.log('LIKHA: _migration.txt  (poora natija)');
