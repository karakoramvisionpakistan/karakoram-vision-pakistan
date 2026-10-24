// Build ke baad har page ka JSON-LD schema check karta hai.
//   npm run build
//   node tools/check-schema.mjs
// Agar kisi page ka schema kharab ho to yeh bata deta hai (Google use nazarandaz kar deta hai).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '_site';
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

let pages = 0, blocks = 0, broken = 0, noSchema = [];
const types = new Map();
const missing = { sameAs: 0, geo: 0, openingHours: 0, address: 0 };

for (const file of walk(ROOT)) {
  pages++;
  const html = readFileSync(file, 'utf8');
  const found = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!found.length) { noSchema.push(file); continue; }
  for (const [, raw] of found) {
    blocks++;
    try {
      const data = JSON.parse(raw);
      const nodes = data['@graph'] || [data];
      for (const node of nodes) {
        for (const t of [].concat(node['@type'] || [])) types.set(t, (types.get(t) || 0) + 1);
        if ([].concat(node['@type'] || []).includes('Organization')) {
          if (!node.sameAs) missing.sameAs++;
          if (!node.geo) missing.geo++;
          if (!node.openingHoursSpecification) missing.openingHours++;
          if (!node.address) missing.address++;
        }
      }
    } catch (e) {
      broken++;
      console.log(`KHARAB SCHEMA  ${file}\n   ${e.message}`);
    }
  }
}

console.log(`\n${pages} pages, ${blocks} schema blocks, ${broken} kharab.`);
console.log('Types:', [...types.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} (${n})`).join(', '));
if (noSchema.length) console.log(`Schema ke baghair ${noSchema.length} page(s), misal: ${noSchema.slice(0, 3).join(', ')}`);
const gaps = Object.entries(missing).filter(([, n]) => n > 0).map(([k]) => k);
if (gaps.length) console.log(`Organization mein abhi nahi hai: ${gaps.join(', ')}  (site.json mein wo field bharni hai)`);
if (broken) { console.log('\nPehle schema theek karein, phir push karein.'); process.exit(1); }
console.log('Sab schema theek hai.');
