// Renames entry files to match their title.
//
// WHAT HAPPENED
// Before the slug fix, the dashboard could not find a "title" field on these
// cards and named every new file untitled.md. The first entry saved; the rest
// collided with it.
//
// The field is fixed now and the contents of those files were corrected, but
// the file name was left as it was - so the dashboard looks for
// muhammad-ali.md, finds untitled.md, and reports "not found" on edit and on
// delete. This renames each file after its own title.
//
// Nothing is overwritten: if two entries would end up with the same name, the
// second gets -2, and anything already named correctly is left alone.
//
//   node tools/rename-entry-files.mjs           -> shows what will change
//   node tools/rename-entry-files.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

const DIRS = ['content/team', 'content/clients', 'content/partners', 'content/affiliations', 'content/announcements', 'content/gallery'];

// Same shape the rest of the site uses: lowercase, words joined by hyphens.
const slugify = (s) => String(s || '')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

const moves = [];
let problems = 0;

for (const dir of DIRS) {
  let names = [];
  try { names = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch { continue; }

  const taken = new Set(names);

  for (const name of names) {
    const file = `${dir}/${name}`;
    const text = fs.readFileSync(file, 'utf8');
    if (!text.startsWith('---')) continue;
    const end = text.indexOf('\n---', 3);
    if (end < 0) continue;

    let data;
    try { data = yaml.load(text.slice(3, end)) || {}; }
    catch { console.log(`!! ${file}: could not be read`); problems++; continue; }

    const title = String(data.title || data.name || data.message || '').trim();
    if (!title) { console.log(`   no title, left alone: ${file}`); continue; }

    const want = slugify(title);
    if (!want) { console.log(`   title has no usable letters, left alone: ${file}`); continue; }
    // Already named after its title - including the -2, -3 given to a second
    // entry with the same title. Without this check those would climb one
    // number higher every time this runs.
    const escaped = want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (name === `${want}.md` || new RegExp(`^${escaped}-\\d+\\.md$`).test(name)) continue;

    // do not tread on a file that is already there
    let final = `${want}.md`;
    let n = 2;
    while (taken.has(final)) final = `${want}-${n++}.md`;
    taken.delete(name);
    taken.add(final);

    moves.push([file, `${dir}/${final}`, title]);
  }
}

if (problems) { console.log(`\n${problems} problem(s) - nothing was renamed.`); process.exit(1); }
if (!moves.length) { console.log('Every file is already named after its title.'); process.exit(0); }

console.log(`${moves.length} file(s) to rename:\n`);
for (const [from, to, title] of moves) {
  console.log(`   ${from}`);
  console.log(`   -> ${to}   ("${title}")`);
}

if (!WRITE) { console.log('\nNothing changed yet. Run again with --write to apply.'); process.exit(0); }

for (const [from, to] of moves) fs.renameSync(from, to);
console.log(`\nDone. ${moves.length} file(s) renamed.`);
console.log('Run "npm run build", commit and push. Then reload the dashboard.');
