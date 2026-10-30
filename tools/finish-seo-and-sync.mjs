#!/usr/bin/env node
/**
 * finish-seo-and-sync.mjs
 *
 * 1) KHALI PAGES GOOGLE SE CHHUPANA
 *    Naye section pages tab tak khali rehte hain jab tak client un ke liye
 *    "Menu sections" nahi chunta. Khali safhe Google ki nazar mein nuqsan
 *    hain (thin content). Yeh script har service folder mein ek chhoti si
 *    data file rakh deti hai jo build ke waqt ginti karti hai:
 *      0 journeys  -> robots: noindex, follow
 *      1+ journeys -> jaisa hai waisa (index)
 *    Yani jaise hi entries aayengi, safha khud index hone lagega.
 *
 * 2) GITHUB ACTION
 *    Jab client CMS se menu badlega, GitHub par yeh action khud chalegi:
 *    naye sections ke pages banayegi, dropdown ke options update karegi,
 *    aur commit kar degi. Aap ko ya client ko kuch nahi karna paRega.
 *
 *   node tools/finish-seo-and-sync.mjs            -> sirf dekhna
 *   node tools/finish-seo-and-sync.mjs --write    -> save karna
 *
 * Dobara chalane se nuqsan nahi.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];

const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* =================================================== module style ====== */

console.log('\n1) Project kaunsa module style istemaal karta hai');

let esm = true;
const pkg = read(path.join(ROOT, 'package.json'));
if (pkg) {
  try { esm = JSON.parse(pkg).type === 'module'; } catch {}
}
// _data ki kisi file se tasdeeq
const dataDir = path.join(ROOT, 'src', '_data');
if (fs.existsSync(dataDir)) {
  for (const f of fs.readdirSync(dataDir)) {
    if (!f.endsWith('.js')) continue;
    const t = read(path.join(dataDir, f)) || '';
    if (/module\.exports/.test(t)) { esm = false; break; }
    if (/export\s+default/.test(t)) { esm = true; break; }
  }
}
console.log('   ' + (esm ? 'ESM (export default)' : 'CommonJS (module.exports)'));

/* =================================================== 2) noindex ======== */

console.log('\n2) Khali section pages -> noindex');

const BODY = `// Khud ba khud bani file — tools/finish-seo-and-sync.mjs
// Jis section page par abhi koi journey nahi, usay Google se chhupa deti hai.
// Jaise hi entries aayein, safha khud index hone lagta hai.

const matches = (item, type, filter) => {
  if (type && item && item.data && item.data.service_type !== type) return false;
  if (!filter) return true;
  const secs = Array.isArray(item.sections) ? item.sections : [];
  if (secs.includes(filter)) return true;
  if (filter === 'fixed-departures') return !!item.fixed_departure;
  if (filter === 'best-sellers') return !!item.best_seller;
  if (filter === 'k2-treks') return !!item.k2_trek;
  if (filter === 'cultural-tours') return !!item.cultural_tour;
  if (filter === '8000m-peaks') return !!item.peak_8000m;
  return false;
};

const config = {
  eleventyComputed: {
    seo: (data) => {
      const seo = Object.assign({}, data.seo || {});
      if (!data.structured_filter) return seo;
      if (seo.robots) return seo;
      const list = Array.isArray(data.structuredCatalog) ? data.structuredCatalog : [];
      const count = list.filter((item) => matches(item, data.service_type, data.structured_filter)).length;
      if (count === 0) seo.robots = 'noindex, follow';
      return seo;
    },
  },
};
`;

const TEXT = esm ? BODY + '\nexport default config;\n' : BODY + '\nmodule.exports = config;\n';

let added = 0;
for (const service of SERVICES) {
  const dir = path.join(ROOT, 'src', service);
  if (!fs.existsSync(dir)) { console.log('   -   src/' + service + ' nahi hai'); continue; }
  const file = path.join(dir, `${service}.11tydata.js`);
  if (read(file) === TEXT) { console.log('   OK  ' + service + ': pehle se theek'); continue; }
  writes.push({ file, text: TEXT });
  console.log('   ->  src/' + service + '/' + service + '.11tydata.js');
  added++;
}
if (!added) console.log('   (kuch naya nahi)');

/* ---- sitemap ka haal ---- */
console.log('\n   Sitemap ki jaanch:');
const sm = read(path.join(ROOT, 'src', 'sitemap.xml.njk'));
if (!sm) console.log('   !   src/sitemap.xml.njk nahi mili.');
else if (/noindex|robots/i.test(sm)) console.log('   OK  sitemap noindex ko pehchanta hai — khali pages khud nikal jayenge.');
else {
  console.log('   !   sitemap robots ko nahi dekhta — khali pages sitemap mein rahenge.');
  console.log('       (noindex phir bhi chalega; Google unhe index nahi karega.)');
}

/* =================================================== 3) action ========= */

console.log('\n3) GitHub action');

const WF_DIR = path.join(ROOT, '.github', 'workflows');
const WF = path.join(WF_DIR, 'sync-menu-sections.yml');

const WF_TEXT = `name: Sync menu sections

# Jab bhi CMS se menu badle, section pages aur CMS ke dropdown
# khud ba khud menu ke mutabiq ho jayein.

on:
  push:
    branches: [main]
    paths:
      - 'src/_data/menu.json'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build menu sections
        run: node tools/build-menu-sections.mjs --write

      - name: Commit if anything changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          if git diff --staged --quiet; then
            echo "Kuch nahi badla."
          else
            git commit -m "chore: sync menu sections from menu.json"
            git push
          fi
`;

if (read(WF) === WF_TEXT) {
  console.log('   OK  pehle se theek hai.');
} else {
  writes.push({ file: WF, text: WF_TEXT });
  console.log('   ->  .github/workflows/sync-menu-sections.yml');
}

if (!fs.existsSync(path.join(ROOT, 'package-lock.json'))) {
  console.log('   !   package-lock.json nahi mili — action mein npm ci nakaam hoga.');
  console.log('       Pehle `npm install` chala kar lock file commit kar dein.');
}

/* =================================================== write ============= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) banengi. Save karne ke liye:');
  console.log('   node tools/finish-seo-and-sync.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
