// Menu ke chhupe hue khane dhoondta hai aur wapas dikha deta hai.
//
// KYUN
// Menu ke har khane par ek "chhupao" ka switch tha. Woh page ko band nahi
// karta tha - sirf navbar se gayab kar deta tha. Nateeja yeh ke page website
// par mojood rehta, Google mein bhi, magar menu mein nazar na aata. Yeh
// confusion paida karta hai, is liye woh switch hata diya ja raha hai.
//
// Switch hatane se PEHLE yeh script chalani zaroori hai. Warna jo khane
// chhupe hue hain woh chhupe hi reh jayenge aur unhein wapas lane ka koi
// raasta nahi bachega.
//
//   node tools/fix-menu-visibility.mjs           -> sirf batata hai
//   node tools/fix-menu-visibility.mjs --write   -> sab wapas dikha deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const FILE = 'src/_data/menu.json';

if (!fs.existsSync(FILE)) {
  console.log(`${FILE} nahi mili. Website wale folder mein chalayein.`);
  process.exit(1);
}

const raw = fs.readFileSync(FILE, 'utf8');
let menu;
try { menu = JSON.parse(raw); }
catch (e) { console.log(`menu.json parhi nahi ja rahi: ${e.message}`); process.exit(1); }

const hidden = [];

// Poore darakht mein talash. "enabled: false" ka matlab hai chhupa hua.
(function walk(list, trail) {
  for (const item of list || []) {
    const label = String(item.label || '(bina naam)');
    if (item.enabled === false) {
      hidden.push({ item, label, trail: [...trail], url: item.url || '' });
    }
    walk(item.children, [...trail, label]);
  }
})(menu.items, []);

if (!hidden.length) {
  console.log('Koi khana chhupa hua nahi - menu poora nazar aa raha hai.');
  process.exit(0);
}

console.log(`${hidden.length} khane chhupe hue hain:\n`);
for (const h of hidden) {
  const where = h.trail.length ? `${h.trail.join(' > ')} > ` : '';
  console.log(`   ${where}${h.label}`);
  console.log(`      ${h.url || '(koi link nahi)'}`);
}

if (!WRITE) {
  console.log('\nAbhi kuch change nahi hua.');
  console.log('Sab wapas dikhane ke liye --write ke saath chalayein.');
  process.exit(0);
}

// Wapas dikhao: "enabled" ka khana hata dete hain, kyunki uske baghair
// khana default taur par nazar aata hai.
for (const h of hidden) delete h.item.enabled;

const out = `${JSON.stringify(menu, null, 2)}\n`;
JSON.parse(out); // aakhri jaanch - likhne se pehle
fs.writeFileSync(FILE, out, 'utf8');

console.log(`\n${hidden.length} khane wapas dikha diye.`);
console.log('Ab "npm run build" chala kar push kar dein.');
