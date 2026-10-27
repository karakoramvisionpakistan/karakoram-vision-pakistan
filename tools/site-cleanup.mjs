// The small leftovers, in one pass.
//
// 1. Social Responsibility - its three boxes ("Local communities",
//    "Conservation", "Safe and lawful travel") were written straight into the
//    page, so they were the one set of cards that stayed out of the CMS. They
//    move into Menu Pages like every other page's cards.
//
// 2. A slider with an empty title - the build has been warning about it. The
//    title is taken from its photo's filename, which is almost always what it
//    should have said anyway.
//
// 3. A report of what is left: pages that are switched off, and cards still
//    using a placeholder drawing instead of a real photo.
//
//   node tools/site-cleanup.mjs           -> shows what will change
//   node tools/site-cleanup.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

const LANDING = fs.existsSync('content/landing') ? 'content/landing' : 'src/content/landing';
const writes = [];
let problems = 0;

const fm = (text) => {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end < 0) return null;
  try { return { data: yaml.load(text.slice(3, end)) || {}, end: end + 4 }; }
  catch { return null; }
};

// ------------------------------------------------- 1. Social Responsibility
console.log('1. Social Responsibility boxes');
{
  const file = 'src/social-responsibility/index.njk';
  const card = /<article class="rounded-2xl border border-blue-100 p-6"><h2 class="text-xl font-black">([^<]*)<\/h2><p class="mt-3 text-slate-700">([^<]*)<\/p><\/article>/g;
  const open = '<section class="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-3">';

  if (!fs.existsSync(file)) { console.log('   page not found - skipped'); }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('srCards')) console.log('   already done');
    else {
      const rows = [...src.matchAll(card)].map(([, title, description]) => ({ title: title.trim(), description: description.trim() }));
      const start = src.indexOf(open);
      if (!rows.length || start < 0) { console.log('   !! the boxes look different than expected - not touched'); problems++; }
      else {
        const endTag = src.indexOf('</section>', start);
        const fallback = rows.map((r) => `{"title":${JSON.stringify(r.title)},"description":${JSON.stringify(r.description)}}`).join(',');
        const loop = `${open}{% set srCards = (lp.cards or [${fallback}]) | liveCards %}`
          + '{% for c in srCards %}<article class="rounded-2xl border border-blue-100 p-6">'
          + '<h2 class="text-xl font-black">{{ c.title }}</h2>'
          + '<p class="mt-3 text-slate-700">{{ c.description }}</p></article>{% endfor %}</section>';

        writes.push([file, src.slice(0, start) + loop + src.slice(endTag + '</section>'.length)]);
        console.log(`   ${rows.length} boxes become editable: ${rows.map((r) => r.title).join(', ')}`);

        // ...and into the page's own file, so the CMS shows them filled in
        const lf = `${LANDING}/social-responsibility.md`;
        if (!fs.existsSync(lf)) { console.log(`   !! ${lf} not found`); problems++; }
        else {
          const parsed = fm(fs.readFileSync(lf, 'utf8'));
          if (!parsed) { console.log(`   !! could not read ${lf}`); problems++; }
          else if (Array.isArray(parsed.data.cards) && parsed.data.cards.length) {
            console.log('   its page file already has cards - left alone');
          } else {
            parsed.data.cards = rows;
            writes.push([lf, `---\n${yaml.dump(parsed.data, { lineWidth: 0, quotingType: '"' })}---\n`]);
            console.log('   the three boxes added to its page file');
          }
        }
      }
    }
  }
}

// ------------------------------------------------- 2. empty slider title
console.log('\n2. Sliders with no title');
{
  const dir = 'src/content/sliders';
  const nice = (p) => path.basename(String(p || ''), path.extname(String(p || '')))
    .replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
  let found = 0;
  for (const name of files) {
    const file = `${dir}/${name}`;
    const text = fs.readFileSync(file, 'utf8');
    const parsed = fm(text);
    if (!parsed) continue;
    if (String(parsed.data.title || '').trim()) continue;
    found++;

    const photo = parsed.data.image || parsed.data.cover_image || parsed.data.photo || '';
    const title = nice(photo) || nice(name);
    if (!title) { console.log(`   !! ${name}: nothing to build a title from`); problems++; continue; }

    parsed.data.title = title;
    writes.push([file, `---\n${yaml.dump(parsed.data, { lineWidth: 0, quotingType: '"' })}---\n${text.slice(parsed.end)}`]);
    console.log(`   ${name}  ->  "${title}"`);
  }
  if (!found) console.log('   none - all sliders have a title');
}

// ------------------------------------------------- 3. report
console.log('\n3. Still needs attention');
{
  try {
    const control = JSON.parse(fs.readFileSync('src/_data/pageControl.json', 'utf8'));
    const off = (control.pages || []).filter((p) => p.published === false);
    const hidden = control.hiddenUrls || [];
    if (off.length || hidden.length) {
      console.log(`   switched off (${off.length + hidden.length}):`);
      for (const p of off) console.log(`      ${p.label} - ${p.url}`);
      for (const u of hidden) console.log(`      ${u}`);
      console.log('      ^ check these are off on purpose');
    } else console.log('   no pages switched off');
  } catch { console.log('   could not read pageControl.json'); }

  const placeholders = [];
  (function scan(dir) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name).replace(/\\/g, '/');
      if (e.isDirectory()) { scan(p); continue; }
      if (!e.name.endsWith('.md')) continue;
      const parsed = fm(fs.readFileSync(p, 'utf8'));
      const cover = String(parsed?.data?.cover_image || '');
      if (/\.svg$/i.test(cover) || /placeholder/i.test(cover)) placeholders.push([p, cover]);
    }
  })('src/content');

  if (placeholders.length) {
    console.log(`\n   still using a drawing instead of a real photo (${placeholders.length}):`);
    for (const [p] of placeholders.slice(0, 15)) console.log(`      ${p}`);
    if (placeholders.length > 15) console.log(`      ... and ${placeholders.length - 15} more`);
    console.log('      ^ the client needs to upload real photos for these');
  } else console.log('\n   every card has a real photo');
}

// ------------------------------------------------- go
console.log('');
if (problems) { console.log(`${problems} problem(s) - nothing was written.`); process.exit(1); }
if (!writes.length) { console.log('Nothing to change.'); process.exit(0); }
if (!WRITE) { console.log(`${writes.length} file(s) will change. Run again with --write to apply.`); process.exit(0); }

for (const [file, text] of writes) fs.writeFileSync(file, text, 'utf8');
console.log(`${writes.length} file(s) changed. Run "npm run build", then commit and push.`);
