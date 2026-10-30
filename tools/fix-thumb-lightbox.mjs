#!/usr/bin/env node
/**
 * fix-thumb-lightbox.mjs
 *
 * 1) Thumbnail par click karne se lightbox (badi tasveer) bhi khulegi.
 *    Abhi thumbnail sirf main image badalta hai, open() call hi nahi hota.
 *
 * 2) entries[] mein cover photo do baar jaane ka masla:
 *    main.currentSrc srcset ki wajah se resize shuda URL deta hai
 *    (…-400.webp), jo thumb ke data-full se mel nahi khata.
 *    getAttribute('src') se asal path milta hai aur duplicate khatam.
 *
 *   node tools/fix-thumb-lightbox.mjs            -> sirf dekhna
 *   node tools/fix-thumb-lightbox.mjs --write    -> save karna
 *
 * Dobara chalane se nuqsan nahi (idempotent).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, 'src', 'assets', 'js', 'site-core.js');

if (!fs.existsSync(FILE)) {
  console.log('XX  src/assets/js/site-core.js nahi mili.');
  process.exit(1);
}

let text = fs.readFileSync(FILE, 'utf8');
const before = text;
let done = 0;
let already = 0;

/* ---------------------------------------------------------- patch 1 ---- */

const OLD_1 = `          gallery.dataset.activeIndex = String(entries.findIndex(item => item.src === thumb.dataset.full));
        });`;

const NEW_1 = `          const picked = entries.findIndex(item => item.src === thumb.dataset.full);
          gallery.dataset.activeIndex = String(picked);
          open(picked < 0 ? 0 : picked);
        });`;

if (text.includes(NEW_1)) {
  console.log('OK  1) thumbnail -> lightbox pehle se laga hua hai.');
  already++;
} else if (text.includes(OLD_1)) {
  text = text.replace(OLD_1, NEW_1);
  console.log('->  1) thumbnail click ab lightbox kholega.');
  done++;
} else {
  console.log('XX  1) line 237 wala hissa pehchana nahi gaya.');
  console.log('    Code shayad badal chuka hai — mujhe bata dein.');
  process.exit(1);
}

/* ---------------------------------------------------------- patch 2 ---- */

const OLD_2 = `if (main) addEntry(main.currentSrc || main.src, main.alt);`;
const NEW_2 = `if (main) addEntry(main.getAttribute('src') || main.src, main.alt);`;

if (text.includes(NEW_2)) {
  console.log('OK  2) cover photo ka duplicate fix pehle se laga hua hai.');
  already++;
} else if (text.includes(OLD_2)) {
  text = text.replace(OLD_2, NEW_2);
  console.log('->  2) cover photo ab lightbox mein do baar nahi aayegi.');
  done++;
} else {
  console.log('!   2) line 229 wala hissa nahi mila — chhoR rahe hain.');
}

/* ---------------------------------------------------------- verify ----- */

// open() thumb handler se pehle define hota hai? (closure hai, isliye theek,
// magar tasdeeq kar lein ke open waqai mojood hai)
if (!/const open = index =>/.test(text)) {
  console.log('XX  open() function nahi mila — patch mahfooz nahi, rok rahe hain.');
  process.exit(1);
}

/* ---------------------------------------------------------- write ------ */

console.log('--------------------------------------------------');

if (!done) {
  console.log('Sab kuch pehle se theek hai, kuch badalne ko nahi.');
  process.exit(0);
}

if (!WRITE) {
  console.log(done + ' tabdeeli hogi. Save karne ke liye:');
  console.log('   node tools/fix-thumb-lightbox.mjs --write');
  process.exit(0);
}

fs.writeFileSync(FILE, text, 'utf8');
console.log('LIKHA: src/assets/js/site-core.js');
console.log('\nHo gaya. Ab build kar ke dekh lein.');
