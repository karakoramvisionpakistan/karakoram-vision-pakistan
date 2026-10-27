// Jo pages CMS se bahar hain, un sab ka code ek file mein jama kar deta hai.
//
// KYUN
// 26 files alag alag bhejna takleef deh hai. Yeh sab bohot chhoti hain - sab
// milakar bhi ek chhoti si file banti hai. Ek hi file gaseet dena asaan hai.
//
// Kuch badalta nahi - sirf parhta hai.
//
//   node tools/collect-pages.mjs
//   -> tools/_pages-dump.txt
import fs from 'node:fs';

if (!fs.existsSync('tools/_menu-audit.json')) {
  console.log('Pehle "node tools/audit-menu-pages.mjs" chalayein.');
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync('tools/_menu-audit.json', 'utf8'));
const files = [...new Set(
  audit.rows.filter((r) => r.file && !r.cms && /\.njk$/.test(r.file)).map((r) => r.file),
)].sort();

const parts = [];
let total = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  total += src.length;
  parts.push(`\n===== FILE: ${f} =====\n${src}`);
}

fs.writeFileSync('tools/_pages-dump.txt', parts.join('\n'), 'utf8');

console.log(`${parts.length} files jama kar di.`);
console.log(`kul ${Math.round(total / 1024)} KB`);
console.log('\nlikh di: tools/_pages-dump.txt');
console.log('Yeh ek file attach kar dein.');
