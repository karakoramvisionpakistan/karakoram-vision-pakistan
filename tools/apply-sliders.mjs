// Hero slider ko CMS se chalane layak banata hai.
//
// Ab tak slider khud ba khud journeys ki cover photos uthata tha. Us ke baad bhi
// wahi hoga - lekin agar client CMS ke naye "Hero Sliders" hisse mein us section
// ke liye slides bana de, to unhein tarjeeh milegi: har slide ki apni photo,
// heading, text aur button.
//
// Kya kya badalta hai:
//   1. eleventy.config.js  -> `sliders` collection aur `slidesFor` filter
//   2. src/content/sliders -> ek namoona slide (band hui, taake website par na aaye)
//   3. .pages.yml          -> naya CMS section "Hero Sliders"
//   4. landing-hero.njk    -> alag se bheji gayi file se replace hoti hai
//
//   node tools/apply-sliders.mjs           -> sirf dikhata hai
//   node tools/apply-sliders.mjs --write   -> files badal deta hai
// Dobara chalane par kuch duplicate nahi hota.
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
let changed = 0, skipped = 0, problems = 0;

// Yeh wahi naam hain jo client dropdown mein chunega
const SECTIONS = [
  'homepage', 'tours', 'trekking', 'expeditions', 'jeep-safaris',
  'hunting-services', 'vehicles', 'blog', 'destinations', 'all',
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

// ---------------------------------------------------------------- 1. eleventy
patch('eleventy.config.js', 'Eleventy: sliders collection aur slidesFor filter', (t) => {
  if (t.includes('"sliders"') || t.includes('slidesFor')) return null;

  const anchor = '  eleventyConfig.addCollection("pages", api => coll(api,"pages"));';
  if (!t.includes(anchor)) throw new Error('eleventy.config.js mein pages collection wali line nahi mili');
  const nl = nlOf(t);

  const lines = [
    anchor,
    '  eleventyConfig.addCollection("sliders", api => coll(api,"sliders"));',
    '  // Kisi section ki slides nikalta hai. "all" wali slides har jagah aati hain.',
    '  eleventyConfig.addFilter("slidesFor", (sliders, section) => {',
    '    const key = String(section || "homepage").toLowerCase();',
    '    const of = item => [].concat(item.data.sections || item.data.section || [])',
    '      .map(x => String(x || "").toLowerCase()).filter(Boolean);',
    '    return (sliders || [])',
    '      .filter(item => { const s = of(item); return s.includes(key) || s.includes("all"); })',
    '      .sort((a,b) => (Number(a.data.order||0) - Number(b.data.order||0))',
    '        || String(a.data.title||"").localeCompare(String(b.data.title||"")))',
    '      .slice(0, 12);',
    '  });',
  ].join(nl);

  return t.replace(anchor, lines);
});

// ---------------------------------------------------------------- 2. namoona slide
const sliderDir = 'src/content/sliders';
const samplePath = path.join(sliderDir, 'example-slide.md');
if (fs.existsSync(samplePath)) {
  console.log('   pehle se theek: namoona slide');
  skipped++;
} else {
  console.log(`${WRITE ? 'bana' : 'banega'}: namoona slide  (${samplePath})`);
  changed++;
  if (WRITE) {
    fs.mkdirSync(sliderDir, { recursive: true });
    fs.writeFileSync(samplePath, [
      '---',
      'title: "Example slide — change or delete me"',
      'published: false',
      'sections:',
      '  - homepage',
      'order: 1',
      'image: ""',
      'image_alt: ""',
      'eyebrow: "Karakoram Vision Pakistan"',
      'heading: "Your headline for this slide"',
      'text: "One or two lines of text that sit under the headline."',
      'button_label: "View tours"',
      'button_url: "/tours/"',
      '---',
      '',
    ].join('\n'), 'utf8');
  }
}

// --------------------------------- 2b. slides se alag pages na banein
// Eleventy har .md file ka ek page bana deta hai. Slides pages nahi hain, sirf
// data hain - is liye is folder ke liye `permalink: false` keh dete hain.
const dirData = path.join(sliderDir, 'sliders.json');
if (fs.existsSync(dirData)) {
  console.log('   pehle se theek: sliders folder ki settings');
  skipped++;
} else {
  console.log(`${WRITE ? 'bana' : 'banega'}: sliders folder ki settings  (${dirData})`);
  changed++;
  if (WRITE) {
    fs.mkdirSync(sliderDir, { recursive: true });
    fs.writeFileSync(dirData, `${JSON.stringify({
      permalink: false,
      eleventyExcludeFromCollections: false,
    }, null, 2)}\n`, 'utf8');
  }
}

// Permalink banane wala tool bhi is folder ko chhor de
patch('tools/normalize-permalinks.mjs', 'Permalink tool: sliders folder ko chhor dena', (t) => {
  if (t.includes('SKIP_FOLDERS')) return null;

  const anchor = 'const slugify = (s) =>';
  if (!t.includes(anchor)) throw new Error('normalize-permalinks.mjs mein slugify wali line nahi mili');
  const nl = nlOf(t);
  let out = t.replace(anchor,
    `// Yeh folders pages nahi hain (sirf data), in ka koi URL nahi hota.${nl}`
    + `const SKIP_FOLDERS = new Set(['sliders']);${nl}${nl}${anchor}`);

  const loopAnchor = '  const section = SECTIONS[folder];';
  if (!out.includes(loopAnchor)) throw new Error('normalize-permalinks.mjs mein section wali line nahi mili');
  out = out.replace(loopAnchor, `  if (SKIP_FOLDERS.has(folder)) continue;${nl}${loopAnchor}`);
  return out;
});

// ---------------------------------------------------------------- 3. .pages.yml
patch('.pages.yml', 'CMS: naya "Hero Sliders" section', (t) => {
  if (t.includes('- name: sliders')) return null;

  const nl = nlOf(t);
  const lines = t.split(/\r?\n/);

  // naya collection "pages" wale collection se pehle daalte hain
  let at = lines.findIndex((l) => l === '- name: pages');
  if (at === -1) {
    // warna pehli settings screen se pehle
    at = lines.findIndex((l) => /^- name: site(_|$)/.test(l));
  }
  if (at === -1) throw new Error('.pages.yml mein jagah nahi mili');

  const block = [
    '- name: sliders',
    '  label: Hero Sliders (big photos at the top of a page)',
    '  type: collection',
    '  path: src/content/sliders',
    '  filename: "{primary}.md"',
    '  view:',
    '    primary: title',
    '    fields:',
    '    - title',
    '    - sections',
    '    - order',
    '    - published',
    '  fields:',
    '  - name: title',
    '    label: Name (only you see this)',
    '    type: string',
    '    required: true',
    '    description: "Sirf is list mein pehchanne ke liye - website par nazar nahi aata."',
    '  - name: published',
    '    label: Show on the website',
    '    type: boolean',
    '    default: true',
    '  - name: sections',
    '    label: Which pages should show this slide',
    '    type: select',
    '    list: true',
    '    description: "Kam az kam ek chunna zaroori hai, warna slide kahin nazar nahi aayegi. Ek slide kai pages par bhi lag sakti hai; \\"all\\" ka matlab har woh page jahan bara slider hai."',
    '    options:',
    ...SECTIONS.map((s) => `    - ${s}`),
    '  - name: order',
    '    label: Order',
    '    type: number',
    '    description: "Chhota number pehle. 1, 2, 3..."',
    '    options:',
    '      min: 1',
    '      max: 99',
    '  - name: image',
    '    label: Photo',
    '    type: image',
    '    description: "Chaurai mein kam az kam 1600px - yeh poori chaurai par dikhti hai. Upload karein ya library se chunein."',
    '  - name: image_alt',
    '    label: Photo description',
    '    type: string',
    '    description: "Photo mein kya nazar aa raha hai, ek chhoti line. Google Images aur nabina logon ke liye."',
    '  - name: eyebrow',
    '    label: Small line above the headline',
    '    type: string',
    '  - name: heading',
    '    label: Headline',
    '    type: string',
    '  - name: text',
    '    label: Text under the headline',
    '    type: text',
    '  - name: button_label',
    '    label: Button text',
    '    type: string',
    '    description: "Khali chhor dein to button nazar nahi aayega."',
    '  - name: button_url',
    '    label: Button link',
    '    type: string',
    '    description: "Jaise /tours/ ya /plan-a-trip/"',
    '',
  ];

  lines.splice(at, 0, ...block);
  return lines.join(nl);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
console.log('YAAD RAHE: landing-hero.njk alag file hai - usey src/_includes/components/ mein copy karna hai.');
