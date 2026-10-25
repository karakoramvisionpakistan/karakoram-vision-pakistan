// Fully automatic permalinks for CMS content.
//
// Editors never need to type a permalink. For every collection folder the URL is
//   /<section>/<slug>/        (slug = front-matter `slug`, else slugified `title`)
// Files in `pages` keep their own permalink (only the slashes are fixed); if one is
// missing it becomes /<slug>/.
//
// Usage:  node tools/normalize-permalinks.mjs            -> fix files in place
//         node tools/normalize-permalinks.mjs --check    -> only report, change nothing
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, basename, relative, sep } from 'node:path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const root = resolve(args.find((a) => !a.startsWith('--')) || 'src/content');

// folder -> URL section
const SECTIONS = {
  tours: 'tours',
  trekking: 'trekking',
  expeditions: 'expeditions',
  'jeep-safaris': 'jeep-safaris',
  'hunting-services': 'hunting-services',
  vehicles: 'vehicles',
  blog: 'blog',
};

// Yeh folders pages nahi hain (sirf data), in ka koi URL nahi hota.
const SKIP_FOLDERS = new Set(['sliders']);

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});

const getField = (front, key) => {
  const m = front.match(new RegExp(`^${key}:[ \\t]*(["']?)(.+?)\\1[ \\t]*\\r?$`, 'm'));
  return m ? m[2].trim() : '';
};

let changed = 0;
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^(\uFEFF?---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!m) continue;
  const front = m[2];
  const nl = front.includes('\r\n') ? '\r\n' : '\n';
  const folder = relative(root, file).split(sep)[0];
  if (SKIP_FOLDERS.has(folder)) continue;
  const section = SECTIONS[folder];
  const slug = slugify(getField(front, 'slug') || getField(front, 'title') || basename(file, '.md'));
  const current = getField(front, 'permalink');

  let desired;
  if (section) {
    desired = `/${section}/${slug}/`;
  } else {
    // pages/other: keep the editor's permalink, only repair slashes
    let v = current;
    if (!v) v = slug;
    if (/[{}]/.test(v) || v === 'false' || v === 'true' || /\.[A-Za-z0-9]+$/.test(v)) continue;
    desired = ('/' + v.replace(/^\/+/, '').replace(/\/+$/, '') + '/').replace(/\/{2,}/g, '/');
  }
  if (desired === current) continue;

  let next;
  if (current) {
    next = front.replace(/^(permalink:[ \t]*)(["']?)(.+?)\2[ \t]*(\r?)$/m, (a, k, q, v, cr) => `${k}${q}${desired}${q}${cr}`);
  } else if (/^title:/m.test(front)) {
    next = front.replace(/^(title:.*)$/m, (line) => `${line.replace(/\r$/, '')}${nl}permalink: ${desired}`);
  } else {
    next = `permalink: ${desired}${nl}${front}`;
  }
  console.log(`${check ? 'WOULD CHANGE' : 'changed'}: ${relative(process.cwd(), file)}\n    ${current || '(none)'}  ->  ${desired}`);
  if (!check) writeFileSync(file, text.replace(front, () => next), 'utf8');
  changed++;
}
console.log(changed ? `${check ? 'Would change' : 'Changed'} ${changed} permalink(s).` : 'All permalinks OK.');