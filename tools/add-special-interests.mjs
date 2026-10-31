#!/usr/bin/env node
/**
 * add-special-interests.mjs   (website ke folder mein)
 *
 * Special Interests AUR Holiday Types — dono ke kai sub-menu abhi search ke
 * natije par jate hain, un ka apna safha nahi:
 *
 *   Special Interests: Cycle Touring, Eco Tourism, Motorcycle Touring,
 *                      Mountain Passes, Festivals of Pakistan,
 *                      Photography Tours, Ski & Winter Adventures
 *   Holiday Types:     Camping, Family Holidays, Road Trips
 *
 * Yeh un ke asal safhe banwata hai, aur journeys un mein KHUD BA KHUD aati
 * hain — koi naya dropdown nahi, kuch chunna nahi paRta.
 *
 * Faisla unwaan, tags aur categories se hota hai. Poora mazmoon jaan boojh
 * kar nahi dekha jata: warna jis safhe mein kahin guzarte hue "bicycle" ka
 * zikr aa gaya woh bhi Cycle Touring mein ghus jata — wahi kharabi jo
 * best_seller mein thi, jahan har entry best seller ban gayi thi.
 *
 * Isi tarah "mountain", "trip", "holiday" jaise aam lafz nazar andaaz hote
 * hain, warna har trek Mountain Passes mein chala jata.
 *
 * Kuch na pakRa jaye to uske Tags mein woh lafz likh dena kaafi hai.
 *
 *   node tools/add-special-interests.mjs            -> sirf dekhna
 *   node tools/add-special-interests.mjs --write    -> save karna
 *
 * Iske baad asal kaam:
 *   node tools/build-menu-sections.mjs --write
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= 1) builder ==== */

console.log('\n1) tools/build-menu-sections.mjs — safhe banwana');

const GEN = path.join(ROOT, 'tools', 'build-menu-sections.mjs');
let gen = read(GEN);
if (!gen) { console.log('XX  build-menu-sections.mjs nahi mili.'); process.exit(1); }

if (gen.includes("'special-interests': 'Special Interests'")) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const steps = [];
  const apply = (what, find, to) => {
    if (!gen.includes(find)) { console.log('   XX  nahi mila: ' + what); process.exit(1); }
    gen = gen.replace(find, to);
    steps.push(what);
  };

  apply('Special Interests aur Holiday Types ko fehrist mein shaamil karna',
    "  'hunting-services': 'Hunting Services',\n};",
    "  'hunting-services': 'Hunting Services',\n" +
    "  'special-interests': 'Special Interests',\n" +
    "  'holiday-types': 'Holiday Types',\n};"
  );

  apply('in safhon par service ki qaid na lagana',
    'service_type: ${service}\nstructured_filter: ${sec.slug}',
    "${(service === 'special-interests' || service === 'holiday-types') ? '' : 'service_type: ' + service + '\\n'}structured_filter: ${sec.slug}"
  );

  apply('bina collection wali service ko chhoRna',
    '  const collName = COLLECTION_OF[service];\n  const coll = (doc.content || []).find((c) => c.name === collName);',
    '  const collName = COLLECTION_OF[service];\n  if (!collName) continue;   // in ki apni koi collection nahi\n  const coll = (doc.content || []).find((c) => c.name === collName);'
  );

  for (const s of steps) console.log('   ->  ' + s);
  writes.push({ file: GEN, text: gen, bak: true });
}

/* ======================================================= 2) auto ======= */

console.log('\n2) generator — khud ba khud shaamil hona');

const CAT = path.join(ROOT, 'tools', 'generate_runtime_catalog.mjs');
let cat = read(CAT);
if (!cat) { console.log('XX  generate_runtime_catalog.mjs nahi mili.'); process.exit(1); }

