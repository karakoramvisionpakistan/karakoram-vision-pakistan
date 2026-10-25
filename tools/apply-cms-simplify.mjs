// CMS ko asaan banata hai. Koi khana nahi khota, koi data nahi badalta -
// sirf tarteeb, naam aur madad ke jumle behtar hote hain.
//
//   1. "01 — Site Identity, Logos, Contacts & Social" mein 29 khane ek sath thay.
//      Ab woh 11 chhoti screens mein bant gaya hai (file wahi src/_data/site.json rehti hai).
//   2. Baqi screens ke naam saaf zubaan mein, aur naya number.
//   3. Journey forms chhote hisson mein bant jate hain, aur jo khane build khud
//      bharta hai woh "Filled in automatically" naam ke BAND hisse mein chale jate
//      hain - gayab nahi hote, client jab chahe khol kar apni value likh sakta hai.
//   4. Jo khane confusing thay un par madad ka jumla aa gaya.
//
//   node tools/apply-cms-simplify.mjs           -> sirf dikhata hai
//   node tools/apply-cms-simplify.mjs --write   -> .pages.yml badal deta hai
// Dobara chalane par kuch duplicate nahi hota.
import fs from 'node:fs';

const FILE = '.pages.yml';
const WRITE = process.argv.includes('--write');

// ---------------------------------------------------------------- settings screens
// Har nayi screen: andar ka naam, jo label client dekhega, aur kaun se khane.
const SITE_SCREENS = [
  ['site',              '01 — Business name & description',        ['name', 'tagline', 'description', 'url', 'language']],
  ['site_logos',        '02 — Logos & favicon',                    ['logo', 'logo_dark', 'logo_light', 'mobile_logo', 'favicon']],
  ['site_contact',      '03 — Phone, email & address',             ['phone', 'phone_secondary', 'email', 'booking_email', 'address']],
  ['site_channels',     '04 — WhatsApp & chat channels',           ['contact', 'tawk']],
  ['site_social',       '05 — Social media links',                 ['social']],
  ['site_ratings',      '06 — Review & rating links',              ['ratings']],
  ['site_business',     '07 — Business details & map location',    ['business', 'geo']],
  ['site_verification', '08 — Google/Bing verification & sharing', ['verification', 'seo']],
  ['site_faqs',         '09 — Homepage questions & answers',       ['home_faqs']],
  ['site_team',         '10 — Team members',                       ['team']],
  ['site_advanced',     '11 — Advanced (leave alone unless asked)', ['forms', 'navigation', 'performance', 'ai']],
];

const RELABEL = {
  site_header: '12 — Header & top bar',
  navigation:  '13 — Menus (what shows in the navbar)',
  site_footer: '14 — Footer & newsletter',
  homepage:    '15 — Homepage sections & their order',
  theme:       '16 — Colours, corners & spacing',
  forms:       '17 — Enquiry forms & their boxes',
  taxonomies:  '18 — Categories, statuses & dropdown lists',
  pages:       'Pages (About, Destinations, Policies)',
};

// ---------------------------------------------------------------- collections
const SECTION_COLLECTIONS = ['tours', 'trekking', 'expeditions', 'jeep_safaris', 'hunting_services', 'blog', 'vehicles'];
const ALL_COLLECTIONS = [...SECTION_COLLECTIONS, 'pages'];

// Yeh khane tools/autofill-content.mjs build ke waqt khud bhar deta hai.
// Inhein chhupaya NAHI jata - ek band hisse ("Filled in automatically") mein
// daal diya jata hai, taake form chhota rahe lekin client jab chahe badal sake.
const AUTO_FIELDS = [
  'slug',             // file ke naam se - isi liye title badalne par URL nahi toot-ta
  'duration_days',    // itinerary ke "Day N" se
  'departure_type',   // "Fixed departure" wale khane se
  'price_currency',   // default USD
  'cover_image_alt',  // title + destination se
  'answer_summary',   // summary ke pehle jumle se
  'key_facts',        // duration / difficulty / destination / group size / price se
  'author',           // site settings ke business naam se
  'reviewed_by',      // wahi
  'last_verified',    // git mein is file ke aakhri commit ki tareekh se
  'sources',          // bohot kam zarurat parti hai
  'reviews',          // mehmanon ki reviews ab dashboard ke Reviews hisse se aati hain
];

// Sirf yeh khana chhupa rehta hai: build har baar slug se dobara banata hai,
// is liye client ki likhi value bach nahi sakti - usey dikhana dhoka hoga.
const KEEP_HIDDEN_IN_SECTIONS = ['permalink'];

