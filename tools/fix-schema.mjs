#!/usr/bin/env node
/**
 * fix-schema.mjs   (WEBSITE ke folder mein:  D:\Websites\Karakoram_Vision_Pakistan)
 *
 * Google Search Console: "Invalid URL in field id (in itemListElement.item)".
 * Asal wajah: Lahore City Tour ke front matter mein canonical ghalti se
 * "/tours/islamabad-city-tour/" likha hai (copy hua page). Is ka matlab Google
 * ko keh rahe thay "Lahore wala page asal mein Islamabad wala hai" - Lahore
 * page Google se gayab ho sakta tha. Yeh breadcrumb error se bada masla hai.
 *
 * Yeh script:
 *  1. content files mein har ghalat / bekaar canonical dhoondti hai:
 *     - jo apne hi page ki taraf ho -> khali (site khud sahi poora URL banati hai)
 *     - Lahore -> Islamabad wali ghalti -> khali
 *     - koi aur doosre page ki taraf ho -> sirf batati hai, chhoorti nahi
 *  2. schema.njk: agar kabhi canonical adhoora (/abc/) ho to schema mein poora
 *     https://... URL bane - aage kabhi yeh error na aaye.
 *  3. Blog posts ko bhi breadcrumb schema (Home > Blog > Post).
 *  4. Blog author: "Editorial Team" Person nahi hai - Organization bana deta hai.
 *
 *   node tools/fix-schema.mjs            -> sirf jaanch
 *   node tools/fix-schema.mjs --write    -> likh deta hai (.bakschema backup)
 *   node tools/fix-schema.mjs --verify   -> build ke baad: poori site ka schema check
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
const HOST = 'www.karakoramvision.com';
const norm = (u) => { // canonical ko path mein badlo, takay muqabla ho sake
  try { const x = new URL(u, `https://${HOST}`); return x.hostname.replace(/^www\./, '') === HOST.replace(/^www\./, '') ? x.pathname.replace(/\/?$/, '/') : null; } catch { return null; }
};

/* ================================================================ verify */
if (process.argv.includes('--verify')) {
  if (!fs.existsSync('_site')) { console.log('Pehle:  npm run build'); process.exit(1); }
  const errs = [], warns = [];
  let pages = 0, crumbs = 0, posts = 0, postCrumbs = 0;
  const abs = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname === HOST; } catch { return false; } };
  for (const f of walk('_site', /\.html$/)) {
    const h = fs.readFileSync(f, 'utf8');
    if (h.length < 3000 && /http-equiv="refresh"/i.test(h)) continue;
    const url = '/' + relp(f).replace(/^_site\//, '').replace(/index\.html$/, '');
    if (/^\/(404|admin)/.test(url)) continue;
    pages++;
    const canon = (/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i.exec(h) || /<link[^>]+href="([^"]*)"[^>]+rel="canonical"/i.exec(h) || [])[1];
    const noindex = /<meta name="robots" content="[^"]*noindex/i.test(h);
    if (!canon) { if (!noindex) warns.push(`${url}: canonical link nahi`); }
    else if (!abs(canon)) errs.push(`${url}: canonical adhoora/ghalat: ${canon}`);
    else if (norm(canon) !== url && !noindex) errs.push(`${url}: canonical DOOSRE page ki taraf: ${canon}`);
    const blocks = [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    let isPost = false, hasCrumb = false;
    for (const m of blocks) {
      let j; try { j = JSON.parse(m[1]); } catch (e) { errs.push(`${url}: JSON-LD toota: ${e.message.slice(0, 80)}`); continue; }
      const visit = (n) => {
        if (Array.isArray(n)) return n.forEach(visit);
        if (!n || typeof n !== 'object') return;
        const t = [].concat(n['@type'] || []);
        if (t.includes('Article') || t.includes('BlogPosting')) isPost = true;
        if (t.includes('BreadcrumbList')) {
          crumbs++; hasCrumb = true;
          const items = n.itemListElement || [];
          items.forEach((li, i) => {
            const u = typeof li.item === 'string' ? li.item : li.item && (li.item['@id'] || li.item.url);
            if (u === undefined && i === items.length - 1) return;
            if (!abs(u)) errs.push(`${url}: breadcrumb ${li.position} "${li.name}" ka URL ghalat: ${JSON.stringify(u)}`);
            if (li.position !== i + 1) errs.push(`${url}: breadcrumb position ${li.position} (hona ${i + 1})`);
            if (!li.name) errs.push(`${url}: breadcrumb ${i + 1} ka naam khali`);
          });
          const last = items[items.length - 1];
          const lu = last && (typeof last.item === 'string' ? last.item : last.item && (last.item['@id'] || last.item.url));
          if (lu && norm(lu) !== url && !noindex) errs.push(`${url}: breadcrumb ki aakhri kadi doosre page ki taraf: ${lu}`);
        }
        if (Array.isArray(n.sameAs) && new Set(n.sameAs).size !== n.sameAs.length) warns.push(`${url}: sameAs mein ek link do dafa (choti baat)`);
        Object.values(n).forEach(visit);
      };
      visit(j);
    }
    if (isPost) { posts++; if (hasCrumb) postCrumbs++; else errs.push(`${url}: blog post par breadcrumb schema nahi`); }
  }
  const uniq = (a) => [...new Set(a)];
  const sameAsW = warns.filter((w) => w.includes('sameAs'));
  const otherW = warns.filter((w) => !w.includes('sameAs'));
  console.log(`\n${pages} safhe, ${crumbs} breadcrumb, blog posts: ${posts} (breadcrumb ke sath: ${postCrumbs})`);
  if (otherW.length) { console.log(`\n!! ${otherW.length} tanbeeh:`); otherW.slice(0, 30).forEach((w) => console.log('   ' + w)); }
  if (sameAsW.length) console.log(`\n!! sameAs mein ek link do dafa (${sameAsW.length} safhe) - choti baat, neeche dekhein`);
  if (errs.length) { console.log(`\nXX ${errs.length} GHALTI:`); uniq(errs).slice(0, 60).forEach((e) => console.log('   ' + e)); process.exit(1); }
  console.log('\nOK  Schema mein koi ghalti nahi. Ab push karein.');
  process.exit(0);
}

