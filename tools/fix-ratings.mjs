#!/usr/bin/env node
/**
 * fix-ratings.mjs   (website ke folder mein)
 *
 * site.json mein Google ka rating aur link bharta hai, taake footer ka
 * woh box nazar aane lage jo pehle se bana hua hai magar khaali hone ki
 * wajah se chhupa hua tha.
 *
 * Markup pehle se mojood hai (footer.njk line 22) aur Tripadvisor se
 * PEHLE aata hai. Sirf qeemat ki kami thi.
 *
 * Baad mein reviews barh jayein to dobara chala lein:
 *
 *   node tools/fix-ratings.mjs --score "5.0 (8 reviews)" --write
 *
 * Bagair kisi argument ke yeh qeematein lagti hain:
 *   google_score : 5.0 * (3)
 *   google_url   : Google Maps ka link, place ID ke sath
 *
 *   node tools/fix-ratings.mjs            -> sirf dikhana
 *   node tools/fix-ratings.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const say = (s = '') => console.log(s);

const argOf = (name) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const PLACE_ID = 'ChIJBxdfeoBj5DgRjqatdvq71Hc';

/* ★ seedha likha hai, PowerShell se nahi guzarta, is liye mehfooz hai */
const SCORE = argOf('score') || '5.0 ★ (3)';
const URL = argOf('url') || 'https://www.google.com/maps/place/?q=place_id:' + PLACE_ID;

const FILE = path.join(ROOT, 'src', '_data', 'site.json');

say('\nFOOTER MEIN GOOGLE KA RATING');
say('='.repeat(78));

if (!fs.existsSync(FILE)) { say('XX  src/_data/site.json nahi mili.'); process.exit(1); }

const before = fs.readFileSync(FILE, 'utf8');
let data;
try { data = JSON.parse(before); }
catch (e) { say('XX  site.json parh nahi hoti: ' + e.message); process.exit(1); }

if (!data.ratings || typeof data.ratings !== 'object') {
  say('XX  site.json mein "ratings" ka khaana nahi mila.');
  say('    Yeh ajeeb hai — mujhe batayein, main dekh lunga.');
  process.exit(1);
}

const old = { ...data.ratings };

say('');
say('1. ABHI KYA HAI');
say('-'.repeat(78));
for (const k of ['google_score', 'google_url', 'tripadvisor_score', 'tripadvisor_url']) {
  const v = String(old[k] ?? '').trim();
  say('   ' + k.padEnd(20) + (v || '[khaali]'));
}

say('');
say('2. KYA BADLEGA');
say('-'.repeat(78));
const changes = [];
if (String(old.google_score ?? '').trim() !== SCORE) changes.push(['google_score', old.google_score, SCORE]);
if (String(old.google_url ?? '').trim() !== URL) changes.push(['google_url', old.google_url, URL]);

if (!changes.length) {
  say('   Dono pehle se theek hain. Kuch nahi badla.');
  process.exit(0);
}
for (const [k, from, to] of changes) {
  say('   ' + k);
  say('      pehle: ' + (String(from ?? '').trim() || '[khaali]'));
  say('      ab:    ' + to);
}

say('');
say('   Tripadvisor ko haath nahi lagaya ja raha. Us ka link khaali rehne');
say('   par footer khud site.social.tripadvisor istemal kar leta hai, jo');
say('   pehle se laga hua hai.');

/* ---- naya matan ---- */
data.ratings.google_score = SCORE;
data.ratings.google_url = URL;
const after = JSON.stringify(data, null, 2) + '\n';

/* ---- jaanch ---- */
say('');
say('3. JAANCH');
say('-'.repeat(78));
const problems = [];
let check;
try { check = JSON.parse(after); }
catch (e) { say('   XX  naya JSON parh nahi hota: ' + e.message); problems.push('parse'); }

if (check) {
  const sameKeys = JSON.stringify(Object.keys(check)) === JSON.stringify(Object.keys(data));
  const okScore = check.ratings.google_score === SCORE;
  const okUrl = check.ratings.google_url === URL;
  const okTa = String(check.ratings.tripadvisor_url ?? '') === String(old.tripadvisor_url ?? '')
    && String(check.ratings.tripadvisor_score ?? '') === String(old.tripadvisor_score ?? '');

  /* ratings ke alawa kuch nahi badla? */
  const a = JSON.parse(before), b = JSON.parse(after);
  delete a.ratings; delete b.ratings;
  const restSame = JSON.stringify(a) === JSON.stringify(b);

  const checks = [
    ['bare khaane utne hi hain', sameKeys],
    ['google_score laga', okScore],
    ['google_url laga', okUrl],
    ['tripadvisor waisa hi hai', okTa],
    ['ratings ke alawa kuch nahi badla', restSame],
    ['URL mein place ID mojood', URL.includes(PLACE_ID) || !!argOf('url')],
  ];
  for (const [label, pass] of checks) {
    if (!pass) problems.push(label);
    say('   ' + (pass ? 'OK ' : 'XX ') + label);
  }
}

say('');
say('='.repeat(78));
if (problems.length) {
  say('XX XX XX  ' + problems.length + ' masle — FILE NAHI LIKHI:');
  for (const p of problems) say('          ' + p);
  process.exit(1);
}

say('   Sab theek.');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-ratings.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bakratings')) fs.copyFileSync(FILE, FILE + '.bakratings');
fs.writeFileSync(FILE, after, 'utf8');
say('LIKHA: src/_data/site.json   (backup: site.json.bakratings)');
say('');
say('Agla qadam:  npm run build');
say('Phir footer mein Tripadvisor se pehle Google ka box nazar aayega.');