const AUTO_HEADING = 'Filled in automatically — open only to change something';

// Form ko hisson mein baantne wale unwaan. Har entry: [kis khane se pehle, unwaan, band rahe?]
// "collapsed" wale hisse default band rehte hain - client unhein kabhi kabhi hi kholta hai.
const HEADINGS = {
  journey: [
    ['title',         'The basics', false],
    ['published',     'Show it on the website', false],
    ['summary',       'Short descriptions', false],
    ['cover_image',   'Photos', false],
    ['duration',      'Duration, price & group size', false],
    ['destination',   'Destination', false],
    ['categories',    'Categories & tags', true],
    ['departures',    'Departure dates', true],
    ['highlights',    'Highlights, inclusions & packing', false],
    ['route_map_url', 'Extras — route map & trip leader', true],
    ['faqs',          'Questions & key facts (helps Google and AI)', false],
    ['author',        'Who prepared this page', true],
    ['seo',           'Search & social sharing', false],
    ['body',          'Full content / itinerary', false],
  ],
  blog: [
    ['title',          'The basics', false],
    ['published',      'Show it on the website', false],
    ['summary',        'Description & photo', false],
    ['categories',     'Categories & tags', true],
    ['answer_summary', 'Questions & quick answer (helps Google and AI)', false],
    ['author',         'Who prepared this page', true],
    ['seo',            'Search & social sharing', false],
    ['body',           'Article content', false],
  ],
  vehicles: [
    ['title',       'The basics', false],
    ['published',   'Show it on the website', false],
    ['summary',     'Description & photos', false],
    ['capacity',    'Vehicle details', false],
    ['seo',         'Search & social sharing', false],
    ['body',        'Full description', false],
  ],
  pages: [
    ['title',          'The basics', false],
    ['published',      'Show it on the website', false],
    ['summary',        'Description & photo', false],
    ['categories',     'Categories', true],
    ['answer_summary', 'Questions & quick answer (helps Google and AI)', false],
    ['seo',            'Search & social sharing', false],
    ['body',           'Page content', false],
  ],
};

const headingsFor = (collection) => {
  if (collection === 'blog') return HEADINGS.blog;
  if (collection === 'vehicles') return HEADINGS.vehicles;
  if (collection === 'pages') return HEADINGS.pages;
  return HEADINGS.journey;
};

const headingName = (label) => `_h_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 28)}`;

// Madad ke jumle - client ko samajh aaye ke kis khane mein kya likhna hai.
const HELP = {
  slug: 'Page ka address ka aakhri hissa, chhote haroof aur dash mein - jaise k2-base-camp-trek. Badalne se purana link toot sakta hai.',
  summary: 'Do ya teen line - yeh cards par aur Google par nazar aati hai.',
  answer_summary: 'Ek saaf jumla jo bataye yeh safar kya hai. ChatGPT aur Google ke AI jawab isi ko uthate hain.',
  gallery: 'Is page ki photo gallery. Upload karein ya library se chunein; pehli photo pehle dikhti hai.',
  cover_image_alt: 'Photo mein kya nazar aa raha hai, ek chhoti line mein. Google Images aur nabina logon ke liye.',
  tags: 'Sirf search aur andar ke kaam ke liye - website par visitor ko nazar nahi aate.',
  categories: 'Group banane ke liye - jaise "Cultural", "Family". Menu aur filters inhi se bante hain.',
  key_facts: 'Chhoti label aur value - jaise "Best season: May-September". AI inhi ko seedha quote karta hai.',
  departure_details: 'Sirf tab bharein jab fixed dates par group ja raha ho. Warna khali chhor dein.',
  highlights: 'Chaar se chh chhoti lines - safar ki sab se khaas baatein.',
  included: 'Qeemat mein kya shamil hai, ek line fi cheez.',
  excluded: 'Qeemat mein kya shamil nahi, ek line fi cheez.',
  reviews: 'Yahan haath se review likhne ki zarurat nahi. Mehmanon ki reviews dashboard ke "Reviews" wale hisse se publish hoti hain.',
  sources: 'Hawale - sirf tab jab kisi sarkari safhe ya khabar ka hawala dena ho.',
  author: 'Yeh page kis ne tayar kiya. Khali chhor dein to business ka naam chala jata hai.',
  reviewed_by: 'Kis ne check kiya. Google aur AI aise pages ko zyada ahmiyat dete hain.',
  last_verified: 'Aakhri baar kab check kiya tha. Saal mein ek do baar update kar dein.',
};

