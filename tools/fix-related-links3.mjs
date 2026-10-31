#!/usr/bin/env node
/**
 * fix-related-links3.mjs   (website ke folder mein)
 *
 * Pehli koshish mein 42 naam nahi mile. Waja yeh ke purane link haath se
 * likhe gaye the aur naam asli unwanon se thoRe mukhtalif hain:
 *
 *   matan mein "Biafo Hispar Pass trek"  ->  unwan "Biafo Hisper Pass Trek"
 *   matan mein "Spantik expedition"      ->  unwan "Spantik Peak Expedition"
 *
 * Ab yeh milte julte naam TAJWEEZ karti hai, lagati nahi — jab tak aap
 * --fuzzy na kahein. "Skardu" jaisa akela naam teen safhon par ja sakta
 * hai, aur andaze se ghalat safhe par bhejna na bhejne se bura hai.
 *
 *   node tools/fix-related-links3.mjs            -> dikhana + tajweez + poori fehrist
 *   node tools/fix-related-links3.mjs --write    -> sirf pakke naam lagana
 *   node tools/fix-related-links3.mjs --write --fuzzy   -> tajweez bhi lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FUZZY = process.argv.includes('--fuzzy');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const COLLECTIONS = ['tours', 'trekking', 'expeditions', 'jeep_safaris', 'hunting_services'];

const WIDE_SRC = "/^\\\\/(tours|trekking|expeditions|jeep-safaris|hunting-services|destinations|blog|vehicles)\\\\/[^/]+\\\\/?$/";
const WIDE_RE = /^\/(tours|trekking|expeditions|jeep-safaris|hunting-services|destinations|blog|vehicles)\/[^/]+\/?$/;

/* Jo naam main haath se jorR doon, woh yahan aayenge. Abhi khaali —
   fehrist dekhne ke baad bharunga. */
/* Matan ka naam -> safhe ka PATA. Pata istemaal karte hain kyunke unwan
   badal jata hai aur pata wahi rehta hai: "Deosai jeep safari" ab
   "Deosai High Plateau Trip" kehlata hai, magar pata wahi hai. */
const OVERRIDES = {
  'Hunza Valley': '/destinations/hunza/',
  'Skardu': '/destinations/skardu/',
  'Khaplu travel guide': '/destinations/khaplu/',
  'Fairy Meadows travel guide': '/destinations/fairy-meadows/',
  'Thalle La trek': '/trekking/thalle-la-trek/',
  'Deosai jeep safari': '/jeep-safaris/deosai-jeep-safari/',
  'Shigar and Khaplu jeep safari': '/jeep-safaris/shigar-basho-khaplu-jeep-safari/',
  'Prado 4x4 hire': '/vehicles/toyota-prado-4x4/',
  // Yeh mera faisla hai, pakka nahi: cycle tour ke sath "Gilgit Baltistan"
  // likha tha aur GB ka apna destination safha nahi hai, is liye Grand
  // Circuit par bheja. Ghalat lage to nikaal dein.
  'Gilgit Baltistan': '/tours/gilgit-baltistan-grand-circuit/',
};

const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const key = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const toks = (s) => key(s).split(' ').filter(Boolean);

/* ============================================= milana ================= */

/* Do lafzon mein ek harf ka farq — "hispar" aur "hisper" ek hi hain. */
function near(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length < 5 || b.length < 5) return false;
  let i = 0, j = 0, diff = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return diff + (a.length - i) + (b.length - j) <= 1;
}

function score(qt, ct) {
  let hit = 0;
  const used = new Set();
  for (const q of qt) {
    for (let i = 0; i < ct.length; i++) {
      if (used.has(i)) continue;
      if (near(q, ct[i])) { used.add(i); hit++; break; }
    }
  }
  const union = qt.length + ct.length - hit;
  let s = union ? hit / union : 0;
  if (hit === qt.length || hit === ct.length) s += 0.25;   // ek doosre ke andar
  return s;
}

/* ============================================= 0) fehrist ============== */

console.log('\n0) Fehrist');

const catRaw = read(path.join(ROOT, 'src', '_data', 'structuredCatalog.json'));
if (!catRaw) { console.log('XX  structuredCatalog.json nahi mili. Pehle npm run build.'); process.exit(1); }

const found = [];
const walk = (node, depth) => {
  if (!node || depth > 5) return;
  if (Array.isArray(node)) { for (const n of node) walk(n, depth + 1); return; }
  if (typeof node !== 'object') return;
  const t = node.title || node.label || node.name;
  const u = node.url || node.permalink || node.href || node.path;
  if (typeof t === 'string' && typeof u === 'string' && WIDE_RE.test(u)) { found.push({ title: t.trim(), url: u }); return; }
  for (const v of Object.values(node)) walk(v, depth + 1);
};
walk(JSON.parse(catRaw), 0);

