// Menu ke har page ki padtaal: CMS se badla ja sakta hai ya nahi?
//
// SAWAL
// Menu mein darjanon page hain. Kuch CMS mein nazar aate hain aur client
// unhein khud badal leta hai; kuch bilkul nazar hi nahi aate - jaise Travel
// Insurance ya Special Interests ke page. Pehle yeh maloom hona chahiye ke
// kaun kaun se page CMS se bahar hain, aur un ke peechay file kis qism ki hai,
// kyunki dono ka ilaj alag hai:
//
//   .md  file  -> likhai alag file mein hai. CMS mein laana asaan: bas
//                 `.pages.yml` mein us folder ka zikr karna hai.
//   .njk file  -> likhai seedha code ke andar likhi hui hai. Pehle usey code
//                 se nikal kar alag file mein rakhna parega, phir CMS mein.
//
// Yeh script kuch badalti nahi - sirf dekh kar batati hai aur ek tafseeli
// report file bana deti hai.
//
//   node tools/audit-menu-pages.mjs
//   -> tools/_menu-audit.json
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml nahi mila. Pehle "npm install" chalayein.'); process.exit(1); }

const need = (f) => {
  if (!fs.existsSync(f)) { console.log(`${f} nahi mili. Website wale folder mein chalayein.`); process.exit(1); }
};
need('.pages.yml');
need('src/_data/menu.json');

// ----------------------------------------------------- menu ke saare link
const menu = JSON.parse(fs.readFileSync('src/_data/menu.json', 'utf8'));
const links = [];
(function walk(list, trail) {
  for (const it of list || []) {
    const label = String(it.label || '').trim();
    const url = String(it.url || '').trim();
    if (url) links.push({ label, url, trail: [...trail] });
    walk(it.children, [...trail, label]);
  }
})(menu.items, []);

const isExternal = (u) => /^(https?:)?\/\//i.test(u) || /^(mailto|tel):/i.test(u);
const clean = (u) => u.split('#')[0].split('?')[0];

// ----------------------------------------------- CMS kin files ko janta hai
const doc = yaml.load(fs.readFileSync('.pages.yml', 'utf8'));
const cmsFolders = [];   // collection - poora folder badla ja sakta hai
const cmsFiles = [];     // ek file
(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== 'object') return;
  if (typeof node.path === 'string' && node.name) {
    const p = node.path.replace(/\\/g, '/').replace(/\/+$/, '');
    if (node.type === 'collection') cmsFolders.push({ name: node.name, label: node.label || node.name, path: p });
    else cmsFiles.push({ name: node.name, label: node.label || node.name, path: p });
  }
  Object.values(node).forEach(walk);
})(doc);

const inCms = (file) => {
  const f = file.replace(/\\/g, '/');
  const hit = cmsFiles.find((c) => c.path === f);
  if (hit) return { how: 'file', screen: hit.label };
  const folder = cmsFolders.find((c) => f.startsWith(`${c.path}/`));
  if (folder) return { how: 'collection', screen: folder.label };
  return null;
};

// -------------------------------------------- saari source files ka naqsha
const SKIP = new Set(['node_modules', '_site', '.git', '.cache', '_includes', '_data', 'assets']);
const pages = [];
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) { scan(p); continue; }
    if (!/\.(md|njk|html)$/.test(e.name)) continue;
    pages.push(p);
  }
})('src');

// front matter ka permalink (agar likha ho)
const frontMatter = (file) => {
  const t = fs.readFileSync(file, 'utf8');
  if (!t.startsWith('---')) return {};
  const end = t.indexOf('\n---', 3);
  if (end < 0) return {};
  try { return yaml.load(t.slice(3, end)) || {}; } catch { return {}; }
};

const asUrl = (u) => {
  let s = String(u || '').trim();
  if (!s) return '/';
  if (!s.startsWith('/')) s = `/${s}`;
  s = s.replace(/index\.html$/, '');
  if (!s.endsWith('/')) s = `${s}/`;
  return s.toLowerCase();
};

