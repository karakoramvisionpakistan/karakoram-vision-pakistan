#!/usr/bin/env node
/**
 * seo-batch1.mjs  —  On-page SEO, Batch 1 (technical; keyword nahi badalte)
 *
 *   node tools/seo-batch1.mjs            dry-run: sirf batata hai kya badlega
 *   node tools/seo-batch1.mjs --write    tabdeeli lagata hai (.bak-seo1 backup ke sath)
 *   npm run build
 *   node tools/seo-batch1.mjs --verify   _site mein nateeja check karta hai
 *
 * Kya theek hota hai:
 *   1. Custom hero slider wale pages (Home, Family Tours, Why Choose Us) par H1
 *      slide ki heading ("Biafo Glacier") ki jagah page ka apna unwaan banta hai.
 *      Slide ki heading H2 ho jati hai.
 *   2. K2 Base Camp page ke 2 toote links.
 *   3. Gasherbrum I page ka toota "source" link (K5).
 *   4. Hiace page se band (unpublished) Coaster page ka link.
 *   5. Travel Resources ka card jo band page /international-travelers/ par jata tha.
 *   6. 4 pages ki khaali <h2></h2>, aur 3 pages ka ghalat <h3><h2>.
 *   7. Why Choose Us (orphan) ko About Us se link.
 *
 * All-or-nothing: ek bhi masla ho to koi file nahi badalti.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const VERIFY = process.argv.includes('--verify');
const BAK = '.bak-seo1';

const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

/* ------------------------------------------------------------------ */
/*  Tabdeeliyan                                                        */
/*  har ek: file, naam, find (string ya RegExp), replace, done (string  */
/*  jo lagne ke baad file mein hoti hai — dobara chalane par pehchan)  */
/* ------------------------------------------------------------------ */

const HERO = 'src/_includes/components/landing-hero.njk';
const heroEyebrow = '<p class="bk-hero-eyebrow"><span class="bk-hero-mark">{{ item.data.eyebrow or heroEyebrow or site.tagline or site.name }}</span></p>';
const heroHead = '{% if loop.first %}<h1><span class="bk-hero-mark">{{ slideHeading }}</span></h1>{% else %}<h2><span class="bk-hero-mark">{{ slideHeading }}</span></h2>{% endif %}';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EDITS = [
  {
    file: HERO,
    name: 'Hero slider: page ka apna H1, slide heading H2',
    find: new RegExp(esc(heroEyebrow) + '(\\s+)' + esc(heroHead)),
    replace: (m, gap) =>
      '{# seoBatch1: slide ki apni heading ho to woh H2 hai; page ka unwaan H1 (chhoti line ki shakal mein) #}' + gap +
      '{% if loop.first and item.data.heading %}<h1 class="bk-hero-eyebrow"><span class="bk-hero-mark">{{ heroHeading or title }}</span></h1>{% else %}' + heroEyebrow + '{% endif %}' + gap +
      '{% if loop.first and not item.data.heading %}<h1><span class="bk-hero-mark">{{ slideHeading }}</span></h1>{% else %}<h2><span class="bk-hero-mark">{{ slideHeading }}</span></h2>{% endif %}',
    done: 'seoBatch1: slide ki apni heading',
  },
  {
    file: 'src/assets/css/input.css',
    name: 'CSS: H1 eyebrow ki shakal',
    append:
      '\n/* seoBatch1: custom slider par page ka H1 chhoti line (eyebrow) ki shakal mein.\n' +
      '   @layer ke baahar, is liye .bk-hero-copy h1 ke bare font par bhaari. */\n' +
      '.bk-hero .bk-hero-copy h1.bk-hero-eyebrow { margin: 0 0 .3rem; max-width: none; font-size: .75rem; font-weight: 900;\n' +
      '  line-height: 1.5; letter-spacing: .22em; text-transform: uppercase; color: #bfdbfe; }\n',
    done: 'h1.bk-hero-eyebrow',
  },
  {
    file: 'src/content/trekking/k2-base-camp-baltoro-trek.md',
    name: 'K2 BC: K2 expedition ka toota link',
    find: 'href="/expeditions/k2-expediiton/"',
    replace: 'href="/expeditions/k2-expedition/"',
    done: 'href="/expeditions/k2-expedition/"',
  },
  {
    file: 'src/content/trekking/k2-base-camp-baltoro-trek.md',
    name: 'K2 BC: Biafo Hispar ka toota link',
    find: 'href="/trekking/biafo-hisper-trek/"',
    replace: 'href="/trekking/biafo-hispar-trek/"',
    done: 'href="/trekking/biafo-hispar-trek/"',
  },
  {
    file: 'src/content/expeditions/ghasherbrum-1.md',
    name: 'Gasherbrum I: bekaar "sources" (K5) hatana',
    find: 'sources:\n  - label: Gasherbrum-I\n    url: K5\n  - label: G-1\nseo:',
    replace: 'seo:',
    absent: '    url: K5\n',
  },
  {
    file: 'src/content/vehicles/toyota-hiace-van.md',
    name: 'Hiace: band Coaster page ka link hatana',
    find: '<li><p><a href="/vehicles/coaster-group-transport/">Coaster</a> &mdash; for parties too large for a van</p></li>',
    replace: '',
    absent: '/vehicles/coaster-group-transport/',
  },
  {
    file: 'src/travel-resources/index.njk',
    name: 'Travel Resources: band page ki jagah Travel Guides',
    find: '"url":"/international-travelers/"}',
    replace: '"url":"/blog/"}',
    absent: '"url":"/international-travelers/"}',
  },
  {
    // CMS ka mawad isi file se aata hai aur template ki default fehrist par bhaari hai
    file: 'content/landing/travel-resources.md',
    name: 'Travel Resources (CMS mawad): band page ki jagah Travel Guides',
    find: '    url: /international-travelers/',
    replace: '    url: /blog/',
    absent: 'url: /international-travelers/',
  },
  ...[
    'src/content/tours/hunza-valley-heritage-tour.md',
    'src/content/tours/skardu-shigar-valley-explorer.md',
    'src/content/hunting-services/permit-mountain-expedition-logistics.md',
  ].flatMap((file) => [
    { file, name: 'khaali <h2></h2> hatana', find: '<h2></h2>', replace: '', absent: '<h2></h2>' },
    { file, name: 'ghalat <h3><h2> theek karna', find: '<h3><h2><strong>Planning notes</strong></h2>', replace: '<h2><strong>Planning notes</strong></h2>', absent: '<h3><h2>' },
  ]),
  { file: 'src/content/pages/privacy-policy.md', name: 'khaali <h2></h2> hatana', find: '<h2></h2>', replace: '', absent: '<h2></h2>' },
  {
    file: 'src/content/pages/about-us.md',
    name: 'About Us: Why Choose Us aur Our Team ka link (orphan fix)',
    find: '<h2>Contact</h2>',
    replace: '<p>See <a href="/why-choose-us/">why travellers choose Karakoram Vision Pakistan</a> and meet <a href="/our-team/">our guides and team</a>.</p><h2>Contact</h2>',
    done: 'href="/why-choose-us/"',
    guard: true,
  },
];

