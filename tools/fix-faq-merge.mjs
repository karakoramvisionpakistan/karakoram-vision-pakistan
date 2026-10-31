#!/usr/bin/env node
/**
 * fix-faq-merge.mjs   (website ke folder mein) — build theek karta hai
 *
 * MASLA
 *   src/content/content.11tydata.js ne build tor di:
 *     TypeError: Cannot convert a Symbol value to a string
 *
 *   Eleventy eleventyComputed ko pehle ek jaali (proxy) object ke sath
 *   chalata hai taake maloom kare ke kaun se khaane istemaal ho rahe hain.
 *   Us dauran .concat() par woh jaali object Symbol lauta deta hai, aur
 *   wahin toot jata hai.
 *
 * HAL
 *   Yeh kaam eleventyComputed se nikaal kar ek filter mein — wahan yeh
 *   masla hota hi nahi, aur schema bhi wahi filter istemaal kar sakta hai.
 *
 *   node tools/fix-faq-merge.mjs            -> sirf dekhna
 *   node tools/fix-faq-merge.mjs --write    -> theek karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const deletes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= 1) hataana ==== */

console.log('\n1) Jo file build tor rahi hai');

const DATA = path.join(ROOT, 'src', 'content', 'content.11tydata.js');
if (!fs.existsSync(DATA)) console.log('   OK  pehle hi hat chuki hai.');
else { deletes.push(DATA); console.log('   ->  src/content/content.11tydata.js hat jayegi'); }

/* ======================================================= 2) filter ===== */

console.log('\n2) eleventy.config.js — naya filter');

const CFG = path.join(ROOT, 'eleventy.config.js');
let cfg = read(CFG);
if (!cfg) { console.log('XX  eleventy.config.js nahi mili.'); process.exit(1); }

const FILTER = `  eleventyConfig.addFilter("withFaqBank", (faqs, bank, serviceType) => {
    // Trip ke apne sawalon ke baad aam sawalon ka bank. Jo sawal trip ne
    // khud likha ho, bank ka wahi sawal chhoR diya jata hai — trip ka
    // apna jawab hamesha bhaari rehta hai.
    const own = Array.isArray(faqs) ? faqs : [];
    if (!serviceType) return own;              // sirf journeys par
    const extra = Array.isArray(bank) ? bank : [];
    const key = (q) => String(q || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const seen = new Set(own.map((f) => key(f && f.question)));
    return own.concat(extra.filter((f) => f && f.question && !seen.has(key(f.question))));
  });
`;

if (cfg.includes('withFaqBank')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const anchor = '  eleventyConfig.addFilter("catalogFilter"';
  if (!cfg.includes(anchor)) { console.log('XX  jagah nahi mili.'); process.exit(1); }
  cfg = cfg.replace(anchor, FILTER + anchor);
  writes.push({ file: CFG, text: cfg, bak: true });
  console.log('   ->  withFaqBank filter juR jayega.');
}

/* ======================================================= 3) faq-block == */

console.log('\n3) faq-block.njk');

const FAQ = path.join(ROOT, 'src', '_includes', 'components', 'faq-block.njk');
let faq = read(FAQ);
if (!faq) { console.log('XX  faq-block.njk nahi mili.'); process.exit(1); }

if (faq.includes('withFaqBank')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const OLD_IF = '{% if faqs and faqs.length %}';
  const NEW_IF = '{% set allFaqs = faqs | withFaqBank(faqBank, service_type) %}\n{% if allFaqs and allFaqs.length %}';
  const OLD_FOR = '{% for faq in faqs %}';
  const NEW_FOR = '{% for faq in allFaqs %}';

  if (!faq.includes(OLD_IF) || !faq.includes(OLD_FOR)) {
    console.log('XX  faq-block ka dhaancha nahi pehchana.');
    process.exit(1);
  }
  faq = faq.replace(OLD_IF, NEW_IF).replace(OLD_FOR, NEW_FOR);
  writes.push({ file: FAQ, text: faq, bak: true });
  console.log('   ->  ab bank filter se jurRega.');
}

/* ======================================================= 4) schema ===== */

console.log('\n4) Structured data');

const SCHEMA = path.join(ROOT, 'src', '_includes', 'components', 'schema.njk');
const schema = read(SCHEMA);
if (!schema) {
  console.log('   !   schema.njk nahi mili.');
} else if (schema.includes('withFaqBank')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const hits = (schema.match(/\bfaqs\b/g) || []).length;
  console.log('   !   schema.njk mein "faqs" ' + hits + ' jagah hai, magar bank abhi usme nahi jata.');
  console.log('       Matlab bank ke sawal safhe par dikhenge magar Google ke');
  console.log('       structured data mein nahi aayenge. Yeh file mujhe bhej dein');
  console.log('       to woh bhi laga doonga — tab woh sawal Google aur AI ke');
  console.log('       jawabon mein aane ke qaabil ho jayenge.');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length && !deletes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log((writes.length + deletes.length) + ' tabdeeli. Karne ke liye:');
  console.log('   node tools/fix-faq-merge.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && !fs.existsSync(w.file + '.bak17')) fs.copyFileSync(w.file, w.file + '.bak17');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
for (const d of deletes) {
  fs.rmSync(d);
  console.log('HATAYI: ' + path.relative(ROOT, d).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
