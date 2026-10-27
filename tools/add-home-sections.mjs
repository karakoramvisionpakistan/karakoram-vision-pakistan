// Adds "Happy clients" and "Our partners" to the bottom of the homepage.
//
// WHAT YOU GET
//   Happy clients   round photo, name, country, and their words underneath.
//                   Five fit on a wide screen; more than that and the row
//                   slides. Fewer, and it simply centres.
//   Our partners    logo strip, right above the footer. Each logo links to
//                   that partner's own site. Same rule: it only slides when
//                   there are too many to fit.
//
// Both are ordinary CMS cards - add, remove, reorder, hide. Empty the card and
// the section disappears from the page on its own.
//
// WHERE THE FILES LIVE
// In content/ at the top of the repo, not src/content/, because anything under
// src/content/ is treated as a real page by the build tools - they would stamp
// a permalink on each one and try to publish them.
//
//   node tools/add-home-sections.mjs           -> shows what will change
//   node tools/add-home-sections.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml not found. Run "npm install" first.'); process.exit(1); }

for (const f of ['.pages.yml', 'eleventy.config.js', 'src/index.njk']) {
  if (!fs.existsSync(f)) { console.log(`${f} not found. Run this in the website folder.`); process.exit(1); }
}

const writes = new Map();
let problems = 0;
// Jo file pehle se bilkul waisi hi hai, usey dobara mat likho - warna dobara
// chalane par "yeh badlegi" likha aata hai halanki kuch badalna nahi hota.
const add = (file, text) => {
  try { if (fs.readFileSync(file, 'utf8') === text) return; } catch {}
  writes.set(file, text);
};
const say = (s) => console.log(`   ${s}`);

// ------------------------------------------------------------- data reader
const reader = (dir, label) => `// ${label} - read from content/${dir}/, which the CMS writes.
//
// These files are not pages, they are entries shown on the homepage, so they
// live outside src/ where the build tools cannot mistake them for pages.
// Sorted by the "order" number, then by name.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/${dir}";

export default function () {
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return []; }

  const out = [];
  for (const name of names) {
    let text = "";
    try { text = fs.readFileSync(\`\${DIR}/\${name}\`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || data.published === false) continue;
    out.push(data);
  }

  return out.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.name || "").localeCompare(String(b.name || "")));
}
`;

add('src/_data/clients.js', reader('clients', 'Happy clients'));
add('src/_data/partners.js', reader('partners', 'Our partners'));
add('content/clients/.gitkeep', '');
add('content/partners/.gitkeep', '');

// ------------------------------------------------------------- the strip
add('src/assets/js/strip.js', `// A row that only slides when it has to.
//
// Five photos fit on a wide screen. With five or fewer the row simply sits in
// the middle and the arrows stay hidden - arrows that do nothing are worse
// than no arrows. Add a sixth and they appear.
//
// No library: the browser's own smooth scrolling does the work, so this costs
// nothing on page load.
(function () {
  function setup(strip) {
    var track = strip.querySelector("[data-strip-track]");
    var prev = strip.querySelector("[data-strip-prev]");
    var next = strip.querySelector("[data-strip-next]");
    if (!track) return;

    function step() {
      var first = track.firstElementChild;
      var card = first ? first.getBoundingClientRect().width + 24 : 240;
      return Math.max(card, Math.round(track.clientWidth * 0.8));
    }

    function refresh() {
      var overflows = track.scrollWidth > track.clientWidth + 4;
      strip.classList.toggle("is-sliding", overflows);
      if (!prev || !next) return;
      prev.disabled = !overflows || track.scrollLeft <= 2;
      next.disabled = !overflows || track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }

    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);
    refresh();
  }

  function start() { document.querySelectorAll("[data-strip]").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
`);

// ------------------------------------------------------------- components
const arrows = (label) => `    <button class="bk-strip-btn" type="button" data-strip-prev aria-label="Previous ${label}">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
    </button>`;
const arrowsNext = (label) => `    <button class="bk-strip-btn" type="button" data-strip-next aria-label="Next ${label}">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
    </button>`;

add('src/_includes/components/happy-clients.njk', `{# Happy clients - the few travellers you pick yourself, with their photo.
   Guest reviews are a separate thing: those arrive from travellers and you
   approve them. This strip is yours to curate.
   No entries, no section - nothing empty ever shows. #}
{% if clients and clients.length %}
<section class="bk-clients">
  <header class="bk-clients-head">
    <h2>{{ homePage.clients.heading or 'Happy clients' }}</h2>
    <p>{{ homePage.clients.description or 'A good word means a lot' }}</p>
  </header>

  <div class="bk-strip" data-strip>
${arrows('clients')}
    <ul class="bk-strip-track" data-strip-track>
      {% for person in clients %}
      <li class="bk-client">
        {% if person.photo %}
        <div class="bk-client-photo">
          <img src="{{ person.photo }}" alt="{{ person.name }}" width="180" height="180" loading="lazy" decoding="async">
        </div>
        {% endif %}
        <h3>{{ person.name }}</h3>
        {% if person.country %}<p class="bk-client-where">{{ person.country }}</p>{% endif %}
        <p class="bk-client-quote">{{ person.quote }}</p>
      </li>
      {% endfor %}
    </ul>
${arrowsNext('clients')}
  </div>
</section>
{% endif %}
`);

