// Menu ke hub pages ka mawad CMS mein le aata hai.
//
// MASLA
// Website ke 26 "hub" pages - Travel Resources, Special Interests, Destinations,
// Holiday Types, Vehicles, News waghaira - ka mawad code ke andar likha hua
// hai. Un par jo card ki listein hain (Travel Resources ke nau, Special
// Interests ke aath, Destinations ke nau...) woh client badal nahi sakta,
// halanki yehi cheezein sab se zyada badalti hain.
//
// HAL
// Har hub page ka mawad ek alag file mein chala jata hai - src/content/landing/
// ke andar. CMS mein "Menu Pages" ka card us folder ko dikhata hai, to client
// page ka naam, taaruf, Google wale do jumle, aur card ki poori list wahan se
// badal sakta hai.
//
// HIFAZAT
// Purani likhai code mein wahin rehti hai. Template pehle CMS se poochta hai,
// kuch na mile to purani likhai chalti hai. Yani CMS ka khana khali chhor
// dein, ya file hi gayab ho jaye, to bhi page waisa ka waisa chalta rahega.
//
//   node tools/make-landing.mjs           -> sirf batata hai
//   node tools/make-landing.mjs --write   -> sab kuch bana deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

let yaml;
try { yaml = require('js-yaml'); }
catch { console.log('js-yaml nahi mila. Pehle "npm install" chalayein.'); process.exit(1); }

const must = (f) => { if (!fs.existsSync(f)) { console.log(`${f} nahi mili. Website wale folder mein chalayein.`); process.exit(1); } };
must('.pages.yml'); must('eleventy.config.js'); must('src/_data/pageControl.json');

// Yeh files sirf mawad hain, page nahi. src/content/ ke andar rakhein to
// build ke tools (autofill, normalize-permalinks) inhein asli page samajh
// kar un mein slug aur permalink daal dete hain - aur permalink asli page
// se takra sakta hai. Is liye src/ se bahar.
const LANDING_DIR = 'content/landing';
let made = 0, patched = 0, skipped = 0, problems = 0;
const plan = [];           // { file, before, after }
const files = new Map();   // naya banne wali files

const note = (s) => console.log(`   ${s}`);

// ------------------------------------------------------------ parhna
const slugOf = (url) => String(url).replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';

function frontMatter(src) {
  if (!src.startsWith('---')) return { fm: {}, end: 0 };
  const end = src.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, end: 0 };
  let fm = {};
  try { fm = yaml.load(src.slice(3, end)) || {}; } catch {}
  return { fm, end: end + 4 };
}

// {% set heroEyebrow = 'Travel around your passion' %}
const HERO_EYEBROW = /\{%\s*set heroEyebrow\s*=\s*'([^']*)'\s*%\}/;

// <p class="eyebrow">A</p><h2>B</h2><p>C</p>   (beech ka unwaan)
const SECTION_H2 = /<p class="eyebrow">([^<]*)<\/p><h2[^>]*>([^<]*)<\/h2><p>([^<]*)<\/p>/;

// <p class="eyebrow">A</p><h1>B</h1><p>C</p>   (saada hero wale pages)
const SIMPLE_HERO = /<p class="eyebrow">([^<]*)<\/p><h1>([^<]*)<\/h1><p>([^<]*)<\/p>/;

// {% set NAME = [ ['a','b','c'], ... ] %}
const CARD_BLOCK = /\{%\s*set (\w+)\s*=\s*\[([\s\S]*?)\]\s*%\}/;
const CARD_ROW = /\[\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\]/g;

// ------------------------------------------------------------ har page
const control = JSON.parse(fs.readFileSync('src/_data/pageControl.json', 'utf8'));
const pages = (control.pages || []).filter((p) => p.file && /\.njk$/.test(p.file));

console.log(`${pages.length} hub pages dekhe ja rahe hain.\n`);

