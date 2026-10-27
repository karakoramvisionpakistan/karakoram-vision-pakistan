// .pages.yml mein se sirf "navigation" wali screen nikal kar alag file mein
// rakh deta hai.
//
// .pages.yml saare screens ki tareef rakhti hai - taqreeban saarhe char hazar
// qataarein. Menu wala editor banane ke liye mujhe sirf ek screen chahiye, to
// poori file bhejne ki zaroorat nahi.
//
// Kuch badalta nahi - sirf parhta hai aur ek nayi file banata hai.
//
//   node tools/dump-menu-schema.mjs
//   -> tools/_menu-schema.json
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml nahi mila. Pehle "npm install" chala lein.'); process.exit(1); }

if (!fs.existsSync('.pages.yml')) {
  console.log('.pages.yml nahi mili. Website wale folder mein chalayein.');
  process.exit(1);
}

const doc = yaml.load(fs.readFileSync('.pages.yml', 'utf8'));

// Poore document mein talash - "navigation" naam wali screen jahan bhi ho.
const found = [];
(function walk(node, trail) {
  if (Array.isArray(node)) { node.forEach((n, i) => walk(n, `${trail}[${i}]`)); return; }
  if (!node || typeof node !== 'object') return;
  if (node.name === 'navigation') found.push({ kahan: trail, screen: node });
  for (const [k, v] of Object.entries(node)) walk(v, trail ? `${trail}.${k}` : k);
})(doc, '');

if (!found.length) {
  console.log('"navigation" naam ki koi screen nahi mili.');
  console.log('Yeh naam mojood hain:');
  const names = new Set();
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    if (typeof n.name === 'string' && n.fields) names.add(n.name);
    Object.values(n).forEach(walk);
  })(doc);
  console.log('   ' + [...names].join(', '));
  process.exit(1);
}

const out = found.length === 1 ? found[0].screen : found;
fs.writeFileSync('tools/_menu-schema.json', JSON.stringify(out, null, 2), 'utf8');

console.log(`mil gayi: ${found.map((f) => f.kahan).join(', ')}`);
console.log('likh di: tools/_menu-schema.json');
console.log('Yeh file attach kar dein.');
