#!/usr/bin/env node
/**
 * dump-images.mjs   (website ke folder mein, npm run build ke BAAD)
 *
 * Hero, cover aur share image ka poora nazam ek hi baar mein:
 *   1. har safha Google/WhatsApp ko kaun si tasweer de raha hai
 *   2. hero-crops kaise kaam karta hai (slider ki katai)
 *   3. heroConfig / heroPicture / safeMedia filters
 *   4. landing-hero.njk poora
 *   5. tour/trek/expedition ke safhe par cover photo kaise lagti hai
 *   6. in sab ka CSS (zoom yahin se aata hai)
 *   7. CMS (.pages.yml) mein hero, cover, social image ke khane
 *   8. har catalogue safhe ki meta description
 *
 * KUCH BADALTA NAHI. Key / password jaisa matan XXXXX ho jata hai.
 *
 *   node tools/dump-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const mask = (l) => l
  .replace(/(['"`])([A-Za-z0-9_\-+/=]{24,})\1/g, (m, q, v) => (/\d/.test(v) && /[A-Z]/.test(v) && /[a-z]/.test(v) && !/[./]/.test(v) ? q + 'XXXXX' + q : m))
  .replace(/((?:pass|secret|token|apikey|api_key)\w*["']?\s*[:=]\s*)(['"`])[^'"`]+\2/gi, '$1$2XXXXX$2');
const H = (t) => { say(''); say(t); say('='.repeat(78)); };
const sub = (t) => { say(''); say(t); say('-'.repeat(78)); };
const dumpFile = (p, limit = 220) => {
  const s = read(p); if (s == null) { say('   (' + rel(p) + ' nahi mili)'); return; }
  const L = s.split(/\r?\n/);
  say('   ' + rel(p) + '  (' + L.length + ' lines)');
  L.slice(0, limit).forEach((l, i) => say('   ' + String(i + 1).padStart(4) + ' | ' + mask(l).slice(0, 170)));
  if (L.length > limit) say('   ... aur ' + (L.length - limit) + ' lines');
};
const fnBlock = (p, name, max = 60) => {
  const s = read(p); if (!s) return false;
  const L = s.split(/\r?\n/);
  let hit = false;
  L.forEach((l, i) => {
    if (!new RegExp('\\b' + name + '\\b').test(l)) return;
    if (!/(addFilter|addNunjucksFilter|addShortcode|function|=>|const|export)/.test(l)) return;
    hit = true;
    say('');
    let depth = 0, started = false;
    for (let k = i; k < Math.min(L.length, i + max); k++) {
      say('   ' + rel(p) + ':' + String(k + 1).padStart(4) + ' | ' + mask(L[k]).slice(0, 170));
      depth += (L[k].match(/[{(]/g) || []).length - (L[k].match(/[})]/g) || []).length;
      if (/[{(]/.test(L[k])) started = true;
      if (started && depth <= 0) break;
    }
  });
  return hit;
};

say('');
say('HERO, COVER AUR SHARE IMAGE — POORA NAZAM');

/* ================================================================ 1 */
H('1. HAR SAFHE KA og:image');
const pages = [];
const walkPages = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const f = path.join(d, e.name);
  if (e.isDirectory()) walkPages(f); else if (e.name === 'index.html') pages.push(f); } };
