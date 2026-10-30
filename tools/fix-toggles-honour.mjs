#!/usr/bin/env node
/**
 * fix-toggles-honour.mjs
 *
 * MASLA
 *   tools/generate_runtime_catalog.mjs toggles ko parhta hi nahi tha:
 *      const k2Trek       = folder === 'trekking'    && /\bk2\b/.test(text);
 *      const culturalTour = folder === 'tours'       && /cultur|heritage/.test(text);
 *      const peak8000     = folder === 'expeditions' && /(8000|8611)/.test(text);
 *   Yani K2 Treks / Cultural Tours / 8,000m Peaks ke switch bekaar the —
 *   faisla matn se hota tha. Best seller aur Fixed departure ka switch parha
 *   to jata tha magar uske sath bhi matn ka andaza laga hua tha, isi liye
 *   taqreeban har entry "best seller" ban jaati thi.
 *
 * YEH SCRIPT
 *   1. generate_runtime_catalog.mjs: switch ab waqai gina jayega, aur ek naya
 *      khaana `sections` banega. Agar entry mein menu_sections mojood ho to
 *      sirf wahi chalega (poora control); warna purana tareeqa — yani abhi
 *      website par jo dikh raha hai woh waisa hi rahega.
 *   2. eleventy.config.js: catalogFilter ab `sections` ko bhi dekhega, aur
 *      anjaan filter par `true` ke bajaye `false` dega — warna naye section
 *      page par saari entries aa jatin.
 *
 *   node tools/fix-toggles-honour.mjs            -> sirf dekhna
 *   node tools/fix-toggles-honour.mjs --write    -> save karna
 *
 * Dobara chalane se nuqsan nahi.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const planned = [];

const GEN = path.join(ROOT, 'tools', 'generate_runtime_catalog.mjs');
const CFG = path.join(ROOT, 'eleventy.config.js');

for (const f of [GEN, CFG]) {
  if (!fs.existsSync(f)) {
    console.log('XX  nahi mili: ' + path.relative(ROOT, f));
    process.exit(1);
  }
}

/* ======================================================= 1) generator == */

console.log('\n1) tools/generate_runtime_catalog.mjs');

let gen = fs.readFileSync(GEN, 'utf8');
const genBefore = gen;

