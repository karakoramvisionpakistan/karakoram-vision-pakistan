#!/usr/bin/env node
/**
 * fix-schema-2.mjs   (WEBSITE ke folder mein, fix-schema.mjs ke BAAD)
 *
 * --verify ne do cheezein pakdin:
 *  1. "Prepare for K2" blog ke canonical khane mein do links chipka diye gaye
 *     hain ("trekking/k2-base-camp-trek/  trekking/gondogoro-la-circuit-trek/").
 *     Yeh khana sirf apna URL batane ke liye hai - ghalat value Google ko
 *     uljhati hai. Har aisi ghalat value khali karta hai (site khud sahi URL banati hai).
 *  2. "blog posts: 0" - blog pages par Article schema bilkul nahi ban raha tha
 *     (template "page_type == post" dhoondta tha jo blog ko milta hi nahi).
 *     Ab /blog/... wale har post ko Article + breadcrumb milega.
 *  3. site.json: TripAdvisor ka do dafa wala link ek kar deta hai (agar ek hi list mein ho).
 *
 *   node tools/fix-schema-2.mjs            -> sirf jaanch
 *   node tools/fix-schema-2.mjs --write    -> likh deta hai (.bakschema2 backup)
 *   phir: npm run build  ->  node tools/fix-schema.mjs --verify
 */
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const P = (rel) => path.join(process.cwd(), ...rel.split('/'));
const relp = (f) => path.relative(process.cwd(), f).split(path.sep).join('/');
const walk = (d, re, acc = []) => {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (/node_modules|\.git([\\/]|$)|_unused/.test(f)) continue;
    if (e.isDirectory()) walk(f, re, acc); else if (re.test(e.name)) acc.push(f);
  }
  return acc;
};
const problems = [], report = [], plan = [];
const keepEol = (raw, t) => (raw.includes('\r\n') ? t.replace(/\n/g, '\r\n') : t);