walkPages(path.join(ROOT, '_site'));
const kinds = { default: [], svg: [], photo: [], none: [], redirect: [] };
const descs = [];
for (const p of pages) {
  const h = read(p);
  const url = '/' + rel(p).replace(/^_site\//, '').replace(/index\.html$/, '');
  if (h.length < 3000 && /http-equiv="refresh"/i.test(h)) { kinds.redirect.push({ url }); continue; }
  const og = (h.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];
  const hero = (h.match(/<img[^>]*class="bk-hero-photo"[^>]*src="([^"]*)"/) || [])[1];
  const cover = (h.match(/<img[^>]*class="[^"]*bk-trip-main[^"]*"[^>]*src="([^"]*)"/) || h.match(/class="bk-trip-main-image"[\s\S]{0,400}?<img[^>]*src="([^"]*)"/) || [])[1];
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  descs.push({ url, desc });
  const row = { url, og, hero, cover };
  if (!og) kinds.none.push(row);
  else if (/karakoram-vision-og\./.test(og)) kinds.default.push(row);
  else if (/\.svg(\?|$)/i.test(og)) kinds.svg.push(row);
  else kinds.photo.push(row);
}
say('   kul: ' + pages.length + '  |  default banner ' + kinds.default.length + '  |  SVG ' + kinds.svg.length
  + '  |  photo ' + kinds.photo.length + '  |  kuch nahi ' + kinds.none.length + '  |  redirect ' + kinds.redirect.length);
for (const k of ['default', 'svg', 'photo', 'none']) {
  if (!kinds[k].length) continue;
  sub('   ' + k);
  for (const r of kinds[k]) {
    say('   ' + r.url);
    if (k !== 'default') say('        og:    ' + (r.og || '-'));
    if (r.hero) say('        hero:  ' + r.hero);
    if (r.cover) say('        cover: ' + r.cover);
  }
}

/* ================================================================ 2 */
H('2. SLIDER KI KATAI — tools/hero-crops.mjs');
dumpFile(path.join(ROOT, 'tools', 'hero-crops.mjs'), 260);
sub('   tools/image-sizes.mjs (pehli 80 lines)');
dumpFile(path.join(ROOT, 'tools', 'image-sizes.mjs'), 80);
const pkg = JSON.parse(read(path.join(ROOT, 'package.json')) || '{}');
sub('   package.json');
say('   sharp: ' + ((pkg.dependencies || {}).sharp || (pkg.devDependencies || {}).sharp || 'NAHI') + '   node_modules/sharp: ' + fs.existsSync(path.join(ROOT, 'node_modules', 'sharp')));
say('   build:assets: ' + ((pkg.scripts || {})['build:assets'] || ''));
const hi = read(path.join(ROOT, 'src', '_data', 'heroImages.json'));
if (hi) {
  sub('   src/_data/heroImages.json — shakal (pehle 2 entries)');
  try {
    const j = JSON.parse(hi); const ks = Object.keys(j);
    say('   ' + ks.length + ' entries');
    ks.slice(0, 2).forEach((k) => say('   ' + k + '  =>  ' + JSON.stringify(j[k]).slice(0, 400)));
  } catch (e) { say('   ' + e.message); }
}

/* ================================================================ 3 */
H('3. FILTERS: heroConfig, heroPicture, safeMedia, imageSizes');
const jsFiles = [];
const walkJs = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const f = path.join(d, e.name);
  if (e.isDirectory()) { if (!/node_modules|_site|\.git|_unused|functions|assets/.test(f)) walkJs(f); }
  else if (/\.(js|mjs|cjs)$/.test(e.name) && !/\.bak|\.min\./.test(e.name)) jsFiles.push(f); } };
for (const n of ['eleventy.config.js', 'eleventy.config.mjs', '.eleventy.js', 'eleventy.config.cjs']) if (fs.existsSync(path.join(ROOT, n))) jsFiles.push(path.join(ROOT, n));
walkJs(path.join(ROOT, 'lib')); walkJs(path.join(ROOT, 'src', '_lib')); walkJs(path.join(ROOT, 'config')); walkJs(path.join(ROOT, 'src', '_config')); walkJs(path.join(ROOT, 'src', '_filters'));
say('   dekhi gayi files: ' + jsFiles.map(rel).join(', '));
for (const name of ['heroConfig', 'heroPicture', 'safeMedia', 'responsiveImage', 'imageSrcset', 'srcset', 'sizedImage']) {
  let any = false;
  for (const f of jsFiles) any = fnBlock(f, name, 70) || any;
  if (!any) say('   (' + name + ' nahi mila)');
}

/* ================================================================ 4 */
H('4. src/_includes/components/landing-hero.njk');
dumpFile(path.join(ROOT, 'src', '_includes', 'components', 'landing-hero.njk'), 200);

/* ================================================================ 5 */
H('5. TOUR / TREK / EXPEDITION SAFHE PAR COVER PHOTO');
const njks = [];
const walkN = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const f = path.join(d, e.name);
  if (e.isDirectory()) { if (!/_unused/.test(f)) walkN(f); } else if (/\.njk$/.test(e.name) && !/\.bak/.test(e.name)) njks.push(f); } };
