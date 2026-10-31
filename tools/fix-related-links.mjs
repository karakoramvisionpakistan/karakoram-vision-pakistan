#!/usr/bin/env node
/**
 * fix-related-links.mjs   (website ke folder mein)
 *
 * MASLA
 *   Safhe par "Related journeys" saada likhai ke tor par parha hai, matan
 *   ke HTML mein, is liye clickable nahi. Naya khaana khaali hai.
 *
 * HAL
 *   1. Fehrist barhao — trips ke sath destinations aur blog bhi, kyunke
 *      purane link un ke bhi hain ("Hunza valley guide", "Best time to
 *      visit Skardu").
 *   2. Matan mein se purane naam parh kar naye khaane mein daalo.
 *   3. Woh saada hissa matan se hata do.
 *
 *   Jo naam fehrist mein na mile unhein chhoR deta hai aur naam bata deta
 *   hai — andaza laga kar ghalat safhe par nahi bhejta.
 *
 *   node tools/fix-related-links.mjs            -> sirf dikhana
 *   node tools/fix-related-links.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const COLLECTIONS = ['tours', 'trekking', 'expeditions', 'jeep_safaris', 'hunting_services'];

/* Ab sirf trips nahi — destination aur blog ke safhe bhi. */
const WIDE = "/^\\\\/(tours|trekking|expeditions|jeep-safaris|hunting-services|destinations|blog)\\\\/[^/]+\\\\/?$/";
const WIDE_RE = /^\/(tours|trekking|expeditions|jeep-safaris|hunting-services|destinations|blog)\/[^/]+\/?$/;

const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ============================================= 0) fehrist ============== */

console.log('\n0) Fehrist');

const catRaw = read(path.join(ROOT, 'src', '_data', 'structuredCatalog.json'));
if (!catRaw) { console.log('XX  structuredCatalog.json nahi mili. Pehle npm run build.'); process.exit(1); }

const cat = JSON.parse(catRaw);
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
walk(cat, 0);

const titles = [];
const seenT = new Set();
const byKey = new Map();
const key = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

for (const it of found) {
  if (!it.title) continue;
  const k = it.title.toLowerCase();
  if (seenT.has(k)) continue;
  seenT.add(k);
  titles.push(it.title);
  byKey.set(key(it.title), it);
}
titles.sort((a, b) => a.localeCompare(b));

const kinds = {};
for (const it of found) { const s = it.url.split('/')[1]; kinds[s] = (kinds[s] || 0) + 1; }
console.log('   ' + titles.length + ' safhe: ' + Object.entries(kinds).map(([k, n]) => n + ' ' + k).join(', '));
if (titles.length < 10) { console.log('XX  itni kam? ruk raha hoon.'); process.exit(1); }

/* ============================================= 1) filter widen ========= */

console.log('\n1) Filter aur sync tool ki fehrist barhana');

const narrow = /\/\^\\\/\(tours\|trekking\|expeditions\|jeep-safaris\|hunting-services\)\\\/\[\^\/\]\+\\\/\?\$\//g;

for (const rel of ['eleventy.config.js', 'tools/sync-related-options.mjs']) {
  const file = path.join(ROOT, rel);
  const text = read(file);
  if (!text) { console.log('   !   ' + rel + ' nahi mili.'); continue; }
  if (text.includes('destinations|blog')) { console.log('   OK  ' + rel + ': pehle se barhi hui hai.'); continue; }

  narrow.lastIndex = 0;
  const n = (text.match(narrow) || []).length;
  if (!n) { console.log('   !   ' + rel + ': purana pattern nahi mila.'); continue; }

  narrow.lastIndex = 0;
  writes.push({ file, text: text.replace(narrow, WIDE.replace(/\\\\/g, '\\')), bak: '.bakrel' });
  console.log('   ->  ' + rel + ': destinations aur blog shamil');
}

/* ============================================= 2) .pages.yml =========== */

console.log('\n2) .pages.yml — fehrist aur naam');

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
  if (!f) { console.log('   !   ' + name + ': related ka khaana nahi mila.'); continue; }

  f.label = 'Related journeys and guides';
  f.description = 'Pick as many as you like — other trips, destination guides or articles. They appear under the itinerary as links. Nearby trips in the same valley, an easier or harder version of this one, or the guide someone would read next.';
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
  console.log('   jaanch: ' + before.size + ' -> ' + after.size + ' fields, koi gum nahi.');
  console.log('   ->  fehrist mein ab ' + titles.length + ' safhe');
  writes.push({ file: YML, text: dumped, bak: '.bakrel' });
}

