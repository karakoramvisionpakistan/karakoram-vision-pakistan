#!/usr/bin/env node
/**
 * fix-csp.mjs   (website ke folder mein)  — FORAN CHALAYEIN
 *
 * src/_headers ki script-src qatar kharab ho gayi thi:
 *
 *   script-src  https://static.cloudflareinsights.com'self' 'unsafe-inline' ...
 *                                                   ^^^ space ghayab
 *
 * Pata aur 'self' chipak kar ek bemaani token ban gaye, jis se poori
 * directive kharab ho gayi aur website ki SAARI JavaScript block ho gayi —
 * Alpine, FAQ, mobile menu, search, contact form, sab.
 *
 * Yeh script har directive ko theek se tokenize kar ke dobara jorti hai.
 *
 *   node tools/fix-csp.mjs            -> sirf dekhna
 *   node tools/fix-csp.mjs --write    -> theek karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

const CANDIDATES = [
  path.join(ROOT, 'src', '_headers'),
  path.join(ROOT, '_headers'),
  path.join(ROOT, 'public', '_headers'),
];

const file = CANDIDATES.find((f) => fs.existsSync(f));
if (!file) { console.log('XX  _headers nahi mili.'); process.exit(1); }

console.log('\nFile: ' + path.relative(ROOT, file).replace(/\\/g, '/'));

let text = fs.readFileSync(file, 'utf8');
const before = text;

/* Har directive ko theek se tokenize kar ke dobara joRna.
   [^\s']+  -> bina quote wala hissa (pata), quote par ruk jata hai
   '[^']*'  -> quote wala token ('self', 'unsafe-inline')
   Is tarah chipke hue "...com'self'" do alag tokens ban jate hain. */
const tidy = (directive) => {
  const tokens = directive.match(/[^\s']+|'[^']*'/g) || [];
  const seen = new Set();
  const out = [];
  for (const t of tokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.join(' ');
};

console.log('\nJo directives mili:');

let count = 0;
text = text.replace(/([a-z-]+-src|default-src|frame-ancestors|form-action|base-uri)([^;\n]*)/g, (whole, name, rest) => {
  const fixed = tidy(name + rest);
  const original = (name + rest).replace(/\s+/g, ' ').trim();
  if (fixed !== original) {
    count++;
    console.log('\n   ' + name);
    console.log('   purana: ' + original);
    console.log('   naya  : ' + fixed);
  }
  return fixed;
});

/* Aakhri jaanch: script-src mein 'self' mojood hona hi chahiye */
const m = text.match(/script-src([^;\n]*)/);
if (m) {
  const d = m[0];
  console.log('\nAakhri script-src:');
  console.log('   ' + d.trim());
  if (!/\s'self'/.test(d)) {
    console.log("\nXX  'self' ab bhi theek se nahi hai — rok raha hoon.");
    console.log('    Mujhe poori _headers file bhej dein.');
    process.exit(1);
  }
  console.log("\n   OK  'self' apni jagah hai — JavaScript dobara chalegi.");
}

console.log('\n--------------------------------------------------');

if (text === before) {
  console.log('Kuch badalne ko nahi hai — directives pehle se theek hain.');
  process.exit(0);
}

console.log(count + ' directive theek hogi.');

if (!WRITE) {
  console.log('\nTheek karne ke liye:');
  console.log('   node tools/fix-csp.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(file + '.bak')) fs.copyFileSync(file, file + '.bak');
fs.writeFileSync(file, text, 'utf8');
console.log('LIKHA: ' + path.relative(ROOT, file).replace(/\\/g, '/'));
console.log('\nAgla qadam:  npm run build  phir commit aur push');
