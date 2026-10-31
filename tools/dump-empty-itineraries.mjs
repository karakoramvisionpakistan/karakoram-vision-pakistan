#!/usr/bin/env node
/**
 * dump-empty-itineraries.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dekhta hai.
 *
 * Jin trips ka bayaan khaali hai, unke din ke unwan nikaal kar deta hai,
 * aur jin mein itinerary hai hi nahi unka matan. Inhi ke sahare bayaan
 * likha ja sakta hai — unwan hi tay karta hai ke us din kahan se kahan
 * jana hai.
 *
 * migrate-itineraries.mjs --write ke BAAD chalayein.
 *
 *   node tools/dump-empty-itineraries.mjs
 *
 * Yeh  _empty.txt  bana dega. Wohi file bhej dein.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const strip = (html) => String(html || '')
  .replace(/<\/(p|li|h[1-6])>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&ndash;/g, '–')
  .replace(/&#39;/g, "'")
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');

const files = [];
for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!fs.existsSync(dir)) continue;
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.md')) files.push({ service, name: n, full: path.join(dir, n) });
}

say('KHAALI ITINERARIES');
say('');

const needWriting = [];
const needAll = [];

for (const f of files) {
  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) continue;

  let data;
  try { data = yaml.load(fm[1]); } catch { continue; }
  if (!data) continue;

  const body = raw.slice(fm[0].length);
  const itin = Array.isArray(data.itinerary) ? data.itinerary : [];
  const blank = itin.filter((d) => !d || !d.description).length;

  const info = {
    ref: f.service + '/' + f.name,
    title: data.title || '',
    duration: data.duration || data.duration_days || '',
    destination: data.destination || '',
    difficulty: data.difficulty || '',
    summary: (data.summary || '').replace(/\s+/g, ' ').trim(),
    itin, blank, body,
  };

  if (!itin.length) needAll.push(info);
  else if (blank >= Math.ceil(itin.length / 2)) needWriting.push(info);
  else if (blank > 0) needWriting.push(info);
}

/* ====================================== 1) jin ke unwan hain =========== */

say('1) JIN KE UNWAN HAIN, BAYAAN NAHI');
say('='.repeat(64));

for (const t of needWriting) {
  say('');
  say('#'.repeat(64));
  say('## ' + t.ref);
  say('   Title:       ' + t.title);
  say('   Duration:    ' + t.duration);
  say('   Destination: ' + t.destination);
  say('   Difficulty:  ' + t.difficulty);
  if (t.summary) say('   Summary:     ' + t.summary.slice(0, 300));
  say('   ' + t.blank + ' / ' + t.itin.length + ' din ka bayaan khaali');
  say('');
  for (const d of t.itin) {
    const marks = [];
    if (!d.description) marks.push('BAYAAN KHAALI');
    if (!d.overnight) marks.push('raat khaali');
    if (!d.altitude) marks.push('bulandi khaali');
    say('   Day ' + String(d.day || '').padEnd(6) + (d.title || '[unwan nahi]').padEnd(46) +
        (marks.length ? '  <- ' + marks.join(', ') : ''));
  }
  say('');
}

/* ====================================== 2) jin mein kuch nahi ========== */

say('');
say('2) JIN MEIN ITINERARY HAI HI NAHI');
say('='.repeat(64));

for (const t of needAll) {
  say('');
  say('#'.repeat(64));
  say('## ' + t.ref);
  say('   Title:       ' + t.title);
  say('   Duration:    ' + t.duration);
  say('   Destination: ' + t.destination);
  say('   Difficulty:  ' + t.difficulty);
  if (t.summary) say('   Summary:     ' + t.summary.slice(0, 300));
  say('');
  say('   --- poora matan ---');
  const text = strip(t.body);
  for (const line of text.slice(0, 3000).split('\n')) say('   ' + line);
  if (text.length > 3000) say('   ... [aur ' + (text.length - 3000) + ' harf]');
  say('');
}

/* ====================================== likhna ========================= */

say('');
say('-'.repeat(64));
say(needWriting.length + ' trips mein bayaan likhna hai, ' + needAll.length + ' mein poori itinerary.');

const FILE = path.join(ROOT, '_empty.txt');
fs.writeFileSync(FILE, out.join('\n') + '\n', 'utf8');
console.log('');
console.log('LIKHA: _empty.txt');
