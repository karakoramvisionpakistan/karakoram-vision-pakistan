#!/usr/bin/env node
/**
 * clean-uploads.mjs   (website ke folder mein, npm run build ke BAAD)
 *
 * Woh uploads dhoondta hai jo kahin istemal nahi ho rahin, aur un ke sath
 * un ki `sized` aur `hero` naqlein bhi.
 *
 * MITATA KUCH NAHI. `--write` par sirf _unused/ mein SARKA deta hai, jo
 * project ke bahar hai — site us ko nahi uthati, aur agar koi photo ghalti
 * se nikal gayi to wapas laana ek minute ka kaam hai.
 *
 * Ek upload ko "istemal mein" tab mana jata hai jab us ka naam:
 *   - build ki hui kisi file (_site) mein mile, YA
 *   - kisi asli source file mein mile (content, njk, data)
 * Build se bani fehristein (imageSizes.json waghera) ginti mein nahi aatin,
 * kyunki un mein har photo ka naam hota hai chahe woh istemal ho ya na ho.
 *
 *   node tools/clean-uploads.mjs            <- sirf fehrist dikhata hai
 *   node tools/clean-uploads.mjs --write    <- sarka deta hai
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const mb = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

const UP = path.join(ROOT, 'src', 'assets', 'uploads');
const SIZED = path.join(ROOT, 'src', 'assets', 'sized');
const HERO = path.join(ROOT, 'src', 'assets', 'hero');
const SITE = path.join(ROOT, '_site');
const PARK = path.join(ROOT, '_unused');

/* build khud banati hai — in mein har photo ka naam hota hai */
const GENERATED = new Set([
  'imageSizes.json', 'heroImages.json', 'search-index.json',
  'structuredCatalog.json', 'catalog.js', 'knowledge.js',
]);

say('');
say('GHAIR-ISTEMAL PHOTOS' + (WRITE ? '   (SARKA RAHA HOON)' : '   (SIRF DIKHA RAHA HOON)'));
say('='.repeat(78));

if (!fs.existsSync(UP)) { say('   XX  src/assets/uploads nahi mila'); process.exit(1); }
if (!fs.existsSync(SITE)) { say('   XX  _site nahi mila — pehle npm run build chala lein'); process.exit(1); }

/* ---------- 1. matan jama karo ---------- */
const haystack = [];
const gather = (dir, exts, skipGenerated) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_unused'].includes(e.name) || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { gather(f, exts, skipGenerated); continue; }
    if (skipGenerated && GENERATED.has(e.name)) continue;
    if (!exts.test(e.name)) continue;
    /* assets ke andar ki photos khud haystack nahi banatin */
    if (/[\\/]assets[\\/](uploads|sized|hero)[\\/]/.test(f)) continue;
    try { haystack.push(fs.readFileSync(f, 'utf8')); } catch { }
  }
};

gather(SITE, /\.(html|json|xml|txt|css|js|webmanifest)$/i, false);
const siteLen = haystack.length;
gather(path.join(ROOT, 'src'), /\.(njk|md|json|js|mjs|yml|yaml)$/i, true);
gather(path.join(ROOT, 'functions'), /\.(js|mjs|json)$/i, true);
const hay = haystack.join('\n');

say('');
say('   dekhi gayi files: ' + haystack.length + '   (' + siteLen + ' build se, ' + (haystack.length - siteLen) + ' source se)');
say('   matan ka naap: ' + mb(hay.length));

/* ---------- 2. uploads ko chaano ---------- */
const uploads = fs.readdirSync(UP, { withFileTypes: true })
  .filter((e) => e.isFile() && !/\.bak/.test(e.name))
  .map((e) => {
    const p = path.join(UP, e.name);
    return { name: e.name, p, size: fs.statSync(p).size, stem: path.parse(e.name).name };
  });

const used = [], unused = [];
for (const u of uploads) {
  /* stem kaafi hai: naqlein isi naam se banti hain */
  if (hay.includes(u.stem)) used.push(u); else unused.push(u);
}

say('');
say('   kul uploads: ' + uploads.length + '   (' + mb(uploads.reduce((s, u) => s + u.size, 0)) + ')');
say('   istemal mein: ' + used.length);
say('   ghair-istemal: ' + unused.length + '   (' + mb(unused.reduce((s, u) => s + u.size, 0)) + ')');

if (!unused.length) {
  say('');
  say('   Kuch bhi ghair-istemal nahi mila. Safai ki zaroorat nahi.');
  say('');
  fs.writeFileSync(path.join(ROOT, '_uploads.txt'), out.join('\n') + '\n', 'utf8');
  process.exit(0);
}

/* ---------- 3. naqlein dhoondo ---------- */
const derivativesOf = (stem) => {
  const hits = [];
  for (const dir of [SIZED, HERO]) {
    if (!fs.existsSync(dir)) continue;
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) { walk(f); continue; }
        if (e.name.startsWith(stem)) hits.push({ p: f, size: fs.statSync(f).size });
      }
    };
    walk(dir);
  }
  return hits;
};

