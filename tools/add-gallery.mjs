// A photo gallery.
//
// HOW IT IS BUILT
// One page at /gallery/. Along the top, a chip for each album; below, every
// photo in a grid. Click one and it opens full screen with arrows and Esc.
//
// Albums are not separate pages on purpose. A page per album would mean two
// dozen thin pages in the sitemap with almost no words on them, which search
// engines treat as weak - and every one would need its own address, with all
// the ways that can clash. Chips give the same browsing without any of that.
//
// Photos come from the Media Library like everywhere else, so nothing new to
// learn: add an album, pick its photos, done.
//
//   node tools/add-gallery.mjs           -> shows what will change
//   node tools/add-gallery.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');
const ADD_TO_MENU = !process.argv.includes('--no-menu');

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

// ------------------------------------------------------------------ data
add('src/_data/gallery.js', `// Photo albums - from content/gallery/.
//
// Outside src/ on purpose: these are entries, not pages, and the build tools
// treat anything under src/content/ as a page.
//
// Each album keeps its photos together; the page flattens them into one grid
// and uses the album name for the filter chips.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/gallery";

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

    const photos = (data.photos || []).filter(Boolean);
    if (!photos.length) continue;              // khali album dikhane ka koi faida nahi
    out.push({ ...data, photos, count: photos.length });
  }

  return out.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.title || "").localeCompare(String(b.title || "")));
}
`);
add('content/gallery/.gitkeep', '');

// ------------------------------------------------------------------ page
add('src/gallery/index.njk', `---
layout: layouts/base.njk
permalink: /gallery/
title: Photo Gallery
summary: Photographs from our tours, treks and expeditions across northern Pakistan.
seo:
  title: "Photo Gallery - Pakistan Tours & Treks | Karakoram Vision"
  description: >-
    Photographs from the Karakoram, Hunza, Skardu and Deosai, taken on our own tours, treks and expeditions.
---
{% set lp = landing[page.url] or {} %}
{% set heroItems = collections.journeys | limit(6) %}{% set heroHeading = lp.title or title %}{% set heroSummary = lp.summary or summary %}{% set heroEyebrow = lp.hero_eyebrow or 'From our own journeys' %}{% set heroCompact = true %}
{% include "components/landing-hero.njk" %}

{% if gallery and gallery.length %}
<section class="bk-gallery">
  <header class="bk-section-heading"><div>
    <p class="eyebrow">{{ lp.section_eyebrow or 'Photographs' }}</p>
    <h2>{{ lp.section_heading or 'Browse by journey' }}</h2>
    <p>{{ lp.section_intro or 'Every photograph here was taken on one of our own departures.' }}</p>
  </div></header>

  {# Chips. "All" first, then one per album. With a single album there is
     nothing to filter, so they stay hidden. #}
  {% if gallery.length > 1 %}
  <div class="bk-gallery-chips" data-gallery-chips>
    <button type="button" class="is-on" data-filter="all">All</button>
    {% for album in gallery %}
    <button type="button" data-filter="{{ loop.index }}">{{ album.title }} <span>{{ album.count }}</span></button>
    {% endfor %}
  </div>
  {% endif %}

  <div class="bk-gallery-grid" data-gallery>
    {% for album in gallery %}{% set albumIndex = loop.index %}
      {% for photo in album.photos %}
      <figure class="bk-gallery-item" data-album="{{ albumIndex }}">
        <button type="button" data-photo="{{ photo }}" data-caption="{{ album.title }}">
          <img src="{{ photo }}"{{ photo | srcsetAttr('(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw') }} alt="{{ album.title }}" loading="lazy" decoding="async">
        </button>
      </figure>
      {% endfor %}
    {% endfor %}
  </div>
</section>

{# Full screen viewer. Empty until a photo is clicked. #}
<div class="bk-lightbox" data-lightbox hidden>
  <button type="button" class="bk-lightbox-close" data-lightbox-close aria-label="Close">
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
  <button type="button" class="bk-lightbox-nav is-prev" data-lightbox-prev aria-label="Previous photo">
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>
  </button>
  <figure>
    <img data-lightbox-img src="" alt="">
    <figcaption data-lightbox-caption></figcaption>
  </figure>
  <button type="button" class="bk-lightbox-nav is-next" data-lightbox-next aria-label="Next photo">
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
  </button>
</div>
<script src="/assets/js/gallery.js" defer></script>
{% else %}
<section class="bk-gallery">
  <p class="bk-gallery-empty">Photographs are on their way.</p>
</section>
{% endif %}
`);

