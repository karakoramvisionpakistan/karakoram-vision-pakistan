#!/usr/bin/env node
/**
 * add-home-pager.mjs
 *
 * Homepage par journeys ke cards ab safhon mein batt jayenge — neeche
 * chhote number (1, 2, 3). Number dabane par wahin cards badal jate hain,
 * safha dobara load nahi hota.
 *
 * Google ke liye saare cards HTML mein mojood rehte hain, bas nazar ek
 * waqt mein ek safhe ke aate hain.
 *
 * CMS: "Homepage sections" -> Latest journeys mein do khaane
 *   - Cards per page  (card_count)
 *   - Number of pages (pages)
 *
 *   node tools/add-home-pager.mjs            -> sirf dekhna
 *   node tools/add-home-pager.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= 1) index.njk == */

console.log('\n1) src/index.njk — cards ki qatar');

const INDEX = path.join(ROOT, 'src', 'index.njk');
let idx = read(INDEX);
if (!idx) { console.log('XX  src/index.njk nahi mili.'); process.exit(1); }

const OLD = '<div class="bk-card-grid">{% for item in collections.journeys | limit(hp.latest.card_count or 9) %}{% include "components/journey-card.njk" %}{% endfor %}</div>';

const NEW =
  '{% set per = hp.latest.card_count or 9 %}' +
  '{% set pageCount = hp.latest.pages or 3 %}' +
  '{% set latestItems = collections.journeys | limit(per * pageCount) %}' +
  '{% set totalPages = (latestItems.length + per - 1) // per %}' +
  '<div data-card-pager>' +
  '{% for p in range(0, totalPages) %}' +
  '<div class="bk-card-grid" data-pager-page="{{ loop.index }}"{% if not loop.first %} hidden{% endif %}>' +
  '{% for item in latestItems.slice(p * per, (p + 1) * per) %}{% include "components/journey-card.njk" %}{% endfor %}' +
  '</div>{% endfor %}' +
  '{% if totalPages > 1 %}' +
  '<nav class="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="More journeys">' +
  '{% for p in range(0, totalPages) %}' +
  '<button type="button" data-pager-go="{{ loop.index }}" aria-label="Show page {{ loop.index }} of journeys" ' +
  'aria-current="{{ \'true\' if loop.first else \'false\' }}" ' +
  'class="h-10 min-w-[2.5rem] rounded-full border px-4 text-sm font-bold transition ' +
  '{% if loop.first %}border-orange-500 bg-orange-500 text-white{% else %}border-slate-300 bg-white text-slate-700{% endif %}">' +
  '{{ loop.index }}</button>{% endfor %}</nav>{% endif %}</div>';

if (idx.includes('data-card-pager')) {
  console.log('   OK  pehle se laga hua hai.');
} else if (!idx.includes(OLD)) {
  console.log('XX  cards wali qatar pehchani nahi gayi — rok rahe hain.');
  process.exit(1);
} else {
  idx = idx.replace(OLD, NEW);
  console.log('   ->  qatar safhon mein batt jayegi.');
}

/* script tag */
const OLD_S = '<script src="/assets/js/strip.js" defer></script>';
const NEW_S = '<script src="/assets/js/strip.js" defer></script>\n<script src="/assets/js/pager.js" defer></script>';
if (idx.includes('pager.js')) {
  console.log('   OK  script pehle se lagi hai.');
} else if (!idx.includes(OLD_S)) {
  console.log('   !   strip.js wali line nahi mili — script khud lagani hogi.');
} else {
  idx = idx.replace(OLD_S, NEW_S);
  console.log('   ->  pager.js ka script juR gaya.');
}

if (idx !== read(INDEX)) writes.push({ file: INDEX, text: idx, bak: true });

/* ======================================================= 2) pager.js === */

console.log('\n2) src/assets/js/pager.js');

