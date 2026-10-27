// Three homepage changes.
//
// 1. The dark "Plan directly from Skardu" box goes. It took a whole screen
//    near the top and said little, which made the page feel long before the
//    journeys ever appeared.
//
// 2. Fixed departures now slide, and they are the real ones. Until now that
//    row searched for the words "fixed departure" in the text, so a trip could
//    be missed or wrongly included. It reads the Fixed departure switch on
//    each trip instead.
//
// 3. An announcement bar at the very top of every page - one line, with a
//    link, that rotates when there is more than one. A reader can close it and
//    it stays closed until the message changes. Written from the CMS.
//
//   node tools/home-tweaks.mjs           -> shows what will change
//   node tools/home-tweaks.mjs --write   -> makes the change
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

// =============================================================== 1. proof box
console.log('1. The dark Tripadvisor box');
{
  const file = 'src/index.njk';
  const src = fs.readFileSync(file, 'utf8');
  const start = "  {% if section == 'proof' and hp.proof.enabled !== false %}";
  const after = "  {% elseif section == 'services' and hp.services.enabled !== false %}";

  if (!src.includes(start)) say('already removed');
  else {
    const a = src.indexOf(start);
    const b = src.indexOf(after, a);
    if (b < 0) { console.log('   !! could not find where it ends - not touched'); problems++; }
    else {
      const replaced = src.slice(0, a)
        + "  {% if section == 'services' and hp.services.enabled !== false %}"
        + src.slice(b + after.length);
      add(file, replaced);
      say('removed - the journeys now start higher up the page');
      say('(the "proof" switch in Homepage sections simply does nothing now)');
    }
  }
}

// =============================================================== 2. departures
console.log('\n2. Fixed departures row');
{
  const file = 'eleventy.config.js';
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('fixedDepartures')) say('filter already there: eleventy.config.js');
  else {
    const anchor = '  eleventyConfig.addFilter("json", v => JSON.stringify(v));';
    if (!src.includes(anchor)) { console.log('   !! eleventy.config.js: no place to add the filter'); problems++; }
    else {
      add(file, src.replace(anchor, [
        '  // Trips whose "Fixed departure" switch is on. Pehle yeh row alfaz',
        '  // dhoondti thi ("fixed departure" likha hua ho) - us se koi trip reh',
        '  // jata tha aur koi galti se aa jata tha. Ab switch hi faisla karta hai.',
        '  eleventyConfig.addFilter("fixedDepartures", (arr) => (arr || []).filter(i => i && i.data && i.data.fixed_departure === true));',
        anchor,
      ].join('\n')));
      say('filter added: reads the Fixed departure switch');
    }
  }
}
{
  const file = 'src/index.njk';
  const src = writes.get(file) ?? fs.readFileSync(file, 'utf8');
  const old = "  {% set fixedItems = collections.journeys | keywordItems('fixed departure,departure dates,group departure') %}";

  if (src.includes('collections.journeys | fixedDepartures')) {
    say('row already slides');
  } else if (!src.includes(old)) {
    console.log('   !! the fixed-departures row looks different than expected - not touched');
    problems++;
  } else {
    const a = src.indexOf(old);
    const endMark = '</div></section>';
    const b = src.indexOf(endMark, a);
    if (b < 0) { console.log('   !! could not find where the row ends - not touched'); problems++; }
    else {
      const block = [
        "  {% set fixedItems = collections.journeys | fixedDepartures %}",
        "  {% if fixedItems.length %}",
        '  <section class="bk-home-section"><header class="bk-section-heading"><div><p class="eyebrow">{{ hp.fixed.eyebrow }}</p><h2>{{ hp.fixed.heading }}</h2><p>{{ hp.fixed.description }}</p></div><a class="bk-heading-link" href="{{ hp.fixed.button_url }}">{{ hp.fixed.button_label }}</a></header>',
        '  <div class="bk-strip" data-strip>',
        '    <button class="bk-strip-btn" type="button" data-strip-prev aria-label="Previous"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>',
        '    <ul class="bk-strip-track" data-strip-track>',
        '      {% for item in fixedItems %}<li class="bk-strip-card">{% include "components/journey-card.njk" %}</li>{% endfor %}',
        '    </ul>',
        '    <button class="bk-strip-btn" type="button" data-strip-next aria-label="Next"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>',
        '  </div></section>',
        '  {% endif %}',
      ].join('\n');
      add(file, src.slice(0, a) + block + src.slice(b + endMark.length));
      say('every fixed departure now, in a sliding row');
    }
  }
}
// the strip script must always load on the homepage now
{
  const file = 'src/index.njk';
  const src = writes.get(file) ?? fs.readFileSync(file, 'utf8');
  const old = '{% if (clients and clients.length) or (partners and partners.length) %}<script src="/assets/js/strip.js" defer></script>{% endif %}';
  if (src.includes(old)) {
    add(file, src.replace(old, '<script src="/assets/js/strip.js" defer></script>'));
    say('the sliding script now loads for the departures row too');
  }
}

// =============================================================== 3. announcement bar
console.log('\n3. Announcement bar');

add('src/_data/announcements.js', `// The announcement bar's messages - from content/announcements/.
//
// Outside src/ on purpose: these are not pages, and anything under
// src/content/ gets treated as one by the build tools.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/announcements";

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
    if (!data || data.published === false || !String(data.message || "").trim()) continue;
    out.push(data);
  }

  return out.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}
`);
add('content/announcements/.gitkeep', '');

