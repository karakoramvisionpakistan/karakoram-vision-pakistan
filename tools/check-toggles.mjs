#!/usr/bin/env node
/**
 * check-toggles.mjs  — sirf parhta hai, kuch nahi badalta.
 *
 * Teen sawalon ka jawab deta hai:
 *
 *  1. Maujooda toggles (Best seller, Fixed departure, K2 Treks, Cultural
 *     Tours, 8,000m Peaks) waqai kaam karte hain? Yani landing page in par
 *     filter lagata bhi hai ya nahi.
 *  2. Kis toggle par kitni entries on hain, aur woh page par aani chahiyein.
 *  3. pageControl.json aur heroSettings.json ki maujooda shakal.
 *
 *   node tools/check-toggles.mjs > _toggles.txt
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git') || e.name === '_site') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/* har toggle ka naam aur uska landing page */
const TOGGLES = [
  { field: 'best_seller',     label: 'Best seller' },
  { field: 'fixed_departure', label: 'Fixed departure' },
  { field: 'k2_trek',         label: 'K2 Treks' },
  { field: 'cultural_tour',   label: 'Cultural Tours' },
  { field: 'peak_8000m',      label: '8,000m Peaks' },
  { field: 'featured',        label: 'Featured' },
];

const SERVICES = ['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services'];

/* ============================================ 1) landing pages ======== */

console.log('========== 1) LANDING PAGES — kis cheez par filter lagta hai ==========');

const landings = walk(path.join(ROOT, 'src'))
  .filter((f) => path.basename(f) === 'index.njk')
  .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
  .filter((rel) => {
    const parts = rel.split('/');            // src / <service> / <section> / index.njk
    return parts.length === 4 && SERVICES.includes(parts[1]);
  });

if (!landings.length) console.log('  (koi sub-page nahi mila)');

for (const rel of landings) {
  const text = read(path.join(ROOT, rel)) || '';
  console.log('\n--- ' + rel);

  // title
  const fmEnd = text.indexOf('\n---', 3);
  const fm = text.startsWith('---') && fmEnd > 0 ? text.slice(3, fmEnd) : '';
  const title = (fm.match(/^title:\s*(.+)$/m) || [])[1];
  const permalink = (fm.match(/^permalink:\s*(.+)$/m) || [])[1];
  console.log('    title: ' + (title || '(nahi mila)'));
  console.log('    permalink: ' + (permalink || '(front matter mein nahi)'));

  // filter lines
  const lines = text.split(/\r?\n/);
  const hits = [];
  lines.forEach((l, i) => {
    const isFilter =
      /collections\./.test(l) ||
      /selectattr|rejectattr|liveCards|\| *limit|for .* in /.test(l) ||
      TOGGLES.some((t) => l.includes(t.field));
    if (isFilter) hits.push((i + 1) + ': ' + l.trim().slice(0, 190));
  });

  if (!hits.length) {
    console.log('    !! koi filter line nahi mili');
  } else {
    console.log('    filter lines:');
    for (const h of hits.slice(0, 14)) console.log('      ' + h);
  }

  const used = TOGGLES.filter((t) => text.includes(t.field)).map((t) => t.field);
  console.log('    istemaal hone wale toggles: ' + (used.join(', ') || '(koi nahi)'));
}

/* ============================================ 2) content ginti ======== */

console.log('\n\n========== 2) HAR TOGGLE PAR KITNI ENTRIES ON HAIN ==========');

const mdFiles = walk(path.join(ROOT, 'src', 'content')).filter((f) => f.endsWith('.md'));

const byService = {};
for (const f of mdFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const service = rel.split('/')[2];           // src/content/<service>/x.md
  if (!SERVICES.includes(service)) continue;
  const text = read(f) || '';
  const fmEnd = text.indexOf('\n---', 3);
  if (!text.startsWith('---') || fmEnd < 0) continue;
  const fm = text.slice(3, fmEnd);
  const title = ((fm.match(/^title:\s*(.+)$/m) || [])[1] || path.basename(f)).replace(/^["']|["']$/g, '');
  const published = !/^published:\s*false\s*$/m.test(fm);

  byService[service] = byService[service] || [];
  const on = [];
  for (const t of TOGGLES) {
    const m = fm.match(new RegExp('^' + t.field + ':\\s*(\\S+)\\s*$', 'm'));
    if (m && /^(true|yes)$/i.test(m[1])) on.push(t.field);
  }
  byService[service].push({ title, on, published, file: rel });
}

for (const service of SERVICES) {
  const list = byService[service] || [];
  console.log('\n--- ' + service + '  (' + list.length + ' entries)');
  for (const t of TOGGLES) {
    const names = list.filter((e) => e.on.includes(t.field)).map((e) => e.title);
    console.log(
      '    ' + t.field.padEnd(18) + String(names.length).padStart(2) + '  ' +
      names.slice(0, 5).join(' | ').slice(0, 150)
    );
  }
  const none = list.filter((e) => !e.on.length).map((e) => e.title);
  if (none.length) console.log('    (kisi toggle par nahi): ' + none.slice(0, 6).join(' | '));
  const unpub = list.filter((e) => !e.published).map((e) => e.title);
  if (unpub.length) console.log('    (published: false): ' + unpub.join(' | '));
}

/* ============================================ 3) data files ========== */

console.log('\n\n========== 3) pageControl.json ==========');
const pc = read(path.join(ROOT, 'src', '_data', 'pageControl.json'));
if (!pc) console.log('  nahi mili');
else {
  try {
    const obj = JSON.parse(pc);
    console.log('  pages: ' + (obj.pages || []).length);
    for (const p of obj.pages || []) {
      console.log(
        '    ' + (p.published === false ? 'HIDDEN ' : 'show   ') +
        String(p.url).padEnd(36) + (p.label || '') +
        (p.redirect_to ? '   -> ' + p.redirect_to : '')
      );
    }
    console.log('  hidden: ' + JSON.stringify(obj.hidden));
    console.log('  redirects: ' + JSON.stringify(obj.redirects));
  } catch (e) {
    console.log('  parse fail: ' + e.message);
  }
}

console.log('\n========== 4) heroSettings.json ==========');
const hs = read(path.join(ROOT, 'src', '_data', 'heroSettings.json'));
if (!hs) console.log('  nahi mili');
else console.log(hs);

/* ============================================ 5) kaun istemaal karta = */

console.log('\n========== 5) heroSettings kaun parhta hai ==========');
const users = [];
for (const f of walk(path.join(ROOT, 'src'))) {
  if (!/\.(njk|js)$/.test(f)) continue;
  const t = read(f) || '';
  if (t.includes('heroSettings')) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const line = t.split(/\r?\n/).find((l) => l.includes('heroSettings')) || '';
    users.push('  ' + rel + '   ' + line.trim().slice(0, 150));
  }
}
console.log(users.length ? users.join('\n') : '  (koi nahi — yani yeh setting kaam hi nahi kar rahi)');

console.log('\n========== KHATAM ==========');
