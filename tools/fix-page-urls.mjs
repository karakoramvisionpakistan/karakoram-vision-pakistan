// Page ke URL (slug) ko search-friendly aur sahi spelling par le jata hai.
//   node tools/fix-page-urls.mjs           -> sirf dikhata hai, change nahi karta
//   node tools/fix-page-urls.mjs --write   -> files badal deta hai
// Collection pages (tours/trekking/expeditions/jeep-safaris/hunting-services)
// ka permalink `slug` se khud banta hai, is liye yahan slug badla jata hai.
// `pages/` folder ki files ka permalink seedha likha jata hai.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

// file -> naya slug (ya pages/ ke liye naya permalink)
const SLUGS = {
  'src/content/trekking/biafo-hisper-trek.md': 'biafo-hispar-trek',
  'src/content/trekking/thalle-la-trek.md': 'thalle-la-trek',
  'src/content/trekking/fairy-meadows-nanga-parbat-base-camp-trek.md': 'fairy-meadows-base-camp-trek',
  'src/content/jeep-safaris/deosai-jeep-safari.md': 'deosai-jeep-safari',
  'src/content/jeep-safaris/shigar-basho-khaplu-jeep-adventure.md': 'shigar-basho-khaplu-jeep-safari',
  'src/content/expeditions/ghasherbrum-1.md': 'gasherbrum-i-expedition',
  'src/content/hunting-services/permit-mountain-expedition-logistics.md': 'ibex-markhor-hunting-permits',
};

const PAGE_PERMALINKS = {
  'src/content/pages/family-trip.md': '/family-tours/',
};

const setField = (text, key, value) => {
  const rx = new RegExp(`^(${key}:[ \\t]*)(["']?)(.*?)\\2[ \\t]*(\\r?)$`, 'm');
  if (rx.test(text)) return text.replace(rx, (a, k, q, v, cr) => `${k}${value}${cr}`);
  return text.replace(/^(title:.*)$/m, (line) => `${line.replace(/\r$/, '')}\n${key}: ${value}`);
};

const get = (text, key) => {
  const m = text.match(new RegExp(`^${key}:[ \\t]*(["']?)(.+?)\\1[ \\t]*\\r?$`, 'm'));
  return m ? m[2].trim() : '';
};

let changed = 0, same = 0, missing = 0;

for (const [file, slug] of Object.entries(SLUGS)) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); missing++; continue; }
  let text = fs.readFileSync(file, 'utf8');
  const section = file.split('/')[2];
  const oldSlug = get(text, 'slug');
  if (oldSlug === slug) { same++; continue; }
  console.log(`${file}\n   - /${section}/${oldSlug}/\n   + /${section}/${slug}/`);
  changed++;
  if (WRITE) {
    text = setField(text, 'slug', slug);
    text = setField(text, 'permalink', `/${section}/${slug}/`);
    fs.writeFileSync(file, text, 'utf8');
  }
}

for (const [file, permalink] of Object.entries(PAGE_PERMALINKS)) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); missing++; continue; }
  let text = fs.readFileSync(file, 'utf8');
  const old = get(text, 'permalink');
  if (old === permalink) { same++; continue; }
  console.log(`${file}\n   - ${old}\n   + ${permalink}`);
  changed++;
  if (WRITE) {
    text = setField(text, 'permalink', permalink);
    text = setField(text, 'slug', permalink.replace(/^\/|\/$/g, ''));
    fs.writeFileSync(file, text, 'utf8');
  }
}

console.log(`\n${changed} URL ${WRITE ? 'badle' : 'badlenge'}, ${same} pehle se theek, ${missing} problem.`);
if (!WRITE) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