/* ================================================================ 1. canonicals */
const problems = [], report = [], plan = [];
const KNOWN_BAD = { 'lahore-city-tour': '/tours/islamabad-city-tour/' };
const contentFiles = walk('src/content', /\.md$/);
for (const f of contentFiles) {
  const raw = fs.readFileSync(f, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const t = raw.replace(/\r\n/g, '\n');
  const fm = /^---\n([\s\S]*?)\n---/.exec(t);
  if (!fm) continue;
  const lines = fm[1].split('\n');
  const permalink = ((/^permalink:\s*['"]?([^'"\n]+?)['"]?\s*$/m.exec(fm[1]) || [])[1] || '').trim();
  let changed = false;
  lines.forEach((l, i) => {
    const m = /^(\s+canonical:\s*)(['"]?)(.*?)\2\s*$/.exec(l);
    if (!m || !m[3].trim()) return;
    const val = m[3].trim();
    const base = path.basename(f, '.md');
    const target = norm(val);
    const self = permalink && target === permalink.replace(/\/?$/, '/');
    if (self || KNOWN_BAD[base] === target) {
      lines[i] = `${m[1]}''`;
      changed = true;
      report.push(`  badli  ${relp(f)}: canonical "${val}" -> khali ${self ? '(apna hi page tha)' : '(GHALAT: doosre page ki taraf tha)'}`);
    } else {
      report.push(`  !!     ${relp(f)}: canonical "${val}" doosre page ki taraf hai (permalink ${permalink || '?'}) - nahi chheda, mujhe batayein agar yeh ghalat hai`);
    }
  });
  if (changed) {
    const out = t.replace(fm[1], lines.join('\n'));
    plan.push({ rel: relp(f), abs: f, after: eol === '\n' ? out : out.replace(/\n/g, '\r\n') });
  }
}
if (!Object.keys(KNOWN_BAD).some((b) => contentFiles.some((f) => path.basename(f, '.md') === b))) report.push('  --     lahore-city-tour.md nahi mili (shayad naam alag hai)');

/* ================================================================ 2-4. schema.njk */
const SCHEMA = 'src/_includes/components/schema.njk';
if (!fs.existsSync(P(SCHEMA))) problems.push(`${SCHEMA}: nahi mili`);
else {
  const raw = fs.readFileSync(P(SCHEMA), 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let t = raw.replace(/\r\n/g, '\n');
  const notes = [];
  // 2. canonical hamesha poora URL
  if (t.includes('schemaCanonFix')) notes.push('-- canonical guard pehle se');
  else {
    const m = /<script[^>]*application\/ld\+json[^>]*>/.exec(t);
    if (!m) problems.push('schema.njk: ld+json script tag nahi mila');
    else {
      const guard = "{# schemaCanonFix: canonical kabhi adhoora (/abc/) ho to schema mein poora URL #}\n{% if canonicalUrl and canonicalUrl.indexOf('http') != 0 %}{% set canonicalUrl = site.url + canonicalUrl %}{% endif %}\n";
      t = t.slice(0, m.index) + guard + t.slice(m.index);
      notes.push('canonical hamesha poora https:// URL');
    }
  }
  // 3. blog breadcrumb
  if (t.includes('#post-breadcrumbs')) notes.push('-- blog breadcrumb pehle se');
  else {
    const anchor = "      \"inLanguage\":{{ (site.language or 'en') | json | safe }}\n    }\n    {% else %}";
    const n = t.split(anchor).length - 1;
    if (n !== 1) problems.push(`schema.njk: post block ka aakhir ${n} dafa mila (1 chahiye)`);
    else {
      const blogExists = fs.existsSync(P('src/blog')) || contentFiles.concat(walk('src', /\.njk$/)).some((f) => /^permalink:\s*['"]?\/blog\/['"]?\s*$/m.test(fs.readFileSync(f, 'utf8')));
      const crumb = [
        "      \"inLanguage\":{{ (site.language or 'en') | json | safe }}",
        '    },',
        "    {\"@type\":\"BreadcrumbList\",\"@id\":{{ (canonicalUrl + '#post-breadcrumbs') | json | safe }},\"itemListElement\":[",
        "      {\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":{{ (site.url + '/') | json | safe }}},",
        ...(blogExists ? ["      {\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":{{ (site.url + '/blog/') | json | safe }}},"] : []),
        `      {"@type":"ListItem","position":${blogExists ? 3 : 2},"name":{{ title | json | safe }},"item":{{ canonicalUrl | json | safe }}}`,
        '    ]}',
        '    {% else %}'
      ].join('\n');
      t = t.replace(anchor, crumb);
      notes.push(`blog posts ko breadcrumb (Home > ${blogExists ? 'Blog > ' : ''}Post)`);
      if (!blogExists) report.push('  !!     /blog/ ka index page nahi mila - breadcrumb Home > Post rakha');
    }
  }
  // 4. author
  const AUTH = "      \"author\":{\"@type\":\"Person\",\"name\":{{ (author or site.name + ' Editorial Team') | json | safe }}},";
  if (t.includes('schemaAuthorFix')) notes.push('-- author pehle se');
  else if (!t.includes(AUTH)) report.push('  --     author wali line nahi mili (chhor diya)');
  else {
    t = t.replace(AUTH, [
      "      {# schemaAuthorFix: 'Team' ek idara hai, insaan nahi #}",
      "      {% if author and author.indexOf('Team') == -1 %}\"author\":{\"@type\":\"Person\",\"name\":{{ author | json | safe }}},",
      "      {% else %}\"author\":{\"@type\":\"Organization\",\"@id\":{{ (site.url + '/#organization') | json | safe }},\"name\":{{ (author or site.name + ' Editorial Team') | json | safe }}},{% endif %}"
    ].join('\n'));
    notes.push('author: "Team" ho to Organization, warna Person');
  }
  const ch = notes.filter((n) => !n.startsWith('--'));
  if (ch.length) {
    plan.push({ rel: SCHEMA, abs: P(SCHEMA), after: eol === '\n' ? t : t.replace(/\n/g, '\r\n') });
    report.push(`  badli  ${SCHEMA}`); ch.forEach((n) => report.push(`           ${n}`));
  }
  notes.filter((n) => n.startsWith('--')).forEach((n) => report.push(`  ${n}`));
  // nunjucks ke {% %} ka tawazun
  const open = (t.match(/\{%\s*(if|for)\b/g) || []).length, close = (t.match(/\{%\s*end(if|for)\b/g) || []).length;
  if (open !== close) problems.push(`schema.njk: if/for (${open}) aur endif/endfor (${close}) barabar nahi`);
}

/* sameAs mein do dafa wala link kahan se? (sirf batao) */
for (const f of walk('src/_data', /\.json$/)) {
  const s = fs.readFileSync(f, 'utf8');
  const n = (s.match(/tripadvisor\.com\/Profile\/karakoramvision/g) || []).length;
  if (n > 1) report.push(`  !!     ${relp(f)}: TripAdvisor link ${n} dafa (Google ko farq nahi, CMS settings mein ek hata dein)`);
}

/* ================================================================ report */
console.log('\nSCHEMA / CANONICAL  ' + (WRITE ? '(LIKH RAHA HAI)' : '(sirf jaanch)'));
console.log('='.repeat(70));
report.forEach((r) => console.log(r));
if (problems.length) { console.log(`\nXX  ${problems.length} MASLA - KOI FILE NAHI BADLI:`); problems.forEach((p) => console.log('    - ' + p)); console.log('Yeh nateeja mujhe bhej dein.'); process.exit(1); }
if (!plan.length) { console.log('\nSab pehle se laga hua hai.'); process.exit(0); }
if (!WRITE) { console.log('\nSab jagahen mil gayin. Likhne ke liye:  node tools/fix-schema.mjs --write'); process.exit(0); }
for (const x of plan) {
  let b = `${x.abs}.bakschema`; let k = 2; while (fs.existsSync(b)) b = `${x.abs}.bakschema${k++}`;
  fs.copyFileSync(x.abs, b); fs.writeFileSync(x.abs, x.after, 'utf8');
}
console.log(`\nOK  ${plan.length} files badli (.bakschema backup).\nAb:  npm run build   phir   node tools/fix-schema.mjs --verify`);
