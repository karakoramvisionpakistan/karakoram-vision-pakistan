// Three things at once.
//
// 1. GALLERY FILLS ITSELF
//    Every photo already attached to a tour, trek, expedition, safari or
//    vehicle now shows in the gallery, grouped by the kind of journey. Nobody
//    uploads anything twice: add a trek with its photos and they are in the
//    gallery the moment the site rebuilds. Albums made by hand still work and
//    come first.
//
// 2. OUR TEAM
//    A new page at /our-team/, added under About. Guides and staff in groups
//    you choose - "Mountain Guides", "Office Team", whatever you like. A photo
//    shows name and role; hover and their story slides up over it. On a phone,
//    where there is no hover, the story is simply there.
//
// 3. EXPEDITION HEIGHT
//    A dropdown on every expedition: 4,000m through 8,000m and above. Until
//    now the only way to mark an 8,000er was a yes/no switch, which said
//    nothing about the rest.
//
//   node tools/team-gallery-peaks.mjs           -> shows what will change
//   node tools/team-gallery-peaks.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

if (!fs.existsSync('.pages.yml')) { console.log('.pages.yml not found. Run this in the website folder.'); process.exit(1); }

const writes = new Map();
let problems = 0;
const add = (file, text) => {
  try { if (fs.readFileSync(file, 'utf8') === text) return; } catch {}
  writes.set(file, text);
};
const say = (s) => console.log(`   ${s}`);

// ======================================================== 1. gallery sources
console.log('1. Gallery fills itself from the journeys');

add('src/_data/gallery.js', `// Photo albums.
//
// Two sources, in this order:
//
//   content/gallery/   albums you put together by hand
//   src/content/...    every photo already attached to a journey
//
// The second one is the point: a trek's cover photo and its gallery are
// already in the CMS, so asking anyone to upload them again for the gallery
// would be busy-work - and the two copies would drift apart.
//
// A photo that appears in both is shown once, in the hand-made album, because
// that is where someone chose to put it.
import fs from "node:fs";
import yaml from "js-yaml";

const BY_HAND = "content/gallery";

// folder -> the name shown on the filter button
const JOURNEYS = [
  ["tours", "Tours"],
  ["trekking", "Trekking"],
  ["expeditions", "Expeditions"],
  ["jeep-safaris", "Jeep Safaris"],
  ["hunting-services", "Hunting"],
  ["vehicles", "Vehicles"],
  ["pages", "Destinations"],
];

function frontMatter(file) {
  let text = "";
  try { text = fs.readFileSync(file, "utf8"); } catch { return null; }
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\\n---", 3);
  if (end < 0) return null;
  try { return yaml.load(text.slice(3, end)); } catch { return null; }
}

// A drawing standing in for a missing photo is not worth showing.
const real = (src) => {
  const s = String(src || "").trim();
  return s && !/\\.svg(\\?|$)/i.test(s) && !/placeholder/i.test(s);
};

export default function () {
  const albums = [];
  const seen = new Set();

  // ---- by hand
  let names = [];
  try { names = fs.readdirSync(BY_HAND).filter((f) => f.endsWith(".md")); } catch {}
  for (const name of names) {
    const data = frontMatter(\`\${BY_HAND}/\${name}\`);
    if (!data || data.published === false) continue;
    const photos = (data.photos || []).filter(real);
    if (!photos.length) continue;
    photos.forEach((p) => seen.add(p));
    albums.push({ ...data, photos, count: photos.length, source: "manual" });
  }
  albums.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.title || "").localeCompare(String(b.title || "")));

  // ---- from the journeys
  for (const [folder, label] of JOURNEYS) {
    const dir = \`src/content/\${folder}\`;
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }

    const photos = [];
    for (const file of files.sort()) {
      const data = frontMatter(\`\${dir}/\${file}\`);
      if (!data || data.published === false) continue;
      for (const src of [data.cover_image, ...(data.gallery || [])]) {
        if (!real(src) || seen.has(src)) continue;
        seen.add(src);
        photos.push(src);
      }
    }
    if (photos.length) albums.push({ title: label, photos, count: photos.length, source: "journeys" });
  }

  return albums;
}
`);
say('every journey photo now appears in the gallery, grouped by kind');
say('a photo used twice is shown once');

// ======================================================== 2. our team
console.log('\\n2. Our Team');

