// Normalizes `permalink:` in CMS content front matter so a typo by an editor
// (missing leading/trailing slash) can never break the build.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] || 'src/content');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});

let fixed = 0;
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^(\uFEFF?---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!m) continue;
  const front = m[2];
  const next = front.replace(/^(permalink:[ \t]*)(["']?)([^"'\r\n]+?)\2[ \t]*$/m, (all, key, q, value) => {
    let v = value.trim();
    if (/[{}]/.test(v) || v === 'false' || v === 'true' || /\.[A-Za-z0-9]+$/.test(v)) return all;
    v = '/' + v.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
    v = v.replace(/\/{2,}/g, '/');
    return key + q + v + q;
  });
  if (next !== front) {
    writeFileSync(file, text.replace(front, () => next), 'utf8');
    console.log('normalized permalink:', file);
    fixed++;
  }
}
console.log(fixed ? `Fixed ${fixed} permalink(s).` : 'All permalinks OK.');