if (cat.includes('autoSections')) {
  console.log('   OK  pehle se laga hua hai.');
} else {
  const ANCHOR = 'const sectionLookup = (() => {';
  if (!cat.includes(ANCHOR)) {
    console.log('   XX  sectionLookup nahi mila — pehle build-menu-sections chalayein.');
    process.exit(1);
  }

  const TABLE = `const autoSections = (() => {
  // Special Interests aur Holiday Types ke woh sections jin mein journeys
  // khud ba khud aati hain. Har ek ke pehchan wale alfaaz.
  const WORDS = {
    'cycle-touring': ['cycle', 'cycling', 'bicycle', 'bike', 'biking'],
    'eco-tourism': ['eco', 'ecotourism', 'sustainable', 'responsible'],
    'motorcycle-touring': ['motorcycle', 'motorbike', 'motorcycling'],
    'mountain-passes': ['pass', 'passes', 'khunjerab', 'babusar', 'shandur', 'gondogoro', 'thalle', 'shimshal'],
    'festivals-of-pakistan': ['festival', 'festivals', 'polo', 'kalash', 'jashn'],
    'photography-tours': ['photography', 'photo', 'photographer'],
    'ski-winter-adventures': ['ski', 'skiing', 'snowboard', 'winter', 'snow'],
    'camping': ['camp', 'camping', 'campsite', 'tented'],
    'family-holidays': ['family', 'families', 'kids', 'children'],
    'road-trips': ['road', 'roadtrip', 'highway', 'kkh', 'overland', 'drive', 'driving'],
  };
  // Aam lafz jo har safhe par mil jate hain — in par koi faisla nahi hota,
  // warna har trek "Mountain Passes" mein chala jata.
  const SKIP = [
    'tour', 'tours', 'touring', 'trip', 'trips', 'holiday', 'holidays',
    'tourism', 'adventure', 'adventures', 'mountain', 'mountains',
    'pakistan', 'and', 'the', 'of',
  ];
  try {
    const raw = fs.readFileSync(path.join(root, 'src', '_data', 'menuSections.json'), 'utf8');
    const all = JSON.parse(raw);
    const list = [].concat(all['special-interests'] || [], all['holiday-types'] || []);
    return list.map((s) => {
      const fromLabel = String(s.label).toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ').split(' ')
        .filter((w) => w.length > 3 && !SKIP.includes(w));
      return { slug: s.slug, words: [...new Set([...(WORDS[s.slug] || []), ...fromLabel])] };
    });
  } catch {
    return [];
  }
})();

`;
  cat = cat.replace(ANCHOR, TABLE + ANCHOR);

  const OLD_SEC = `    const sections = hasChoice ? sectionsChosen : [
      fixedDeparture && 'fixed-departures',
      bestSeller && 'best-sellers',
      k2Trek && 'k2-treks',
      culturalTour && 'cultural-tours',
      peak8000 && '8000m-peaks',
    ].filter(Boolean);`;

  const NEW_SEC = OLD_SEC + `

    // Special Interests aur Holiday Types khud ba khud. Sirf unwaan, tags
    // aur categories — poora mazmoon nahi, warna har safha har jagah ghus jata.
    const autoHaystack = normalize([data.title, tagsText, categoriesText].join(' ')).split(' ');
    for (const auto of autoSections) {
      if (auto.words.some((w) => autoHaystack.includes(w)) && !sections.includes(auto.slug)) {
        sections.push(auto.slug);
      }
    }`;

  if (!cat.includes(OLD_SEC)) {
    console.log('   XX  sections wala hissa nahi mila — pehle fix-toggles-honour chalayein.');
    process.exit(1);
  }
  cat = cat.replace(OLD_SEC, NEW_SEC);

  writes.push({ file: CAT, text: cat, bak: true });
  console.log('   ->  unwaan, tags aur categories dekh kar khud shaamil hogi.');
}

/* ======================================================= 3) menu tree == */

console.log('\n3) eleventy.config.js — menu ka teesra darja');

const CFG = path.join(ROOT, 'eleventy.config.js');
let cfg = read(CFG);
if (!cfg) { console.log('XX  eleventy.config.js nahi mili.'); process.exit(1); }

const OLD_M = '.filter((c) => matches(c, sec.service, sec.slug))';
const NEW_M = '.filter((c) => matches(c, (sec.service === "special-interests" || sec.service === "holiday-types") ? "" : sec.service, sec.slug))';

if (cfg.includes('holiday-types')) console.log('   OK  pehle se laga hua hai.');
else if (!cfg.includes(OLD_M)) { console.log('   XX  menuWithJourneys ka hissa nahi mila.'); process.exit(1); }
else {
  cfg = cfg.replace(OLD_M, NEW_M);
  writes.push({ file: CFG, text: cfg, bak: true });
  console.log('   ->  in ke neeche har qism ki journey aa sakegi.');
}

/* ======================================================= 4) noindex ==== */

console.log('\n4) Khali safhe Google se chhupe rahein');

const SAMPLE = read(path.join(ROOT, 'src', 'tours', 'tours.11tydata.js'));
if (!SAMPLE) {
  console.log('   !   src/tours/tours.11tydata.js nahi mili — pehle finish-seo-and-sync chalayein.');
} else {
  for (const dir of ['special-interests', 'holiday-types']) {
    const DEST = path.join(ROOT, 'src', dir, `${dir}.11tydata.js`);
    if (read(DEST) === SAMPLE) console.log('   OK  ' + dir + ': pehle se hai.');
    else { writes.push({ file: DEST, text: SAMPLE }); console.log('   ->  src/' + dir + '/' + dir + '.11tydata.js'); }
  }
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/add-special-interests.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  if (w.bak && fs.existsSync(w.file) && !fs.existsSync(w.file + '.bak13')) fs.copyFileSync(w.file, w.file + '.bak13');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}

console.log('\nAb asal kaam:');
console.log('   node tools/build-menu-sections.mjs --write');
console.log('   npm run build');