add('src/_includes/components/our-partners.njk', `{# Our partners - the logo strip just above the footer. Each logo opens that
   partner's own site in a new tab. No entries, no section. #}
{% if partners and partners.length %}
<section class="bk-partners">
  <h2>{{ homePage.partners.heading or 'Our partners' }}</h2>
  {% if homePage.partners.description %}<p class="bk-partners-note">{{ homePage.partners.description }}</p>{% endif %}

  <div class="bk-strip" data-strip>
${arrows('partners')}
    <ul class="bk-strip-track" data-strip-track>
      {% for partner in partners %}
      <li class="bk-partner">
        {% if partner.url %}<a href="{{ partner.url }}" target="_blank" rel="noopener noreferrer" title="{{ partner.name }}">{% endif %}
          <img src="{{ partner.logo }}" alt="{{ partner.name }}" height="72" loading="lazy" decoding="async">
        {% if partner.url %}</a>{% endif %}
      </li>
      {% endfor %}
    </ul>
${arrowsNext('partners')}
  </div>
</section>
{% endif %}
`);

// ------------------------------------------------------------- index.njk
{
  const file = 'src/index.njk';
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('our-partners.njk')) say('already on the homepage: index.njk');
  else {
    const anchor = '{% endfor %}';
    const last = src.lastIndexOf(anchor);
    if (last < 0) { console.log('!! index.njk: could not find where the sections end'); problems++; }
    else {
      const nl = src.includes('\r\n') ? '\r\n' : '\n';
      const block = [
        anchor,
        '',
        '{# These two always sit at the very bottom, in this order, so partners are',
        '   the last thing above the footer. They are not part of the section list',
        '   above because their place on the page is fixed. #}',
        '{% include "components/happy-clients.njk" %}',
        '{% include "components/our-partners.njk" %}',
        '{% if (clients and clients.length) or (partners and partners.length) %}<script src="/assets/js/strip.js" defer></script>{% endif %}',
      ].join(nl);
      add(file, src.slice(0, last) + block + src.slice(last + anchor.length));
      say('two sections added at the bottom of the homepage');
    }
  }
}

// ------------------------------------------------------------- styles
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`!! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('.bk-strip')) say('styles already there: input.css');
    else {
      add(file, `${src.replace(/\s*$/, '')}

/* ---------------------------------------------------------- sliding rows
   Used by "Happy clients" and "Our partners". The row centres itself when
   everything fits and scrolls when it does not - width:fit-content on the
   wrapper is what makes both happen without any measuring in JS. */