for (const page of pages) {
  if (!fs.existsSync(page.file)) { note(`nahi mili: ${page.file}`); continue; }

  const src = fs.readFileSync(page.file, 'utf8');
  const { fm, end } = frontMatter(src);
  let body = src.slice(end);
  const before = body;

  const entry = {
    url: page.url,
    title: String(fm.title || page.label || '').trim(),
    summary: String(fm.summary || '').trim(),
    seo_title: String(fm.seo?.title || '').trim(),
    seo_description: String(fm.seo?.description || '').trim(),
  };

  const changes = [];

  // ---- hero ka chhota jumla
  const he = body.match(HERO_EYEBROW);
  if (he) {
    entry.hero_eyebrow = he[1];
    body = body.replace(HERO_EYEBROW,
      `{% set heroEyebrow = lp.hero_eyebrow or '${he[1]}' %}`);
    changes.push('hero ka jumla');
  }

  // ---- saada hero (jin pages par landing-hero nahi)
  const sh = body.match(SIMPLE_HERO);
  if (sh) {
    entry.hero_eyebrow = entry.hero_eyebrow || sh[1];
    entry.title = entry.title || sh[2];
    entry.summary = entry.summary || sh[3];
    body = body.replace(SIMPLE_HERO,
      `<p class="eyebrow">{{ lp.hero_eyebrow or '${sh[1]}' }}</p>`
      + `<h1>{{ lp.title or '${sh[2].replace(/'/g, "\\'")}' }}</h1>`
      + `<p>{{ lp.summary or '${sh[3].replace(/'/g, "\\'")}' }}</p>`);
    changes.push('saada hero');
  }

  // ---- beech ka unwaan
  const sec = body.match(SECTION_H2);
  if (sec) {
    entry.section_eyebrow = sec[1];
    entry.section_heading = sec[2];
    entry.section_intro = sec[3];
    body = body.replace(SECTION_H2,
      `<p class="eyebrow">{{ lp.section_eyebrow or '${sec[1].replace(/'/g, "\\'")}' }}</p>`
      + `<h2>{{ lp.section_heading or '${sec[2].replace(/'/g, "\\'")}' }}</h2>`
      + `<p>{{ lp.section_intro or '${sec[3].replace(/'/g, "\\'")}' }}</p>`);
    changes.push('beech ka unwaan');
  }

  // ---- card ki list
  const cb = body.match(CARD_BLOCK);
  if (cb) {
    const rows = [...cb[2].matchAll(CARD_ROW)].map(([, title, description, url]) => ({ title, description, url }));
    if (rows.length) {
      entry.cards = rows;
      const name = cb[1];
      // Purani list waisi hi rehti hai - CMS khali ho to wohi chalti hai.
      const fallback = rows
        .map((r) => `{"title":${JSON.stringify(r.title)},"description":${JSON.stringify(r.description)},"url":${JSON.stringify(r.url)}}`)
        .join(',\n');
      body = body.replace(CARD_BLOCK,
        `{% set ${name} = (lp.cards or [\n${fallback}\n]) | liveCards %}`);

      // loop ke andar ab naam se kaam hoga, ginti se nahi
      const loopRe = new RegExp(`\\{%\\s*for (\\w+) in ${name}\\s*%\\}`);
      const lm = body.match(loopRe);
      if (lm) {
        const v = lm[1];
        body = body
          .replace(new RegExp(`\\{\\{\\s*${v}\\[2\\]\\s*\\}\\}`, 'g'), `{{ ${v}.url }}`)
          .replace(new RegExp(`\\{\\{\\s*${v}\\[0\\]\\s*\\}\\}`, 'g'), `{{ ${v}.title }}`)
          .replace(new RegExp(`\\{\\{\\s*${v}\\[1\\]\\s*\\}\\}`, 'g'), `{{ ${v}.description }}`);
      }
      changes.push(`${rows.length} card`);
    }
  }

  // ---- lp ka elaan, sirf jab zaroorat ho
  //
  // Shuru mein nayi qataar lazmi hai: front matter ka "---" apni qataar par
  // akela hona chahiye. Us ke sath kuch jur jaye to Eleventy front matter
  // parh hi nahi pata aur poora page toot jata hai.
  if (changes.length && !body.includes('set lp = landing')) {
    body = `\n{% set lp = landing[page.url] or {} %}\n${body.replace(/^\n+/, '')}`;
  }

  // ---- landing wali file
  const slug = slugOf(page.url);
  const mdPath = `${LANDING_DIR}/${slug}.md`;
  if (fs.existsSync(mdPath)) {
    note(`pehle se mojood: ${mdPath}`);
    skipped++;
  } else {
    const clean = Object.fromEntries(
      Object.entries(entry).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)),
    );
    files.set(mdPath, `---\n${yaml.dump(clean, { lineWidth: 0, quotingType: '"' })}---\n`);
    made++;
  }

  if (body !== before) {
    plan.push({ file: page.file, text: src.slice(0, end) + body });
    patched++;
    console.log(`${WRITE ? 'badla' : 'badlega'}: ${page.file}`);
    note(changes.join(', '));
  }
}

