#!/usr/bin/env node
/**
 * audit-and-tag.mjs   (website ke folder mein)
 *
 * 1. Har tour / trek / expedition / jeep safari ki kami ginwata hai —
 *    tags, destination, summary, difficulty, SEO description,
 *    reviewed by, last verified waghera.
 *
 * 2. Tag tajweez karta hai. Khud sirf woh lagata hai jo jugraafiya ki
 *    bina par yaqeeni hain: Nanga Parbat Himalaya mein hai, K2 Karakoram
 *    mein. Yeh raay nahi, haqeeqat hai.
 *
 * 3. Climbing style (alpine / expedition) ALAG flag se lagta hai, kyunke
 *    woh is par hai ke aap trip kis andaz mein chalate hain — yeh aap
 *    tay karenge. --style lagane par hi lagega.
 *
 *   node tools/audit-and-tag.mjs                   -> sirf jaanch aur tajweez
 *   node tools/audit-and-tag.mjs --write           -> jugraafiya wale tag lagana
 *   node tools/audit-and-tag.mjs --write --style   -> climbing style bhi
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const STYLE = process.argv.includes('--style');

const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ---------------------------------------------------- tag ke qaide ---- */

/* Jugraafiya — yeh badalta nahi */
const RANGE = {
  himalaya: ['nanga parbat', 'fairy meadows', 'rupal', 'diamir'],
  karakoram: [
    'k2', 'broad peak', 'gasherbrum', 'baltoro', 'concordia', 'laila', 'trango',
    'spantik', 'gondogoro', 'masherbrum', 'rakaposhi', 'diran', 'batura',
    'shimshal', 'biafo', 'hispar', 'snow lake', 'hushe', 'nangma', 'khosar gang',
    'pastore', 'thalle', 'hunza', 'passu', 'majrooh',
  ],
  'hindu kush': ['chitral', 'tirich mir', 'kalash'],
};

const EIGHT_THOUSAND = ['k2', 'nanga parbat', 'gasherbrum i', 'gasherbrum ii', 'broad peak'];

/* Andaz — yeh raay hai, is liye --style ke baghair nahi lagta */
const STYLE_TAGS = {
  'expedition style': ['k2', 'broad peak', 'gasherbrum', 'nanga parbat'],
  'alpine style': ['laila', 'trango', 'nangma', 'spantik'],
};

const norm = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------------------------------------------------- jaanch ---------- */

const entries = [];

for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(dir, name);
    const text = read(file);
    if (!text || !text.startsWith('---')) continue;
    const end = text.indexOf('\n---', 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)) || {}; } catch { continue; }
    entries.push({ service, file, name, text, end, data });
  }
}

console.log('\n' + entries.length + ' entries dekhi gayin\n');

/* ---- kami ---- */

console.log('========== 1) KYA KAM HAI ==========');

const CHECKS = [
  ['tags', (d) => Array.isArray(d.tags) && d.tags.length],
  ['destination', (d) => !!String(d.destination || '').trim()],
  ['summary', (d) => String(d.summary || '').trim().length > 30],
  ['difficulty', (d) => !!String(d.difficulty || '').trim()],
  ['duration', (d) => !!String(d.duration || '').trim()],
  ['seo description', (d) => String(d?.seo?.description || '').trim().length > 50],
  ['cover photo', (d) => !!String(d.cover_image || d.cover_source || '').trim()],
  ['photo description', (d) => !!String(d.cover_image_alt || '').trim()],
  ['reviewed by', (d) => !!String(d.reviewed_by || '').trim()],
  ['last verified', (d) => !!String(d.last_verified || '').trim()],
];

const tally = {};
for (const e of entries) {
  const missing = CHECKS.filter(([, ok]) => !ok(e.data)).map(([label]) => label);
  e.missing = missing;
  for (const m of missing) tally[m] = (tally[m] || 0) + 1;
}

console.log('Kul ginti:');
for (const [label] of CHECKS) {
  const n = tally[label] || 0;
  const bar = n ? '  ' + String(n).padStart(2) + ' entries mein nahi' : '  sab mein hai';
  console.log('   ' + label.padEnd(20) + bar);
}

console.log('\nEntry ke hisaab se:');
for (const service of SERVICES) {
  const list = entries.filter((e) => e.service === service && e.missing.length);
  if (!list.length) continue;
  console.log('\n--- ' + service);
  for (const e of list) {
    console.log('   ' + String(e.data.title || e.name).slice(0, 44).padEnd(46) + e.missing.join(', '));
  }
}

