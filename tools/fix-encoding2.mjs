// Kharab hue haroof theek karta hai - chahe ek dafa kharab hue hon ya kai dafa.
//
// KYA HUA THA
// File UTF-8 mein likhi hui thi. PowerShell 5 ne usey apni purani Windows
// encoding (cp1252) samajh kar parha, aur phir UTF-8 mein wapas likh di. Har
// khaas harf teen ajeeb haroof ban gaya:
//
//   ★ -> â˜…        — -> â€"
//
// Aur agar yehi amal DO dafa hua, to har harf chhe haroof ban gaya:
//
//   ⚡ -> Ã¢Å¡Â¡     › -> Ã¢â‚¬Âº
//
// Purana script sirf ek tah utarta tha. Do tah wali file mein, ek tah utarne
// ke baad bhi kharabi baqi rehti thi, to woh hifazat ke tor par file ko chhorh
// deta tha. Isi liye menu.json jahan ka tahan raha.
//
// AB KYA HOTA HAI
// Tah ba tah utarta hai - jab tak koi kharabi baqi na rahe. Har tah ke baad
// jaanch:
//   * koi harf zaya to nahi hua (� ka nishan)?
//   * file abhi bhi parhi ja rahi hai (JSON / YAML)?
// Koi bhi jaanch naakaam ho to usi jagah ruk jata hai aur pichli haalat rakhta
// hai. Zyada utarna bhi utna hi khatarnak hai jitna kam utarna.
//
//   node tools/fix-encoding2.mjs           -> sirf batata hai
//   node tools/fix-encoding2.mjs --write   -> theek kar deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');

// js-yaml website ke packages mein hota hai. Agar kisi wajah se na mile to
// YAML ki jaanch nahi ho paayegi - us soorat mein batayenge, magar "file
// kharab hai" na samjhenge.
let YAML = null;
try { YAML = require('js-yaml'); } catch {}

// cp1252 mein 0x80-0x9F par jo haroof hain - sirf yahi latin1 se mukhtalif hain
const CP1252 = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85,
  '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A,
  '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E, '‘': 0x91, '’': 0x92,
  '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C,
  'ž': 0x9E, 'Ÿ': 0x9F,
};

// Kharabi ki nishani: "â" ya "Ã" ke baad cp1252 wala koi harf
const BROKEN = /[âÃ][\u0080-ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/;
const countBroken = (t) => (t.match(new RegExp(BROKEN.source, 'g')) || []).length;

// Ek tah utaro: har harf wapas apne cp1252 byte mein, phir un bytes ko UTF-8
// ki tarah parho.
function peel(text) {
  const bytes = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xFF) { bytes.push(cp); continue; }
    const mapped = CP1252[ch];
    // Aisa harf jo cp1252 mein tha hi nahi - matlab yeh hissa aur kharab nahi
    // hua. Aage barhna khatarnak hai.
    if (mapped === undefined) return null;
    bytes.push(mapped);
  }
  return Buffer.from(bytes).toString('utf8');
}

function parses(file, text) {
  try {
    if (file.endsWith('.json')) { JSON.parse(text); return true; }
    if (/\.ya?ml$/.test(file)) {
      if (!YAML) return true; // jaanch nahi ho saki - neechay iska zikr hai
      YAML.load(text);
      return true;
    }
    return true;
  } catch (e) {
    return String(e.message).split('\n')[0];
  }
}

// Tah ba tah, hifazat ke sath.
function repairFully(file, original) {
  let cur = original;
  let tahein = 0;
  const notes = [];

  for (let i = 0; i < 6; i++) {
    if (!BROKEN.test(cur)) break;

    const next = peel(cur);
    if (next === null) { notes.push('aage nahi barh sakte: aise haroof aa gaye jo cp1252 mein nahi thay'); break; }
    if (next.includes('�')) { notes.push('aage nahi barhe: agli tah mein haroof zaya ho rahe thay'); break; }
    if (countBroken(next) >= countBroken(cur)) { notes.push('aage nahi barhe: kharabi kam nahi ho rahi thi'); break; }

    const bad = parses(file, next);
    if (bad !== true) { notes.push(`aage nahi barhe: file parhi nahi ja rahi thi (${bad})`); break; }

    cur = next;
    tahein++;
  }

  return { text: cur, tahein, notes, baqi: countBroken(cur) };
}