const titles = [];
const seenT = new Set();
const byKey = new Map();
const byUrl = new Map();
const all = [];
for (const it of found) {
  if (!it.title) continue;
  const k = it.title.toLowerCase();
  if (seenT.has(k)) continue;
  seenT.add(k);
  titles.push(it.title);
  byKey.set(key(it.title), it);
  byUrl.set(it.url.replace(/\/+$/, ''), it);
  all.push({ ...it, t: toks(it.title) });
}
titles.sort((a, b) => a.localeCompare(b));
if (titles.length < 10) { console.log('XX  itni kam fehrist, ruk raha hoon.'); process.exit(1); }

console.log('   ' + titles.length + ' safhe\n');
console.log('   POORI FEHRIST (unwan -> pata)');
console.log('   ' + '-'.repeat(66));
for (const it of [...all].sort((a, b) => a.url.localeCompare(b.url))) {
  console.log('   ' + it.title.padEnd(42) + it.url);
}

/* ============================================= 1) filter =============== */

console.log('\n1) Filter aur sync tool');

const narrow = /\/\^\\\/\(tours\|trekking\|expeditions\|jeep-safaris\|hunting-services\)\\\/\[\^\/\]\+\\\/\?\$\//g;
for (const rel of ['eleventy.config.js', 'tools/sync-related-options.mjs']) {
  const file = path.join(ROOT, rel);
  const text = read(file);
  if (!text) { console.log('   !   ' + rel + ' nahi mili.'); continue; }
  if (text.includes('destinations|blog')) { console.log('   OK  ' + rel + ': pehle se barhi hui.'); continue; }
  narrow.lastIndex = 0;
  if (!(text.match(narrow) || []).length) { console.log('   !   ' + rel + ': purana pattern nahi mila.'); continue; }
  narrow.lastIndex = 0;
  writes.push({ file, text: text.replace(narrow, WIDE_SRC.replace(/\\\\/g, '\\')), bak: '.bakrel' });
  console.log('   ->  ' + rel + ': destinations aur blog shamil');
}

/* ============================================= 2) .pages.yml =========== */

console.log('\n2) .pages.yml');

const YML = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML);
if (!ymlRaw) { console.log('XX  .pages.yml nahi mili.'); process.exit(1); }
let doc;
try { doc = yaml.load(ymlRaw); } catch (e) { console.log('XX  parse fail: ' + e.message); process.exit(1); }

let ymlChanged = false;
for (const name of COLLECTIONS) {
  const coll = (doc.content || []).find((c) => c.name === name);
  if (!coll) continue;
  const f = (coll.fields || []).find((x) => x.name === 'related');
  if (!f) continue;
  f.label = 'Related journeys and guides';
  f.description = 'Pick as many as you like — other trips, destination guides or articles. They appear under the itinerary as links.';
  if (Array.isArray(f.options)) f.options = titles.slice();
  else if (f.options && Array.isArray(f.options.values)) f.options = { ...f.options, values: titles.slice() };
  ymlChanged = true;
}
if (ymlChanged) {
  const before = new Set();
  for (const c of yaml.load(ymlRaw).content || []) for (const x of c.fields || []) before.add(c.name + '.' + x.name);
  const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
  const after = new Set();
  for (const c of yaml.load(dumped).content || []) for (const x of c.fields || []) after.add(c.name + '.' + x.name);
  const lost = [...before].filter((n) => !after.has(n));
  if (lost.length) { console.log('XX  fields gum: ' + lost.join(', ')); process.exit(1); }
  console.log('   jaanch: ' + before.size + ' -> ' + after.size + ', koi gum nahi. Fehrist: ' + titles.length);
  writes.push({ file: YML, text: dumped, bak: '.bakrel' });
}

/* ============================================= 3) matan =============== */

console.log('\n3) Matan ke purane link' + (FUZZY ? '   [--fuzzy: tajweez bhi lagegi]' : ''));
console.log('-'.repeat(72));

