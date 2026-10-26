// Kharab hue haroof theek karta hai.
//
// KYA HUA THA
// File UTF-8 mein likhi hui thi. PowerShell 5 ne usey apni purani Windows
// encoding (cp1252) samajh kar parha, aur phir woh UTF-8 mein wapas likh di
// gayi. Natija: har khaas harf teen ajeeb haroof ban gaya -
//
//   —  (em dash)  ->  â€"
//   ★  (sitara)   ->  â˜…
//
// YEH WAPAS KAISE HOTA HAI
// Kharabi bilkul yaksan hai, is liye ulat-pher mumkin hai: har harf ko wapas
// us ke cp1252 byte mein badlo, aur un bytes ko UTF-8 ki tarah parho. Asal
// haroof wapas aa jate hain.
//
// HIFAZAT
// Theek karne ke baad file ko parh kar dekha jata hai - YAML sahi hai? JSON
// sahi hai? Agar kuch bhi gadbad ho to file ko haath nahi lagaya jata.
//
//   node tools/fix-encoding.mjs           -> sirf batata hai
//   node tools/fix-encoding.mjs --write   -> theek kar deta hai
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

const FILES = ['.pages.yml', 'src/_data/menu.json'];

// cp1252 mein 0x80-0x9F par jo haroof hain - sirf yahi latin1 se mukhtalif hain
const CP1252 = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85,
  '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A,
  '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E, '‘': 0x91, '’': 0x92,
  '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C,
  'ž': 0x9E, 'Ÿ': 0x9F,
};

// Kharabi ki nishani: "â" ke baad cp1252 wala harf
const BROKEN = /â[\u0080-ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]|Ã[\u0080-¿]/;

function repair(text) {
  const bytes = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xFF) { bytes.push(cp); continue; }
    const mapped = CP1252[ch];
    // Aisa harf jo cp1252 mein tha hi nahi - matlab yeh hissa dohra kharab
    // nahi hua. Aise mein kuch na karo, warna sahi harf bhi bigar jayega.
    if (mapped === undefined) return null;
    bytes.push(mapped);
  }
  return Buffer.from(bytes).toString('utf8');
}

function parses(file, text) {
  try {
    if (file.endsWith('.json')) { JSON.parse(text); return true; }
    if (/\.ya?ml$/.test(file)) {
      // js-yaml website ke packages mein maujood hai
      const yaml = require('js-yaml');
      yaml.load(text);
      return true;
    }
    return true;
  } catch (e) {
    console.log(`   (parh nahi saka: ${String(e.message).split('\n')[0]})`);
    return false;
  }
}

// ESM mein require banane ke liye
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let fixed = 0, clean = 0, problems = 0;

for (const file of FILES) {
  if (!fs.existsSync(file)) { console.log(`   nahi mili: ${file}`); continue; }

  const text = fs.readFileSync(file, 'utf8');
  if (!BROKEN.test(text)) { console.log(`   pehle se theek: ${file}`); clean++; continue; }

  const before = (text.match(/â[^\x00-\x7F]{1,2}|Ã[^\x00-\x7F]/g) || []);
  const after = repair(text);

  if (after === null) {
    console.log(`!! ${file}: is mein aise haroof bhi hain jo kharab nahi hue - haath nahi lagaya`);
    problems++;
    continue;
  }
  if (BROKEN.test(after)) {
    console.log(`!! ${file}: theek karne ke baad bhi kharabi baqi hai - haath nahi lagaya`);
    problems++;
    continue;
  }
  if (!parses(file, after)) {
    console.log(`!! ${file}: theek karne ke baad file parhi nahi ja rahi - haath nahi lagaya`);
    problems++;
    continue;
  }

  console.log(`${WRITE ? 'theek kiya' : 'theek hoga'}: ${file}  (${before.length} jagah)`);
  const show = [...new Set(before)].slice(0, 6);
  for (const b of show) {
    const good = repair(b);
    console.log(`   ${b}  ->  ${good}`);
  }
  fixed++;
  if (WRITE) fs.writeFileSync(file, after, 'utf8');
}

console.log(`\n${fixed} ${WRITE ? 'files theek hui' : 'files theek hongi'}, ${clean} pehle se theek, ${problems} problem.`);
if (!WRITE && fixed) console.log('Abhi kuch change nahi hua. Theek karne ke liye --write ke saath chalayein.');
