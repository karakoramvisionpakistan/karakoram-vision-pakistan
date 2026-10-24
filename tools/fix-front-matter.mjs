// Front matter ke closing --- ke saath agar content chipak gaya ho to use alag karta hai.
//   node tools/fix-front-matter.mjs           -> sirf dikhata hai
//   node tools/fix-front-matter.mjs --write   -> files theek karta hai
// Sahi:   ---  (apni line par)        Ghalat:  ---<!-- page-intro -->
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WRITE = process.argv.includes('--write');
const ROOT = 'src/content';

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});

let fixed = 0, ok = 0, problems = 0;
for (const file of walk(ROOT)) {
  const text = readFileSync(file, 'utf8');
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);

  if (lines[0].replace(/^﻿/, '') !== '---') {
    console.log(`front matter shuru nahi hua  ${file}`); problems++; continue;
  }

  let closeAt = -1, glued = null;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') { closeAt = i; break; }
    if (/^---\S/.test(lines[i]) || (lines[i].startsWith('---') && lines[i].trim() !== '---')) {
      closeAt = i; glued = lines[i].slice(3); break;
    }
  }

  if (closeAt === -1) { console.log(`closing --- nahi mila  ${file}`); problems++; continue; }

  if (glued === null) { ok++; continue; }

  lines.splice(closeAt, 1, '---', '', glued);
  console.log(`${file}\n   "---${glued.slice(0, 45)}"  ->  closing --- apni line par`);
  fixed++;
  if (WRITE) writeFileSync(file, lines.join(nl), 'utf8');
}

console.log(`\n${ok} files pehle se theek, ${fixed} ${WRITE ? 'theek ki' : 'theek hongi'}, ${problems} problem.`);
if (!WRITE && fixed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