/* ---- tag tajweez ---- */

console.log('\n\n========== 2) TAG JO LAGAYE JAYENGE ==========');

const plans = [];

for (const e of entries) {
  const hay = norm([e.data.title, e.data.destination, (e.data.tags || []).join(' ')].join(' '));
  const have = new Set((e.data.tags || []).map((t) => norm(t)));
  const add = [];

  for (const [range, names] of Object.entries(RANGE)) {
    if (have.has(range)) continue;
    if (names.some((n) => hay.includes(n))) add.push({ tag: range, why: 'jugraafiya' });
  }

  /* 8000m sirf expeditions par. Base camp trek aur view tour 8,000m par
     chaRte nahi — un par yeh tag lagana ghalat bayani hoti. */
  if (e.service === 'expeditions' && !have.has('8000m') && EIGHT_THOUSAND.some((n) => hay.includes(n))) {
    add.push({ tag: '8000m', why: 'bulandi' });
  }

  if (STYLE) {
    for (const [tag, names] of Object.entries(STYLE_TAGS)) {
      if (have.has(norm(tag))) continue;
      if (names.some((n) => hay.includes(n))) add.push({ tag, why: 'andaz' });
    }
  }

  if (add.length) {
    e.add = add;
    plans.push(e);
  }
}

if (!plans.length) console.log('   (kuch lagane ko nahi)');
for (const p of plans) {
  console.log('   ' + String(p.data.title || p.name).slice(0, 44).padEnd(46) + p.add.map((a) => a.tag).join(', '));
}

if (!STYLE) {
  console.log('\n   Climbing style (alpine / expedition) abhi shaamil nahi.');
  console.log('   Woh is par hai ke aap trip kis andaz mein chalate hain, is liye');
  console.log('   --style lagane par hi lagega. Tajweez yeh hai:');
  console.log('      expedition style : K2, Broad Peak, Gasherbrum I aur II, Nanga Parbat');
  console.log('      alpine style     : Laila Peak, Trango, Nangma Valley, Spantik');
  console.log('   Agar yeh durust hai to --style bhi laga dein.');
}

/* ---------------------------------------------------- likhna ---------- */

console.log('\n--------------------------------------------------');

if (!plans.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(plans.length + ' entries mein tag lagenge. Lagane ke liye:');
  console.log('   node tools/audit-and-tag.mjs --write');
  console.log('   node tools/audit-and-tag.mjs --write --style');
  process.exit(0);
}

/* tags ke block mein saleeqe se daalna — poori front matter dobara nahi likhte,
   warna tarteeb aur comments zaya ho jate hain */
function addTags(text, end, tags) {
  const head = text.slice(0, end + 1);
  const rest = text.slice(end + 1);
  const lines = head.split(/\r?\n/);

  const i = lines.findIndex((l) => /^tags\s*:/.test(l));
  const block = tags.map((t) => '  - ' + t);

  if (i === -1) {
    // koi tags nahi — front matter ke aakhir mein naya block
    const close = lines.length - 2;
    lines.splice(close + 1, 0, 'tags:', ...block);
    return lines.join('\n') + rest;
  }

  if (/^tags\s*:\s*\[\s*\]\s*$/.test(lines[i])) {
    lines[i] = 'tags:';
    lines.splice(i + 1, 0, ...block);
    return lines.join('\n') + rest;
  }

  let j = i + 1;
  while (j < lines.length && /^\s*-\s+/.test(lines[j])) j++;
  lines.splice(j, 0, ...block);
  return lines.join('\n') + rest;
}

let done = 0;
for (const p of plans) {
  const next = addTags(p.text, p.end, p.add.map((a) => a.tag));
  // jaanch: nayi front matter ab bhi parh hoti hai?
  const e2 = next.indexOf('\n---', 3);
  try { yaml.load(next.slice(3, e2)); }
  catch (err) {
    console.log('XX  ' + p.name + ': front matter toot rahi thi, chhoR diya (' + err.message + ')');
    continue;
  }
  fs.writeFileSync(p.file, next, 'utf8');
  done++;
}

console.log(done + ' entries mein tag lag gaye.');
console.log('\nAgla qadam:  npm run build');