// File se us ka mumkina pata. Teen darje - pehle sab se bharose mand, phir
// kam. Pehle darje ka daawa doosre darje par ghalib rehta hai, warna kisi
// aur file ka naam milta julta hone par ghalat jori ban jati hai.
const byUrl = new Map();
const guesses = [[], [], []];

for (const file of pages) {
  const fm = frontMatter(file);
  const rel = file.replace(/^src\//, '').replace(/\.(md|njk|html)$/, '');
  const noIndex = (s) => s.replace(/\/?index$/, '');

  // 1. front matter mein saaf likha hua pata
  if (typeof fm.permalink === 'string' && fm.permalink.trim()) {
    guesses[0].push([asUrl(fm.permalink), file]);
  }

  // 2. raaste se: src/a/b.njk -> /a/b/ , src/a/index.njk -> /a/ , src/index.njk -> /
  guesses[1].push([asUrl(noIndex(rel)), file]);
  // content wali files aksar "content/" ke baghair chalti hain:
  // src/content/trekking/k2.md -> /trekking/k2/
  if (rel.startsWith('content/')) {
    guesses[1].push([asUrl(noIndex(rel.slice('content/'.length))), file]);
  }

  // 3. aakhri koshish: sirf file ka naam
  guesses[2].push([asUrl(rel.split('/').pop()), file]);
}

for (const tier of guesses) {
  for (const [u, file] of tier) if (u && !byUrl.has(u)) byUrl.set(u, file);
}

// ------------------------------------------------------------- nateeja
const seen = new Set();
const rows = [];
for (const l of links) {
  const u = clean(l.url);
  if (!u || u.startsWith('#')) continue;
  if (isExternal(u)) continue;
  const key = asUrl(u);
  if (seen.has(key)) continue;
  seen.add(key);

  const file = byUrl.get(key) || null;
  const built = fs.existsSync(path.join('_site', u.replace(/^\//, ''), 'index.html'));
  const cms = file ? inCms(file) : null;
  const kind = file ? path.extname(file).slice(1) : '';

  let status;
  if (!file) status = built ? 'file nahi mili (magar page banta hai)' : 'page hi nahi mila';
  else if (cms) status = 'CMS mein hai';
  else if (kind === 'md') status = 'CMS mein nahi - magar asaan (md file)';
  else status = 'CMS mein nahi - likhai code ke andar';

  rows.push({ label: l.label, trail: l.trail, url: u, file, kind, built, cms, status });
}

// ------------------------------------------------------------- report
const group = (s) => rows.filter((r) => r.status === s);
const order = [
  'CMS mein hai',
  'CMS mein nahi - magar asaan (md file)',
  'CMS mein nahi - likhai code ke andar',
  'file nahi mili (magar page banta hai)',
  'page hi nahi mila',
];

console.log(`Menu mein kul ${rows.length} alag alag page hain.\n`);
for (const s of order) {
  const g = group(s);
  if (!g.length) continue;
  console.log(`${s}: ${g.length}`);
  if (s === 'CMS mein hai') continue; // yeh theek hain, naam ginwane ki zaroorat nahi
  for (const r of g.slice(0, 40)) {
    const where = r.trail.length ? `${r.trail.join(' > ')} > ` : '';
    console.log(`   ${where}${r.label}`);
    console.log(`      ${r.url}   ${r.file || '(koi file nahi)'}`);
  }
  if (g.length > 40) console.log(`   ... aur ${g.length - 40}`);
  console.log('');
}

if (!fs.existsSync('_site')) {
  console.log('Note: _site folder nahi hai, to "page banta hai ya nahi" check nahi ho saka.');
  console.log('Behtar hoga pehle "npm run build" chala lein.\n');
}

fs.writeFileSync('tools/_menu-audit.json', JSON.stringify({
  cmsFolders, cmsFiles, rows,
}, null, 2), 'utf8');
console.log('tafseel likh di: tools/_menu-audit.json');
console.log('Yeh file attach kar dein.');
