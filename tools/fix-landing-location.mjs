// Moves the hub-page content files out of src/content/.
//
// WHAT WENT WRONG
// The hub-page content files were created in src/content/landing/. Everything
// under src/content/ is treated as a real page by the build tools, so on the
// first build:
//
//   autofill-content      added slug, author, reviewed_by, seo... to each file
//   normalize-permalinks  gave each file a permalink
//
// Nothing broke, because eleventy was told to ignore that folder - but
// src/content/landing/tours.md now carries the permalink /tours/, the same
// address as the real Tours page. One change to that ignore rule and two
// pages would fight over the same address.
//
// THE FIX
// These files are data, not pages, so they move to content/landing/ at the top
// of the repo - outside src/, where no build tool looks. The junk keys are
// stripped at the same time.
//
//   node tools/fix-landing-location.mjs           -> shows what will change
//   node tools/fix-landing-location.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

const OLD = 'src/content/landing';
const NEW = 'content/landing';

// Only these belong in a hub-page file. Anything else was added by a build
// tool that mistook these for real pages.
const KEEP = [
  'url', 'title', 'summary', 'hero_eyebrow',
  'section_eyebrow', 'section_heading', 'section_intro',
  'cards', 'seo_title', 'seo_description',
];

let problems = 0;
const writes = [];
const deletes = [];

// ---------------------------------------------------------------- files
const from = fs.existsSync(OLD) ? fs.readdirSync(OLD).filter((f) => f.endsWith('.md')) : [];
const already = fs.existsSync(NEW) ? fs.readdirSync(NEW).filter((f) => f.endsWith('.md')) : [];

if (!from.length && already.length) {
  console.log(`Already moved - ${already.length} files in ${NEW}/`);
} else if (!from.length) {
  console.log(`Nothing to move: ${OLD}/ is empty or missing.`);
}

const dropped = new Map();
for (const name of from) {
  const text = fs.readFileSync(`${OLD}/${name}`, 'utf8');
  if (!text.startsWith('---')) { console.log(`!! ${name}: no front matter`); problems++; continue; }
  const end = text.indexOf('\n---', 3);
  if (end < 0) { console.log(`!! ${name}: front matter not closed`); problems++; continue; }

  let data;
  try { data = yaml.load(text.slice(3, end)) || {}; }
  catch (e) { console.log(`!! ${name}: ${e.message}`); problems++; continue; }

  if (!data.url) { console.log(`!! ${name}: no url - skipped`); problems++; continue; }

  for (const key of Object.keys(data)) {
    if (!KEEP.includes(key)) dropped.set(key, (dropped.get(key) || 0) + 1);
  }

  const clean = {};
  for (const key of KEEP) if (data[key] !== undefined && data[key] !== '') clean[key] = data[key];

  writes.push([`${NEW}/${name}`, `---\n${yaml.dump(clean, { lineWidth: 0, quotingType: '"' })}---\n`]);
  deletes.push(`${OLD}/${name}`);
}

if (from.length) {
  console.log(`${from.length} files move from ${OLD}/ to ${NEW}/`);
  if (dropped.size) {
    console.log('   keys added by the build tools, now removed:');
    for (const [k, n] of [...dropped].sort((a, b) => b[1] - a[1])) console.log(`      ${k}  (${n} files)`);
  }
}

// ---------------------------------------------------------------- pointers
function retarget(file, pairs, label) {
  if (!fs.existsSync(file)) { console.log(`!! ${file} not found`); problems++; return; }
  const src = fs.readFileSync(file, 'utf8');
  let out = src;
  for (const [a, b] of pairs) out = out.split(a).join(b);
  if (out === src) { console.log(`   already points to ${NEW}: ${file}`); return; }
  writes.push([file, out]);
  console.log(`${WRITE ? 'updated' : 'will update'}: ${file}  (${label})`);
}

retarget('src/_data/landing.js', [[`"${OLD}"`, `"${NEW}"`], [`'${OLD}'`, `'${NEW}'`]], 'reads from the new folder');

// eleventy no longer needs to ignore them - they are outside src/ now
{
  const file = 'eleventy.config.js';
  const src = fs.readFileSync(file, 'utf8');
  // comment aur line dono - warna comment jhoota raasta batata reh jayega
  const block = [
    '  // Hub pages ka mawad CMS mein hai: src/content/landing/ ki files.',
    '  // Woh khud koi page nahi bantin - sirf mawad hain - is liye build se',
    '  // bahar. Unhein src/_data/landing.js parh kar templates tak pohanchata hai.',
    `  eleventyConfig.ignores.add("${OLD}/*.md");`,
    '',
  ].join('\n');
  const line = `  eleventyConfig.ignores.add("${OLD}/*.md");\n`;
  if (src.includes(block)) {
    writes.push([file, src.replace(block, '')]);
    console.log(`${WRITE ? 'updated' : 'will update'}: ${file}  (ignore rule no longer needed)`);
  } else if (src.includes(line)) {
    writes.push([file, src.replace(line, '')]);
    console.log(`${WRITE ? 'updated' : 'will update'}: ${file}  (ignore rule no longer needed)`);
  } else {
    console.log(`   nothing to change: ${file}`);
  }
}

// .pages.yml - the CMS needs the new path
{
  const file = '.pages.yml';
  const src = fs.readFileSync(file, 'utf8');
  const doc = yaml.load(src);
  const entry = (doc.content || []).find((c) => c.name === 'landing');
  if (!entry) { console.log('!! .pages.yml: the "landing" collection is missing'); problems++; }
  else if (entry.path === NEW) { console.log('   already points to the new folder: .pages.yml'); }
  else {
    entry.path = NEW;
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    const check = yaml.load(out);
    if (check.content.length !== doc.content.length
      || check.content.find((c) => c.name === 'landing')?.path !== NEW) {
      console.log('!! .pages.yml: check failed - not touched');
      problems++;
    } else {
      writes.push([file, out]);
      console.log(`${WRITE ? 'updated' : 'will update'}: .pages.yml  (CMS points to ${NEW})`);
    }
  }
}

// ---------------------------------------------------------------- go
if (problems) { console.log(`\n${problems} problem(s) - nothing was written.`); process.exit(1); }
if (!writes.length && !deletes.length) { console.log('\nNothing to do.'); process.exit(0); }

if (!WRITE) { console.log('\nNothing changed yet. Run again with --write to apply.'); process.exit(0); }

for (const [file, text] of writes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}
for (const file of deletes) fs.rmSync(file);
try { if (fs.existsSync(OLD) && !fs.readdirSync(OLD).length) fs.rmdirSync(OLD); } catch {}

console.log(`\nDone. ${deletes.length} files moved to ${NEW}/`);
console.log('Now run "npm run build" and check it still writes the same number of pages.');
