#!/usr/bin/env node
/**
 * menu-bar-colour-fix.mjs   (website ke folder mein)
 *
 * Patti ka rang nahi laga tha — koi purana rule zyada mazboot nikla.
 * Yeh script wahi rang zyada mazboot tareeqe se lagati hai, aur andar
 * wale hisse ko shaffaf kar deti hai (agar neela wahan se aa raha ho).
 *
 * Saath hi batati hai ke takkar kis rule se thi.
 *
 *   node tools/menu-bar-colour-fix.mjs            -> sirf dekhna
 *   node tools/menu-bar-colour-fix.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');

let css = (() => { try { return fs.readFileSync(CSS, 'utf8'); } catch { return null; } })();
if (!css) { console.log('XX  input.css nahi mili.'); process.exit(1); }

/* ---- takkar kis se hai ---- */

console.log('\n1) "bk-navigation-wrap" aur "bk-desktop-nav" kahan kahan likhe hain');

const lines = css.split(/\r?\n/);
let found = 0;
lines.forEach((line, i) => {
  if (/bk-navigation-wrap|bk-desktop-nav/.test(line)) {
    found++;
    console.log('   ' + String(i + 1).padStart(5) + ': ' + line.trim().slice(0, 150));
  }
});
if (!found) console.log('   (kahin nahi mila — ajeeb baat hai)');

/* ---- mazboot rule ---- */

console.log('\n2) Rang mazbooti se lagana');

const MARK = '/* === Menu bar colour fix (V11.19) === */';
if (css.includes(MARK)) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const BLOCK = `

${MARK}
/* Patti ka rang kisi purane, zyada mazboot rule se takra raha tha.
   Yahan do classon wala selector aur !important dono isi liye hain. */
@media (min-width: 1024px) {
  .bk-site-header .bk-navigation-wrap,
  header.bk-site-header .bk-navigation-wrap {
    background: #E6E1CA !important;
    background-image: none !important;
  }

  /* Agar neela andar wale hisse se aa raha ho to woh shaffaf ho jaye */
  .bk-site-header .bk-desktop-nav {
    background: transparent !important;
    background-image: none !important;
  }

  .bk-site-header .bk-navigation-wrap .bk-nav-link { color: #16233D; }
  .bk-site-header .bk-navigation-wrap .bk-nav-toggle { color: #4A5A75; }
  .bk-site-header .bk-navigation-wrap .bk-nav-link:hover,
  .bk-site-header .bk-navigation-wrap .bk-nav-item:hover .bk-nav-link,
  .bk-site-header .bk-navigation-wrap .bk-nav-item:hover .bk-nav-toggle,
  .bk-site-header .bk-navigation-wrap .bk-nav-toggle:hover {
    color: #C2410C;
  }
}
/* === Menu bar colour fix END === */
`;
  css = css.trimEnd() + '\n' + BLOCK;
  console.log('   ->  naya block aakhir mein juR jayega.');

  if (WRITE) {
    if (!fs.existsSync(CSS + '.bak11')) fs.copyFileSync(CSS, CSS + '.bak11');
    fs.writeFileSync(CSS, css, 'utf8');
    console.log('\nLIKHA: src/assets/css/input.css   (backup: input.css.bak11)');
    console.log('Agla qadam:  npm run build');
    process.exit(0);
  }
}

console.log('\n--------------------------------------------------');
if (!WRITE) {
  console.log('Save karne ke liye:');
  console.log('   node tools/menu-bar-colour-fix.mjs --write');
}
