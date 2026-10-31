#!/usr/bin/env node
/**
 * audit-itineraries2.mjs   (website ke folder mein)
 *
 * Kuch badalta nahi — sirf dekhta hai.
 *
 * Pehla audit kehta hai ke 31 trips mein kahin "Day" ka nishan nahi. Lekin
 * itinerary kahin hai zaroor. To yeh dekhta hai ke trip ki file mein asal
 * mein kya kya khaane hain, aur matan kis shakal ka hai.
 *
 *   node tools/audit-itineraries2.mjs
 *
 * Yeh  _itineraries2.txt  bana dega. Wohi file mujhe bhej dein.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const files = [];
for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', 'content', service);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    files.push({ service, name, full: path.join(dir, name) });
  }
}

const parsed = files.map((f) => {
  const raw = fs.readFileSync(f.full, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return { ...f, raw, head: fm ? fm[1] : '', body: fm ? raw.slice(fm[0].length) : raw };
});

say('ITINERARY AUDIT 2');
say('Kul ' + parsed.length + ' trips');
say('');

/* ============================================= 1) front matter ke khaane */

say('1) TRIP KI FILE MEIN KAUN KAUN SE KHAANE HAIN');
say('-'.repeat(60));
say('(khaane ka naam, kitni trips mein hai, kaisa hai)');
say('');

const keys = new Map();
for (const p of parsed) {
  for (const line of p.head.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:(.*)$/);   // sirf top level
    if (!m) continue;
    const k = m[1];
    const rest = m[2].trim();
    const kind = !rest ? 'list/nested' : (rest === '[]' ? 'khaali list' : 'ek qeemat');
    if (!keys.has(k)) keys.set(k, { n: 0, kinds: new Set() });
    const e = keys.get(k);
    e.n++;
    e.kinds.add(kind);
  }
}

const sorted = [...keys.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]));
for (const [k, e] of sorted) {
  say('   ' + String(e.n).padStart(3) + '  ' + k.padEnd(26) + [...e.kinds].join(' + '));
}
say('');

/* Jin naamon se itinerary ka shak hota hai */
const SUSPECT = /itiner|day|programme|program|schedule|route|plan|stage|overnight|night/i;
const hits = sorted.filter(([k]) => SUSPECT.test(k));
say('   Itinerary jesa lagne wale khaane: ' + (hits.length ? hits.map(([k]) => k).join(', ') : 'koi nahi'));
say('');

/* ============================================= 2) matan ka haal ======== */

say('2) MATAN (body) KA HAAL');
say('-'.repeat(60));
say('');

const lens = [];
for (const p of parsed) {
  const words = (p.body.trim().match(/\S+/g) || []).length;
  lens.push({ ref: p.service + '/' + p.name, words, heads: (p.body.match(/^#{1,6}\s+.*/gm) || []).length });
}
lens.sort((a, b) => b.words - a.words);
say('   Sab se bara matan: ' + lens[0].words + ' alfaaz  (' + lens[0].ref + ')');
say('   Sab se chhota:     ' + lens[lens.length - 1].words + ' alfaaz  (' + lens[lens.length - 1].ref + ')');
say('   Darmiyana:         ' + lens[Math.floor(lens.length / 2)].words + ' alfaaz');
say('');
say('   Har trip ka matan:');
for (const l of lens) say('      ' + String(l.words).padStart(5) + ' alfaaz, ' + String(l.heads).padStart(2) + ' heading   ' + l.ref);
say('');

/* ============================================= 3) poore namoone ======== */

say('3) TEEN POORI FILEIN');
say('='.repeat(60));
say('(ek tour, ek trek, ek expedition — jo sab se bari ho)');

const pickOne = (service) => {
  const list = parsed.filter((p) => p.service === service);
  if (!list.length) return null;
  list.sort((a, b) => b.raw.length - a.raw.length);
  return list[0];
};

for (const service of ['tours', 'trekking', 'expeditions']) {
  const p = pickOne(service);
  if (!p) continue;

  say('');
  say('#'.repeat(60));
  say('## ' + p.service + '/' + p.name);
  say('#'.repeat(60));
  say('');
  say('--- FRONT MATTER (poora) ---');
  for (const line of p.head.split('\n')) say('   ' + line);
  say('');
  say('--- MATAN (pehle 2500 harf) ---');
  for (const line of p.body.slice(0, 2500).split('\n')) say('   ' + line);
  if (p.body.length > 2500) say('   ... [aur ' + (p.body.length - 2500) + ' harf]');
  say('');
}

/* ============================================= likhna ================== */

const FILE = path.join(ROOT, '_itineraries2.txt');
fs.writeFileSync(FILE, out.join('\n') + '\n', 'utf8');

console.log('');
console.log('-'.repeat(60));
console.log('LIKHA: _itineraries2.txt');
console.log('');
console.log('Yeh file mujhe bhej dein.');