// ------------------------------------------------------------------ script
add('src/assets/js/gallery.js', `// Gallery: filter chips and a full-screen viewer.
//
// No library. Filtering is a class on each tile, and the viewer walks whatever
// tiles are currently on show - so after filtering, the arrows stay inside
// that album instead of wandering into photos you cannot see.
(function () {
  var grid = document.querySelector("[data-gallery]");
  var box = document.querySelector("[data-lightbox]");
  if (!grid || !box) return;

  var img = box.querySelector("[data-lightbox-img]");
  var caption = box.querySelector("[data-lightbox-caption]");
  var at = 0;

  function shown() {
    return Array.prototype.filter.call(grid.querySelectorAll(".bk-gallery-item"), function (el) {
      return !el.hidden;
    });
  }

  function open(index) {
    var list = shown();
    if (!list.length) return;
    at = (index + list.length) % list.length;
    var button = list[at].querySelector("button");
    img.src = button.getAttribute("data-photo");
    img.alt = button.getAttribute("data-caption") || "";
    caption.textContent = button.getAttribute("data-caption") || "";
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    box.hidden = true;
    img.src = "";
    document.body.style.overflow = "";
  }

  grid.addEventListener("click", function (e) {
    var button = e.target.closest("button[data-photo]");
    if (!button) return;
    open(shown().indexOf(button.closest(".bk-gallery-item")));
  });

  box.querySelector("[data-lightbox-close]").addEventListener("click", close);
  box.querySelector("[data-lightbox-prev]").addEventListener("click", function () { open(at - 1); });
  box.querySelector("[data-lightbox-next]").addEventListener("click", function () { open(at + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") open(at - 1);
    else if (e.key === "ArrowRight") open(at + 1);
  });

  var chips = document.querySelector("[data-gallery-chips]");
  if (!chips) return;
  chips.addEventListener("click", function (e) {
    var chip = e.target.closest("button[data-filter]");
    if (!chip) return;
    var want = chip.getAttribute("data-filter");
    chips.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-on", b === chip); });
    grid.querySelectorAll(".bk-gallery-item").forEach(function (tile) {
      tile.hidden = want !== "all" && tile.getAttribute("data-album") !== want;
    });
  });
})();
`);