/* ================================================================ 1. ghalat canonical values */
const validCanon = (v) => /^(https:\/\/www\.karakoramvision\.com)?\/[^\s]*$/.test(v);
for (const f of walk('src/content', /\.md$/)) {
  const raw = fs.readFileSync(f, 'utf8');
  const t = raw.replace(/\r\n/g, '\n');
  const fm = /^---\n([\s\S]*?)\n---/.exec(t);
  if (!fm) continue;
  const lines = fm[1].split('\n');
  let changed = false;
  lines.forEach((l, i) => {
    const m = /^(\s+canonical:\s*)(['"]?)(.*?)\2\s*$/.exec(l);
    if (!m || !m[3].trim() || validCanon(m[3].trim())) return;
    // agar agli lines bhi isi value ka hissa hon (lambi YAML value) to woh bhi hatao
    let j = i + 1;
    while (j < lines.length && /^\s{4,}\S/.test(lines[j]) && !/^\s+\w+:/.test(lines[j])) { lines[j] = null; j++; }
    lines[i] = `${m[1]}''`;
    changed = true;
    report.push(`  badli  ${relp(f)}: canonical "${m[3].trim().slice(0, 80)}" -> khali (yeh URL nahi tha)`);
  });
  if (changed) plan.push({ abs: f, after: keepEol(raw, t.replace(fm[1], lines.filter((x) => x !== null).join('\n'))) });
}

/* ================================================================ 2. blog Article schema */
const SCHEMA = 'src/_includes/components/schema.njk';
if (!fs.existsSync(P(SCHEMA))) problems.push(`${SCHEMA}: nahi mili`);
else {
  const raw = fs.readFileSync(P(SCHEMA), 'utf8');
  let t = raw.replace(/\r\n/g, '\n');
  const OLD = "{% elif source.page_type == 'post' %}";
  if (t.includes('schemaPostFix')) report.push('  --     blog Article schema pehle se');
  else if (t.split(OLD).length - 1 !== 1) problems.push(`schema.njk: "${OLD}" ${t.split(OLD).length - 1} dafa mila (1 chahiye)`);
  else if (!t.includes('#post-breadcrumbs')) problems.push('schema.njk: pehle fix-schema.mjs --write chalayein');
  else {
    t = t.replace(OLD, "{# schemaPostFix: blog posts /blog/... par hain, page_type un par nahi hota #}\n    {% elif source.page_type == 'post' or (page.url and page.url.indexOf('/blog/') == 0 and page.url != '/blog/' and page.url.indexOf('/blog/page') != 0) %}");
    plan.push({ abs: P(SCHEMA), after: keepEol(raw, t) });
    report.push(`  badli  ${SCHEMA}: har /blog/... post ko Article + breadcrumb schema`);
  }
}

/* ================================================================ 3. site.json do dafa link */
const SITE = 'src/_data/site.json';
if (fs.existsSync(P(SITE))) {
  const raw = fs.readFileSync(P(SITE), 'utf8');
  let j; try { j = JSON.parse(raw); } catch (e) { problems.push(`${SITE}: JSON parhi nahi gayi: ${e.message}`); }
  if (j) {
    let fixed = 0;
    const visit = (n, where) => {
      if (Array.isArray(n)) {
        if (n.every((x) => typeof x === 'string')) {
          const u = [...new Set(n)];
          if (u.length !== n.length) { fixed += n.length - u.length; n.splice(0, n.length, ...u); report.push(`  badli  ${SITE}: ${where} mein do dafa wala link ek kiya`); }
        } else n.forEach((x, i) => visit(x, `${where}[${i}]`));
      } else if (n && typeof n === 'object') Object.entries(n).forEach(([k, v]) => visit(v, where ? `${where}.${k}` : k));
    };
    visit(j, '');
    if (fixed) {
      const indent = (/\n(\s+)"/.exec(raw) || [, '  '])[1];
      plan.push({ abs: P(SITE), after: keepEol(raw, JSON.stringify(j, null, indent) + (raw.endsWith('\n') ? '\n' : '')) });
    } else {
      const keys = [];
      const find = (n, w) => { if (typeof n === 'string' && /tripadvisor\.com\/Profile\/karakoramvision/.test(n)) keys.push(w); else if (n && typeof n === 'object') Object.entries(n).forEach(([k, v]) => find(v, w ? `${w}.${k}` : k)); };
      find(j, '');
      if (keys.length > 1) report.push(`  !!     ${SITE}: TripAdvisor link do alag khanon mein: ${keys.join(' , ')} - nahi chheda (dono kahin aur kaam aa sakte hain). Choti baat hai.`);
    }
  }
}

/* ================================================================ report */
console.log('\nSCHEMA 2  ' + (WRITE ? '(LIKH RAHA HAI)' : '(sirf jaanch)'));
console.log('='.repeat(70));
report.forEach((r) => console.log(r));
if (problems.length) { console.log(`\nXX  ${problems.length} MASLA - KOI FILE NAHI BADLI:`); problems.forEach((p) => console.log('    - ' + p)); console.log('Yeh nateeja mujhe bhej dein.'); process.exit(1); }
if (!plan.length) { console.log('\nSab pehle se laga hua hai.'); process.exit(0); }
if (!WRITE) { console.log('\nSab jagahen mil gayin. Likhne ke liye:  node tools/fix-schema-2.mjs --write'); process.exit(0); }
for (const x of plan) {
  let b = `${x.abs}.bakschema2`; let k = 2; while (fs.existsSync(b)) b = `${x.abs}.bakschema2${k++}`;
  fs.copyFileSync(x.abs, b); fs.writeFileSync(x.abs, x.after, 'utf8');
}
console.log(`\nOK  ${plan.length} files badli (.bakschema2 backup).\nAb:  npm run build   phir   node tools/fix-schema.mjs --verify`);
