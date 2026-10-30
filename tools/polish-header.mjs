#!/usr/bin/env node
/**
 * polish-header.mjs   (website ke folder mein)
 *
 *  1. Tagline ("Skardu-based Tours, Trekking…") header aur footer dono se hat jayegi
 *  2. Logo wali qatar se hours+phone ka dabba — woh maloomat oopar wali patti
 *     mein pehle se mojood hai, do baar likhi hui thi
 *  3. Search ka dabba chhota (poora jumla adhoora nazar aa raha tha)
 *  4. Menu ki patti: safed, gehri likhai, narangi SIRF hover par; patti patli
 *  5. Language dropdown halka aur chhota
 *  6. Hero ki likhai ka safed chaukor khatam — uski jagah halki dhalaan
 *  7. Scroll par header simat jata hai (oopar wali patti chhup jati hai,
 *     logo aur menu rehte hain)
 *
 *   node tools/polish-header.mjs            -> sirf dekhna
 *   node tools/polish-header.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= 1) tagline ==== */

console.log('\n1) Tagline header se');

const NJK = path.join(ROOT, 'src', '_includes', 'components', 'header.njk');
let njk = read(NJK);
if (!njk) { console.log('XX  header.njk nahi mili.'); process.exit(1); }
const njkBefore = njk;

const OLD_TAG = `      <span>{{ h.top_strip.left_text or site.tagline }}</span>\n`;
if (!njk.includes('h.top_strip.left_text')) console.log('   OK  pehle se hat chuki hai.');
else if (!njk.includes(OLD_TAG)) console.log('   !   tagline wali line nahi pehchani.');
else { njk = njk.replace(OLD_TAG, ''); console.log('   ->  header se hat jayegi.'); }

/* search ka chhota jumla */
console.log('\n2) Search ka jumla chhota');
const OLD_PH = `placeholder="{{ h.search.placeholder or 'Search tours, treks, expeditions and destinations' }}"`;
const NEW_PH = `placeholder="{{ h.search.placeholder or 'Search' }}"`;
if (njk.includes(NEW_PH)) console.log('   OK  pehle se theek hai.');
else if (!njk.includes(OLD_PH)) console.log('   !   placeholder nahi pehchana.');
else { njk = njk.replace(OLD_PH, NEW_PH); console.log('   ->  "Search" reh jayega.'); }

if (njk !== njkBefore) writes.push({ file: NJK, text: njk, bak: true });

/* ======================================================= 3) data ======= */

console.log('\n3) Settings — hours ka dabba aur footer ki tagline');

const HDR_DATA = path.join(ROOT, 'src', '_data', 'siteHeader.json');
const hdrRaw = read(HDR_DATA);
if (!hdrRaw) console.log('   !   siteHeader.json nahi mili.');
else {
  const hdr = JSON.parse(hdrRaw);
  hdr.brand = hdr.brand || {};
  hdr.search = hdr.search || {};
  let changed = false;
  if (hdr.brand.show_support_block !== false) { hdr.brand.show_support_block = false; changed = true; console.log('   ->  logo wali qatar se hours+phone ka dabba hat jayega'); }
  if (hdr.search.placeholder && hdr.search.placeholder.length > 12) { hdr.search.placeholder = 'Search'; changed = true; console.log('   ->  search ka jumla "Search"'); }
  if (changed) writes.push({ file: HDR_DATA, text: JSON.stringify(hdr, null, 2) + '\n', bak: true });
  else console.log('   OK  pehle se theek hai.');
}

const FTR_DATA = path.join(ROOT, 'src', '_data', 'siteFooter.json');
const ftrRaw = read(FTR_DATA);
if (!ftrRaw) console.log('   !   siteFooter.json nahi mili.');
else {
  const ftr = JSON.parse(ftrRaw);
  ftr.contact = ftr.contact || {};
  if (ftr.contact.description) {
    console.log('   ->  footer se hat raha hai: "' + String(ftr.contact.description).slice(0, 60) + '…"');
    ftr.contact.description = '';
    writes.push({ file: FTR_DATA, text: JSON.stringify(ftr, null, 2) + '\n', bak: true });
  } else console.log('   OK  footer ki tagline pehle se khali hai.');
}

/* ======================================================= 4) JS ========= */

console.log('\n4) Scroll par header simatna');