/* ============================================= 3) matan se nikalna ===== */

console.log('\n3) Matan se purane link nikalna');
console.log('-'.repeat(70));

const strip = (html) => String(html || '')
  .replace(/<\/(p|li|h[1-6]|div)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

/* "Related journeys" ki sarkhi — heading ya mota likha hua */
const HEAD_RE = /<(h[1-6]|p)[^>]*>\s*(?:<(?:strong|b)[^>]*>\s*)?related\s+(?:journeys?|links?|trips?|tours?)\s*:?\s*(?:<\/(?:strong|b)>\s*)?<\/\1>/i;

const files = [];
for (const s of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', s);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ ref: s + '/' + n, full: path.join(dir, n) });
}

const unmatched = [];
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
  /* sarkhi se agli <h2> tak, ya matan ke aakhir tak */
  const after = body.slice(from + m[0].length);
  const nextH2 = after.search(/<h[12][^>]*>/i);
  const to = from + m[0].length + (nextH2 >= 0 ? nextH2 : after.length);

  const names = strip(body.slice(from + m[0].length, to));
  if (!names.length) continue;

  const picked = [];
  const missed = [];
  for (const n of names) {
    if (n.length > 80) continue;                       // jumla hai, naam nahi
    const hit = byKey.get(key(n));
    if (hit) { if (!picked.includes(hit.title)) picked.push(hit.title); }
    else missed.push(n);
  }

  console.log('   ' + f.ref);
  for (const p of picked) console.log('      OK  ' + p);
  for (const x of missed) { console.log('      ??  ' + x + '   <- fehrist mein nahi mila'); unmatched.push(f.ref + ': ' + x); }

  /* front matter mein related: likhein (agar pehle se bhara na ho) */
  const lines = head.split('\n');
  const ri = lines.findIndex((l) => /^related:/.test(l));
  let newHead;

  if (ri >= 0) {
    let end = ri + 1;
    while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end++;
    const existing = yaml.load(lines.slice(ri, end).join('\n')).related;
    if (Array.isArray(existing) && existing.length) {
      console.log('      --  naya khaana pehle se bhara hua hai, chhoR diya');
      newHead = head;
    } else {
      const blk = yaml.dump({ related: picked }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
      newHead = [...lines.slice(0, ri), ...blk.split('\n'), ...lines.slice(end)].join('\n');
    }
  } else {
    const blk = yaml.dump({ related: picked }, { lineWidth: -1, noRefs: true }).replace(/\s*$/, '');
    newHead = head.replace(/\s*$/, '') + '\n' + blk;
  }

  const newBody = (body.slice(0, from) + body.slice(to))
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
    .replace(/\n{3,}/g, '\n\n');

  if (!picked.length && !missed.length) continue;

  /* jaanch */
  try {
    const d = yaml.load(newHead);
    if (!d || (picked.length && (!Array.isArray(d.related) || d.related.length !== picked.length))) {
      console.log('      XX  jaanch fail, chhoR diya');
      continue;
    }
  } catch (e) { console.log('      XX  YAML fail: ' + e.message); continue; }

  writes.push({ file: f.full, text: '---\n' + newHead + '\n---\n' + newBody, bak: '.bakrel' });
  touched++;
}

if (!touched) console.log('   Kisi matan mein purana "Related journeys" ka hissa nahi mila.');

/* ============================================= report ================= */

console.log('\n' + '-'.repeat(70));
console.log(touched + ' trips ke purane link naye khaane mein jayenge.');

if (unmatched.length) {
  console.log('\nJo naam fehrist mein nahi mile (' + unmatched.length + '):');
  for (const u of unmatched) console.log('   ' + u);
  console.log('   Yeh matan se nikal jayenge magar link nahi banenge — shayad');
  console.log('   woh safha ab maujood nahi, ya uska naam badal gaya hai.');
}

if (!writes.length) { console.log('\nKuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log('\n' + writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/fix-related-links.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && !fs.existsSync(w.file + w.bak)) fs.copyFileSync(w.file, w.file + w.bak);
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
