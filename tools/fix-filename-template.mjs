// File names the dashboard actually understands.
//
// WHAT WENT WRONG
// I told the new cards to name their files {title}.md, assuming the dashboard
// would put the title in place of {title}. It does not. It wrote the file as
// content/team/{title}.md, braces and all - so the second entry always
// collided with the first, and nothing could be edited or deleted because the
// name on disk matched nothing the dashboard looked for.
//
// The collections that have always worked - Tours, Trekking - say {slug}.md.
// That is the one word this dashboard replaces; it works out the slug itself,
// which is why the error read "slug 'ibrahim' already exists" while the file
// was still called {title}.md.
//
// This sets every card I added to {slug}.md, and renames the files that were
// saved under a literal name.
//
//   node tools/fix-filename-template.mjs           -> shows what will change
//   node tools/fix-filename-template.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

if (!fs.existsSync('.pages.yml')) { console.log('.pages.yml not found. Run this in the website folder.'); process.exit(1); }

const CARDS = ['team', 'clients', 'partners', 'affiliations', 'announcements', 'gallery'];
const DIRS = CARDS.map((c) => `content/${c}`);

const writes = new Map();
const moves = [];
let problems = 0;
const add = (file, text) => {
  try { if (fs.readFileSync(file, 'utf8') === text) return; } catch {}
  writes.set(file, text);
};
const say = (s) => console.log(`   ${s}`);

// ---------------------------------------------------------- the template
console.log('1. File name template');
{
  const file = '.pages.yml';
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  let touched = 0;

  for (const name of CARDS) {
    const entry = doc.content.find((c) => c.name === name);
    if (!entry) { say(`card not found: ${name}`); continue; }
    if (entry.filename && entry.filename.template === '{slug}.md') { say(`already right: ${name}`); continue; }
    entry.filename = { template: '{slug}.md', field: 'create' };
    touched++;
    say(`${name}: now names its files the way Tours and Trekking do`);
  }

  if (touched) {
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try {
      const check = yaml.load(out);
      ok = check.content.length === doc.content.length
        && CARDS.every((n) => {
          const e = check.content.find((c) => c.name === n);
          return !e || e.filename.template === '{slug}.md';
        });
    } catch (e) { console.log(`!! ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else add(file, out);
  }
}

// ---------------------------------------------------------- stuck files
console.log('\n2. Files saved under a literal name');

const slugify = (s) => String(s || '')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

for (const dir of DIRS) {
  let names = [];
  try { names = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch { continue; }
  const taken = new Set(names);

  for (const name of names) {
    // only the ones that are plainly wrong - a real slug is left alone
    if (!/[{}]/.test(name) && name !== 'untitled.md') continue;

    const file = `${dir}/${name}`;
    const text = fs.readFileSync(file, 'utf8');
    if (!text.startsWith('---')) continue;
    const end = text.indexOf('\n---', 3);
    if (end < 0) continue;

    let data;
    try { data = yaml.load(text.slice(3, end)) || {}; }
    catch { console.log(`!! ${file}: could not be read`); problems++; continue; }

    const title = String(data.title || data.name || data.message || '').trim();
    const want = slugify(title);
    if (!want) { console.log(`   !! ${file}: no title to name it after - left alone`); problems++; continue; }

    let final = `${want}.md`;
    let n = 2;
    while (taken.has(final)) final = `${want}-${n++}.md`;
    taken.delete(name);
    taken.add(final);

    moves.push([file, `${dir}/${final}`, title]);
  }
}

if (!moves.length) say('none stuck');
for (const [from, to, title] of moves) say(`${from}  ->  ${to}   ("${title}")`);

// ---------------------------------------------------------- go
console.log('');
if (problems) { console.log(`${problems} problem(s) - nothing was written.`); process.exit(1); }
if (!writes.size && !moves.length) { console.log('Nothing to change.'); process.exit(0); }

if (!WRITE) { console.log('Nothing changed yet. Run again with --write to apply.'); process.exit(0); }

for (const [file, text] of writes) fs.writeFileSync(file, text, 'utf8');
for (const [from, to] of moves) fs.renameSync(from, to);

console.log('Done. Run "npm run build", then commit and push.');
console.log('Then open /api/schema?refresh=1 in the dashboard once, and reload it.');
