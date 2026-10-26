// Menu ko pages ke saath jor deta hai.
//
// Ab tak menu aur pages alag alag chalte thay. Client koi page chhupa deta to
// us ka menu khana wahin ka wahin rehta - ek aisa link jo kahin nahi le jata.
// Client ko yaad rakhna parta ke dono jagah kaam kare, aur yahi bhoola jata hai.
//
// Ab menu khud dekh leta hai: jo page chhupa hua ho, us ka khana menu se gayab
// ho jata hai. menu.json mein kuch nahi badalta - khana wahin likha rehta hai,
// bas dikhta nahi. Page wapas chalu karte hi link bhi lout aata hai.
//
// Agar kisi khane ke neechay aur khanay hon aur sirf us ka apna page chhupa ho,
// to woh khana rehta hai (apne andar ke links ke saath), bas khud click karne
// layak nahi rehta. Aur agar us ke neechay ke sab khanay bhi chhup jayein, to
// poora khana gayab ho jata hai - khali menu nahi rehta.
//
// Sath mein: tools/page-control.mjs ab har build mein un links ki fehrist
// nikalta hai jo kisi maujood page par nahi jate.
//
// PEHLE tools/page-control.mjs ka naya version copy karein.
//
//   node tools/apply-menu-link.mjs           -> sirf dikhata hai
//   node tools/apply-menu-link.mjs --write   -> files badal deta hai
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

function once(text, old, neu, what) {
  const parts = text.split(old);
  if (parts.length === 1) throw new Error(`${what}: yeh hissa nahi mila`);
  if (parts.length > 2) throw new Error(`${what}: yeh hissa ek se zyada dafa hai`);
  return parts.join(neu);
}

// ---------------------------------------------- 0. naya tool mojood hai?
if (!fs.existsSync('tools/page-control.mjs')) {
  console.log('MISSING FILE  tools/page-control.mjs');
  process.exit(1);
}
if (!fs.readFileSync('tools/page-control.mjs', 'utf8').includes('hiddenUrls')) {
  console.log('!! tools/page-control.mjs ka naya version copy nahi hua.');
  console.log('   Us ke baghair menu ko pata nahi chalega ke kaunse page chhupe hue hain.');
  process.exit(1);
}
console.log('   theek: page-control.mjs ka naya version mojood hai');

// ---------------------------------------------- 1. Eleventy filter
patch('eleventy.config.js', 'Eleventy: liveMenu filter', (t) => {
  if (t.includes('"liveMenu"')) return null;

  const nl = nlOf(t);
  let out = t;

  if (!out.includes('__readFileForSizes')) {
    out = `import { readFileSync as __readFileForSizes } from "node:fs";${nl}${out}`;
  }

  const anchor = '  eleventyConfig.addFilter("json", v => JSON.stringify(v));';
  if (!out.includes(anchor)) throw new Error('eleventy.config.js mein json filter wali line nahi mili');

  const block = [
    '  // Menu mein se un khanon ko nikal deta hai jin ke page chhupaye gaye hain.',
    '  // menu.json mein kuch nahi badalta - khana wahin likha rehta hai, bas dikhta',
    '  // nahi. Page wapas chalu karte hi link bhi lout aata hai.',
    '  const __hiddenUrls = (() => {',
    '    try {',
    '      const c = JSON.parse(__readFileForSizes("src/_data/pageControl.json", "utf8"));',
    '      return new Set(c.hiddenUrls || []);',
    '    } catch { return new Set(); }',
    '  })();',
    '  eleventyConfig.addFilter("liveMenu", function liveMenu(items) {',
    '    return (items || []).map((item) => {',
    '      const kids = item.children ? liveMenu(item.children) : null;',
    '      const dead = item.url && __hiddenUrls.has(item.url);',
    '      // Page bhi chhupa hua aur andar bhi kuch nahi bacha - poora khana hata do',
    '      if (dead && (!kids || !kids.length)) return null;',
    '      const out = { ...item };',
    '      if (dead) delete out.url;            // khana rehta hai, click nahi hota',
    '      if (kids) { if (kids.length) out.children = kids; else delete out.children; }',
    '      return out;',
    '    }).filter(Boolean);',
    '  });',
    anchor,
  ].join(nl);

  return out.replace(anchor, block);
});

// ---------------------------------------------- 2. header menu filter se guzre
patch('src/_includes/components/header.njk', 'Header: menu chhupe hue pages chhor de', (t) => {
  if (t.includes('liveMenuItems')) return null;
  const nl = nlOf(t);
  let out = t;

  out = once(out,
    '  {% if h.navigation.enabled !== false %}',
    [
      '  {% if h.navigation.enabled !== false %}',
      '  {# Jo pages CMS se chhupaye gaye hain, un ke menu khanay yahan nikal jate hain. #}',
      '  {% set liveMenuItems = menu.items | liveMenu %}',
    ].join(nl),
    'menu ki chhanti');

  out = once(out, '{% for item in menu.items %}', '{% for item in liveMenuItems %}', 'bari screen ka menu');
  out = once(out, '{{ mobileChildren(menu.items) }}', '{{ mobileChildren(liveMenuItems) }}', 'mobile ka menu');

  return out;
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
