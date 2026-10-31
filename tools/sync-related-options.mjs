#!/usr/bin/env node
/**
 * sync-related-options.mjs
 *
 * Naya trip banne par uska naam "Related journeys" ki fehrist mein le aata
 * hai. GitHub Action yeh khud chalata hai; haath se bhi chala sakte hain:
 *
 *   npm run build
 *   node tools/sync-related-options.mjs --write
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const COLLECTIONS = ["tours","trekking","expeditions","jeep_safaris","hunting_services"];

const catRaw = fs.readFileSync(path.join(ROOT, 'src', '_data', 'structuredCatalog.json'), 'utf8');
const cat = JSON.parse(catRaw);

const JOURNEY_URL = /^\/(tours|trekking|expeditions|jeep-safaris|hunting-services|destinations|blog|vehicles)\/[^/]+\/?$/;
const found = [];
const walk = (node, depth) => {
  if (!node || depth > 5) return;
  if (Array.isArray(node)) { for (const n of node) walk(n, depth + 1); return; }
  if (typeof node !== 'object') return;
  const t = node.title || node.label || node.name;
  const u = node.url || node.permalink || node.href || node.path;
  if (typeof t === 'string' && typeof u === 'string' && JOURNEY_URL.test(u)) {
    found.push(t.trim());
    return;
  }
  for (const v of Object.values(node)) walk(v, depth + 1);
};
walk(cat, 0);

const titles = [];
const seen = new Set();
for (const t of found) {
  if (!t) continue;
  const k = t.toLowerCase();
  if (seen.has(k)) continue;
  seen.add(k);
  titles.push(t);
}
titles.sort((a, b) => a.localeCompare(b));

if (titles.length < 5) {
  console.log('XX  sirf ' + titles.length + ' trips mile — fehrist theek nahi lagti, ruk raha hoon.');
  process.exit(1);
}

const YML = path.join(ROOT, '.pages.yml');
const raw = fs.readFileSync(YML, 'utf8');
const doc = yaml.load(raw);

let changed = false;
for (const name of COLLECTIONS) {
  const coll = (doc.content || []).find((c) => c.name === name);
  if (!coll) continue;
  const f = (coll.fields || []).find((x) => x.name === 'related');
  if (!f) continue;
  const current = Array.isArray(f.options) ? f.options : (f.options && f.options.values) || [];
  if (JSON.stringify(current) === JSON.stringify(titles)) continue;
  f.options = Array.isArray(f.options) ? titles.slice() : { ...f.options, values: titles.slice() };
  changed = true;
}

if (!changed) { console.log('Fehrist pehle se taza hai (' + titles.length + ' trips).'); process.exit(0); }

const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });

const before = new Set();
for (const c of yaml.load(raw).content || []) for (const f of c.fields || []) before.add(c.name + '.' + f.name);
const after = new Set();
for (const c of yaml.load(dumped).content || []) for (const f of c.fields || []) after.add(c.name + '.' + f.name);
const lost = [...before].filter((n) => !after.has(n));
if (lost.length) { console.log('XX  fields gum ho rahe hain: ' + lost.join(', ')); process.exit(1); }

if (!WRITE) { console.log(titles.length + ' trips. Lagane ke liye: node tools/sync-related-options.mjs --write'); process.exit(0); }

fs.writeFileSync(YML, dumped, 'utf8');
console.log('LIKHA: .pages.yml  (' + titles.length + ' trips fehrist mein)');
