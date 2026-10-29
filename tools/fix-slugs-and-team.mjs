// Two bugs and one addition.
//
// 1. "An item with slug 'untitled' already exists"
//    The dashboard builds a file name from the field called "title". The
//    cards I added - Our Team, Happy Clients, Our Partners, Affiliated With,
//    Announcement Bar - called that field "name" instead, so every new entry
//    was handed the same slug, "untitled". The first one saved; the second
//    collided with it. Renaming the field to "title" is all it takes, and the
//    label on screen stays what it was.
//
//    Entries already saved keep working: the readers accept either spelling,
//    and the files on disk are renamed here as well.
//
// 2. The hover panel swallowed the photo
//    It grew to fit the words, so a long biography covered the whole picture.
//    Now it covers the lower part and no more, the words are trimmed to fit,
//    and a "More" button opens the rest.
//
//   node tools/fix-slugs-and-team.mjs           -> shows what will change
//   node tools/fix-slugs-and-team.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

const writes = new Map();
let problems = 0;
const add = (file, text) => {
  try { if (fs.readFileSync(file, 'utf8') === text) return; } catch {}
  writes.set(file, text);
};
const say = (s) => console.log(`   ${s}`);

// ===================================================== 1. the slug
console.log('1. "slug untitled already exists"');

// collection -> what the renamed field should be labelled
const CARDS = {
  team: 'Name',
  clients: 'Name',
  partners: 'Partner name',
  affiliations: 'Name',
};

