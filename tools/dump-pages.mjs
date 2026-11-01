#!/usr/bin/env node
/**
 * dump-pages.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dikhata hai.
 *
 * Jitne safhe batayein, har ek ki alag file banata hai, taake ek bari file
 * kat na jaye.
 *
 *   node tools/dump-pages.mjs biafo broad-peak gasherbrum-ii nanga-parbat
 *
 * Yeh  _p1.txt  _p2.txt  _p3.txt  _p4.txt  banayega.
 * Do do bhej dein.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'src', 'content');
const args = process.argv.slice(2);

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
const rel = (f) => path.relative(CONTENT, f).split(path.sep).join('/');

if (!args.length) {
  console.log('\nKaun se safhe? Naam saath likhein, jitne chahein:\n');
  console.log('   node tools/dump-pages.mjs biafo broad-peak gasherbrum-ii nanga-parbat\n');
  for (const f of all) console.log('   ' + rel(f));
  process.exit(0);
}

const strip = (html) => String(html || '')
  .replace(/<\/(p|li|h[1-6]|div|tr)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .replace(/&mdash;/g, '--').replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

const words = (s) => (String(s || '').match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;

let n = 0;
const summary = [];

for (const arg of args) {
  const needle = arg.toLowerCase().replace(/\\/g, '/').replace(/\.md$/, '');
  const hits = all.filter((f) => rel(f).toLowerCase().replace(/\.md$/, '').includes(needle));

  if (!hits.length) { console.log('XX  "' + arg + '" se koi safha nahi mila — chhor raha hoon.'); continue; }
  if (hits.length > 1) {
    console.log('XX  "' + arg + '" se ' + hits.length + ' safhe miley, poora naam likhein:');
    for (const f of hits) console.log('      ' + rel(f));
    continue;
  }

  const FILE = hits[0];
  const ref = rel(FILE);
  const out = [];
  const say = (s = '') => out.push(s);
  const wrap = (s, w, c) => { for (let i = 0; i < s.length; i += c) say(w + s.slice(i, i + c)); };

  const raw = fs.readFileSync(FILE, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { console.log('XX  ' + ref + ': front matter nahi parhi gayi'); continue; }

  let d;
  try { d = yaml.load(fm[1]) || {}; } catch (e) { console.log('XX  ' + ref + ': YAML ' + e.message); continue; }

  const body = strip(raw.slice(fm[0].length));
  const itin = Array.isArray(d.itinerary) ? d.itinerary : [];
  const bodyW = body.reduce((a, l) => a + words(l), 0);
  const itinW = itin.reduce((a, x) => a + words(x.title) + words(x.description), 0);

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
  say('   ALFAAZ:  matan ' + bodyW + '  +  itinerary ' + itinW + '  =  ' + (bodyW + itinW));

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
    say('   Day ' + String(day.day || '?').padEnd(8) + (day.title || '[unwan nahi]') +
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

  n++;
  const outFile = path.join(ROOT, '_p' + n + '.txt');
  fs.writeFileSync(outFile, out.join('\n') + '\n', 'utf8');
  summary.push(['_p' + n + '.txt', ref, bodyW + itinW, itin.length]);
}

console.log('');
console.log('LIKHI GAYI FILES');
console.log('-'.repeat(84));
for (const [f, ref, w, dd] of summary) {
  console.log('   ' + f.padEnd(10) + ref.padEnd(50) + String(w).padStart(6) + ' alfaaz   ' + dd + ' din');
}
console.log('');
console.log('   Do do bhej dein.');