// ----------------------------------------------------------------- files
function dataJsonFiles() {
  const dir = 'src/_data';
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f).replace(/\\/g, '/'));
}

const FILES = ['.pages.yml', ...dataJsonFiles()];

let fixed = 0, clean = 0, problems = 0, partial = 0;

for (const file of FILES) {
  if (!fs.existsSync(file)) continue;

  const original = fs.readFileSync(file, 'utf8');
  if (!BROKEN.test(original)) { clean++; continue; }

  const samplesBefore = [...new Set(original.match(/[âÃ][^\x00-\x7F]{1,5}/g) || [])].slice(0, 6);
  const res = repairFully(file, original);

  if (res.text === original) {
    console.log(`!! ${file}: kharabi hai magar theek nahi kar saka`);
    for (const n of res.notes) console.log(`   ${n}`);
    problems++;
    continue;
  }

  console.log(`${WRITE ? 'theek kiya' : 'theek hoga'}: ${file}`);
  console.log(`   ${res.tahein} tah utari, ${countBroken(original)} jagah`);
  for (const b of samplesBefore) {
    const after = repairFully(file, b).text;
    if (after !== b) console.log(`   ${b}  ->  ${after}`);
  }
  if (res.baqi) {
    console.log(`   dhyan dein: ${res.baqi} jagah abhi bhi kharab lag rahi hai`);
    for (const n of res.notes) console.log(`   ${n}`);
    partial++;
  }

  fixed++;
  if (WRITE) fs.writeFileSync(file, res.text, 'utf8');
}

// ----------------------------------------------------------------- baqi jagah talash
// Sirf batata hai - khud kuch nahi badalta. Taake pata chale ke kahin aur to
// yeh kharabi nahi phaili.
const EXTS = new Set(['.md', '.njk', '.json', '.yml', '.yaml', '.js', '.mjs', '.css', '.html']);
const SKIP = new Set(['node_modules', '_site', '.git', '.cache']);
const SELF = path.basename(new URL(import.meta.url).pathname);
const elsewhere = [];

(function scan(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) { scan(p); continue; }
    if (!EXTS.has(path.extname(e.name))) continue;
    if (FILES.includes(p.replace(/^\.\//, ''))) continue;
    // Yeh script khud: is ke comments mein kharab haroof ki misalein hain.
    if (e.name === SELF || /^fix-encoding/.test(e.name)) continue;
    try {
      const t = fs.readFileSync(p, 'utf8');
      const n = countBroken(t);
      if (n) elsewhere.push([p, n]);
    } catch {}
  }
})('.');

if (elsewhere.length) {
  console.log('\nIn files mein bhi aisi hi kharabi nazar aayi (inhein haath nahi lagaya):');
  for (const [p, n] of elsewhere.slice(0, 20)) console.log(`   ${p}  (${n} jagah)`);
  if (elsewhere.length > 20) console.log(`   ... aur ${elsewhere.length - 20} files`);
}

if (!YAML) console.log('\nNote: js-yaml nahi mila, is liye .pages.yml ki jaanch nahi ho saki.');

console.log(`\n${fixed} ${WRITE ? 'files theek hui' : 'files theek hongi'}, ${clean} pehle se theek, ${problems} problem.`);
if (partial) console.log('Kuch files mein thori kharabi baqi hai - oopar dekh lein.');
if (!WRITE && fixed) console.log('Abhi kuch change nahi hua. Theek karne ke liye --write ke saath chalayein.');
