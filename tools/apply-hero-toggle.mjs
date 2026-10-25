// Har page ka bara banner CMS se control karne layak banata hai.
//
// Har page ke liye teen surtein:
//   1. Slider chalu (default)            -> jo abhi hota hai
//   2. Slider band + ek photo lagai hui  -> wahi photo jami hui dikhti hai, slide nahi hoti
//   3. Slider band aur koi photo nahi    -> ek saada patti (gehra rang, page ka unwaan)
//
// Teesri surat mein bhi page ka unwaan rehta hai - us par page ka h1 hota hai
// aur usey gayab karna Google ke liye nuqsan-deh hai.
//
//   node tools/apply-hero-toggle.mjs           -> sirf dikhata hai
//   node tools/apply-hero-toggle.mjs --write   -> files badal deta hai
// Dobara chalane par kuch duplicate nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const CSS_VER = '11.3.0';
let changed = 0, skipped = 0, problems = 0;

// Har woh page jahan bara banner lagta hai. Naam URL ka pehla hissa hai, yani
// ek switch us page aur us ke andar ke pages dono par chalta hai.
const PAGES = [
  ['homepage', 'Home page'],
  ['tours', 'Tours'],
  ['trekking', 'Trekking'],
  ['expeditions', 'Expeditions'],
  ['jeep-safaris', 'Jeep Safaris'],
  ['hunting-services', 'Hunting Services'],
  ['vehicles', 'Vehicles'],
  ['blog', 'Travel Guides (blog)'],
  ['news', 'News'],
  ['destinations', 'Destinations'],
  ['holiday-types', 'Holiday Types'],
  ['special-interests', 'Special Interests'],
  ['journey-categories', 'Journey Categories'],
  ['international-travelers', 'International Travelers'],
  ['guest-reviews', 'Guest Reviews'],
  ['social-responsibility', 'Social Responsibility'],
  ['plan-a-trip', 'Plan a Trip'],
  ['contact-us', 'Contact Us'],
];

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

// ---------------------------------------------------------------- 1. data file
const dataFile = 'src/_data/heroSettings.json';
const blank = () => ({ enabled: true, image: '', image_alt: '' });