// ================================================================ engine
if (!fs.existsSync(FILE)) {
  console.log(`${FILE} nahi mila - yeh command website ke folder mein chalayein.`);
  process.exit(1);
}

const text = fs.readFileSync(FILE, 'utf8');
const nl = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);

// Top-level entries (indent 0) dhoondna
const entryStarts = [];
lines.forEach((l, i) => { if (/^- name: \S/.test(l)) entryStarts.push(i); });
if (!entryStarts.length) { console.log('.pages.yml mein koi entry nahi mili.'); process.exit(1); }

const entries = entryStarts.map((start, idx) => {
  const end = idx + 1 < entryStarts.length ? entryStarts[idx + 1] : lines.length;
  const name = lines[start].replace(/^- name:\s*/, '').trim();
  return { name, start, end };
});

const byName = Object.fromEntries(entries.map((e) => [e.name, e]));

// Ek entry ke andar `  fields:` ke top-level blocks nikalna
function fieldBlocks(entry) {
  let fieldsAt = -1;
  for (let i = entry.start; i < entry.end; i++) {
    if (/^  fields:\s*$/.test(lines[i])) { fieldsAt = i; break; }
  }
  if (fieldsAt === -1) return { fieldsAt, blocks: [], after: entry.end };

  const starts = [];
  for (let i = fieldsAt + 1; i < entry.end; i++) {
    if (/^  - name: \S/.test(lines[i])) starts.push(i);
    else if (/^\S/.test(lines[i])) break;
  }
  const blocks = starts.map((s, k) => {
    let e = k + 1 < starts.length ? starts[k + 1] : entry.end;
    // aakhri block ke baad jo khali lines hon unhein chhor dein
    while (e > s + 1 && lines[e - 1].trim() === '') e--;
    return { name: lines[s].replace(/^  - name:\s*/, '').trim(), start: s, end: e };
  });
  const after = blocks.length ? blocks[blocks.length - 1].end : fieldsAt + 1;
  return { fieldsAt, blocks, after };
}

let changed = 0, skipped = 0, problems = 0;
const report = [];
const edits = []; // { from, to, replacement: string[] }

function note(msg) { report.push(msg); }

// ---------------------------------------------------------------- 1. site ko baantna
const siteEntry = byName.site;
if (!siteEntry) {
  note('!! "site" wali screen nahi mili');
  problems++;
} else if (lines[siteEntry.start + 1] && lines[siteEntry.start + 1].includes('Business name & description')) {
  note('   pehle se ho chuka: site screens ka bantwara');
  skipped++;
} else {
  const { blocks } = fieldBlocks(siteEntry);
  const blockByName = Object.fromEntries(blocks.map((b) => [b.name, b]));
  const planned = new Set(SITE_SCREENS.flatMap(([, , f]) => f));
  const missing = [...planned].filter((f) => !blockByName[f]);
  const extra = blocks.map((b) => b.name).filter((n) => !planned.has(n));

  if (missing.length) {
    note(`!! yeh khane site.json mein nahi mile: ${missing.join(', ')}`);
    problems++;
  } else {
    // jo khane plan mein nahi, woh aakhri (advanced) screen mein chale jayenge
    const screens = SITE_SCREENS.map(([n, l, f]) => [n, l, [...f]]);
    if (extra.length) {
      screens[screens.length - 1][2].push(...extra);
      note(`   note: yeh khane "Advanced" screen mein rakhe gaye: ${extra.join(', ')}`);
    }

    const out = [];
    screens.forEach(([name, label, fieldNames], i) => {
      if (i > 0) out.push('');
      out.push(`- name: ${name}`);
      out.push(`  label: ${label}`);
      out.push('  type: file');
      out.push('  path: src/_data/site.json');
      out.push('  operations:');
      out.push('    delete: false');
      out.push('    rename: false');
      out.push('  fields:');
      for (const fn of fieldNames) {
        const b = blockByName[fn];
        out.push(...lines.slice(b.start, b.end));
      }
    });
    out.push('');

    edits.push({ from: siteEntry.start, to: siteEntry.end, replacement: out });
    note(`${WRITE ? 'bana' : 'banega'}: 1 bari screen -> ${screens.length} chhoti screens (${screens.map((s) => s[2].length).join('+')} khane)`);
    changed++;
  }
}