add('src/_data/team.js', `// The team - from content/team/, grouped the way you named the groups.
//
// Outside src/ on purpose: these are entries, not pages.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/team";

export default function () {
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return []; }

  const people = [];
  for (const name of names) {
    let text = "";
    try { text = fs.readFileSync(\`\${DIR}/\${name}\`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || data.published === false || !data.name) continue;
    people.push(data);
  }

  people.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.name || "").localeCompare(String(b.name || "")));

  // Group, keeping the order the people are in - so the first person's group
  // comes first and nobody has to number the groups as well.
  const groups = [];
  for (const person of people) {
    const title = String(person.section || "Our Team").trim() || "Our Team";
    let group = groups.find((g) => g.title === title);
    if (!group) { group = { title, people: [] }; groups.push(group); }
    group.people.push(person);
  }
  return groups;
}
`);
add('content/team/.gitkeep', '');

add('src/our-team/index.njk', `---
layout: layouts/base.njk
permalink: /our-team/
title: Our Guides & Team
summary: The guides, drivers and office staff who plan and run every journey.
seo:
  title: "Our Guides & Team | Karakoram Vision Pakistan"
  description: >-
    The Skardu-based guides, high-altitude porters, drivers and planners behind every Karakoram Vision tour, trek and expedition.
---
{% set lp = landing[page.url] or {} %}
{% set heroItems = collections.journeys | limit(6) %}{% set heroHeading = lp.title or title %}{% set heroSummary = lp.summary or summary %}{% set heroEyebrow = lp.hero_eyebrow or 'The people behind the journeys' %}{% set heroCompact = true %}
{% include "components/landing-hero.njk" %}

{% if team and team.length %}
{% for group in team %}
<section class="bk-team">
  <h2 class="bk-team-title">{{ group.title }}</h2>
  <div class="bk-team-grid">
    {% for person in group.people %}
    <article class="bk-team-card">
      <div class="bk-team-photo">
        {% if person.photo %}
        <img src="{{ person.photo }}"{{ person.photo | srcsetAttr('(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw') }} alt="{{ person.name }}" loading="lazy" decoding="async">
        {% endif %}
        {% if person.bio %}
        <div class="bk-team-bio"><p>{{ person.bio }}</p></div>
        {% endif %}
      </div>
      <h3>{{ person.name }}</h3>
      {% if person.role %}<p class="bk-team-role">{{ person.role }}</p>{% endif %}
    </article>
    {% endfor %}
  </div>
</section>
{% endfor %}
{% else %}
<section class="bk-team"><p class="bk-team-empty">Team members will be listed here shortly.</p></section>
{% endif %}
`);

// ======================================================== styles
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('.bk-team')) say('styles already there: input.css');
    else {
      add(file, `${src.replace(/\s*$/, '')}

/* ---------------------------------------------------------- our team
   The story slides up over the photo on hover. On a touch screen there is no
   hover, so it simply sits there instead - a panel nobody can open is worse
   than one that is always open. */
.bk-team { max-width: 80rem; margin-inline: auto; padding: 2.5rem 1rem; }
.bk-team-title {
  font-size: clamp(1.35rem, 2.4vw, 1.9rem); font-weight: 800;
  color: var(--color-navy-900, #062a72);
  margin-bottom: 1.5rem;
}
.bk-team-empty { text-align: center; color: #64748b; padding: 3rem 0; }

.bk-team-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 640px)  { .bk-team-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .bk-team-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.bk-team-card { text-align: center; }
.bk-team-photo {
  position: relative; overflow: hidden;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-lg, 6px);
  background: var(--color-navy-100, #e8edf7);
}
.bk-team-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bk-team-bio {
  position: absolute; inset: 0;
  display: flex; align-items: flex-end;
  padding: 1.1rem;
  color: #fff;
  background: linear-gradient(to top, rgb(2 6 23 / .92) 35%, rgb(2 6 23 / .55));
  opacity: 0; transform: translateY(12%);
  transition: opacity .25s ease, transform .25s ease;
}
.bk-team-bio p { margin: 0; font-size: .85rem; line-height: 1.55; text-align: left; }
.bk-team-card:hover .bk-team-bio,
.bk-team-card:focus-within .bk-team-bio { opacity: 1; transform: none; }

.bk-team-card h3 {
  margin-top: .85rem; font-size: 1.05rem; font-weight: 700;
  color: var(--color-navy-900, #062a72);
}
.bk-team-role {
  font-size: .8rem; font-weight: 600; margin-top: .15rem;
  color: var(--color-orange-600, #d9600c);
}

@media (hover: none) {
  .bk-team-bio { opacity: 1; transform: none; }
}
`);
      say('styles added to input.css');
    }
  }
}