.bk-strip {
  position: relative;
  display: flex;
  align-items: center;
  gap: .5rem;
  width: fit-content;
  max-width: 100%;
  margin-inline: auto;
}
.bk-strip-track {
  display: flex;
  gap: 1.5rem;
  margin: 0;
  padding: .5rem 0 1rem;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
.bk-strip-track::-webkit-scrollbar { display: none; }
.bk-strip-track > * { flex: 0 0 auto; scroll-snap-align: center; }

/* Arrows appear only when the row actually slides - strip.js adds the class. */
.bk-strip-btn {
  display: none;
  flex: 0 0 auto;
  width: 2.75rem; height: 2.75rem;
  align-items: center; justify-content: center;
  border-radius: 9999px;
  color: var(--color-navy-900, #062a72);
  background: transparent;
  transition: background .15s, opacity .15s;
}
.bk-strip.is-sliding .bk-strip-btn { display: flex; }
.bk-strip-btn:hover { background: rgb(0 0 0 / .05); }
.bk-strip-btn:disabled { opacity: .25; cursor: default; }

/* ---------------------------------------------------------- happy clients */
.bk-clients { padding: 3.5rem 1rem; background: var(--color-navy-100, #e8edf7); }
.bk-clients-head { text-align: center; margin-bottom: 2rem; }
.bk-clients-head h2 {
  font-size: clamp(1.6rem, 3vw, 2.25rem); font-weight: 900; letter-spacing: -.01em;
  color: var(--color-navy-900, #062a72);
}
.bk-clients-head p { margin-top: .4rem; color: #475569; }
.bk-client { width: 15rem; text-align: center; }
.bk-client-photo {
  width: 9.5rem; height: 9.5rem; margin: 0 auto 1rem;
  border-radius: 9999px; overflow: hidden;
  border: 6px solid var(--color-orange-500, #f97316);
  background: #fff;
}
.bk-client-photo img { width: 100%; height: 100%; object-fit: cover; }
.bk-client h3 {
  font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: .02em;
  color: var(--color-navy-900, #062a72);
}
.bk-client-where { font-size: .8rem; color: #64748b; margin-top: .15rem; }
.bk-client-quote { margin-top: .6rem; font-size: .9rem; line-height: 1.6; color: #475569; }

/* ---------------------------------------------------------- our partners */
.bk-partners { padding: 3rem 1rem 3.5rem; text-align: center; background: #fff; }
.bk-partners h2 {
  font-size: clamp(1.4rem, 2.4vw, 1.9rem); font-weight: 800;
  color: var(--color-navy-900, #062a72); margin-bottom: .35rem;
}
.bk-partners-note { color: #64748b; font-size: .9rem; margin-bottom: 1.25rem; }
.bk-partner { display: flex; align-items: center; justify-content: center; min-width: 8rem; }
.bk-partner img {
  max-height: 4.5rem; width: auto; object-fit: contain;
  filter: grayscale(1); opacity: .75;
  transition: filter .2s, opacity .2s, transform .2s;
}
.bk-partner a:hover img { filter: none; opacity: 1; transform: translateY(-2px); }

@media (max-width: 640px) {
  .bk-client { width: 13rem; }
  .bk-client-photo { width: 8rem; height: 8rem; }
}
`);
      say('styles added to input.css');
    }
  }
}

// ------------------------------------------------------------- .pages.yml
{
  const file = '.pages.yml';
  const src = fs.readFileSync(file, 'utf8');
  const doc = yaml.load(src);
  const names = new Set(doc.content.map((c) => c.name));
  let touched = 0;

  if (!names.has('clients')) {
    doc.content.push({
      name: 'clients',
      label: 'Happy Clients (homepage)',
      description: 'The travellers you want on the homepage, with their photo and a line about their trip. These are yours to choose — guest reviews that people send in are handled separately under Reviews.',
      type: 'collection',
      path: 'content/clients',
      filename: { template: '{name}.md', field: 'name' },
      view: { primary: 'name', fields: ['name', 'country', 'published'] },
      fields: [
        { name: 'name', label: 'Name', type: 'string', required: true },
        { name: 'photo', label: 'Photo', type: 'image', description: 'A square photo works best — it is shown in a circle.' },
        { name: 'country', label: 'Country', type: 'string' },
        { name: 'quote', label: 'What they said', type: 'text', required: true },
        { name: 'order', label: 'Order', type: 'number', description: 'Lower numbers come first.' },
        { name: 'published', label: 'Show on the website', type: 'boolean', default: true },
      ],
    });
    touched++;
    say('new card: Happy Clients');
  } else say('already there: Happy Clients');

  if (!names.has('partners')) {
    doc.content.push({
      name: 'partners',
      label: 'Our Partners (homepage)',
      description: 'Partner and affiliate logos, shown just above the footer. Each logo opens that partner\'s own website.',
      type: 'collection',
      path: 'content/partners',
      filename: { template: '{name}.md', field: 'name' },
      view: { primary: 'name', fields: ['name', 'url', 'published'] },
      fields: [
        { name: 'name', label: 'Partner name', type: 'string', required: true },
        { name: 'logo', label: 'Logo', type: 'image', required: true, description: 'PNG or SVG with a see-through background looks best.' },
        { name: 'url', label: 'Their website', type: 'string', description: 'Opens in a new tab. Leave empty for a logo with no link.' },
        { name: 'order', label: 'Order', type: 'number', description: 'Lower numbers come first.' },
        { name: 'published', label: 'Show on the website', type: 'boolean', default: true },
      ],
    });
    touched++;
    say('new card: Our Partners');
  } else say('already there: Our Partners');

  // headings on the homepage screen
  const home = doc.content.find((c) => c.name === 'homepage');
  if (home && !(home.fields || []).some((f) => f.name === 'clients')) {
    home.fields = home.fields || [];
    home.fields.push(
      { name: '_h_bottom_sections', label: 'Bottom of the homepage', type: 'heading', collapsed: true },
      { name: 'clients', label: 'Happy clients', type: 'object', fields: [
        { name: 'heading', label: 'Heading', type: 'string', description: 'Leave empty for "Happy clients".' },
        { name: 'description', label: 'Line underneath', type: 'string' },
      ] },
      { name: 'partners', label: 'Our partners', type: 'object', fields: [
        { name: 'heading', label: 'Heading', type: 'string', description: 'Leave empty for "Our partners".' },
        { name: 'description', label: 'Line underneath', type: 'string' },
      ] },
    );
    touched++;
    say('headings for both sections added to the Homepage screen');
  } else if (home) say('already there: homepage headings');

  if (touched) {
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try {
      const check = yaml.load(out);
      ok = check.content.length === doc.content.length
        && check.content.some((c) => c.name === 'clients')
        && check.content.some((c) => c.name === 'partners');
    } catch (e) { console.log(`!! .pages.yml: ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else add(file, out);
  }
}

// ------------------------------------------------------------- go
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
console.log('The two sections stay hidden until you add the first client or partner in the CMS.');
