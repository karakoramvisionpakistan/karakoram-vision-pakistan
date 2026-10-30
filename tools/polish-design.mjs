#!/usr/bin/env node
/**
 * polish-design.mjs   (website ke folder mein)
 *
 * Paanch cheezein, ek hi CSS block mein (input.css ke aakhir mein):
 *
 *   1. Motay harf kam — 900/950 ki jagah 700 unwaan, 600 button
 *   2. Button ke neeche narangi roshni aur "uchhal" khatam
 *   3. Goloan ke saat naap -> teen (8px chhoti cheezein, 14px cards, goliyan waisi hi)
 *   4. Footer mein narangi sirf Subscribe par; hover saada safed
 *   5. Footer ke matn ka rang thoRa saaf (14px likhai ke liye zaroori)
 *
 * Block @layer ke BAAHAR hai, is liye oopar wali tamam lines par bhaari
 * parta hai. Wapas lena ho to sirf yeh block hata dein — kuch aur nahi badla.
 *
 *   node tools/polish-design.mjs            -> sirf dekhna
 *   node tools/polish-design.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');

const css = (() => { try { return fs.readFileSync(CSS, 'utf8'); } catch { return null; } })();
if (!css) { console.log('XX  src/assets/css/input.css nahi mili.'); process.exit(1); }

const MARK = '/* === Design polish (V11.17) === */';
if (css.includes(MARK)) {
  console.log('OK  pehle se laga hua hai. Dobara lagane ke liye block hata dein.');
  process.exit(0);
}

const BLOCK = `

${MARK}
/* Yeh hissa @layer ke baahar hai, is liye oopar likhi har cheez par bhaari
   parta hai. Wapas lena ho to poora block hata dein — baqi file jaisi hai
   waisi rahegi. */

/* ---- 1) Motay harf kam -------------------------------------------------
   Poori website par 900/950 laga hua tha. Jab har cheez moti ho to koi
   cheez numaya nahi rehti. Unwaan 700, button 600, matn apni jagah. */

.font-black { font-weight: 700; }

h1, h2, h3, h4,
.bk-trip-summary-card h1,
.bk-trip-content-section > h2,
.bk-trip-section-heading h2,
.bk-highlight-grid article > span {
  font-weight: 700;
}

.bk-trip-inquiry-primary,
.bk-trip-contact-hub,
.bk-footer-contact-hub,
.bk-footer-top-actions > a,
.bk-footer-top-actions > button,
.bk-footer-cta,
.bk-newsletter-form button,
.bk-departure-table a,
.bk-simple-departures a,
.bk-trip-section-nav a,
.bk-floating-contact-button,
.bk-social-links a,
.bk-book-button,
.bk-plan-button {
  font-weight: 600;
}

.bk-trip-breadcrumb a,
.bk-trip-destination,
.bk-trip-tools a,
.bk-trip-tools button,
.bk-trip-tags span,
.bk-departure-status,
.bk-trip-gallery-count,
.bk-trip-facts strong,
.bk-search-chip,
.bk-count-pill,
.bk-card-type {
  font-weight: 600;
}

/* ---- 2) Narangi roshni aur uchhal khatam -------------------------------
   Rang wali parchhai button ke neeche purana andaz hai. Hover par rang
   badalna kaafi hai — safha ko hilne ki zaroorat nahi. */

.bk-footer-top > a,
.bk-newsletter-form button,
.bk-footer-cta,
.bk-trip-inquiry-primary {
  box-shadow: none;
}

.bk-footer-top > a:hover,
.bk-newsletter-form button:hover,
.bk-footer-cta:hover,
.bk-trip-inquiry-primary:hover,
.bk-footer-top-actions > a:hover,
.bk-footer-top-actions > button:hover,
.bk-social-links a:hover,
.bk-footer-rating-links a:hover {
  box-shadow: none;
  transform: none;
}

/* ---- 3) Goloan ke naap: saat se teen -----------------------------------
   Pehle 6, 8, 10, 12, 14, 18 aur 999px sab chal rahe the. Aankh ko pata
   chalta hai chahe wajah samajh na aaye. Ab: chhoti cheezein 8px,
   cards 14px, goliyan (social, chips) waisi hi. */

.bk-footer-cta,
.bk-newsletter-form button,
.bk-newsletter-form input,
.bk-footer-contact-hub,
.bk-footer-top-actions > a,
.bk-footer-top-actions > button,
.bk-trip-inquiry-primary,
.bk-trip-contact-hub,
.bk-departure-table a,
.bk-trip-section-nav a {
  border-radius: 8px;
}

.bk-footer-rating-links a,
.bk-trip-thumbnails button,
.bk-highlight-grid article,
.bk-simple-departures a,
.bk-trip-section-nav,
.bk-departure-table-wrap,
.bk-trip-main-image,
.bk-trip-summary-card,
.bk-trip-lightbox img {
  border-radius: 14px;
}

/* ---- 4) Footer mein narangi sirf ek jagah ------------------------------
   Pehle link, social, contact hub, rating — sab par hover narangi tha.
   Ab narangi sirf Subscribe par, taake woh waqai nazar aaye. */

.bk-footer section > a:hover,
.bk-footer-bottom a:hover,
.bk-footer a:hover {
  color: #ffffff;
}

.bk-social-links a:hover {
  border-color: rgba(255, 255, 255, 0.32) !important;
  background: rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
}

.bk-footer-contact-hub:hover {
  border-color: rgba(255, 255, 255, 0.38);
  color: #ffffff;
}

.bk-footer-rating-links a:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

/* Subscribe button narangi hi rehta hai */
.bk-footer-cta,
.bk-newsletter-form button {
  background: var(--bk-accent);
  color: #ffffff;
}
.bk-footer-cta:hover,
.bk-newsletter-form button:hover {
  background: var(--bk-accent-hover);
  color: #ffffff;
}

/* ---- 5) Footer ke matn ka rang -----------------------------------------
   Likhai ab 14px hai; .68 par woh mobile par dhoop mein parhna mushkil
   ho jati thi. Rang wahi, bas thoRa saaf. */

.bk-footer p,
.bk-footer-top p:not(.eyebrow),
.bk-footer-bottom {
  color: rgba(255, 255, 255, 0.80);
}

.bk-footer section > a,
.bk-footer-bottom a,
.bk-footer a {
  color: rgba(255, 255, 255, 0.92);
}
/* === Design polish END === */
`;

console.log('\nJo badlega:');
console.log('   1) Motay harf kam        — unwaan 700, button 600 (poori website)');
console.log('   2) Narangi roshni khatam — button ke neeche se parchhai aur uchhal');
console.log('   3) Goloan ke naap        — saat se teen');
console.log('   4) Footer ka narangi     — sirf Subscribe par');
console.log('   5) Footer ke matn ka rang — .68 se .80, links .92');

console.log('\n--------------------------------------------------');
console.log('1 file badlegi: src/assets/css/input.css (aakhir mein naya block).');

if (!WRITE) {
  console.log('\nSave karne ke liye:');
  console.log('   node tools/polish-design.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(CSS + '.bak8')) fs.copyFileSync(CSS, CSS + '.bak8');
fs.writeFileSync(CSS, css.trimEnd() + '\n' + BLOCK, 'utf8');
console.log('\nLIKHA: src/assets/css/input.css   (backup: input.css.bak8)');
console.log('Agla qadam:  npm run build');