// ======================================================== 3 + CMS
console.log('\\n3. Expedition height, and the CMS cards');
{
  const file = '.pages.yml';
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  let touched = 0;

  // ---- team card
  if (doc.content.some((c) => c.name === 'team')) say('already there: Our Team card');
  else {
    doc.content.push({
      name: 'team',
      label: 'Our Team',
      description: 'Guides, drivers and office staff, shown on the Our Team page. The group name decides which heading a person appears under — type the same group name for everyone who belongs together.',
      type: 'collection',
      path: 'content/team',
      filename: { template: '{name}.md', field: 'name' },
      view: { primary: 'name', fields: ['name', 'role', 'section', 'published'] },
      fields: [
        { name: 'name', label: 'Name', type: 'string', required: true },
        { name: 'role', label: 'Role', type: 'string', description: 'Shown under the name — "Expedition Leader", "Driver", "Office Manager".' },
        { name: 'photo', label: 'Photo', type: 'image', description: 'A standing photo works best — it is shown taller than it is wide.' },
        { name: 'bio', label: 'About them', type: 'text', description: 'A few lines. These slide up over the photo when someone hovers.' },
        { name: 'section', label: 'Group', type: 'string', description: 'The heading they appear under — "Mountain Guides", "Office Team", "Drivers". Leave empty for "Our Team".' },
        { name: 'order', label: 'Order', type: 'number', description: 'Lower numbers come first. The first person\'s group is the first group on the page.' },
        { name: 'published', label: 'Show on the website', type: 'boolean', default: true },
      ],
    });
    touched++;
    say('new card: Our Team');
  }

  // ---- expedition height
  const exp = doc.content.find((c) => c.name === 'expeditions');
  if (!exp) { console.log('   !! the Expeditions card is missing'); problems++; }
  else if ((exp.fields || []).some((f) => f.name === 'peak_class')) say('already there: expedition height');
  else {
    const at = exp.fields.findIndex((f) => f.name === 'difficulty');
    const field = {
      name: 'peak_class',
      label: 'Peak height',
      type: 'select',
      description: 'Which height band this peak falls in. Used for grouping expeditions.',
      options: ['Trekking peak (under 6,000m)', '6,000m peaks', '7,000m peaks', '8,000m peaks'],
    };
    exp.fields.splice(at < 0 ? exp.fields.length : at + 1, 0, field);
    touched++;
    say('new dropdown on every expedition: Peak height');
  }

  if (touched) {
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try {
      const check = yaml.load(out);
      ok = check.content.length === doc.content.length
        && (check.content.find((c) => c.name === 'expeditions')?.fields || []).some((f) => f.name === 'peak_class');
    } catch (e) { console.log(`!! ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else add(file, out);
  }
}

// ---- menu: Our Team under About
{
  const file = 'src/_data/menu.json';
  if (!fs.existsSync(file)) say('menu.json not found - add the Our Team link yourself');
  else {
    const menu = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (JSON.stringify(menu.items || []).includes('"/our-team/"')) say('already in the menu');
    else {
      const about = (menu.items || []).find((i) => /about/i.test(String(i.url || '')) || /^about$/i.test(String(i.label || '')));
      const entry = { label: 'Our Team', url: '/our-team/' };
      if (about) { about.children = about.children || []; about.children.unshift(entry); say('added to the menu, first under About'); }
      else { menu.items.push(entry); say('About not found - added to the end of the menu'); }
      const out = `${JSON.stringify(menu, null, 2)}\n`;
      JSON.parse(out);
      add(file, out);
    }
  }
}

// ======================================================== go
console.log('');
if (problems) { console.log(`${problems} problem(s) - nothing was written.`); process.exit(1); }
if (!writes.size) { console.log('Nothing to change.'); process.exit(0); }

console.log(`${writes.size} file(s) will change:`);
for (const f of writes.keys()) console.log(`   ${f}`);
if (!WRITE) { console.log('\nNothing changed yet. Run again with --write to apply.'); process.exit(0); }

for (const [file, text] of writes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}
console.log('\nDone. Run "npm run build", then commit and push.');