const JS = path.join(ROOT, 'src', 'assets', 'js', 'header-compact.js');
const JS_TEXT = `/* Neeche scroll karte hi header simat jata hai: oopar wali maloomat ki
   patti chhup jati hai, logo chhota ho jata hai, menu apni jagah rehta hai.
   Safha parhte waqt poora chauthai screen header nahi khata. */
(() => {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;

  let waiting = false;
  const apply = () => {
    header.classList.toggle('is-compact', window.scrollY > 140);
    waiting = false;
  };

  window.addEventListener('scroll', () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(apply);
  }, { passive: true });

  apply();
})();
`;
if (read(JS) === JS_TEXT) console.log('   OK  pehle se hai.');
else { writes.push({ file: JS, text: JS_TEXT }); console.log('   ->  header-compact.js banegi'); }

const BASE = path.join(ROOT, 'src', '_includes', 'layouts', 'base.njk');
let base = read(BASE);
if (!base) console.log('   !   base.njk nahi mili.');
else if (base.includes('header-compact.js')) console.log('   OK  script pehle se lagi hai.');
else {
  const anchor = '<script src="/assets/js/trip-form.js';
  const at = base.indexOf(anchor);
  if (at < 0) console.log('   !   script lagane ki jagah nahi mili.');
  else {
    base = base.slice(0, at) + '<script src="/assets/js/header-compact.js" defer></script>\n  ' + base.slice(at);
    writes.push({ file: BASE, text: base, bak: true });
    console.log('   ->  base.njk mein script juR gayi.');
  }
}

/* ======================================================= 5) CSS ======== */

console.log('\n5) input.css — menu, search, language, hero');

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
const css = read(CSS);
if (!css) { console.log('XX  input.css nahi mili.'); process.exit(1); }

const MARK = '/* === Header + hero polish (V11.18) === */';
if (css.includes(MARK)) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const BLOCK = `

${MARK}
/* @layer ke baahar — oopar wali har cheez par bhaari. Wapas lena ho to
   poora block hata dein. */

/* ---- Menu ki patti: safed, narangi sirf hover par ---------------------
   Mobile ka drawer bilkul nahi chhua ja raha, sirf baRi screen. */
@media (min-width: 1024px) {
  .bk-navigation-wrap {
    background: #ffffff;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    border-bottom: 1px solid rgba(15, 23, 42, 0.10);
  }
  .bk-desktop-nav { gap: 0.05rem; }
  .bk-nav-link {
    padding-top: 0.6rem;
    padding-bottom: 0.6rem;
    color: #0f172a;
    font-size: 0.9rem;
  }
  .bk-nav-toggle { color: #64748b; }
  .bk-nav-link:hover,
  .bk-nav-toggle:hover,
  .bk-nav-item:hover .bk-nav-link,
  .bk-nav-item:hover .bk-nav-toggle {
    color: var(--bk-accent);
  }
}

/* ---- Search ka dabba chhota ------------------------------------------ */
.bk-header-search input {
  width: 14rem;
  max-width: 100%;
}

/* ---- Language dropdown halka ----------------------------------------- */
.bk-language select {
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  font-weight: 500;
}

/* ---- Hero: safed chaukor ki jagah halki dhalaan -----------------------
   Chaukor parhne ke liye to theek tha magar patti jaisa lagta tha. Ab
   tasveer par neeche se oopar halka andhera, aur likhai saadi safed. */
.bk-hero-mark {
  background: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  color: #ffffff;
  text-shadow: 0 2px 20px rgba(2, 6, 23, 0.6), 0 1px 3px rgba(2, 6, 23, 0.55);
}

.bk-hero-shade {
  background: linear-gradient(
    to top,
    rgba(2, 6, 23, 0.74) 0%,
    rgba(2, 6, 23, 0.40) 38%,
    rgba(2, 6, 23, 0.08) 70%,
    rgba(2, 6, 23, 0) 100%
  );
}

/* ---- Scroll par header simat jata hai --------------------------------- */
.bk-site-header .bk-info-strip,
.bk-site-header .bk-brand-row,
.bk-site-header .bk-brand-link img {
  transition: all 0.18s ease;
}

.bk-site-header.is-compact .bk-info-strip { display: none; }

.bk-site-header.is-compact .bk-brand-row {
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
}

.bk-site-header.is-compact .bk-brand-link img {
  height: 36px;
  width: auto;
}

@media (prefers-reduced-motion: reduce) {
  .bk-site-header .bk-info-strip,
  .bk-site-header .bk-brand-row,
  .bk-site-header .bk-brand-link img { transition: none; }
}
/* === Header + hero polish END === */
`;
  writes.push({ file: CSS, text: css.trimEnd() + '\n' + BLOCK, bak: true });
  console.log('   ->  naya block aakhir mein juR jayega.');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/polish-header.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  if (w.bak && fs.existsSync(w.file) && !fs.existsSync(w.file + '.bak9')) fs.copyFileSync(w.file, w.file + '.bak9');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