const strip = (html) => String(html || '')
  .replace(/<\/(p|li|h[1-6]|div)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

const HEAD_RE = /<(h[1-6]|p)[^>]*>\s*(?:<(?:strong|b)[^>]*>\s*)?related\s+(?:journeys?|links?|trips?|tours?)\s*:?\s*(?:<\/(?:strong|b)>\s*)?<\/\1>/i;

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

const stillLost = [];
const proposals = [];
let touched = 0;

for (const f of files) {
  const raw = read(f.full);
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) continue;
  const head = fm[1];
  const body = raw.slice(fm[0].length);

  const m = body.match(HEAD_RE);
  if (!m) continue;

  const from = m.index;
  const after = body.slice(from + m[0].length);
  const nextH2 = after.search(/<h[12][^>]*>/i);
  const to = from + m[0].length + (nextH2 >= 0 ? nextH2 : after.length);

  const names = strip(body.slice(from + m[0].length, to)).filter((n) => n.length <= 80);
  if (!names.length) continue;

  const picked = [];
  const lines = [];

  for (const n of names) {
    let ov = OVERRIDES[n];
    if (ov === undefined) {
      for (const k of Object.keys(OVERRIDES)) if (key(k) === key(n)) { ov = OVERRIDES[k]; break; }
    }
    const direct = (ov && ov.startsWith('/'))
      ? byUrl.get(ov.replace(/\/+$/, ''))
      : byKey.get(key(ov || n));
    if (ov && !direct) {
      console.log('      XX  ' + n + '   <- mera jorR "' + ov + '" kisi safhe se nahi mila');
    }
    if (direct) {
      if (!picked.includes(direct.title)) picked.push(direct.title);
      lines.push('      OK  ' + n + (ov ? '   -> ' + direct.title : ''));
      continue;
    }

    // milta julta dhoondhein
    const qt = toks(n);
    const scored = all.map((c) => ({ c, s: score(qt, c.t) })).sort((a, b) => b.s - a.s);
    const best = scored[0];
    const second = scored[1];
    const clear = best && best.s >= 0.6 && (!second || best.s - second.s >= 0.1);

    if (clear) {
      proposals.push({ ref: f.ref, from: n, to: best.c.title, s: best.s });
      if (FUZZY) {
        if (!picked.includes(best.c.title)) picked.push(best.c.title);
        lines.push('      ~~  ' + n + '   -> ' + best.c.title + '  (' + best.s.toFixed(2) + ')');
      } else {
        lines.push('      ~?  ' + n + '   -> ' + best.c.title + '  (' + best.s.toFixed(2) + ') tajweez');
      }
    } else {
      stillLost.push({ ref: f.ref, name: n, best: best ? best.c.title + ' (' + best.s.toFixed(2) + ')' : '-' });
      lines.push('      XX  ' + n + '   <- koi pakka jorR nahi');
    }
  }

  console.log('   ' + f.ref);
  for (const l of lines) console.log(l);

  const hl = head.split('\n');
  const ri = hl.findIndex((l) => /^related:/.test(l));
  let newHead;
  if (ri >= 0) {
    let end = ri + 1;
    while (end < hl.length && (/^\s/.test(hl[end]) || hl[end].trim() === '')) end++;
    let existing;
    try { existing = yaml.load(hl.slice(ri, end).join('\n')).related; } catch { existing = null; }
    if (Array.isArray(existing) && existing.length) { console.log('      --  pehle se bhara hua, chhoR diya'); continue; }
    const blk = yaml.dump({ related: picked }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
    newHead = [...hl.slice(0, ri), ...blk.split('\n'), ...hl.slice(end)].join('\n');
  } else {
    const blk = yaml.dump({ related: picked }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
    newHead = head.replace(/\s*$/, '') + '\n' + blk;
  }

  try {
    const d = yaml.load(newHead);
    if (picked.length && (!Array.isArray(d.related) || d.related.length !== picked.length)) {
      console.log('      XX  jaanch fail, chhoR diya'); continue;
    }
  } catch (e) { console.log('      XX  YAML fail: ' + e.message); continue; }

  const newBody = (body.slice(0, from) + body.slice(to))
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '').replace(/\n{3,}/g, '\n\n');

  writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + newBody, bak: '.bakrel' });
  touched++;
}

/* ============================================= report ================= */

console.log('\n' + '-'.repeat(72));
console.log(touched + ' trips.');

if (proposals.length) {
  console.log('\nTAJWEEZ (' + proposals.length + ') ' + (FUZZY ? '— lag rahi hain' : '— abhi NAHI lagin'));
  for (const p of proposals) console.log('   ' + p.from.padEnd(34) + ' -> ' + p.to.padEnd(36) + p.s.toFixed(2));
}

if (stillLost.length) {
  console.log('\nKOI PAKKA JORR NAHI (' + stillLost.length + ')');
  for (const l of stillLost) console.log('   ' + l.name.padEnd(34) + ' qareeb tareen: ' + l.best);
}

if (!writes.length) { console.log('\nKuch badalne ko nahi.'); process.exit(0); }

if (!WRITE) {
  console.log('\n' + writes.length + ' file(s).');
  console.log('   Sirf pakke naam:        node tools/fix-related-links3.mjs --write');
  console.log('   Tajweez bhi lagani ho:  node tools/fix-related-links3.mjs --write --fuzzy');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && !fs.existsSync(w.file + w.bak)) fs.copyFileSync(w.file, w.file + w.bak);
  fs.writeFileSync(w.file, w.text, 'utf8');
}
console.log('\n' + writes.length + ' file likhi gayin.  (naqal .bakrel mein)');
console.log('Agla qadam:  npm run build');