say('');
say('   GHAIR-ISTEMAL PHOTOS AUR UN KI NAQLEIN');
say('-'.repeat(78));

let totalBytes = 0, totalFiles = 0;
const plan = [];
for (const u of unused.sort((a, b) => b.size - a.size)) {
  const derivs = derivativesOf(u.stem);
  const bytes = u.size + derivs.reduce((s, d) => s + d.size, 0);
  totalBytes += bytes; totalFiles += 1 + derivs.length;
  plan.push({ u, derivs, bytes });
  say('   ' + u.name.slice(0, 50).padEnd(52) + mb(u.size).padStart(9)
    + '   + ' + String(derivs.length).padStart(3) + ' naqlein = ' + mb(bytes).padStart(9));
}

say('');
say('   ' + 'KUL'.padEnd(52) + ''.padStart(9) + '   ' + String(totalFiles).padStart(5) + ' files = ' + mb(totalBytes).padStart(9));

/* ---------- 4. ek dafa aur tasalli ---------- */
say('');
say('   TASALLI KI JAANCH');
say('-'.repeat(78));
const fails = [];
const check = (ok, label) => { say('   ' + (ok ? 'OK  ' : 'XX  ') + label); if (!ok) fails.push(label); };

check(used.length > 0, 'kuch photos istemal mein mili hain  (' + used.length + ')');
check(unused.length < uploads.length * 0.8,
  'ghair-istemal ' + Math.round(unused.length / uploads.length * 100) + '% hain — 80% se kam hona chahiye');
check(siteLen > 50, 'build ki kaafi files dekhi gayin  (' + siteLen + ')');
/* nazuk: koi aisi photo jo site.json ya homePage.json mein ho, kabhi na nikle */
for (const n of ['site.json', 'homePage.json', 'menu.json']) {
  const p = path.join(ROOT, 'src', '_data', n);
  if (!fs.existsSync(p)) continue;
  let t = ''; try { t = fs.readFileSync(p, 'utf8'); } catch { }
  const bad = unused.filter((u) => t.includes(u.stem));
  check(bad.length === 0, n + ' mein koi ghair-istemal photo nahi'
    + (bad.length ? '  (' + bad.map((b) => b.name).join(', ').slice(0, 80) + ')' : ''));
}

if (fails.length) {
  say('');
  say('   RUK GAYA — KUCH BHI NAHI SARKAYA');
  say('');
  say('   Yeh ginti bharosay ke laiq nahi lag rahi. Mumkin hai build purani ho,');
  say('   ya photos kisi aisi jagah se aa rahi hon jo maine nahi dekhi.');
  say('   Pehle `npm run build` chala kar dobara azmayein; phir bhi yahi aaye');
  say('   to yeh matan mujhe bhej dein.');
  say('');
  fs.writeFileSync(path.join(ROOT, '_uploads.txt'), out.join('\n') + '\n', 'utf8');
  console.log('-'.repeat(78));
  console.log('LIKHA: _uploads.txt');
  process.exit(1);
}

/* ---------- 5. kaam ---------- */
say('');
say('='.repeat(78));
if (!WRITE) {
  say('');
  say('   Abhi kuch nahi sarkaya.');
  say('');
  say('   Sarkane ke liye:   node tools/clean-uploads.mjs --write');
  say('');
  say('   Woh in ' + totalFiles + ' files ko _unused/ mein le jayega (mitayega NAHI).');
  say('   _unused/ project ke bahar hai — site us ko nahi uthati.');
  say('   Koi photo wapas chahiye to wahan se uthaa kar apni jagah rakh dein.');
  say('');
} else {
  const moved = [];
  const moveTo = (src, kind) => {
    const dest = path.join(PARK, kind, path.relative(path.join(ROOT, 'src', 'assets', kind), src));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    moved.push(rel(dest));
  };
  for (const { u, derivs } of plan) {
    moveTo(u.p, 'uploads');
    for (const d of derivs) moveTo(d.p, d.p.startsWith(SIZED) ? 'sized' : 'hero');
  }
  say('');
  say('   SARKA DIYA: ' + moved.length + ' files  ->  _unused/   (' + mb(totalBytes) + ')');

  /* .gitignore mein _unused/ */
  const gi = path.join(ROOT, '.gitignore');
  let gt = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
  if (!/^_unused\/?$/m.test(gt)) {
    fs.writeFileSync(gi, gt.replace(/\s*$/, '\n') + '\n# clean-uploads.mjs ne yahan ghair-istemal photos rakhi hain\n_unused/\n', 'utf8');
    say('   .gitignore mein _unused/ jor diya');
  }
  say('');
  say('   Ab:   npm run build');
  say('   Phir site dekh lein — khaaskar gallery, destinations, aur tours ke safhay.');
  say('   Koi photo gayab lage to _unused/uploads/ se wapas src/assets/uploads/ mein rakh dein.');
  say('');
}

fs.writeFileSync(path.join(ROOT, '_uploads.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _uploads.txt');