if (gen.includes('const sectionsChosen')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  // purani ginti ko guess* bana dein
  const renames = [
    [/const fixedDeparture = boolValue\(/, 'const guessFixedDeparture = boolValue('],
    [/const bestSeller = boolValue\(/, 'const guessBestSeller = boolValue('],
    [/const k2Trek = folder === 'trekking'/, "const guessK2Trek = folder === 'trekking'"],
    [/const culturalTour = folder === 'tours'/, "const guessCulturalTour = folder === 'tours'"],
    [/const peak8000 = folder === 'expeditions'/, "const guessPeak8000 = folder === 'expeditions'"],
  ];
  for (const [re, to] of renames) {
    if (!re.test(gen)) {
      console.log('   XX  yeh line nahi mili: ' + re);
      console.log('       Rok rahe hain taake file kharab na ho.');
      process.exit(1);
    }
    gen = gen.replace(re, to);
  }

  // guessPeak8000 wali line ke baad naya hissa
  const anchor = /^([ \t]*)const guessPeak8000 = .*$/m;
  if (!anchor.test(gen)) {
    console.log('   XX  guessPeak8000 wali line nahi mili.');
    process.exit(1);
  }

  const block = `
$1
$1// ---- menu sections: client ka chunaav sab se oopar ----
$1const slugifySection = (value) => String(value ?? '').toLowerCase()
$1  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
$1const sectionsChosen = (Array.isArray(data.menu_sections) ? data.menu_sections : [])
$1  .map(slugifySection).filter(Boolean);
$1const hasChoice = sectionsChosen.length > 0;
$1// chunaav mojood ho to sirf wahi; warna purana tareeqa (switch + matn)
$1const inSection = (slug, legacy, guess) =>
$1  hasChoice ? sectionsChosen.includes(slug) : (boolValue(legacy) || guess);

$1const fixedDeparture = inSection('fixed-departures', data.fixed_departure, guessFixedDeparture);
$1const bestSeller = inSection('best-sellers', data.best_seller || data.featured, guessBestSeller);
$1const k2Trek = folder === 'trekking' && inSection('k2-treks', data.k2_trek, guessK2Trek);
$1const culturalTour = folder === 'tours' && inSection('cultural-tours', data.cultural_tour, guessCulturalTour);
$1const peak8000 = folder === 'expeditions' && inSection('8000m-peaks', data.peak_8000m, guessPeak8000);

$1const sections = hasChoice ? sectionsChosen : [
$1  fixedDeparture && 'fixed-departures',
$1  bestSeller && 'best-sellers',
$1  k2Trek && 'k2-treks',
$1  culturalTour && 'cultural-tours',
$1  peak8000 && '8000m-peaks',
$1].filter(Boolean);`;

  gen = gen.replace(anchor, (m, indent) => m + block.replace(/\$1/g, indent));

  // sections ko dono outputs mein daalein
  if (!/peak_8000m: peak8000,/.test(gen)) {
    console.log('   XX  flat object mein peak_8000m nahi mila.');
    process.exit(1);
  }
  gen = gen.replace('peak_8000m: peak8000,', 'peak_8000m: peak8000,\n      sections,');

  if (!/peak_8000m: item\.peak_8000m,/.test(gen)) {
    console.log('   XX  structured object mein peak_8000m nahi mila.');
    process.exit(1);
  }
  gen = gen.replace(
    'peak_8000m: item.peak_8000m,',
    'peak_8000m: item.peak_8000m,\n  sections: item.sections || [],'
  );

  planned.push({ file: GEN, text: gen });
  console.log('   ->  switch ab gine jayenge, aur naya `sections` khaana banega.');
}

/* ======================================================= 2) config ===== */

console.log('\n2) eleventy.config.js — catalogFilter');

let cfg = fs.readFileSync(CFG, 'utf8');

if (cfg.includes('Array.isArray(item.sections)')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const OLD = /const matchesFilter=item=>\{[\s\S]*?\};/;
  if (!OLD.test(cfg)) {
    console.log('   XX  matchesFilter nahi mila.');
    process.exit(1);
  }
  const found = cfg.match(OLD)[0];
  if (found.length > 900) {
    console.log('   XX  matchesFilter bohat lamba nikla (' + found.length + ' chars) — rok rahe hain.');
    process.exit(1);
  }

  const NEW =
    'const matchesFilter=item=>{ if(!filter)return true; ' +
    'const secs=Array.isArray(item.sections)?item.sections:[]; ' +
    'if(secs.includes(filter))return true; ' +
    'if(filter==="fixed-departures")return !!item.fixed_departure; ' +
    'if(filter==="best-sellers")return !!item.best_seller; ' +
    'if(filter==="k2-treks")return !!item.k2_trek; ' +
    'if(filter==="cultural-tours")return !!item.cultural_tour; ' +
    'if(filter==="8000m-peaks")return !!item.peak_8000m; ' +
    'return false; };';

  cfg = cfg.replace(OLD, NEW);
  planned.push({ file: CFG, text: cfg });
  console.log('   ->  ab `sections` bhi dekhega; anjaan filter par khali page (pehle saari entries aa jatin).');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!planned.length) {
  console.log('Kuch badalne ko nahi hai.');
  process.exit(0);
}

if (!WRITE) {
  console.log(planned.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/fix-toggles-honour.mjs --write');
  process.exit(0);
}

for (const p of planned) {
  const bak = p.file + '.bak';
  if (!fs.existsSync(bak)) fs.copyFileSync(p.file, bak);
  fs.writeFileSync(p.file, p.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, p.file) + '   (backup: ' + path.basename(bak) + ')');
}

console.log('\nAgla qadam:');
console.log('   node tools/generate_runtime_catalog.mjs');
console.log('   npm run build');
