// "Affiliated with" - the membership badges, inside the footer.
//
// This is not the same thing as Our Partners. Partners are the companies you
// work with, shown large just above the footer. Affiliations are the bodies
// you belong to or are licensed by - a tourism board, an alpine club, a
// ministry. They belong small and quiet inside the footer, which is where
// travellers look for proof that a company is real.
//
//   node tools/add-affiliations.mjs           -> shows what will change
//   node tools/add-affiliations.mjs --write   -> makes the change
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

// ------------------------------------------------------------------ data
add('src/_data/affiliations.js', `// "Affiliated with" badges - from content/affiliations/.
//
// Outside src/ on purpose: these are entries, not pages, and the build tools
// treat anything under src/content/ as a page.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/affiliations";

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
    if (!data || data.published === false || !data.logo) continue;
    out.push(data);
  }

  return out.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.name || "").localeCompare(String(b.name || "")));
}
`);
add('content/affiliations/.gitkeep', '');

// ------------------------------------------------------------------ markup
add('src/_includes/components/affiliated-with.njk', `{# The membership badges, low in the footer. Small and grey on purpose - they
   are proof, not advertising. Nothing added, nothing shown. #}
{% if affiliations and affiliations.length %}
<div class="bk-affiliations">
  <p class="bk-affiliations-label">{{ siteFooter.affiliations_label or "Affiliated with" }}</p>
  <ul class="bk-affiliations-list">
    {% for item in affiliations %}
    <li>
      {% if item.url %}<a href="{{ item.url }}" target="_blank" rel="noopener noreferrer" title="{{ item.name }}">{% endif %}
        <img src="{{ item.logo }}" alt="{{ item.name }}" height="40" loading="lazy" decoding="async">
      {% if item.url %}</a>{% endif %}
    </li>
    {% endfor %}
  </ul>
</div>
{% endif %}
`);

// ------------------------------------------------------------------ footer
{
  const dir = 'src/_includes';
  const hits = [];
  (function scan(d) {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name).replace(/\\/g, '/');
      if (e.isDirectory()) { scan(p); continue; }
      if (!e.name.endsWith('.njk')) continue;
      const text = fs.readFileSync(p, 'utf8');
      if (text.includes('</footer>')) hits.push([p, text]);
    }
  })(dir);

  if (!hits.length) { console.log('   !! no file with a </footer> found - not placed'); problems++; }
  else {
    for (const [file, text] of hits) {
      if (text.includes('affiliated-with.njk')) { say(`already in place: ${file}`); continue; }
      const at = text.lastIndexOf('</footer>');
      add(file, `${text.slice(0, at)}{% include "components/affiliated-with.njk" %}\n${text.slice(at)}`);
      say(`placed inside the footer: ${file}`);
    }
  }
}

// ------------------------------------------------------------------ styles
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('.bk-affiliations')) say('styles already there: input.css');
    else {
      add(file, `${src.replace(/\s*$/, '')}

/* ---------------------------------------------------------- affiliated with
   Quieter than the partner strip: smaller, greyer, and it wraps instead of
   sliding - there are rarely more than a handful, and a footer is no place
   for arrows. */
.bk-affiliations {
  margin-top: 2rem; padding-top: 1.5rem;
  border-top: 1px solid rgb(255 255 255 / .12);
  text-align: center;
}
.bk-affiliations-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .12em;
  opacity: .55; margin-bottom: .9rem;
}
.bk-affiliations-list {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
  gap: 1.5rem 2rem; margin: 0; padding: 0; list-style: none;
}
.bk-affiliations-list img {
  max-height: 2.5rem; width: auto; object-fit: contain;
  opacity: .6; filter: grayscale(1);
  transition: opacity .2s, filter .2s;
}
.bk-affiliations-list a:hover img { opacity: 1; filter: none; }
`);
      say('styles added to input.css');
    }
  }
}

// ------------------------------------------------------------------ CMS
{
  const file = '.pages.yml';
  const src = fs.readFileSync(file, 'utf8');
  const doc = yaml.load(src);
  let touched = 0;

  if (doc.content.some((c) => c.name === 'affiliations')) say('already there: Affiliated With card');
  else {
    doc.content.push({
      name: 'affiliations',
      label: 'Affiliated With (footer)',
      description: 'Bodies you belong to or are licensed by — a tourism board, an alpine club, a ministry. Shown small inside the footer. Partner companies go in Our Partners instead.',
      type: 'collection',
      path: 'content/affiliations',
      filename: { template: '{name}.md', field: 'name' },
      view: { primary: 'name', fields: ['name', 'url', 'published'] },
      fields: [
        { name: 'name', label: 'Name', type: 'string', required: true },
        { name: 'logo', label: 'Logo', type: 'image', required: true, description: 'A see-through background works best — these are shown in grey.' },
        { name: 'url', label: 'Their website', type: 'string', description: 'Optional. Opens in a new tab.' },
        { name: 'order', label: 'Order', type: 'number', description: 'Lower numbers come first.' },
        { name: 'published', label: 'Show on the website', type: 'boolean', default: true },
      ],
    });
    touched++;
    say('new card: Affiliated With');
  }

  // the wording above the badges lives with the rest of the footer settings
  const footer = doc.content.find((c) => c.name === 'site_footer');
  if (footer && !(footer.fields || []).some((f) => f.name === 'affiliations_label')) {
    footer.fields = footer.fields || [];
    footer.fields.push({
      name: 'affiliations_label',
      label: 'Wording above the badges',
      type: 'string',
      description: 'Leave empty for "Affiliated with".',
    });
    touched++;
    say('wording added to the Footer screen');
  }

  if (touched) {
    const out = yaml.dump(doc, { lineWidth: 0, quotingType: '"', noRefs: true });
    let ok = false;
    try { ok = yaml.load(out).content.some((c) => c.name === 'affiliations'); } catch (e) { console.log(`!! ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: check failed - not touched'); problems++; }
    else add(file, out);
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