add('src/_includes/components/announcement-bar.njk', `{# The thin strip above everything. Nothing written, nothing shown.

   It starts hidden and JavaScript reveals it, so a reader who already closed
   it never sees it flash on the way past. Closing is remembered against the
   messages themselves - change the wording and it comes back for everyone. #}
{% if announcements and announcements.length %}
{% set announceKey = announcements.length ~ "-" ~ (announcements[0].message | length) %}
<div class="bk-announce" data-announce data-announce-key="{{ announceKey }}" hidden>
  <div class="bk-announce-track">
    {% for a in announcements %}
    <p class="bk-announce-item"{% if not loop.first %} hidden{% endif %}>
      <span>{{ a.message }}</span>
      {% if a.link_url %}<a href="{{ a.link_url }}">{{ a.link_label or "Find out more" }}</a>{% endif %}
    </p>
    {% endfor %}
  </div>
  <button type="button" class="bk-announce-close" data-announce-close aria-label="Close this message">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>
<script>
(function () {
  var bar = document.querySelector("[data-announce]");
  if (!bar) return;
  var key = "kv-announce-" + bar.getAttribute("data-announce-key");

  // Private windows and blocked storage both throw here - in that case the bar
  // simply shows, which is better than not showing at all.
  try { if (localStorage.getItem(key) === "closed") return; } catch (e) {}
  bar.hidden = false;

  var close = bar.querySelector("[data-announce-close]");
  if (close) close.addEventListener("click", function () {
    bar.hidden = true;
    try { localStorage.setItem(key, "closed"); } catch (e) {}
  });

  var items = bar.querySelectorAll(".bk-announce-item");
  if (items.length < 2) return;
  var at = 0;
  setInterval(function () {
    items[at].hidden = true;
    at = (at + 1) % items.length;
    items[at].hidden = false;
  }, 6000);
})();
</script>
{% endif %}
`);

// put it at the very top of the page, in whichever layout opens <body>
{
  const dir = 'src/_includes';
  const found = [];
  (function scan(d) {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name).replace(/\\/g, '/');
      if (e.isDirectory()) { scan(p); continue; }
      if (!e.name.endsWith('.njk')) continue;
      const text = fs.readFileSync(p, 'utf8');
      if (/<body[^>]*>/.test(text)) found.push([p, text]);
    }
  })(dir);

  if (!found.length) { console.log('   !! could not find the file that opens <body> - bar not placed'); problems++; }
  else {
    for (const [file, text] of found) {
      if (text.includes('announcement-bar.njk')) { say(`already in place: ${file}`); continue; }
      const m = text.match(/<body[^>]*>/);
      const at = m.index + m[0].length;
      add(file, `${text.slice(0, at)}\n{% include "components/announcement-bar.njk" %}${text.slice(at)}`);
      say(`bar placed at the top of every page: ${file}`);
    }
  }
}

// =============================================================== styles
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`\n!! ${file} not found`); problems++; }
  else {
    const src = writes.get(file) ?? fs.readFileSync(file, 'utf8');
    if (src.includes('.bk-announce')) say('\nstyles already there: input.css');
    else {
      add(file, `${src.replace(/\s*$/, '')}

/* ---------------------------------------------------------- announcement bar */
.bk-announce {
  display: flex; align-items: center; gap: .75rem;
  padding: .55rem 1rem;
  background: var(--color-navy-950, #041d52);
  color: #fff;
  font-size: .85rem;
  text-align: center;
}
.bk-announce-track { flex: 1 1 auto; min-width: 0; }
.bk-announce-item { margin: 0; display: flex; justify-content: center; gap: .5rem; flex-wrap: wrap; }
.bk-announce-item a {
  color: var(--color-orange-500, #f97316);
  font-weight: 700; text-decoration: underline; text-underline-offset: 2px;
}
.bk-announce-close {
  flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem; border-radius: 9999px;
  color: rgb(255 255 255 / .7);
  transition: background .15s, color .15s;
}
.bk-announce-close:hover { background: rgb(255 255 255 / .12); color: #fff; }

/* a sliding row of journey cards */
.bk-strip-card { width: min(22rem, 80vw); }
`);
      say('\nstyles added to input.css');
    }
  }
}

// =============================================================== .pages.yml
{
  const file = '.pages.yml';
  const src = fs.readFileSync(file, 'utf8');
  const doc = yaml.load(src);
  if (doc.content.some((c) => c.name === 'announcements')) say('already there: Announcement Bar card');
  else {
    doc.content.push({
      name: 'announcements',
      label: 'Announcement Bar (top of every page)',
      description: 'A thin strip at the very top of the site. With more than one message they take turns. A reader can close it; it comes back when you change the wording.',
      type: 'collection',
      path: 'content/announcements',
      filename: { template: '{year}-{month}-{day}-{hour}{minute}.md', field: 'message' },
      view: { primary: 'message', fields: ['message', 'published'] },
      fields: [
        { name: 'message', label: 'Message', type: 'text', required: true, description: 'Keep it to one line — it sits above everything else.' },
        { name: 'link_url', label: 'Link', type: 'string', description: 'Optional. Where the message leads.' },
        { name: 'link_label', label: 'Link wording', type: 'string', description: 'Leave empty for "Find out more".' },
        { name: 'order', label: 'Order', type: 'number', description: 'Lower numbers come first.' },
        { name: 'published', label: 'Show on the website', type: 'boolean', default: true },
      ],
    });
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try { ok = yaml.load(out).content.some((c) => c.name === 'announcements'); } catch (e) { console.log(`!! ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else { add(file, out); say('new card: Announcement Bar'); }
  }
}

// =============================================================== go
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