// ------------------------------------------------------------------ styles
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('.bk-gallery')) say('styles already there: input.css');
    else {
      add(file, `${src.replace(/\s*$/, '')}

/* ---------------------------------------------------------- gallery */
.bk-gallery { max-width: 80rem; margin-inline: auto; padding: 3rem 1rem 4rem; }
.bk-gallery-empty { text-align: center; color: #64748b; padding: 3rem 0; }

.bk-gallery-chips {
  display: flex; flex-wrap: wrap; gap: .5rem;
  margin: 1.5rem 0 2rem;
}
.bk-gallery-chips button {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .45rem .9rem; border-radius: 9999px;
  font-size: .85rem; font-weight: 600;
  color: var(--color-navy-900, #062a72);
  border: 1px solid rgb(2 6 23 / .12);
  background: #fff;
  transition: background .15s, color .15s, border-color .15s;
}
.bk-gallery-chips button span { font-size: .72rem; opacity: .5; }
.bk-gallery-chips button:hover { border-color: var(--color-orange-500, #f97316); }
.bk-gallery-chips button.is-on {
  background: var(--color-navy-900, #062a72); color: #fff; border-color: transparent;
}
.bk-gallery-chips button.is-on span { opacity: .65; }

.bk-gallery-grid {
  display: grid; gap: .75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (min-width: 640px) { .bk-gallery-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .bk-gallery-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.bk-gallery-item { margin: 0; }
.bk-gallery-item button {
  display: block; width: 100%; aspect-ratio: 1 / 1;
  overflow: hidden; border-radius: var(--radius-lg, 6px);
  background: var(--color-navy-100, #e8edf7);
  cursor: zoom-in;
}
.bk-gallery-item img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform .35s ease;
}
.bk-gallery-item button:hover img { transform: scale(1.06); }

/* ---------------------------------------------------------- full screen */
.bk-lightbox {
  position: fixed; inset: 0; z-index: 90;
  display: flex; align-items: center; justify-content: center;
  gap: .5rem; padding: 1rem;
  background: rgb(2 6 23 / .93);
}
.bk-lightbox[hidden] { display: none; }
.bk-lightbox figure { margin: 0; max-width: 100%; max-height: 100%; text-align: center; }
.bk-lightbox img {
  max-width: min(92vw, 70rem); max-height: 82vh;
  width: auto; height: auto; object-fit: contain;
  border-radius: var(--radius-lg, 6px);
}
.bk-lightbox figcaption { color: rgb(255 255 255 / .75); font-size: .85rem; margin-top: .75rem; }
.bk-lightbox-close {
  position: absolute; top: 1rem; right: 1rem;
  width: 2.75rem; height: 2.75rem; border-radius: 9999px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; background: rgb(255 255 255 / .1);
}
.bk-lightbox-close:hover { background: rgb(255 255 255 / .2); }
.bk-lightbox-nav {
  flex: 0 0 auto;
  width: 3rem; height: 3rem; border-radius: 9999px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; background: rgb(255 255 255 / .1);
}
.bk-lightbox-nav:hover { background: rgb(255 255 255 / .2); }
@media (max-width: 640px) {
  .bk-lightbox-nav { position: absolute; bottom: 1.25rem; }
  .bk-lightbox-nav.is-prev { left: 25%; }
  .bk-lightbox-nav.is-next { right: 25%; }
}
`);
      say('styles added to input.css');
    }
  }
}

// ------------------------------------------------------------------ CMS
{
  const file = '.pages.yml';
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  if (doc.content.some((c) => c.name === 'gallery')) say('already there: Photo Gallery card');
  else {
    doc.content.push({
      name: 'gallery',
      label: 'Photo Gallery',
      description: 'Albums of photographs shown on the Gallery page. Each album becomes a filter button at the top of that page. An album with no photos is not shown.',
      type: 'collection',
      path: 'content/gallery',
      filename: { template: '{title}.md', field: 'title' },
      view: { primary: 'title', fields: ['title', 'published'] },
      fields: [
        { name: 'title', label: 'Album name', type: 'string', required: true, description: 'Shown on the filter button — keep it short, like "K2 Base Camp" or "Hunza Valley".' },
        { name: 'photos', label: 'Photos', type: 'image', list: true, required: true, description: 'Upload or pick from the Media Library. Drag the arrows to set the order.' },
        { name: 'order', label: 'Order', type: 'number', description: 'Lower numbers come first.' },
        { name: 'published', label: 'Show on the website', type: 'boolean', default: true },
      ],
    });
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try { ok = yaml.load(out).content.some((c) => c.name === 'gallery'); } catch (e) { console.log(`!! ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else { add(file, out); say('new card: Photo Gallery'); }
  }
}

// ------------------------------------------------------------------ menu
if (ADD_TO_MENU) {
  const file = 'src/_data/menu.json';
  if (!fs.existsSync(file)) say('menu.json not found - add the Gallery link yourself');
  else {
    const src = fs.readFileSync(file, 'utf8');
    const menu = JSON.parse(src);
    const has = JSON.stringify(menu.items || []).includes('"/gallery/"');
    if (has) say('already in the menu');
    else {
      // right before Contact if there is one, otherwise at the end
      const items = menu.items || [];
      const at = items.findIndex((i) => /contact/i.test(String(i.url || '')));
      const entry = { label: 'Gallery', url: '/gallery/' };
      items.splice(at < 0 ? items.length : at, 0, entry);
      menu.items = items;
      const out = `${JSON.stringify(menu, null, 2)}\n`;
      JSON.parse(out);
      add(file, out);
      say(at < 0 ? 'added to the end of the menu' : 'added to the menu, just before Contact');
    }
  }
}

// ------------------------------------------------------------------ go
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
console.log('The page stays empty until you add the first album in the CMS.');
