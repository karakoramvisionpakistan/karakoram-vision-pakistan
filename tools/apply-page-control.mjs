// Har page par "dikhao ya chhupao" ka switch lagata hai.
//
// Ab tak website ke bohot se pages template ki soorat mein likhe thay, aur CMS
// unhein dekh hi nahi sakta tha. Client na unhein chhupa sakta tha na hata
// sakta tha - adhoore pages website par pare rehte thay aur Google unhein bhi
// parhta tha.
//
// Ab CMS mein ek nayi screen aayegi jahan website ke sare pages ek fehrist
// mein honge, har ek ke saamne switch. Switch band karne par page BUILD HI
// NAHI HOGA: na us ka address khulega, na sitemap mein aayega, na kisi fehrist
// mein. File apni jagah mojood rahegi, to switch wapas chalu karte hi page
// lout aayega - kuch marta nahi.
//
// Sath mein "agar chhupa dein to logon ko kahan bhejein" ka khana bhi hai. Jo
// page Google mein pehle se hai, usey yun hi gayab karne se log "page not
// found" par pohanchte hain; naya pata dene se woh seedha sahi jagah jate hain
// aur Google us page ki kamai hui izzat nayi jagah ko de deta hai.
//
// PEHLE tools/page-control.mjs copy karein.
//
//   node tools/apply-page-control.mjs           -> sirf dikhata hai
//   node tools/apply-page-control.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
let changed = 0, skipped = 0, problems = 0;

function patch(file, label, fn) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; return; }
  const before = fs.readFileSync(file, 'utf8');
  let after;
  try { after = fn(before); } catch (e) { console.log(`!! ${label}\n   ${e.message}`); problems++; return; }
  if (after === null) { console.log(`   pehle se theek: ${label}`); skipped++; return; }
  if (after === before) { console.log(`   koi tabdeeli nahi: ${label}`); skipped++; return; }
  console.log(`${WRITE ? 'badla' : 'badlega'}: ${label}  (${file})`);
  changed++;
  if (WRITE) fs.writeFileSync(file, after, 'utf8');
}

const nlOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

// ---------------------------------------------- 0. tool mojood hai?
if (!fs.existsSync('tools/page-control.mjs')) {
  console.log('MISSING FILE  tools/page-control.mjs');
  console.log('   Pehle woh file copy karein, phir yeh script chalayein.');
  process.exit(1);
}

// ---------------------------------------------- 1. build ki tarteeb
patch('package.json', 'Build: pages ki fehrist nayi karna', (t) => {
  if (t.includes('tools/page-control.mjs')) return null;
  const old = 'node tools/validate-content.mjs &&';
  if (!t.includes(old)) throw new Error('package.json mein validate-content wali line nahi mili');
  // validate ke foran baad, taake fehrist eleventy chalne se pehle taiyar ho
  return t.replace(old, 'node tools/validate-content.mjs && node tools/page-control.mjs &&');
});

// ---------------------------------------------- 2. chhupe hue pages build se bahar
patch('eleventy.config.js', 'Eleventy: chhupe hue pages build hi na hon', (t) => {
  if (t.includes('pageControl.json')) return null;

  const nl = nlOf(t);
  let out = t;

  if (!out.includes('__readFileForSizes')) {
    out = `import { readFileSync as __readFileForSizes } from "node:fs";${nl}${out}`;
  }

  const anchor = '  eleventyConfig.addFilter("json", v => JSON.stringify(v));';
  if (!out.includes(anchor)) throw new Error('eleventy.config.js mein json filter wali line nahi mili');

  const block = [
    '  // Jo pages CMS se chhupaye gaye hain unhein build hi mat karo. Yeh sirf',
    '  // menu se hatana nahi - page banta hi nahi, is liye na us ka address',
    '  // khulta hai, na woh sitemap ya search mein aata hai, aur Google ko bhi',
    '  // nazar nahi aata. Fehrist tools/page-control.mjs banata hai, build ke',
    '  // shuru mein. Fehrist na mile to sab pages pehle ki tarah chalte hain.',
    '  try {',
    '    const control = JSON.parse(__readFileForSizes("src/_data/pageControl.json", "utf8"));',
    '    for (const file of control.hidden || []) eleventyConfig.ignores.add(file);',
    '  } catch {',
    '    // koi baat nahi',
    '  }',
    anchor,
  ].join(nl);

  return out.replace(anchor, block);
});

// ---------------------------------------------- 3. CMS ki nayi screen
patch('.pages.yml', 'CMS: "Pages: show or hide" wali screen', (t) => {
  if (t.includes('- name: page_control')) return null;
  const nl = nlOf(t);

  const block = [
    '',
    '- name: page_control',
    '  label: 21 — Pages: show or hide',
    '  type: file',
    '  path: src/_data/pageControl.json',
    '  operations:',
    '    delete: false',
    '    rename: false',
    '  fields:',
    '  - name: pages',
    '    label: Website pages',
    '    type: object',
    '    list: true',
    '    description: "Website ke sare pages. Kisi page ko website se hatana ho to us ka switch band kar dein - page CMS mein mojood rahega lekin website par bilkul nahi aayega. Yeh fehrist khud banti hai; naya page banay to woh apne aap yahan aa jata hai."',
    '    fields:',
    '    - name: label',
    '      label: Page',
    '      type: string',
    '    - name: url',
    '      label: Address',
    '      type: string',
    '    - name: published',
    '      label: Show on website',
    '      type: boolean',
    '      default: true',
    '    - name: redirect_to',
    '      label: If hidden, send visitors to',
    '      type: string',
    '      description: "Khali chhor dein to page bas gayab ho jata hai - naye ya adhoore pages ke liye yahi theek hai. Lekin agar is page ka pata Google mein ya kisi aur website par maujood hai, to yahan us page ka address likh dein jahan log jana chahiye - jaise /tours/. Is se aane wala khali hath nahi lautta aur Google is page ki kamai nayi jagah ko de deta hai."',
    '    - name: file',
    '      label: File',
    '      type: string',
    '      hidden: true',
    '  - name: hidden',
    '    label: Hidden pages (automatic)',
    '    type: string',
    '    list: true',
    '    hidden: true',
    '  - name: redirects',
    '    label: Redirects (automatic)',
    '    type: object',
    '    list: true',
    '    hidden: true',
    '    fields:',
    '    - name: from',
    '      label: From',
    '      type: string',
    '    - name: to',
    '      label: To',
    '      type: string',
    '',
  ];

  return `${t.replace(/\s+$/, '')}${nl}${block.join(nl)}`;
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
if (WRITE && changed) console.log('\nAb "npm run build" chalayein - pehli dafa fehrist banegi.');