// ---------------------------------------------------------------- 2. labels
for (const [name, label] of Object.entries(RELABEL)) {
  const e = byName[name];
  if (!e) { note(`!! screen "${name}" nahi mili`); problems++; continue; }
  const at = e.start + 1;
  if (!/^  label:/.test(lines[at] || '')) { note(`!! "${name}" ka label nahi mila`); problems++; continue; }
  if (lines[at] === `  label: ${label}`) { skipped++; continue; }
  edits.push({ from: at, to: at + 1, replacement: [`  label: ${label}`] });
  note(`${WRITE ? 'badla' : 'badlega'}: "${name}" ka naam -> ${label}`);
  changed++;
}

// ------------------------------------------------- 3. collections ko dobara tarteeb dena
// Har collection ke `fields:` ka poora hissa ek hi baar dobara likha jata hai:
// unwaan interleave hote hain, automatic khane aakhir mein ek band hisse mein
// chale jate hain, aur madad ke jumle lag jate hain. Khane ki tafseel (type,
// options, nested fields) jaisi hai waisi copy hoti hai - chhui nahi jati.
let rebuilt = 0, autoMoved = 0, helpCount = 0, alreadyOk = 0;

for (const cname of ALL_COLLECTIONS) {
  const e = byName[cname];
  if (!e) continue;
  const allBlocks = fieldBlocks(e).blocks;
  if (!allBlocks.length) continue;

  // Purane unwaan nikaal dete hain - har baar nayi tarteeb se banaye jate hain.
  const blocks = allBlocks.filter((b) => !b.name.startsWith('_h_'));
  const isSection = SECTION_COLLECTIONS.includes(cname);

  // block ka text: purana "hidden: true" hata kar (sirf automatic khanon se),
  // zaroori "hidden" laga kar, aur madad ka jumla jor kar.
  const textOf = (b) => {
    let body = lines.slice(b.start, b.end);

    // Automatic khane chhupne nahi chahiye - client ko badalne ka mauqa mile.
    if (AUTO_FIELDS.includes(b.name)) {
      body = body.filter((l) => !/^\s{4}hidden:\s*true\s*$/.test(l));
    }

    const joined = body.join('\n');
    const extra = [];
    if (isSection && KEEP_HIDDEN_IN_SECTIONS.includes(b.name) && !/^\s{4}hidden:\s*true\s*$/m.test(joined)) {
      extra.push('    hidden: true');
    }
    const help = HELP[b.name];
    if (help && !/^\s{4}description:/m.test(joined)) {
      extra.push(`    description: ${JSON.stringify(help)}`);
      helpCount++;
    }
    return extra.length ? [body[0], ...extra, ...body.slice(1)] : body;
  };

  const autoNames = blocks.filter((b) => AUTO_FIELDS.includes(b.name)).map((b) => b.name);
  const keep = blocks.filter((b) => !AUTO_FIELDS.includes(b.name));
  const headings = headingsFor(cname);
  const headingBefore = new Map();
  for (const [before, label, collapsed] of headings) headingBefore.set(before, [label, collapsed]);

  const out = [];
  const pushHeading = (label, collapsed) => {
    out.push(`  - name: ${headingName(label)}`);
    out.push(`    label: ${JSON.stringify(label)}`);
    out.push('    type: heading');
    if (collapsed) out.push('    collapsed: true');
  };

  let autoPlaced = false;
  const placeAuto = () => {
    if (autoPlaced || !autoNames.length) return;
    autoPlaced = true;
    pushHeading(AUTO_HEADING, true);
    for (const name of autoNames) {
      const b = blocks.find((x) => x.name === name);
      out.push(...textOf(b));
      autoMoved++;
    }
  };

  for (const b of keep) {
    // automatic hissa SEO se thora pehle - taake aakhir mein content aaye
    if (b.name === 'seo') placeAuto();
    const h = headingBefore.get(b.name);
    if (h) pushHeading(h[0], h[1]);
    out.push(...textOf(b));
  }
  placeAuto(); // agar seo na ho to aakhir mein

  const from = allBlocks[0].start;
  const to = allBlocks[allBlocks.length - 1].end;
  // Agar nateeja bilkul wahi hai jo pehle se likha hai, to kuch na karein.
  if (lines.slice(from, to).join('\n') === out.join('\n')) { alreadyOk++; continue; }
  edits.push({ from, to, replacement: out });
  rebuilt++;
}

