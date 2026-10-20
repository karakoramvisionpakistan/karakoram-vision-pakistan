// Checks CMS content BEFORE the site is built and explains problems in plain words.
//  - ERROR   (build stops): broken front matter (YAML), two pages with the same URL
//  - WARNING (build continues): missing title/summary, cover image file not found
// Usage: node tools/validate-content.mjs
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';

let yaml = null;
try { yaml = (await import('js-yaml')).default; } catch { /* optional */ }

const contentRoot = resolve('src/content');
const srcRoot = resolve('src');
const NEEDS_SUMMARY = new Set(['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services', 'vehicles', 'blog']);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});

const simpleParse = (front) => {            // fallback when js-yaml is missing
  const out = {};
  for (const line of front.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+):[ \t]*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2').replace(/^[>|][-+]?$/, 'x');
  }
  return out;
};

const errors = [];
const warnings = [];
const urls = new Map();

for (const file of walk(contentRoot)) {
  const rel = relative(process.cwd(), file);
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { warnings.push(`${rel}: no front matter block (--- ... ---) found.`); continue; }

  let data;
  try { data = yaml ? (yaml.load(m[1]) || {}) : simpleParse(m[1]); }
  catch (e) { errors.push(`${rel}: front matter is not valid. ${String(e.message).split('\n')[0]}`); continue; }

  const section = relative(contentRoot, file).split(sep)[0];
  const has = (k) => data[k] !== undefined && data[k] !== null && String(data[k]).trim() !== '';

  if (!has('title')) warnings.push(`${rel}: "title" is empty.`);
  if (NEEDS_SUMMARY.has(section) && !has('summary') && !has('answer_summary') && !has('description'))
    warnings.push(`${rel}: "summary" is empty (used for cards and Google).`);

  for (const key of ['cover_image', 'image', 'hero_image']) {
    const v = data[key];
    if (typeof v !== 'string' || !v.trim() || /^(https?:)?\/\//i.test(v) || v.startsWith('data:')) continue;
    const onDisk = join(srcRoot, v.replace(/^\/+/, '').split(/[?#]/)[0]);
    if (!existsSync(onDisk)) warnings.push(`${rel}: ${key} file not found: ${v}`);
  }

  if (has('published') && data.published === false) continue;   // unpublished pages don't need a unique URL
  if (typeof data.permalink === 'string') {
    const u = data.permalink.trim();
    if (urls.has(u)) errors.push(`${rel}: same URL (${u}) is already used by ${urls.get(u)}. Change the slug of one of them.`);
    else urls.set(u, rel);
  }
}

if (warnings.length) { console.log(`\nContent warnings (${warnings.length}) - site will still build:`); warnings.forEach((w) => console.log('  ! ' + w)); }
if (errors.length) { console.error(`\nContent ERRORS (${errors.length}) - fix these first:`); errors.forEach((e) => console.error('  X ' + e)); process.exit(1); }
console.log(`Content check OK${warnings.length ? ' (with warnings)' : ''}.`);