// Code ke andar phansi hui likhai ki paimaish.
//
// KYUN
// Menu ke 26 page CMS se bahar hain kyunki un ki likhai seedha template ke
// andar likhi hui hai. Unhein CMS mein laane ka kaam har page par alag hoga -
// jis page par sirf ek unwaan aur do jumle hain woh chand minton ka kaam hai,
// aur jis par poora safha likha hua hai woh ghanton ka. Pehle yeh naap lena
// zaroori hai, warna waada ghalat ho jayega.
//
// Yeh script har page ki likhai alag kar ke ginti karti hai. Kuch badalti
// nahi.
//
//   node tools/scan-page-text.mjs
//   -> tools/_page-text.json
import fs from 'node:fs';

if (!fs.existsSync('tools/_menu-audit.json')) {
  console.log('Pehle "node tools/audit-menu-pages.mjs" chalayein.');
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync('tools/_menu-audit.json', 'utf8'));
const targets = [...new Set(
  audit.rows
    .filter((r) => r.file && !r.cms && /\.njk$/.test(r.file))
    .map((r) => r.file),
)];

// Template ke andar se woh alfaz nikalna jo waqai safhe par chhapte hain.
// Hukm ({% %}), qeematein ({{ }}), comment, script aur style - in mein se
// kuch bhi likhai nahi hai, is liye sab hata dete hain. Jo bachta hai woh
// wohi hai jo client ko dikhta hai.
function visibleText(src) {
  let t = src;
  if (t.startsWith('---')) {
    const end = t.indexOf('\n---', 3);
    if (end > -1) t = t.slice(end + 4);
  }
  t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  t = t.replace(/\{#[\s\S]*?#\}/g, ' ');
  t = t.replace(/\{%[\s\S]*?%\}/g, '\n');
  t = t.replace(/\{\{[\s\S]*?\}\}/g, ' \u0001 '); // yahan qeemat aati hai
  t = t.replace(/<[^>]+>/g, '\n');
  t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/gi, ' ');

  return t
    .split('\n')
    .map((s) => s.replace(/\u0001/g, '').trim())
    .filter((s) => s.length >= 3 && /[a-z]{3}/i.test(s));
}

// Front matter mein bhi likhai hoti hai (title, description) - woh pehle se
// alag hai, magar CMS mein phir bhi nahi. Us ki ginti alag rakhte hain.
function frontMatterText(src) {
  if (!src.startsWith('---')) return [];
  const end = src.indexOf('\n---', 3);
  if (end < 0) return [];
  return src.slice(3, end)
    .split('\n')
    .filter((l) => /^\s*(title|description|summary|heading|subtitle|intro|eyebrow)\s*:/i.test(l))
    .map((l) => l.trim());
}

const out = [];
for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const chunks = [...new Set(visibleText(src))];
  const words = chunks.join(' ').split(/\s+/).filter(Boolean).length;
  out.push({
    file,
    lines: src.split('\n').length,
    chunks: chunks.length,
    words,
    fm: frontMatterText(src),
    sample: chunks.slice(0, 12),
  });
}

out.sort((a, b) => b.words - a.words);

const band = (w) => (w === 0 ? 'khali' : w < 25 ? 'bohot thori' : w < 120 ? 'thori' : w < 400 ? 'kaafi' : 'bohot zyada');

console.log(`${out.length} page dekhe.\n`);
console.log('page'.padEnd(52) + 'alfaz'.padStart(7) + '  kitni likhai');
console.log('-'.repeat(52 + 7 + 16));
for (const r of out) {
  console.log(r.file.padEnd(52) + String(r.words).padStart(7) + '  ' + band(r.words));
}

const total = out.reduce((n, r) => n + r.words, 0);
const counts = {};
for (const r of out) counts[band(r.words)] = (counts[band(r.words)] || 0) + 1;
console.log(`\nkul alfaz: ${total}`);
console.log('ginti: ' + Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', '));

console.log('\nMisal ke tor par sab se zyada likhai wale do page:\n');
for (const r of out.slice(0, 2)) {
  console.log(`--- ${r.file}  (${r.words} alfaz)`);
  if (r.fm.length) console.log('    front matter: ' + r.fm.join(' | '));
  for (const s of r.sample) console.log('      ' + (s.length > 100 ? `${s.slice(0, 100)}…` : s));
  console.log('');
}

fs.writeFileSync('tools/_page-text.json', JSON.stringify(out, null, 2), 'utf8');
console.log('tafseel likh di: tools/_page-text.json');
console.log('Yeh file attach kar dein.');