if (fs.existsSync(dataFile)) {
  // Agar pehle wala version chal chuka ho (sirf true/false), to usey nayi
  // shakal mein badal dete hain - setting waisi ki waisi rehti hai.
  const raw = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const needsUpgrade = Object.values(raw).some((v) => typeof v === 'boolean')
    || PAGES.some(([k]) => raw[k] === undefined);
  if (!needsUpgrade) {
    console.log('   pehle se theek: banner ki settings ki file');
    skipped++;
  } else {
    console.log(`${WRITE ? 'badli' : 'badlegi'}: banner ki settings ki file  (${dataFile})`);
    changed++;
    if (WRITE) {
      const out = {};
      for (const [key] of PAGES) {
        const v = raw[key];
        if (typeof v === 'boolean') out[key] = { enabled: v, image: '', image_alt: '' };
        else if (v && typeof v === 'object') out[key] = { enabled: v.enabled !== false, image: v.image || '', image_alt: v.image_alt || '' };
        else out[key] = blank();
      }
      fs.writeFileSync(dataFile, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    }
  }
} else {
  console.log(`${WRITE ? 'bani' : 'banegi'}: banner ki settings ki file  (${dataFile})`);
  changed++;
  if (WRITE) {
    const data = {};
    for (const [key] of PAGES) data[key] = blank();
    fs.writeFileSync(dataFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}

// ---------------------------------------------------------------- 2. filters
patch('eleventy.config.js', 'Eleventy: heroKey aur heroConfig filters', (t) => {
  if (t.includes('"heroConfig"')) return null;

  const anchor = '  eleventyConfig.addFilter("json", v => JSON.stringify(v));';
  if (!t.includes(anchor)) throw new Error('eleventy.config.js mein json filter wali line nahi mili');
  const nl = nlOf(t);

  const lines = [];
  if (!t.includes('"heroKey"')) {
    lines.push(
      '  // Page ke URL se banner ki setting ka naam: "/" -> homepage,',
      '  // "/tours/" aur "/tours/fixed-departures/" dono -> tours.',
      '  eleventyConfig.addFilter("heroKey", url => {',
      '    const first = String(url || "/").split("/").filter(Boolean)[0];',
      '    return first ? first.toLowerCase() : "homepage";',
      '  });',
    );
  }
  lines.push(
    '  // Us page ki banner setting. Purani shakal (sirf true/false) bhi chalti hai.',
    '  eleventyConfig.addFilter("heroConfig", (settings, key) => {',
    '    const raw = (settings || {})[key];',
    '    if (raw === undefined || raw === null) return { enabled: true, image: "", image_alt: "" };',
    '    if (typeof raw === "boolean") return { enabled: raw, image: "", image_alt: "" };',
    '    return { enabled: raw.enabled !== false, image: raw.image || "", image_alt: raw.image_alt || "" };',
    '  });',
    anchor,
  );

  return t.replace(anchor, lines.join(nl));
});

// ---------------------------------------------------------------- 3. CSS
patch('src/assets/css/input.css', 'CSS: banner band hone par saada patti', (t) => {
  if (t.includes('.bk-page-header')) return null;

  const anchor = '/* bulandi screen ke saath */';
  const fallback = '.bk-hero { position: relative;';
  const where = t.includes(anchor) ? anchor : fallback;
  if (!t.includes(where)) throw new Error('input.css mein hero wala hissa nahi mila');
  const nl = nlOf(t);

  const block = [
    '/* Banner band ho aur koi photo bhi na lagi ho, to yeh saada patti aati hai.',
    '   Page ka h1 isi mein rehta hai, warna page ka unwaan hi gayab ho jata. */',
    '.bk-page-header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff;',
    '  padding: clamp(2.25rem, 5vw, 4rem) max(4vw, 1.25rem); }',
    '.bk-page-header-inner { max-width: 1440px; margin: 0 auto; }',
    '.bk-page-header .eyebrow { margin: 0; color: #bfdbfe; font-size: .75rem; font-weight: 900;',
    '  letter-spacing: .22em; text-transform: uppercase; }',
    '.bk-page-header h1 { margin: .65rem 0 0; max-width: 22ch; font-size: clamp(2rem, 4.5vw, 3.4rem);',
    '  font-weight: 950; line-height: 1.04; }',
    '.bk-page-header p { margin: .9rem 0 0; max-width: 64ch; color: #dbeafe;',
    '  font-size: clamp(1rem, 1.4vw, 1.15rem); line-height: 1.7; }',
    '.bk-page-header-finder { max-width: 1440px; margin: 1.75rem auto 0; }',
    '',
    where,
  ].join(nl);

  return t.replace(where, block);
});

// ---------------------------------------------------------------- 4. CSS version
patch('src/_includes/layouts/base.njk', `site.css ka version ${CSS_VER}`, (t) => {
  if (t.includes(`site.css?v=${CSS_VER}`)) return null;
  const out = t.replace(/\/assets\/css\/site\.css(\?v=[\d.]+)?/g, `/assets/css/site.css?v=${CSS_VER}`);
  if (out === t) throw new Error('base.njk mein site.css wali line nahi mili');
  return out;
});

patch('src/_headers', `_headers mein site.css ka version ${CSS_VER}`, (t) => {
  if (!/site\.css/.test(t)) return null;
  if (t.includes(`site.css?v=${CSS_VER}`)) return null;
  return t.replace(/\/assets\/css\/site\.css(\?v=[\d.]+)?/g, `/assets/css/site.css?v=${CSS_VER}`);
});

// ---------------------------------------------------------------- 5. CMS screen
patch('.pages.yml', 'CMS: "Big banner" wali screen', (t) => {
  if (t.includes('- name: hero_banners')) return null;
  const nl = nlOf(t);

  const block = [
    '',
    '- name: hero_banners',
    '  label: 20 — Big banner for each page (on/off, or one photo)',
    '  type: file',
    '  path: src/_data/heroSettings.json',
    '  operations:',
    '    delete: false',
    '    rename: false',
    '  fields:',
  ];
  for (const [key, label] of PAGES) {
    block.push(`  - name: ${key}`);
    block.push(`    label: ${JSON.stringify(label)}`);
    block.push('    type: object');
    block.push('    fields:');
    block.push('    - name: enabled');
    block.push('      label: Show the sliding banner');
    block.push('      type: boolean');
    block.push('      default: true');
    block.push('    - name: image');
    block.push('      label: Or one photo instead');
    block.push('      type: image');
    block.push('      description: "Sirf tab chalti hai jab oopar wala switch band ho. Photo lagayein to wahi jami hui nazar aayegi (slide nahi hogi). Khali chhorein to ek saada patti aayegi."');
    block.push('    - name: image_alt');
    block.push('      label: Photo description');
    block.push('      type: string');
    block.push('      description: "Photo mein kya nazar aa raha hai, ek chhoti line."');
  }
  block.push('');

  return `${t.replace(/\s+$/, '')}${nl}${block.join(nl)}`;
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
console.log('YAAD RAHE: landing-hero.njk ka naya version bhi copy karna hai.');
