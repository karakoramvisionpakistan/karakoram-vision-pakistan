#!/usr/bin/env node
/**
 * dump-money-pages.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dikhata hai.
 *
 * Aath safhe jo waqai paisa kamate hain. In ka maujooda matan poora
 * dikhata hai — har din ka unwan aur bayaan, aur safhe ka apna matan —
 * taake unhein barhaya ja sake bina client ka raasta badle.
 *
 *   node tools/dump-money-pages.mjs
 *
 * Yeh  _money.txt  bana dega. Wohi file bhej dein.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();

/* Tarteeb qeemat ke hisab se — sab se ahem pehle */
const PAGES = [
  'trekking/k2-base-camp-baltoro-trek.md',
  'trekking/gondogoro-la-circuit-trek.md',
  'trekking/biafo-hisper-trek.md',
  'expeditions/k2-expediiton.md',
  'expeditions/broad-peak-expedition.md',
  'expeditions/gasherbrum-ii-expedition.md',
  'expeditions/nanga-parbat-expedition.md',
  'tours/hunza-valley-heritage-tour.md',
];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const strip = (html) => String(html || '')
  .replace(/<\/(p|li|h[1-6]|div|tr)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

const words = (s) => (String(s || '').match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;
const wrap = (s, w, n) => { for (let i = 0; i < s.length; i += n) say(w + s.slice(i, i + n)); };

say('AATH AHEM SAFHE — MAUJOODA MATAN');
say('='.repeat(84));

for (const ref of PAGES) {
  const full = path.join(ROOT, 'src', 'content', ...ref.split('/'));
  if (!fs.existsSync(full)) { say('\nXX  ' + ref + ': file nahi mili'); continue; }

  const raw = fs.readFileSync(full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) { say('\nXX  ' + ref + ': front matter nahi parhi gayi'); continue; }

  let d;
  try { d = yaml.load(fm[1]) || {}; } catch (e) { say('\nXX  ' + ref + ': YAML ' + e.message); continue; }

  const body = strip(raw.slice(fm[0].length));
  const itin = Array.isArray(d.itinerary) ? d.itinerary : [];

  say('');
  say('#'.repeat(84));
  say('## ' + ref);
  say('#'.repeat(84));
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

  say('');
  say('   --- SAFHE KA MATAN (' + body.reduce((n, l) => n + words(l), 0) + ' alfaaz) ---');
  for (const line of body) wrap(line, '      ', 92);

  say('');
  say('   --- ITINERARY ---');
  for (const day of itin) {
    const meta = [day.altitude, day.distance, day.hours].filter(Boolean).join('  ');
    say('');
    say('   Day ' + String(day.day || '?').padEnd(8) + (day.title || '[unwan nahi]') +
        (meta ? '   [' + meta + ']' : '') + '   ' + (day.overnight || '-'));
    const t = String(day.description || '');
    say('      (' + words(t) + ' alfaaz)');
    wrap(t, '      ', 92);
  }

  if ((d.faqs || []).length) {
    say('');
    say('   --- IS TRIP KE APNE SAWAL ---');
    for (const q of d.faqs) say('      ' + (q.question || ''));
  }
}

fs.writeFileSync(path.join(ROOT, '_money.txt'), out.join('\n') + '\n', 'utf8');
console.log('');
console.log('-'.repeat(84));
console.log('LIKHA: _money.txt');
