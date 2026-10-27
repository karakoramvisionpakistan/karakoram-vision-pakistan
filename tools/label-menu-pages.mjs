// Explains what "Menu Pages" is for, so it is not confused with the content.
//
// WHY
// In Menu Pages, the row "Travel Guides" points at /blog/. It is easy to think
// that is where blog posts are written - but it is only the page itself: its
// heading, intro and link cards. The articles shown on it live in their own
// card, "Travel Guides & News". The same holds for Tours, Trekking and the
// rest.
//
// This adds a line that says so - once on the collection, and once at the top
// of the edit form where it is sure to be seen.
//
//   node tools/label-menu-pages.mjs           -> shows what will change
//   node tools/label-menu-pages.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

if (!fs.existsSync('.pages.yml')) {
  console.log('.pages.yml not found. Run this in the website folder.');
  process.exit(1);
}

const NOTE = 'These are the pages themselves — their heading, intro text and link cards. '
  + 'The tours, treks and articles that appear on them are edited in their own cards '
  + '(Tours, Trekking, Travel Guides & News, and so on).';

const src = fs.readFileSync('.pages.yml', 'utf8');
const doc = yaml.load(src);
const entry = (doc.content || []).find((c) => c.name === 'landing');

if (!entry) {
  console.log('The "landing" collection is missing from .pages.yml.');
  console.log('Run tools/make-landing.mjs first.');
  process.exit(1);
}

let changes = 0;

if (entry.description !== NOTE) { entry.description = NOTE; changes++; console.log('   collection note added'); }

const heading = (entry.fields || []).find((f) => f.name === '_h_page');
if (heading && heading.description !== NOTE) {
  heading.description = NOTE;
  changes++;
  console.log('   note added at the top of the edit form');
}

if (!changes) { console.log('Already done - nothing to change.'); process.exit(0); }

const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });

// check before writing
let ok = false;
try {
  const check = yaml.load(out);
  const after = check.content.find((c) => c.name === 'landing');
  ok = check.content.length === doc.content.length
    && after?.description === NOTE
    && (after.fields || []).length === (entry.fields || []).length;
} catch (e) { console.log(`!! ${e.message}`); }

if (!ok) { console.log('!! check failed - nothing was written.'); process.exit(1); }

console.log(`\n${changes} change(s).`);
if (!WRITE) { console.log('Nothing changed yet. Run again with --write to apply.'); process.exit(0); }

fs.writeFileSync('.pages.yml', out, 'utf8');
console.log('Done. Commit and push, then reload the dashboard.');