const PAGER = path.join(ROOT, 'src', 'assets', 'js', 'pager.js');
const PAGER_JS = `/* Cards ki qatar ko safhon mein dikhata hai.
   Saare cards HTML mein mojood rehte hain — sirf nazar badalti hai. */
(() => {
  const ON = ['border-orange-500', 'bg-orange-500', 'text-white'];
  const OFF = ['border-slate-300', 'bg-white', 'text-slate-700'];

  document.querySelectorAll('[data-card-pager]').forEach((pager) => {
    const pages = Array.from(pager.querySelectorAll('[data-pager-page]'));
    const buttons = Array.from(pager.querySelectorAll('[data-pager-go]'));
    if (pages.length < 2 || !buttons.length) return;

    const show = (n) => {
      pages.forEach((page) => { page.hidden = page.dataset.pagerPage !== String(n); });
      buttons.forEach((button) => {
        const on = button.dataset.pagerGo === String(n);
        button.setAttribute('aria-current', on ? 'true' : 'false');
        button.classList.remove(...ON, ...OFF);
        button.classList.add(...(on ? ON : OFF));
      });
      // Agar qatar ka sira screen se upar nikal gaya ho to wapas le aao
      const top = pager.getBoundingClientRect().top;
      if (top < 0) pager.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => show(button.dataset.pagerGo));
    });
  });
})();
`;

if (read(PAGER) === PAGER_JS) console.log('   OK  pehle se theek hai.');
else { writes.push({ file: PAGER, text: PAGER_JS }); console.log('   ->  banegi'); }

/* ======================================================= 3) schema ===== */

console.log('\n3) .pages.yml — "Number of pages" ka khaana');

const YML = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML);
const doc = yaml.load(ymlRaw);
const home = (doc.content || []).find((c) => c.name === 'homepage');
if (!home) { console.log('XX  homepage screen nahi mila.'); process.exit(1); }

const latest = (home.fields || []).find((f) => f.name === 'latest');
if (!latest) { console.log('XX  "latest" field nahi mila.'); process.exit(1); }

latest.fields = latest.fields || [];
if (latest.fields.some((f) => f.name === 'pages')) {
  console.log('   OK  pehle se hai.');
} else {
  const at = latest.fields.findIndex((f) => f.name === 'card_count');
  const field = {
    name: 'pages',
    label: 'Number of pages',
    type: 'number',
    description: 'Cards are split across this many pages, with numbers underneath. 1 means no paging.',
    options: { min: 1, max: 6 },
  };
  latest.fields.splice(at >= 0 ? at + 1 : latest.fields.length, 0, field);

  const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
  const check = yaml.load(dumped);
  const ok = (check.content || []).find((c) => c.name === 'homepage')
    ?.fields?.find((f) => f.name === 'latest')
    ?.fields?.some((f) => f.name === 'pages');
  if (!ok) { console.log('XX  jaanch nakaam — rok rahe hain.'); process.exit(1); }

  writes.push({ file: YML, text: dumped, bak: true });
  console.log('   ->  khaana juR gaya (jaanch theek).');
}

/* ======================================================= 4) data ======= */

console.log('\n4) homePage.json');

const HP = path.join(ROOT, 'src', '_data', 'homePage.json');
const hp = JSON.parse(read(HP) || '{}');
hp.latest = hp.latest || {};
if (hp.latest.pages) console.log('   OK  pehle se hai: ' + hp.latest.pages);
else {
  hp.latest.pages = 3;
  writes.push({ file: HP, text: JSON.stringify(hp, null, 2) + '\n', bak: true });
  console.log('   ->  pages: 3   (cards per page: ' + (hp.latest.card_count || 9) + ')');
  console.log('      yani zyada se zyada ' + (hp.latest.card_count || 9) * 3 + ' cards, teen safhon mein.');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/add-home-pager.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  if (w.bak && fs.existsSync(w.file) && !fs.existsSync(w.file + '.bak6')) fs.copyFileSync(w.file, w.file + '.bak6');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
