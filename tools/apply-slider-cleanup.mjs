// Slider files se woh khane nikalta hai jo autofill ne galti se daal diye thay.
//
// Slide sirf ek photo, heading aur text hai - us ka apna page nahi banta. Is
// liye slug, author, reviewed_by, seo wagera wahan bilkul fazool parte hain
// (aur CMS mein form ko lamba kar dete hain).
//
// Saath hi do chhoti kharabiyan bhi theek karta hai:
//   - "sections" mein ek hi naam do dafa (jis se slide do martaba chalti hai)
//   - khali unwaan wali slide par nishandahi (hatata nahi, sirf batata hai)
//
//   node tools/apply-slider-cleanup.mjs           -> sirf dikhata hai
//   node tools/apply-slider-cleanup.mjs --write   -> files badal deta hai
// Dobara chalane par kuch kharab nahi hota.
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const DIR = 'src/content/sliders';

// Yeh khane slide par kabhi kaam nahi aate - autofill ne daale thay.
const DROP = [
  'slug', 'author', 'reviewed_by', 'last_verified', 'answer_summary',
  'key_facts', 'sources', 'reviews', 'seo', 'duration_days',
  'departure_type', 'price_currency', 'cover_image_alt', 'cover_image',
  'cover_source', 'service_type', 'service_label', 'summary', 'permalink',
];

// Jo rehne chahiyein - sirf itminaan ke liye, taake agar kabhi DROP mein
// galti se koi zaroori naam aa jaye to script ruk jaye.
const KEEP = new Set([
  'title', 'heading', 'eyebrow', 'text', 'image', 'image_alt', 'fit', 'focus',
  'button_label', 'button_url', 'sections', 'order', 'published', 'date',
  'eleventyExcludeFromCollections',
]);
for (const k of DROP) {
  if (KEEP.has(k)) { console.log(`!! andaruni ghalti: "${k}" dono fehriston mein hai`); process.exit(1); }
}

if (!fs.existsSync(DIR)) {
  console.log(`MISSING FOLDER  ${DIR}`);
  process.exit(1);
}

// Front matter ko line-by-line dekhte hain. Indent-0 par "naam:" ek naya khana
// shuru karta hai; us ke neeche jo bhi indent wali lines hon woh usi ki hain.
function stripKeys(fm, keys) {
  const lines = fm.split('\n');
  const out = [];
  const removed = [];
  let dropping = null;

  for (const line of lines) {
    const top = /^([A-Za-z_][\w-]*):/.exec(line);
    if (top) {
      dropping = keys.includes(top[1]) ? top[1] : null;
      if (dropping) { removed.push(dropping); continue; }
      out.push(line);
      continue;
    }
    // indent wali ya khali line: jis khane ke neeche hai usi ke saath jati hai
    if (dropping && (line.trim() === '' || /^[\s-]/.test(line))) continue;
    dropping = null;
    out.push(line);
  }
  return { text: out.join('\n'), removed };
}

// sections: ek hi naam do dafa -> ek rakho
function dedupeSections(fm) {
  const lines = fm.split('\n');
  const at = lines.findIndex((l) => /^sections:/.test(l));
  if (at === -1) return { text: fm, removed: [] };

  // "sections: [a, b, a]" ek hi line mein
  const inline = /^sections:\s*\[(.*)\]\s*$/.exec(lines[at]);
  if (inline) {
    const items = inline[1].split(',').map((s) => s.trim()).filter(Boolean);
    const seen = [];
    const dupes = [];
    for (const it of items) (seen.includes(it) ? dupes : seen).push(it);
    if (!dupes.length) return { text: fm, removed: [] };
    lines[at] = `sections: [${seen.join(', ')}]`;
    return { text: lines.join('\n'), removed: dupes };
  }

  // "- naam" wali fehrist
  const keep = [lines[at]];
  const seen = [];
  const dupes = [];
  let i = at + 1;
  for (; i < lines.length; i++) {
    const item = /^\s*-\s*(.+?)\s*$/.exec(lines[i]);
    if (!item) break;
    const value = item[1].replace(/^["']|["']$/g, '');
    if (seen.includes(value)) { dupes.push(value); continue; }
    seen.push(value);
    keep.push(lines[i]);
  }
  if (!dupes.length) return { text: fm, removed: [] };
  return { text: [...lines.slice(0, at), ...keep, ...lines.slice(i)].join('\n'), removed: dupes };
}

const files = fs.readdirSync(DIR).filter((n) => n.endsWith('.md')).sort();
if (!files.length) { console.log(`${DIR} mein koi slide nahi hai.`); process.exit(0); }

let changed = 0, clean = 0;
const warnings = [];

for (const name of files) {
  const file = path.join(DIR, name);
  const raw = fs.readFileSync(file, 'utf8');
  const crlf = raw.includes('\r\n');
  const text = crlf ? raw.replace(/\r\n/g, '\n') : raw;

  const m = /^---\n([\s\S]*?)\n---(\n[\s\S]*)?$/.exec(text);
  if (!m) { warnings.push(`${name}: front matter samajh nahi aayi - haath se dekhein`); continue; }

  const body = m[2] || '\n';
  const a = stripKeys(m[1], DROP);
  const b = dedupeSections(a.text);
  const fm = b.text.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');

  // khali unwaan par nishandahi
  const title = /^title:\s*(.*)$/m.exec(fm);
  const titleValue = title ? title[1].trim().replace(/^["']|["']$/g, '') : '';
  if (!titleValue) warnings.push(`${name}: is slide ka unwaan khali hai - CMS mein naam dein ya slide hata dein`);

  const notes = [];
  if (a.removed.length) notes.push(`hataye: ${a.removed.join(', ')}`);
  if (b.removed.length) notes.push(`sections mein dohrao hataya: ${b.removed.join(', ')}`);

  if (!notes.length) { clean++; console.log(`   pehle se theek: ${name}`); continue; }

  console.log(`${WRITE ? 'badla' : 'badlega'}: ${name}  (${notes.join(' | ')})`);
  changed++;
  if (WRITE) {
    const out = `---\n${fm}\n---${body}`;
    fs.writeFileSync(file, crlf ? out.replace(/\n/g, '\r\n') : out, 'utf8');
  }
}

console.log(`\n${changed} ${WRITE ? 'files badal gayin' : 'files badlengi'}, ${clean} pehle se theek.`);
for (const w of warnings) console.log(`   dhyan dein -> ${w}`);
if (!WRITE && changed) console.log('\nAbhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