/* ------------------------------------------------------------------ */

const fail = (problems) => {
  console.log('\nXX ' + problems.length + ' MASLA - KOI FILE NAHI BADLI\n');
  for (const p of problems) console.log('   - ' + p);
  console.log('');
  process.exit(1);
};

/* ---------------------------- VERIFY ------------------------------ */

if (VERIFY) {
  const SITE = P('_site');
  if (!fs.existsSync(SITE)) fail(['_site nahi mila. Pehle: npm run build']);
  const page = (u) => { try { return fs.readFileSync(path.join(SITE, u, 'index.html'), 'utf8'); } catch { return null; } };
  const bad = []; const ok = [];
  const check = (cond, good, wrong) => (cond ? ok : bad).push(cond ? good : wrong);

  for (const u of ['/', '/family-tours/', '/why-choose-us/']) {
    const h = page(u);
    if (!h) { bad.push(u + ' safha _site mein nahi'); continue; }
    const h1 = [...h.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    check(h1.length === 1, u + ' par 1 H1: "' + h1[0] + '"', u + ' par ' + h1.length + ' H1 hain');
    check(h1[0] && !/^(Biafo Glacier|K2 8611M|Concordia|Snow Lake|Broad Peak 8047M)$/i.test(h1[0]), u + ' ka H1 ab slide ki heading nahi', u + ' ka H1 ab bhi slide ki heading hai: "' + h1[0] + '"');
  }
  const k2 = page('/trekking/k2-base-camp-trek/') || '';
  check(!/k2-expediiton|biafo-hisper-trek/.test(k2), 'K2 BC ke links theek', 'K2 BC par toota link ab bhi hai');
  check(/href="\/expeditions\/k2-expedition\/"/.test(k2), 'K2 BC se K2 Expedition ko link', 'K2 BC se K2 Expedition ka link nahi mila');
  const g1 = page('/expeditions/gasherbrum-i-expedition/') || '';
  check(!/href="K5"/.test(g1), 'Gasherbrum I: K5 link gaya', 'Gasherbrum I par href="K5" ab bhi hai');
  check(!/coaster-group-transport/.test(page('/vehicles/toyota-hiace-van/') || ''), 'Hiace: Coaster link gaya', 'Hiace par Coaster ka link ab bhi hai');
  check(!/href="\/international-travelers\/"/.test(page('/travel-resources/') || ''), 'Travel Resources ka link theek', 'Travel Resources par /international-travelers/ ab bhi hai');
  for (const u of ['/tours/hunza-valley-heritage-tour/', '/tours/skardu-shigar-valley-explorer/', '/hunting-services/ibex-markhor-hunting-permits/', '/privacy-policy/']) {
    const h = page(u) || '';
    check(h && !/<h([1-6])[^>]*>\s*<\/h\1>/.test((h.match(/<main[\s\S]*<\/main>/) || [''])[0]), u + ' par khaali heading nahi', u + ' par khaali heading ab bhi hai');
  }
  check(/href="\/why-choose-us\/"/.test((page('/about-us/') || '').match(/<main[\s\S]*<\/main>/)?.[0] || ''), 'About Us se Why Choose Us ko link', 'About Us ke mazmoon mein /why-choose-us/ link nahi');
  let css = ''; try { css = fs.readFileSync(path.join(SITE, 'assets/css/site.css'), 'utf8'); } catch { /* */ }
  check(/h1\.bk-hero-eyebrow/.test(css), 'CSS mein H1 eyebrow ka rule', 'site.css mein h1.bk-hero-eyebrow nahi mila');

  for (const o of ok) console.log('   OK  ' + o);
  if (bad.length) { console.log('\nXX ' + bad.length + ' MASLA (verify)\n'); for (const b of bad) console.log('   - ' + b); console.log(''); process.exit(1); }
  console.log('\nSab theek: ' + ok.length + ' check paas.\n');
  process.exit(0);
}

/* ------------------------ DRY-RUN / WRITE ------------------------- */

const problems = [];
const texts = {};      // rel -> { raw, eol, cur }
const plan = [];       // { file, name, state }

for (const e of EDITS) {
  if (!texts[e.file]) {
    if (!fs.existsSync(P(e.file))) { problems.push(e.file + ' nahi mili'); continue; }
    const raw = read(e.file);
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    texts[e.file] = { raw, eol, cur: raw.replace(/\r\n/g, '\n') };   // andar LF par kaam, likhte waqt wapas
  }
  const t = texts[e.file];

  if (e.append) {
    if (t.cur.includes(e.done)) { plan.push({ ...e, state: 'pehle se' }); continue; }
    t.cur = t.cur.replace(/\n*$/, '\n') + e.append;
    plan.push({ ...e, state: 'badlega' });
    continue;
  }

  // jis tabdeeli ke baad bhi "find" file mein rehta hai, us ki pehchan "done" se pehle
  if (e.guard && t.cur.includes(e.done)) { plan.push({ ...e, state: 'pehle se' }); continue; }
  const count = typeof e.find === 'string' ? t.cur.split(e.find).length - 1 : (t.cur.match(new RegExp(e.find.source, 'g')) || []).length;
  if (count === 1) {
    t.cur = t.cur.replace(e.find, e.replace);
    plan.push({ ...e, state: 'badlega' });
  } else if (count === 0 && ((e.done && t.cur.includes(e.done)) || (e.absent && !t.cur.includes(e.absent)))) {
    plan.push({ ...e, state: 'pehle se' });
  } else {
    problems.push(e.file + ': "' + e.name + '" — matn ' + count + ' baar mila (1 baar hona chahiye). File shayad badal chuki hai.');
  }
}

if (problems.length) fail(problems);

console.log('\n================ SEO BATCH 1 ' + (WRITE ? '(WRITE)' : '(DRY-RUN)') + ' ================\n');
for (const p of plan) console.log('   ' + (p.state === 'badlega' ? '>>' : '==') + ' ' + p.state.padEnd(9) + p.file + '\n        ' + p.name);

const changed = Object.entries(texts).filter(([, t]) => t.cur !== t.raw.replace(/\r\n/g, '\n'));
console.log('\n' + plan.filter((p) => p.state === 'badlega').length + ' tabdeeli, ' + changed.length + ' file.');

if (!WRITE) {
  console.log('Yeh dry-run tha. Lagane ke liye:  node tools/seo-batch1.mjs --write\n');
  process.exit(0);
}
if (!changed.length) { console.log('Kuch badalne ko nahi — sab pehle se laga hua hai.\n'); process.exit(0); }

// pehle saare backup, phir saari files — beech mein ghalti ho to wapas
const done = [];
try {
  for (const [rel, t] of changed) if (!fs.existsSync(P(rel) + BAK)) fs.writeFileSync(P(rel) + BAK, t.raw);   // pehla backup kabhi nahi mit-ta
  for (const [rel, t] of changed) { fs.writeFileSync(P(rel), t.eol === '\r\n' ? t.cur.replace(/\n/g, '\r\n') : t.cur); done.push(rel); }
} catch (err) {
  for (const rel of done) fs.writeFileSync(P(rel), texts[rel].raw);
  fail(['likhte waqt ghalti: ' + err.message + ' — jo files badli thin wapas kar di gayin']);
}
console.log('Lag gaya. Backup: har file ke sath ' + BAK);
console.log('Ab:  npm run build   phir   node tools/seo-batch1.mjs --verify\n');
