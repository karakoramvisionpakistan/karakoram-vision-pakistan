#!/usr/bin/env node
/**
 * to-desktop.mjs   (website ke folder mein)
 *
 * Jo bhi _*.txt files bani hui hain, un ko Desktop par ek folder mein
 * rakh deta hai taake attach karna aasan ho. Saath hi .pages.yml ki ek
 * copy bhi — us ka naam nuqte se shuru hota hai, is liye attach karte
 * waqt chhupi hui nazar aati hai.
 *
 * Kuch mitata nahi, sirf copy karta hai.
 *
 * .pages.yml ko Node se copy kiya jata hai, PowerShell se nahi: PowerShell
 * ka Get-Content/Set-Content us file ki encoding badal deta hai. Yeh
 * seedhi byte-dar-byte copy hai, matan ko haath nahi lagti.
 *
 *   node tools/to-desktop.mjs
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const FOLDER = 'KVP-for-Claude';

/* Desktop kahan hai — OneDrive wala bhi dekh lo */
const candidates = [
  path.join(os.homedir(), 'OneDrive', 'Desktop'),
  path.join(os.homedir(), 'Desktop'),
  path.join(os.homedir(), 'OneDrive - Personal', 'Desktop'),
];
const desktop = candidates.find((d) => fs.existsSync(d));

if (!desktop) {
  console.log('XX  Desktop nahi mila. Dekhi gayi jaghein:');
  for (const c of candidates) console.log('      ' + c);
  console.log('');
  console.log('   Apna Desktop ka raasta bata dein, main script mein daal dunga.');
  process.exit(1);
}

const dest = path.join(desktop, FOLDER);
fs.mkdirSync(dest, { recursive: true });

console.log('\nFILES DESKTOP PAR');
console.log('='.repeat(72));
console.log('   jagah: ' + dest);
console.log('');

let n = 0;

/* .pages.yml ki copy */
const pages = path.join(ROOT, '.pages.yml');
if (fs.existsSync(pages)) {
  const out = path.join(dest, '_pagesyml.txt');
  fs.copyFileSync(pages, out);
  console.log('   OK  .pages.yml  ->  _pagesyml.txt   (' + fs.statSync(pages).size + ' harf)');
  n++;
} else {
  console.log('   --  .pages.yml nahi mili');
}

/* saari _*.txt */
const txts = fs.readdirSync(ROOT).filter((f) => /^_.*\.txt$/.test(f) && f !== '_pagesyml.txt');
if (!txts.length) console.log('   --  koi _*.txt file nahi mili');
for (const f of txts.sort()) {
  const src = path.join(ROOT, f);
  if (!fs.statSync(src).isFile()) continue;
  fs.copyFileSync(src, path.join(dest, f));
  console.log('   OK  ' + f.padEnd(20) + '(' + fs.statSync(src).size + ' harf)');
  n++;
}

console.log('');
console.log('-'.repeat(72));
console.log('   ' + n + ' files Desktop par folder "' + FOLDER + '" mein.');
console.log('   Wahan se attach kar dein.');