// ------------------------------------------------------------ data file
files.set('src/_data/landing.js', `// Hub pages ka mawad - CMS ki likhi hui files se.
//
// src/content/landing/ ki har file ek hub page ka mawad rakhti hai. Yahan
// unhein parh kar ek fehrist bana dete hain jis ki kunji page ka pata hai,
// taake template seedha landing[page.url] likh kar apna mawad le sake.
//
// Yeh files khud koi page nahi banatin - eleventy.config.js mein unhein
// nazarandaz kar diya gaya hai. Woh sirf mawad hain.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/landing";

export default function () {
  const out = {};
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return out; }

  for (const name of names) {
    let text = "";
    try { text = fs.readFileSync(\`\${DIR}/\${name}\`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || !data.url) continue;
    out[String(data.url)] = data;
  }
  return out;
}
`);

files.set('src/src.11tydata.js', `// Hub page ka naam, taaruf aur Google wale jumle - CMS se.
//
// Yeh har page par lagta hai, magar kuch badalta sirf un pages par hai jin ka
// mawad src/content/landing/ mein mojood hai. Baqi sab pages - tours, treks,
// blog - jaise thay waise rehte hain, kyunki un ka koi landing khana nahi hai.
//
// Is tarah 26 pages ke chaar chaar khane ek hi jagah se CMS ke hawale ho jate
// hain, har page ka code alag se chhere baghair.
const forPage = (data) => (data.landing || {})[String(data.page && data.page.url || "")] || null;

export default {
  eleventyComputed: {
    title: (data) => forPage(data)?.title || data.title,
    summary: (data) => forPage(data)?.summary || data.summary,
    seo: (data) => {
      const lp = forPage(data);
      if (!lp) return data.seo;
      const seo = { ...(data.seo || {}) };
      if (lp.seo_title) seo.title = lp.seo_title;
      if (lp.seo_description) seo.description = lp.seo_description;
      return seo;
    },
  },
};
`);

// ------------------------------------------------------------ eleventy.config.js
{
  const file = 'eleventy.config.js';
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('liveCards')) {
    note('pehle se theek: eleventy.config.js');
  } else {
    const anchor = '  eleventyConfig.addFilter("json", v => JSON.stringify(v));';
    if (!src.includes(anchor)) {
      console.log('!! eleventy.config.js: jorne ki jagah nahi mili');
      problems++;
    } else {
      const add = [
        '  // Card ki list mein se woh card nikal deta hai jo chhupaye gaye hain.',
        '  eleventyConfig.addFilter("liveCards", (arr) => (arr || []).filter(c => c && c.enabled !== false));',
        anchor,
      ].join('\n');
      plan.push({ file, text: src.replace(anchor, add) });
      console.log(`${WRITE ? 'badla' : 'badlega'}: eleventy.config.js`);
      note('landing ki files build se bahar, aur liveCards filter');
    }
  }
}

