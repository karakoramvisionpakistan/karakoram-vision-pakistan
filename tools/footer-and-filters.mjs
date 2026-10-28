// Two fixes.
//
// 1. "AFFILIATED WITH" - PLACE AND SIZE
//    It sat below the copyright line; it belongs beside the International
//    contact hub button, which is where it is moved to.
//
//    The giant logo is a separate thing, and worth explaining. The build adds
//    width="1200" to any <img> that has no width - a sensible rule that keeps
//    pages from jumping while they load. These logos had a height but no
//    width, so they were handed 1200. Normally the stylesheet caps them, but
//    if a browser is still holding an older stylesheet there is nothing to cap
//    them with, and the logo fills the screen. Giving each image its size in
//    the tag itself means it is right even with no stylesheet at all.
//
// 2. "WHICH SUB-MENU DOES THIS GO IN?"
//    Trekking has K2 Treks and Best Sellers; Tours has Cultural Tours;
//    Expeditions has 8,000m Peaks. Those pages pick their trips from switches
//    on each trip - but three of those switches were never added to the form,
//    so there was no way to answer the question while adding a trek. They are
//    added here.
//
//   node tools/footer-and-filters.mjs           -> shows what will change
//   node tools/footer-and-filters.mjs --write   -> makes the change
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

// ===================================================== 1. the badges
console.log('1. Affiliated with');

// Size in the tag, not only in the stylesheet. An <img> with both width and
// height is never handed a made-up width by the build, and it is the right
// size even before any CSS arrives.
add('src/_includes/components/affiliated-with.njk', `{# The membership badges, beside the contact hub button in the footer.

   Each logo carries its own size, in the tag and in a style attribute. That
   is on purpose: the build fills in width="1200" for images that have none,
   and a browser holding an older stylesheet has nothing to cap them with -
   which is how one of these once filled a whole screen. #}
{% if affiliations and affiliations.length %}
<div class="bk-affiliations">
  <p class="bk-affiliations-label">{{ siteFooter.affiliations_label or "Affiliated with" }}</p>
  <ul class="bk-affiliations-list">
    {% for item in affiliations %}
    <li>
      {% if item.url %}<a href="{{ item.url }}" target="_blank" rel="noopener noreferrer" title="{{ item.name }}">{% endif %}
        <img src="{{ item.logo }}" alt="{{ item.name }}" width="56" height="56" style="width:56px;height:56px;object-fit:contain" loading="lazy" decoding="async">
      {% if item.url %}</a>{% endif %}
    </li>
    {% endfor %}
  </ul>
</div>
{% endif %}
`);
say('each logo now carries its own size - right even with no stylesheet');

{
  const file = 'src/_includes/components/footer.njk';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('bk-footer-hub-row')) say('already beside the contact hub');
    else {
      const bottom = '{% include "components/affiliated-with.njk" %}\n';
      const hub = "      {% if f.contact.show_contact_hub !== false %}<button type=\"button\" class=\"bk-footer-contact-hub\" data-open-contact>{{ icon('chat') }} {{ f.contact.contact_hub_label or 'International contact hub' }}</button>{% endif %}";

      if (!src.includes(hub)) { console.log('   !! could not find the contact hub button - footer not touched'); problems++; }
      else {
        let out = src.includes(bottom) ? src.replace(bottom, '') : src;
        out = out.replace(hub, [
          '      <div class="bk-footer-hub-row">',
          hub,
          '        {% include "components/affiliated-with.njk" %}',
          '      </div>',
        ].join('\n'));
        add(file, out);
        say('moved up beside the International contact hub button');
      }
    }
  }
}

// ---------------------------------------------------- styles
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    let src = fs.readFileSync(file, 'utf8');
    if (src.includes('.bk-footer-hub-row')) say('styles already there');
    else {
      // the old block sat at the bottom of the footer - replace it wholesale
      const oldStart = src.indexOf('/* ---------------------------------------------------------- affiliated with');
      if (oldStart >= 0) {
        const nextBlock = src.indexOf('\n/* ---', oldStart + 10);
        src = src.slice(0, oldStart) + (nextBlock < 0 ? '' : src.slice(nextBlock + 1));
      }
      add(file, `${src.replace(/\s*$/, '')}

/* ---------------------------------------------------------- affiliated with
   Beside the contact hub button, wrapping underneath it when there is no room.
   Quieter than the partner strip: small, grey, and no arrows - a footer is no
   place for them. */
.bk-footer-hub-row {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-top: 1rem;
}
.bk-affiliations { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.bk-affiliations-label {
  font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .12em;
  opacity: .5; margin: 0; white-space: nowrap;
}
.bk-affiliations-list {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: .75rem; margin: 0; padding: 0; list-style: none;
}
.bk-affiliations-list img {
  width: 56px; height: 56px; object-fit: contain;
  opacity: .75; filter: grayscale(1);
  transition: opacity .2s, filter .2s;
}
.bk-affiliations-list a:hover img { opacity: 1; filter: none; }
`);
      say('styles updated: a compact row beside the button');
    }
  }
}

// ===================================================== 2. the missing switches
console.log('\n2. "Which sub-menu does this go in?"');
{
  const file = '.pages.yml';
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));

  // collection -> the switch its sub-menu page looks for, and what to call it
  const NEEDED = {
    trekking: [
      { name: 'k2_trek', label: 'K2 Treks', description: 'Shows this trek on the K2 Treks page in the menu.' },
    ],
    tours: [
      { name: 'cultural_tour', label: 'Cultural Tours', description: 'Shows this tour on the Cultural Tours page in the menu.' },
    ],
    expeditions: [
      { name: 'peak_8000m', label: '8,000m Peaks', description: 'Shows this expedition on the 8,000m Peaks page in the menu.' },
    ],
  };

  let touched = 0;
  for (const [name, fields] of Object.entries(NEEDED)) {
    const entry = doc.content.find((c) => c.name === name);
    if (!entry) { console.log(`   !! the ${name} card is missing`); problems++; continue; }

    for (const f of fields) {
      if ((entry.fields || []).some((x) => x.name === f.name)) { say(`already there: ${name} -> ${f.label}`); continue; }
      // next to the Best seller switch, where the other such switches live
      const at = entry.fields.findIndex((x) => x.name === 'best_seller');
      entry.fields.splice(at < 0 ? entry.fields.length : at + 1, 0,
        { name: f.name, label: f.label, type: 'boolean', default: false, description: f.description });
      touched++;
      say(`${name}: new switch "${f.label}"`);
    }

    // and show it in the list view, so it can be seen at a glance
    if (entry.view && Array.isArray(entry.view.fields)) {
      for (const f of fields) {
        if (!entry.view.fields.includes(f.name)) { entry.view.fields.push(f.name); touched++; }
      }
    }
  }

  if (touched) {
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try {
      const check = yaml.load(out);
      ok = check.content.length === doc.content.length
        && (check.content.find((c) => c.name === 'trekking')?.fields || []).some((f) => f.name === 'k2_trek');
    } catch (e) { console.log(`!! ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else add(file, out);
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
