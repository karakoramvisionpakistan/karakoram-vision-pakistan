// Merges settings screens that edit the same file.
//
// THE PROBLEM
// There are 21 settings screens in the sidebar. Eleven of them edit the very
// same file - src/_data/site.json - and were only split apart so that no
// single screen became a long scroll. Now that every long list collapses into
// rows, that split only makes things harder to find.
//
// WHAT THIS DOES
// Merges those eleven into four. Each screen that gets folded in becomes a
// collapsible section inside the new screen, so nothing is lost and nothing
// moves - the data file is not touched at all, only the list of screens.
//
// WHY NOT FEWER
// A settings screen can only edit one file. The other ten screens each have
// their own file (menu.json, theme.json, formsConfig.json and so on), so they
// cannot be merged without rebuilding the data files themselves - which is
// not worth the risk.
//
//   node tools/merge-settings.mjs           -> shows what will change
//   node tools/merge-settings.mjs --write   -> makes the change
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

// target screen, its new name, and the screens folded into it
const MERGES = [
  {
    into: 'site',
    label: 'Business details',
    members: ['site', 'site_logos', 'site_contact', 'site_business', 'site_team'],
  },
  {
    into: 'site_channels',
    label: 'Contact channels & social',
    members: ['site_channels', 'site_social', 'site_ratings'],
  },
  {
    into: 'site_advanced',
    label: 'Advanced (leave alone unless asked)',
    members: ['site_verification', 'site_advanced'],
  },
];

const RENAMES = {
  site_faqs: 'Homepage questions & answers',
  site_header: 'Header & top bar',
  navigation: 'Menus',
  site_footer: 'Footer & newsletter',
  homepage: 'Homepage sections',
  theme: 'Colours, corners & spacing',
  forms: 'Enquiry forms',
  taxonomies: 'Categories & dropdown lists',
  content_defaults: 'Default packing list & inclusions',
  hero_banners: 'Page banners',
  page_control: 'Pages: show or hide',
};

// "01 — Business name & description" -> "Business name & description"
const tidy = (s) => String(s || '').replace(/^\s*\d+\s*[—–-]\s*/, '').trim();

const src = fs.readFileSync('.pages.yml', 'utf8');
const doc = yaml.load(src);
const byName = new Map(doc.content.map((c) => [c.name, c]));

// every field name that exists today, so we can prove none goes missing
const fieldNames = (entry) => (entry.fields || []).filter((f) => f.type !== 'heading').map((f) => f.name);
const before = new Set(doc.content.flatMap(fieldNames));

let problems = 0;
const removed = new Set();

for (const merge of MERGES) {
  const target = byName.get(merge.into);
  if (!target) { console.log(`!! ${merge.into}: screen not found`); problems++; continue; }

  const members = merge.members.map((n) => byName.get(n)).filter(Boolean);
  const missing = merge.members.filter((n) => !byName.get(n));
  if (missing.length) console.log(`   note: already merged or missing - ${missing.join(', ')}`);
  if (members.length < 2) { console.log(`   already done: ${merge.label}`); continue; }

  // all members must edit the same file, otherwise merging would lose data
  const paths = [...new Set(members.map((m) => m.path))];
  if (paths.length > 1) {
    console.log(`!! ${merge.label}: these screens edit different files - ${paths.join(', ')}`);
    problems++;
    continue;
  }

  const seen = new Set();
  const fields = [];
  for (const member of members) {
    const own = (member.fields || []).filter((f) => f.type === 'heading' || !seen.has(f.name));
    if (!own.some((f) => f.type !== 'heading')) continue;
    // one collapsible section per screen that was folded in; the first is open
    fields.push({
      name: `_h_merged_${member.name}`,
      label: tidy(member.label || member.name),
      type: 'heading',
      ...(fields.length ? { collapsed: true } : {}),
    });
    for (const f of own) {
      if (f.type === 'heading') continue;   // the screen's own sub-headings are dropped
      seen.add(f.name);
      fields.push(f);
    }
  }

  target.label = merge.label;
  target.fields = fields;
  for (const member of members) if (member.name !== target.name) removed.add(member.name);

  console.log(`${WRITE ? 'merged' : 'will merge'}: ${merge.label}`);
  console.log(`   ${members.map((m) => tidy(m.label)).join(' + ')}`);
  console.log(`   ${fields.filter((f) => f.type !== 'heading').length} settings in one screen`);
}

doc.content = doc.content.filter((c) => !removed.has(c.name));

// plain English names for the screens that stay
for (const [name, label] of Object.entries(RENAMES)) {
  const entry = byName.get(name);
  if (entry && !removed.has(name) && entry.label !== label) entry.label = label;
}

// ---------------------------------------------------------------- checks
const after = new Set(doc.content.flatMap(fieldNames));
const lost = [...before].filter((n) => !after.has(n));
if (lost.length) { console.log(`!! these settings would disappear: ${lost.join(', ')}`); problems++; }

const dup = doc.content.map((c) => c.name).filter((n, i, a) => a.indexOf(n) !== i);
if (dup.length) { console.log(`!! duplicate screen names: ${dup.join(', ')}`); problems++; }

let out;
try {
  out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
  const check = yaml.load(out);
  if (check.content.length !== doc.content.length) throw new Error('entry count changed');
} catch (e) { console.log(`!! could not write valid YAML: ${e.message}`); problems++; }

const files = doc.content.filter((c) => c.type !== 'collection').length;
const cols = doc.content.filter((c) => c.type === 'collection').length;
console.log(`\nSettings screens: ${doc.content.length - cols} (was 21). Collections: ${cols}.`);
console.log(`Every setting kept: ${lost.length ? 'NO' : 'yes'} (${after.size} fields).`);

if (problems) { console.log(`\n${problems} problem(s) - nothing was written.`); process.exit(1); }

if (!WRITE) {
  console.log('\nNothing changed yet. Run again with --write to apply.');
  process.exit(0);
}

fs.writeFileSync('.pages.yml.bak', src, 'utf8');
fs.writeFileSync('.pages.yml', out, 'utf8');
console.log('\nDone. The previous version is saved as .pages.yml.bak');
console.log(`Screens now: ${doc.content.filter((c) => c.type !== 'collection').map((c) => c.name).join(', ')}`);
void files;