// ------------------------------------------------------------ .pages.yml
{
  const file = '.pages.yml';
  const src = fs.readFileSync(file, 'utf8');
  if (/^- name: landing$/m.test(src)) {
    note('pehle se theek: .pages.yml');
  } else {
    const entryDef = {
      name: 'landing',
      label: 'Menu Pages',
      type: 'collection',
      path: LANDING_DIR,
      filename: { template: '{slug}.md', field: 'create' },
      operations: { create: false, rename: false, delete: false },
      view: { primary: 'title', fields: ['title', 'url'] },
      fields: [
        { name: '_h_page', label: 'Page basics', type: 'heading' },
        { name: 'title', label: 'Page title', type: 'string', required: true },
        { name: 'summary', label: 'Short description', type: 'text',
          description: 'Two lines - shown in the banner and on Google.' },
        { name: 'hero_eyebrow', label: 'Small line above the title', type: 'string' },
        { name: '_h_section', label: 'Section heading', type: 'heading' },
        { name: 'section_eyebrow', label: 'Small line above', type: 'string' },
        { name: 'section_heading', label: 'Heading', type: 'string' },
        { name: 'section_intro', label: 'Intro text', type: 'text' },
        { name: '_h_cards', label: 'Cards on this page', type: 'heading' },
        { name: 'cards', label: 'Cards', type: 'object', list: true,
          description: 'Click a row to edit it. Add, remove or reorder as you like.',
          fields: [
            { name: 'title', label: 'Title', type: 'string', required: true },
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'url', label: 'Link', type: 'string' },
            { name: 'enabled', label: 'Visible', type: 'boolean', default: true },
          ] },
        { name: '_h_google', label: 'Search engines', type: 'heading', collapsed: true },
        { name: 'seo_title', label: 'SEO title', type: 'string' },
        { name: 'seo_description', label: 'Meta description', type: 'text' },
        { name: 'url', label: 'Page URL', type: 'string', hidden: true },
      ],
    };

    // File ko seedha text ki tarah na jorein - us ki qataaron ki indentation
    // badal chuki ho sakti hai, aur phir naya hissa "content" ke andar jane ke
    // bajaye bahar chala jata hai. Is liye file ko poora parh kar, list mein
    // naya khana daal kar, dobara likhte hain.
    let next = null, ok = false;
    try {
      const a = yaml.load(src);
      a.content.push(entryDef);
      next = yaml.dump(a, { lineWidth: 0, quotingType: '"', noRefs: true });
      const b = yaml.load(next);
      const old = yaml.load(src);
      ok = b.content.length === old.content.length + 1
        && JSON.stringify(b.content.slice(0, old.content.length)) === JSON.stringify(old.content)
        && b.content[b.content.length - 1].name === 'landing';
    } catch (e) { note(`!! .pages.yml: ${e.message}`); }
    if (!ok) { console.log('!! .pages.yml: jaanch naakaam - haath nahi lagaya'); problems++; }
    else {
      plan.push({ file, text: next });
      console.log(`${WRITE ? 'badla' : 'badlega'}: .pages.yml`);
      note('"Menu Pages" ka naya card');
    }
  }
}

// ------------------------------------------------------------ likhna
console.log(`\n${made} nayi landing files, ${patched} pages badle, ${skipped} pehle se mojood, ${problems} problem.`);

if (problems) { console.log('\nProblem ki wajah se kuch nahi likha gaya.'); process.exit(1); }

if (!WRITE) {
  console.log('\nAbhi kuch change nahi hua. Karne ke liye --write ke saath chalayein.');
  if (files.size) {
    console.log('\nYeh files banengi:');
    for (const f of [...files.keys()].slice(0, 8)) console.log(`   ${f}`);
    if (files.size > 8) console.log(`   ... aur ${files.size - 8}`);
  }
  process.exit(0);
}

fs.mkdirSync(LANDING_DIR, { recursive: true });
for (const [file, text] of files) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}
for (const { file, text } of plan) fs.writeFileSync(file, text, 'utf8');

console.log('\nHo gaya. Ab "npm run build" chala kar dekh lein, phir push.');