walkN(path.join(ROOT, 'src', '_includes'));
for (const f of njks) {
  const s = read(f); if (!s) continue;
  if (!/bk-trip-main-image|bk-trip-gallery|cover_image|page-hero|bk-page-header/.test(s)) continue;
  const L = s.split(/\r?\n/);
  const marks = new Set();
  L.forEach((l, i) => { if (/bk-trip-main-image|cover_image|<picture|<img|srcset|heroPicture|bk-page-header|page-hero/.test(l)) for (let k = Math.max(0, i - 2); k <= Math.min(L.length - 1, i + 3); k++) marks.add(k); });
  if (!marks.size) continue;
  sub('   ' + rel(f));
  let prev = -2;
  for (const i of [...marks].sort((a, b) => a - b).slice(0, 70)) { if (i > prev + 1) say('        ....'); say('   ' + String(i + 1).padStart(4) + ' | ' + L[i].slice(0, 170)); prev = i; }
}
sub('   ek trek ka front matter (tasweer wali lines)');
for (const dir of ['trekking', 'tours', 'expeditions']) {
  const d = path.join(ROOT, 'src', 'content', dir);
  if (!fs.existsSync(d)) continue;
  const f = fs.readdirSync(d).find((n) => n.endsWith('.md'));
  if (!f) continue;
  const t = read(path.join(d, f));
  const fm = ((t.match(/^---[\s\S]*?\n---/) || [''])[0]).split(/\r?\n/);
  say('   src/content/' + dir + '/' + f);
  fm.filter((l) => /image|cover|gallery|photo|hero|social|svg|webp|jpg|png|^\s*-\s*(src|image)?:?\s*\//i.test(l)).slice(0, 20).forEach((l) => say('   | ' + l.slice(0, 150)));
}
const jd = path.join(ROOT, 'src', 'assets', 'uploads', 'journeys');
if (fs.existsSync(jd)) { const ls = fs.readdirSync(jd); say(''); say('   uploads/journeys: ' + ls.length + ' files — ' + ls.slice(0, 5).join(', ')); }
for (const f of fs.readdirSync(path.join(ROOT, 'tools')).filter((n) => /\.mjs$/.test(n) && !/^(_|dump-|fix-)/.test(n))) {
  if (/journeys|\.svg/.test(read(path.join(ROOT, 'tools', f)) || '')) say('   tools/' + f + ' mein journeys/.svg ka zikr');
}

/* ================================================================ 6 */
H('6. CSS — hero, cover, object-fit');
const css = read(path.join(ROOT, 'src', 'assets', 'css', 'input.css')) || '';
const CL = css.split(/\r?\n/);
const cm = new Set();
CL.forEach((l, i) => { if (/bk-hero-photo|bk-hero-slide picture|bk-hero picture|\.bk-hero\b|bk-hero-compact|bk-hero-stage|bk-trip-main-image|bk-page-header\b|object-fit|object-position/.test(l)) for (let k = Math.max(0, i - 1); k <= Math.min(CL.length - 1, i + 2); k++) cm.add(k); });
let pv = -2, shown = 0;
for (const i of [...cm].sort((a, b) => a - b)) { if (shown++ > 160) { say('   ...'); break; } if (i > pv + 1) say('        ....'); say('   ' + String(i + 1).padStart(5) + ' | ' + CL[i].slice(0, 170)); pv = i; }

/* ================================================================ 7 */
H('7. CMS (.pages.yml) — tasweer ke khane');
const py = read(path.join(ROOT, '.pages.yml'));
if (!py) say('   (.pages.yml nahi mili)');
else {
  const L = py.split(/\r?\n/);
  say('   ' + L.length + ' lines');
  const pm = new Set();
  L.forEach((l, i) => { if (/name:\s*(cover_image|cover_source|image|images|gallery|social_image|hero|hero_image|focal|position|crop|og)|heroSettings|slides|slider|social_image|image_alt|focal|object_position/i.test(l)) for (let k = Math.max(0, i - 1); k <= Math.min(L.length - 1, i + 4); k++) pm.add(k); });
  let p2 = -2, s2 = 0;
  for (const i of [...pm].sort((a, b) => a - b)) { if (s2++ > 200) { say('   ...'); break; } if (i > p2 + 1) say('        ....'); say('   ' + String(i + 1).padStart(5) + ' | ' + mask(L[i]).slice(0, 160)); p2 = i; }
}
const hs = read(path.join(ROOT, 'src', '_data', 'heroSettings.json'));
if (hs) { sub('   src/_data/heroSettings.json'); say('   ' + hs.replace(/\s+/g, ' ').slice(0, 2500)); }

/* ================================================================ 8 */
H('8. META DESCRIPTION (catalogue aur ahem safhay)');
for (const d of descs.filter((x) => /^\/(|tours\/|trekking\/|expeditions\/|jeep-safaris\/|plan-a-trip\/|destinations\/)$/.test(x.url) || /^\/(tours|trekking|expeditions)\/[^/]+\/$/.test(x.url)).slice(0, 40)) {
  say('   ' + d.url.padEnd(46) + (d.desc ? d.desc.length + ' harf  ' + d.desc.slice(0, 90) : 'XX nahi hai'));
}

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein.');
fs.writeFileSync(path.join(ROOT, '_images.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _images.txt');