{
  const file = '.pages.yml';
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  let touched = 0;

  for (const [name, label] of Object.entries(CARDS)) {
    const entry = doc.content.find((c) => c.name === name);
    if (!entry) { say(`card not found: ${name}`); continue; }
    if ((entry.fields || []).some((f) => f.name === 'title')) { say(`already fixed: ${name}`); continue; }

    const field = (entry.fields || []).find((f) => f.name === 'name');
    if (!field) { console.log(`   !! ${name}: no "name" field to rename`); problems++; continue; }

    field.name = 'title';
    field.label = label;
    entry.filename = { template: '{title}.md', field: 'title' };
    if (entry.view) {
      entry.view.primary = 'title';
      entry.view.fields = (entry.view.fields || []).map((f) => (f === 'name' ? 'title' : f));
    }
    touched++;
    say(`${name}: the field is now "title" (still shown as "${label}")`);
  }

  // The announcement bar had no such field at all, so every entry there would
  // have hit the same wall.
  const ann = doc.content.find((c) => c.name === 'announcements');
  if (ann && !(ann.fields || []).some((f) => f.name === 'title')) {
    ann.fields.unshift({
      name: 'title',
      label: 'Name for this list',
      type: 'string',
      required: true,
      description: 'Just so you can find it again — "Winter closure", "2027 Baltoro dates". Not shown on the website.',
    });
    ann.filename = { template: '{title}.md', field: 'title' };
    if (ann.view) ann.view.primary = 'title';
    touched++;
    say('announcements: a short name added, so entries no longer collide');
  } else if (ann) say('already fixed: announcements');

  if (touched) {
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try {
      const check = yaml.load(out);
      ok = check.content.length === doc.content.length
        && (check.content.find((c) => c.name === 'team')?.fields || []).some((f) => f.name === 'title');
    } catch (e) { console.log(`!! ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else add(file, out);
  }
}

// ---- files already saved
{
  let moved = 0;
  for (const dir of ['content/team', 'content/clients', 'content/partners', 'content/affiliations']) {
    let names = [];
    try { names = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch { continue; }
    for (const name of names) {
      const file = `${dir}/${name}`;
      const text = fs.readFileSync(file, 'utf8');
      if (!text.startsWith('---')) continue;
      const end = text.indexOf('\n---', 3);
      if (end < 0) continue;
      let data;
      try { data = yaml.load(text.slice(3, end)) || {}; } catch { continue; }
      if (data.title !== undefined || data.name === undefined) continue;

      // keep the order readable: title where name used to be
      const next = {};
      for (const [k, v] of Object.entries(data)) next[k === 'name' ? 'title' : k] = v;
      add(file, `---\n${yaml.dump(next, { lineWidth: 0, quotingType: '"' })}---\n${text.slice(end + 4)}`);
      moved++;
    }
  }
  say(moved ? `${moved} entry/entries already saved were updated too` : 'no saved entries needed updating');
}

// ---- readers accept either spelling
const reader = (dir, label, extra = '') => `// ${label} - from content/${dir}/.
//
// "title" is what the dashboard names its files after; older entries were
// saved with "name". Both are accepted so nothing saved before has to be
// touched by hand.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/${dir}";

export default function () {
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return []; }

  const out = [];
  for (const file of names) {
    let text = "";
    try { text = fs.readFileSync(\`\${DIR}/\${file}\`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || data.published === false) continue;

    const title = String(data.title || data.name || "").trim();
    if (!title) continue;
${extra}
    out.push({ ...data, name: title, title });
  }

  return out.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.title || "").localeCompare(String(b.title || "")));
}
`;

add('src/_data/clients.js', reader('clients', 'Happy clients'));
add('src/_data/partners.js', reader('partners', 'Our partners', '    if (!data.logo) continue;'));
add('src/_data/affiliations.js', reader('affiliations', 'Affiliated with', '    if (!data.logo) continue;'));

add('src/_data/team.js', `// The team - from content/team/, grouped the way you named the groups.
//
// "title" is what the dashboard names its files after; older entries were
// saved with "name". Both are accepted.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/team";

export default function () {
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return []; }

  const people = [];
  for (const file of names) {
    let text = "";
    try { text = fs.readFileSync(\`\${DIR}/\${file}\`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || data.published === false) continue;

    const name = String(data.title || data.name || "").trim();
    if (!name) continue;
    people.push({ ...data, name });
  }

  people.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.name || "").localeCompare(String(b.name || "")));

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
say('readers accept both spellings');

// ===================================================== 2. the hover panel
console.log('\n2. The hover panel');

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
        <img src="{{ person.photo }}"{{ person.photo | srcsetAttr('(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw') | safe }} alt="{{ person.name }}" loading="lazy" decoding="async">
        {% endif %}
        {% if person.bio %}
        {# The panel keeps to the lower part of the photo and the words are
           trimmed to fit. A long biography used to stretch it until the
           picture was gone. #}
        <div class="bk-team-panel">
          <h3>{{ person.name }}</h3>
          {% if person.role %}<p class="bk-team-panel-role">{{ person.role }}</p>{% endif %}
          <p class="bk-team-panel-bio">{{ person.bio }}</p>
          {% if person.bio | length > 180 %}
          <button type="button" class="bk-team-more"
                  data-team-more
                  data-name="{{ person.name }}"
                  data-role="{{ person.role }}"
                  data-bio="{{ person.bio }}">More</button>
          {% endif %}
        </div>
        {% endif %}
      </div>
      <h3 class="bk-team-name">{{ person.name }}</h3>
      {% if person.role %}<p class="bk-team-role">{{ person.role }}</p>{% endif %}
    </article>
    {% endfor %}
  </div>
</section>
{% endfor %}

{# The whole biography, for when "More" is pressed. #}
<div class="bk-team-modal" data-team-modal hidden>
  <div class="bk-team-modal-box" role="dialog" aria-modal="true" aria-labelledby="team-modal-name">
    <button type="button" class="bk-team-modal-close" data-team-close aria-label="Close">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <h3 id="team-modal-name" data-team-modal-name></h3>
    <p class="bk-team-modal-role" data-team-modal-role></p>
    <p class="bk-team-modal-bio" data-team-modal-bio></p>
  </div>
</div>
<script src="/assets/js/team.js" defer></script>
{% else %}
<section class="bk-team"><p class="bk-team-empty">Team members will be listed here shortly.</p></section>
{% endif %}
`);

add('src/assets/js/team.js', `// "More" on a team photo opens the whole biography.
//
// The panel on the photo only ever shows as much as fits - anything longer is
// trimmed - so this is the way to read the rest.
(function () {
  var modal = document.querySelector("[data-team-modal]");
  if (!modal) return;

  var nameEl = modal.querySelector("[data-team-modal-name]");
  var roleEl = modal.querySelector("[data-team-modal-role]");
  var bioEl = modal.querySelector("[data-team-modal-bio]");

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var button = e.target.closest("[data-team-more]");
    if (button) {
      nameEl.textContent = button.getAttribute("data-name") || "";
      roleEl.textContent = button.getAttribute("data-role") || "";
      bioEl.textContent = button.getAttribute("data-bio") || "";
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      return;
    }
    if (e.target.closest("[data-team-close]") || e.target === modal) close();
  });

  document.addEventListener("keydown", function (e) {
    if (!modal.hidden && e.key === "Escape") close();
  });
})();
`);
say('panel keeps to the lower part, with "More" for the rest');

// ---- styles
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    let src = fs.readFileSync(file, 'utf8');
    const start = src.indexOf('/* ---------------------------------------------------------- our team');
    if (start < 0) { console.log('   !! the team styles are not there - run team-gallery-peaks.mjs first'); problems++; }
    else {
      const next = src.indexOf('\n/* ---', start + 10);
      src = src.slice(0, start) + (next < 0 ? '' : src.slice(next + 1));
      add(file, `${src.replace(/\s*$/, '')}

/* ---------------------------------------------------------- our team
   The panel slides up over the lower part of the photo and stops there. It
   used to grow with the words, so a long biography hid the picture it was
   meant to sit on. Anything that does not fit is trimmed, and "More" opens
   the rest.

   On a touch screen there is no hover, so the panel simply sits there. */
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

.bk-team-panel {
  position: absolute; left: 0; right: 0; bottom: 0;
  max-height: 68%;
  display: flex; flex-direction: column;
  padding: .9rem 1rem 1rem;
  text-align: left; color: #fff;
  background: linear-gradient(to top, rgb(2 6 23 / .94) 55%, rgb(2 6 23 / .72));
  opacity: 0; transform: translateY(100%);
  transition: opacity .25s ease, transform .25s ease;
}
.bk-team-card:hover .bk-team-panel,
.bk-team-card:focus-within .bk-team-panel { opacity: 1; transform: none; }

.bk-team-panel h3 { font-size: .95rem; font-weight: 700; }
.bk-team-panel-role {
  font-size: .72rem; font-weight: 600; margin-top: .1rem;
  color: var(--color-orange-500, #f97316);
}
.bk-team-panel-bio {
  margin-top: .45rem; font-size: .8rem; line-height: 1.5;
  overflow: hidden;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 5;
}
.bk-team-more {
  align-self: flex-start; margin-top: .5rem;
  font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-orange-500, #f97316);
  text-decoration: underline; text-underline-offset: 3px;
}

.bk-team-name {
  margin-top: .85rem; font-size: 1.05rem; font-weight: 700;
  color: var(--color-navy-900, #062a72);
}
.bk-team-role {
  font-size: .8rem; font-weight: 600; margin-top: .15rem;
  color: var(--color-orange-600, #d9600c);
}

@media (hover: none) {
  .bk-team-panel { opacity: 1; transform: none; }
}

/* the whole biography */
.bk-team-modal {
  position: fixed; inset: 0; z-index: 90;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
  background: rgb(2 6 23 / .8);
}
.bk-team-modal[hidden] { display: none; }
.bk-team-modal-box {
  position: relative;
  width: min(34rem, 100%); max-height: 80vh; overflow-y: auto;
  padding: 1.75rem;
  background: #fff; border-radius: var(--radius-xl, 16px);
}
.bk-team-modal-close {
  position: absolute; top: .75rem; right: .75rem;
  width: 2.25rem; height: 2.25rem; border-radius: 9999px;
  display: flex; align-items: center; justify-content: center;
  color: #64748b;
}
.bk-team-modal-close:hover { background: rgb(2 6 23 / .06); }
.bk-team-modal-box h3 { font-size: 1.25rem; font-weight: 800; color: var(--color-navy-900, #062a72); }
.bk-team-modal-role { font-size: .85rem; font-weight: 600; color: var(--color-orange-600, #d9600c); margin-top: .2rem; }
.bk-team-modal-bio { margin-top: 1rem; line-height: 1.65; color: #334155; white-space: pre-line; }
`);
      say('styles rewritten');
    }
  }
}

// ===================================================== go
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
console.log('In the dashboard, open /api/schema?refresh=1 once so the new fields show up.');
