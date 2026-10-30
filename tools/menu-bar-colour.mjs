#!/usr/bin/env node
/**
 * menu-bar-colour.mjs   (website ke folder mein)
 *
 * Menu ki patti safed se garm ret ke rang (#E6E1CA) par.
 * Likhai gehri neeli, hover par gehra narangi + neeche narangi lakeer.
 *
 * Bharkeela narangi (#FF5A1F) is halke rang par 2.9:1 contrast deta hai —
 * chhoti likhai ke liye kam. Gehra narangi (#C2410C) 4.8:1 deta hai, dikhta
 * wahi hai magar parhna aasan.
 *
 *   node tools/menu-bar-colour.mjs            -> sirf dekhna
 *   node tools/menu-bar-colour.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');

let css = (() => { try { return fs.readFileSync(CSS, 'utf8'); } catch { return null; } })();
if (!css) { console.log('XX  input.css nahi mili.'); process.exit(1); }

if (css.includes('#E6E1CA')) {
  console.log('OK  pehle se laga hua hai.');
  process.exit(0);
}

const steps = [];
const apply = (what, find, to) => {
  if (!css.includes(find)) { console.log('XX  nahi mila: ' + what); console.log('    Pehle polish-header.mjs chalayein.'); process.exit(1); }
  css = css.replace(find, to);
  steps.push(what);
};

/* patti ka rang */
apply('patti ka rang',
`  .bk-navigation-wrap {
    background: #ffffff;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    border-bottom: 1px solid rgba(15, 23, 42, 0.10);
  }`,
`  .bk-navigation-wrap {
    background: #E6E1CA;
    border-top: 1px solid rgba(15, 23, 42, 0.10);
    border-bottom: 1px solid rgba(15, 23, 42, 0.14);
  }`
);

/* likhai thori gehri, taake ret ke rang par saaf parhi jaye */
apply('likhai ka rang',
`    color: #0f172a;
    font-size: 0.9rem;
  }
  .bk-nav-toggle { color: #64748b; }`,
`    color: #16233d;
    font-size: 0.9rem;
  }
  .bk-nav-toggle { color: #4A5A75; }`
);

/* hover: gehra narangi + neeche lakeer */
apply('hover ka rang aur lakeer',
`  .bk-nav-link:hover,
  .bk-nav-toggle:hover,
  .bk-nav-item:hover .bk-nav-link,
  .bk-nav-item:hover .bk-nav-toggle {
    color: var(--bk-accent);
  }`,
`  .bk-nav-link:hover,
  .bk-nav-toggle:hover,
  .bk-nav-item:hover .bk-nav-link,
  .bk-nav-item:hover .bk-nav-toggle {
    color: #C2410C;
  }
  .bk-nav-link:hover,
  .bk-nav-item:hover .bk-nav-link {
    box-shadow: inset 0 -2px 0 var(--bk-accent);
  }`
);

console.log('\nTabdeeliyan:');
for (const s of steps) console.log('   ->  ' + s);
console.log('\n   patti   : #E6E1CA (garm ret)');
console.log('   likhai  : #16233D (gehra neela)');
console.log('   hover   : #C2410C + neeche narangi lakeer');

console.log('\n--------------------------------------------------');

if (!WRITE) {
  console.log('Save karne ke liye:');
  console.log('   node tools/menu-bar-colour.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(CSS + '.bak10')) fs.copyFileSync(CSS, CSS + '.bak10');
fs.writeFileSync(CSS, css, 'utf8');
console.log('LIKHA: src/assets/css/input.css   (backup: input.css.bak10)');
console.log('Agla qadam:  npm run build');
