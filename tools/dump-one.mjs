#!/usr/bin/env node
/**
 * dump-one.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dikhata hai.
 *
 * Ek safhe ka poora matan nikalta hai: front matter ke khaane, safhe ka
 * matan, aur har din ka unwan aur bayaan. Chhoti file banti hai, is liye
 * katti nahi.
 *
 *   node tools/dump-one.mjs trekking/k2-base-camp-baltoro-trek.md
 *   node tools/dump-one.mjs k2-base            <- naam ka hissa bhi kaafi
 *
 * Yeh  _one.txt  bana dega. Wohi file bhej dein.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'src', 'content');
const arg = process.argv[2];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

/* ---- safha dhoondna ---------------------------------------------------- */

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith('.md')) acc.push(full);
  }
  return acc;
};

if (!fs.existsSync(CONTENT)) { console.log('XX  src/content nahi mili. Website ke folder mein chalayein.'); process.exit(1); }
const all = walk(CONTENT);

if (!arg) {
  console.log('\nKis safhe ka matan chahiye? Naam saath likhein:\n');
  console.log('   node tools/dump-one.mjs trekking/k2-base-camp-baltoro-trek.md\n');
  console.log('Maujood safhe:\n');
  for (const f of all) console.log('   ' + path.relative(CONTENT, f).split(path.sep).join('/'));
  process.exit(0);
}

const needle = arg.toLowerCase().replace(/\\/g, '/').replace(/\.md$/, '');
const hits = all.filter((f) => path.relative(CONTENT, f).split(path.sep).join('/').toLowerCase().replace(/\.md$/, '').includes(needle));

if (!hits.length) { console.log('XX  "' + arg + '" se koi safha nahi mila. Bina naam chala kar list dekh lein.'); process.exit(1); }
if (hits.length > 1) {
  console.log('XX  "' + arg + '" se ' + hits.length + ' safhe miley — poora naam likhein:\n');
  for (const f of hits) console.log('   ' + path.relative(CONTENT, f).split(path.sep).join('/'));
  process.exit(1);
}

const FILE = hits[0];
const ref = path.relative(CONTENT, FILE).split(path.sep).join('/');

/* ---- parhna ------------------------------------------------------------ */

const strip = (html) => String(html || '')
  .replace(/<\/(p|li|h[1-6]|div|tr)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .replace(/&mdash;/g, '--').replace(/&rsquo;/g, "'")
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

const words = (s) => (String(s || '').match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;
const wrap = (s, w, n) => { for (let i = 0; i < s.length; i += n) say(w + s.slice(i, i + n)); };

const raw = fs.readFileSync(FILE, 'utf8');
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
if (!fm) { console.log('XX  front matter nahi parhi gayi.'); process.exit(1); }

let d;
try { d = yaml.load(fm[1]) || {}; } catch (e) { console.log('XX  YAML: ' + e.message); process.exit(1); }

const body = strip(raw.slice(fm[0].length));
const itin = Array.isArray(d.itinerary) ? d.itinerary : [];
const bodyW = body.reduce((n, l) => n + words(l), 0);
const itinW = itin.reduce((n, day) => n + words(day.title) + words(day.description), 0);

say('EK SAFHA — MAUJOODA MATAN');
say('='.repeat(84));
say('## ' + ref);
say('='.repeat(84));
say('   Title:        ' + (d.title || ''));
say('   Duration:     ' + (d.duration || d.duration_days || ''));
say('   Destination:  ' + (d.destination || ''));
say('   Difficulty:   ' + (d.difficulty || ''));
say('   Group size:   ' + (d.group_size || ''));
say('   Price from:   ' + (d.price_from || '') + '   deposit: ' + (d.deposit || ''));
say('   Best season:  ' + (d.best_season || '[koi khaana nahi]'));
say('   Din:          ' + itin.length);
say('   Highlights:   ' + ((d.highlights || []).join(' | ') || '[khaali]'));
say('   Included:     ' + ((d.included || []).length) + ' nuqte');
say('   Excluded:     ' + ((d.excluded || []).length) + ' nuqte');
say('   Packing:      ' + ((d.packing_list || []).length) + ' nuqte');
say('   Apne FAQ:     ' + ((d.faqs || []).length));
say('   Reviews:      ' + ((d.reviews || []).length));
say('   Gallery:      ' + ((d.gallery || []).length) + ' tasveerein');
say('   Trip leader:  ' + ((d.trip_leader && d.trip_leader.name) ? d.trip_leader.name : '[khaali]'));
say('   Related:      ' + ((d.related || []).length));
say('');
say('   ALFAAZ:  safhe ka matan ' + bodyW + '  +  itinerary ' + itinW + '  =  ' + (bodyW + itinW));

say('');
say('   --- SAFHE KA MATAN (' + bodyW + ' alfaaz) ---');
if (!body.length) say('      [khaali]');
for (const line of body) wrap(line, '      ', 92);

say('');
say('   --- ITINERARY (' + itin.length + ' din) ---');
if (!itin.length) say('      [khaali]');
for (const day of itin) {
  const meta = [day.altitude, day.distance, day.hours].filter(Boolean).join('  ');
  say('');
  say('   Day ' + String(day.day || '?').padEnd(6) + (day.title || '[unwan nahi]') +
      (meta ? '   [' + meta + ']' : '') + '   ' + (day.overnight || '-'));
  const t = String(day.description || '');
  say('      (' + words(t) + ' alfaaz)' + (t.trim() ? '' : '   [bayaan khaali]'));
  wrap(t, '      ', 92);
}

if ((d.faqs || []).length) {
  say('');
  say('   --- IS TRIP KE APNE SAWAL ---');
  for (const q of d.faqs) say('      ' + (q.question || ''));
}

fs.writeFileSync(path.join(ROOT, '_one.txt'), out.join('\n') + '\n', 'utf8');
console.log('');
console.log('-'.repeat(84));
console.log('LIKHA: _one.txt');