if (rebuilt) {
  note(`${WRITE ? 'bana' : 'banega'}: ${rebuilt} forms unwaan ke hisson mein, ${autoMoved} automatic khane band hisse mein, ${helpCount} madad ke jumle`);
  changed++;
} else {
  note(`   pehle se theek: forms ki tarteeb (${alreadyOk} collections)`);
  skipped++;
}

// ---------------------------------------------------------------- 5. defaults ki screen
const DEFAULTS_SECTIONS = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services', 'vehicles'];
const DEFAULTS_LABELS = {
  tours: 'Tours', trekking: 'Trekking', expeditions: 'Expeditions',
  'jeep-safaris': 'Jeep safaris', 'hunting-services': 'Hunting services', vehicles: 'Vehicles',
};

if (entries.some((e) => e.name === 'content_defaults')) {
  note('   pehle se theek: defaults wali screen');
  skipped++;
} else {
  const screen = [
    '',
    '- name: content_defaults',
    '  label: 19 — Default packing list & inclusions',
    '  type: file',
    '  path: src/_data/contentDefaults.json',
    '  operations:',
    '    delete: false',
    '    rename: false',
    '  fields:',
    '  - name: auto_fill',
    '    label: Fill these in automatically when a page leaves them empty',
    '    type: object',
    '    fields:',
    '    - name: packing_list',
    '      label: Packing list',
    '      type: boolean',
    '      default: true',
    '    - name: included',
    '      label: What is included',
    '      type: boolean',
    '      default: false',
    '      description: "Pehle neeche likhi list padh kar client se confirm karwa lein - yeh qeemat ka waada hai."',
    '    - name: excluded',
    '      label: What is not included',
    '      type: boolean',
    '      default: false',
    '      description: "Pehle neeche likhi list padh kar client se confirm karwa lein."',
    '  - name: sections',
    '    label: Default lists for each kind of journey',
    '    type: object',
    '    fields:',
  ];
  for (const s of DEFAULTS_SECTIONS) {
    screen.push(`    - name: ${s}`);
    screen.push(`      label: ${JSON.stringify(DEFAULTS_LABELS[s])}`);
    screen.push('      type: object');
    screen.push('      fields:');
    for (const [key, label] of [['packing_list', 'Packing list'], ['included', 'Included'], ['excluded', 'Not included']]) {
      screen.push(`      - name: ${key}`);
      screen.push(`        label: ${JSON.stringify(label)}`);
      screen.push('        type: string');
      screen.push('        list: true');
    }
  }
  screen.push('');
  edits.push({ from: lines.length, to: lines.length, replacement: screen });
  note(`${WRITE ? 'bana' : 'banega'}: nayi screen "19 — Default packing list & inclusions"`);
  changed++;
}

// ---------------------------------------------------------------- 6. build chain
const PKG = 'package.json';
if (!fs.existsSync(PKG)) {
  note('!! package.json nahi mila - autofill build chain mein nahi laga');
  problems++;
} else {
  const pkgText = fs.readFileSync(PKG, 'utf8');
  const pkg = JSON.parse(pkgText);
  const current = pkg.scripts?.['build:assets'] || '';
  if (!current) {
    note('!! package.json mein "build:assets" nahi mila');
    problems++;
  } else if (current.includes('autofill-content.mjs')) {
    note('   pehle se theek: autofill build chain mein');
    skipped++;
  } else {
    pkg.scripts['build:assets'] = `node tools/autofill-content.mjs && ${current}`;
    note(`${WRITE ? 'laga' : 'lagega'}: autofill build chain mein (build se pehle khane bhar dega)`);
    changed++;
    if (WRITE) {
      const nlPkg = pkgText.includes('\r\n') ? '\r\n' : '\n';
      fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2).replace(/\n/g, nlPkg) + nlPkg, 'utf8');
    }
  }
}

// ---------------------------------------------------------------- likhna
console.log(report.join('\n'));
console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);

if (problems) {
  console.log('Problem ki wajah se kuch nahi likha gaya.');
  process.exit(1);
}
if (!WRITE) {
  console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
  process.exit(0);
}
if (!changed) process.exit(0);

// Edits ko peeche se aage lagana, taake line numbers na hilen
edits.sort((a, b) => b.from - a.from);
let outLines = lines.slice();
for (const ed of edits) outLines.splice(ed.from, ed.to - ed.from, ...ed.replacement);

fs.writeFileSync(FILE, outLines.join(nl), 'utf8');
console.log(`${FILE} likh diya (${lines.length} -> ${outLines.length} lines).`);
