#!/usr/bin/env node
/**
 * seo-onpage-audit.mjs   (website ke folder mein, npm run build ke baad)
 *
 * Har INDEXED safhe ka on-page SEO check. KUCH BADALTA NAHI — sirf report.
 *
 *   npm run build
 *   node tools/seo-onpage-audit.mjs
 *   node tools/seo-onpage-audit.mjs --site=fixture/_site   (test ke liye)
 *
 * Nateeja:
 *   - screen par khulasa (Roman Urdu)
 *   - _seo-onpage.json  (har safhe ki poori tafseel; isay chat mein bhej dein)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argSite = process.argv.find((a) => a.startsWith('--site='));
const SITE = path.resolve(ROOT, argSite ? argSite.slice(7) : '_site');
const OUT = path.join(ROOT, '_seo-onpage.json');

if (!fs.existsSync(SITE)) {
  console.log('\nXX 1 MASLA - KOI FILE NAHI BADLI');
  console.log('   _site nahi mila (' + SITE + '). Pehle: npm run build\n');
  process.exit(1);
}

/* ---------- madadgar ---------- */

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', hellip: '…' };
const decode = (s) => String(s || '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const strip = (s) => decode(String(s || '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<template[\s\S]*?<\/template>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? '') : null;
};
const meta = (html, key, val) => {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    if ((attr(m[0], key) || '').toLowerCase() === val) return (attr(m[0], 'content') ?? '').trim();
  }
  return null;
};
const normPath = (href, base) => {
  try {
    const u = new URL(href, base);
    let p = u.pathname.replace(/\/index\.html$/, '/');
    if (!/\.[a-z0-9]+$/i.test(p) && !p.endsWith('/')) p += '/';
    return { host: u.host.replace(/^www\./, ''), path: p };
  } catch { return null; }
};
const STOP = new Set(['the', 'and', 'for', 'with', 'a', 'of', 'to', 'in', 'on', 'tour', 'tours', 'trek', 'trekking', 'expedition', 'expeditions', 'blog', 'page', 'pages', 'guide']);
const tokens = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);

/* ---------- har safha padho ---------- */

const files = walk(SITE);
let SITE_HOST = '';
const pages = [];

for (const f of files) {
  const html = read(f);
  const rel = '/' + path.relative(SITE, f).replace(/\\/g, '/');
  const url = rel.endsWith('/index.html') ? rel.slice(0, -10) : rel;
  const robots = (meta(html, 'name', 'robots') || '').toLowerCase();
  const refresh = /<meta[^>]+http-equiv=["']?refresh/i.test(html);
  const canonTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0];
  const canonical = canonTag ? (attr(canonTag, 'href') || '') : '';
  if (!SITE_HOST && /^https?:\/\//.test(canonical)) SITE_HOST = new URL(canonical).host.replace(/^www\./, '');

  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const main = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [])[1] ?? '';
  const title = strip((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const desc = meta(html, 'name', 'description') ?? '';

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
  const heads = [...(main || html).matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ lvl: +m[1], text: strip(m[2]) }));
  const skips = [];
  for (let i = 1; i < heads.length; i++) {
    if (heads[i].lvl - heads[i - 1].lvl > 1) skips.push('h' + heads[i - 1].lvl + '→h' + heads[i].lvl + ' "' + heads[i].text.slice(0, 40) + '"');
  }
  const emptyHeads = heads.filter((h) => !h.text).length;

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imgNoAlt = imgs.filter((t) => attr(t, 'alt') === null).map((t) => attr(t, 'src'));
  const imgEmptyAlt = imgs.filter((t) => attr(t, 'alt') === '' && attr(t, 'aria-hidden') !== 'true' && attr(t, 'role') !== 'presentation').length;
  const imgNoWH = imgs.filter((t) => !(attr(t, 'width') && attr(t, 'height'))).map((t) => attr(t, 'src'));

  const words = (strip(main) || '').split(' ').filter(Boolean).length;
  const paras = [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => strip(m[1])).filter((t) => t.split(' ').length >= 12);
  const firstPara = paras[0] || '';

  const linksAll = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], 'href')).filter(Boolean);
  const linksMain = [...main.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], 'href')).filter(Boolean);

  const og = {
    title: meta(html, 'property', 'og:title'),
    description: meta(html, 'property', 'og:description'),
    image: meta(html, 'property', 'og:image'),
    url: meta(html, 'property', 'og:url'),
    type: meta(html, 'property', 'og:type'),
    twitter: meta(html, 'name', 'twitter:card'),
  };

  const ldTypes = []; let ldBroken = 0;
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      for (const o of (Array.isArray(j) ? j : [j]).flatMap((o) => o['@graph'] || [o])) {
        ldTypes.push(...[].concat(o['@type'] || []));
      }
    } catch { ldBroken++; }
  }

  pages.push({
    url, file: rel, html: null, robots, refresh, canonical, title, desc, h1s, heads: heads.length, skips, emptyHeads,
    firstHeading: heads[0] ? 'h' + heads[0].lvl : '', imgs: imgs.length, imgNoAlt, imgEmptyAlt, imgNoWH,
    words, firstPara, linksAll, linksMain, og, ldTypes: [...new Set(ldTypes)], ldBroken,
  });
}

/* ---------- kaun se safhe indexed hain ---------- */

const isIndexed = (p) => !p.refresh && !p.robots.includes('noindex') && !/^\/(404|offline)/.test(p.url) && !/\/404\.html$/.test(p.url);
const indexed = pages.filter(isIndexed);
const base = 'https://' + (SITE_HOST || 'example.com');
const known = new Set(pages.map((p) => p.url));

/* ---------- andar aane wale links ---------- */

const inAll = {}; const inMain = {};
for (const p of pages) {
  if (!isIndexed(p)) continue;
  const seenA = new Set(); const seenM = new Set();
  for (const h of p.linksAll) { const n = normPath(h, base + p.url); if (n && n.host === SITE_HOST && n.path !== p.url) seenA.add(n.path); }
  for (const h of p.linksMain) { const n = normPath(h, base + p.url); if (n && n.host === SITE_HOST && n.path !== p.url) seenM.add(n.path); }
  for (const x of seenA) inAll[x] = (inAll[x] || 0) + 1;
  for (const x of seenM) inMain[x] = (inMain[x] || 0) + 1;
}
const sitemap = read(path.join(SITE, 'sitemap.xml'));
const inSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => (normPath(m[1].trim(), base) || {}).path));

/* ---------- har safhe ke masail ---------- */

const titleCount = {}; const descCount = {}; const h1Count = {};
for (const p of indexed) {
  titleCount[p.title.toLowerCase()] = (titleCount[p.title.toLowerCase()] || 0) + 1;
  if (p.desc) descCount[p.desc.toLowerCase()] = (descCount[p.desc.toLowerCase()] || 0) + 1;
  if (p.h1s[0]) h1Count[p.h1s[0].toLowerCase()] = (h1Count[p.h1s[0].toLowerCase()] || 0) + 1;
}

const report = [];
for (const p of indexed) {
  const I = [];   // [darja, code, tafseel]   darja: 3 = zaroori, 2 = acha ho, 1 = maloomat
  const add = (sev, code, msg) => I.push({ sev, code, msg });

  // title
  if (!p.title) add(3, 'title-missing', 'title nahi hai');
  else {
    if (p.title.length > 62) add(2, 'title-long', p.title.length + ' harf (62 se zyada, Google kaat dega)');
    if (p.title.length < 30) add(2, 'title-short', p.title.length + ' harf');
    if (titleCount[p.title.toLowerCase()] > 1) add(3, 'title-duplicate', 'yahi title ' + titleCount[p.title.toLowerCase()] + ' safhon par');
  }
  // description
  if (!p.desc) add(3, 'desc-missing', 'meta description nahi hai');
  else {
    if (p.desc.length > 160) add(2, 'desc-long', p.desc.length + ' harf');
    if (p.desc.length < 110) add(2, 'desc-short', p.desc.length + ' harf');
    if (descCount[p.desc.toLowerCase()] > 1) add(3, 'desc-duplicate', 'yahi description ' + descCount[p.desc.toLowerCase()] + ' safhon par');
  }
  // H1
  if (p.h1s.length === 0) add(3, 'h1-missing', 'H1 nahi hai');
  if (p.h1s.length > 1) add(3, 'h1-multiple', p.h1s.length + ' H1: ' + p.h1s.map((t) => '"' + t.slice(0, 30) + '"').join(', '));
  if (p.h1s[0] && p.h1s[0].split(' ').length <= 2) add(2, 'h1-weak', 'H1 bohat chhota/aam: "' + p.h1s[0] + '"');
  if (p.h1s[0] && h1Count[p.h1s[0].toLowerCase()] > 1) add(2, 'h1-duplicate', 'yahi H1 doosre safhe par bhi');
  // headings
  if (p.firstHeading && p.firstHeading !== 'h1') add(2, 'heading-first', 'pehla heading ' + p.firstHeading + ' hai, h1 nahi');
  if (p.skips.length) add(1, 'heading-skip', p.skips.length + ' jagah level chhalang: ' + p.skips.slice(0, 3).join(' | '));
  if (p.emptyHeads) add(2, 'heading-empty', p.emptyHeads + ' khaali heading');
  // images
  if (p.imgNoAlt.length) add(3, 'img-no-alt', p.imgNoAlt.length + '/' + p.imgs + ' tasveeron mein alt nahi: ' + p.imgNoAlt.slice(0, 3).join(', '));
  if (p.imgEmptyAlt) add(1, 'img-empty-alt', p.imgEmptyAlt + ' tasveeron ka alt="" (sirf sajawati ho to theek)');
  if (p.imgNoWH.length) add(2, 'img-no-size', p.imgNoWH.length + '/' + p.imgs + ' tasveeron par width/height nahi: ' + p.imgNoWH.slice(0, 3).join(', '));
  // likhai
  if (p.words < 300) add(3, 'thin', p.words + ' lafz (bohat kam)');
  else if (p.words < 600) add(2, 'thin', p.words + ' lafz (kam)');
  // links
  const ia = inAll[p.url] || 0; const im = inMain[p.url] || 0;
  if (p.url !== '/' && ia === 0) add(3, 'orphan', 'kisi safhe se link nahi aata (orphan)');
  else if (p.url !== '/' && im === 0) add(2, 'no-contextual-in', 'sirf menu/footer se link; mazmoon ke andar se koi link nahi');
  const outMain = new Set(p.linksMain.map((h) => normPath(h, base + p.url)).filter((n) => n && n.host === SITE_HOST && n.path !== p.url).map((n) => n.path));
  if (outMain.size < 3) add(2, 'few-out', 'mazmoon se sirf ' + outMain.size + ' andarooni link bahar jaate hain');
  const broken = [...outMain].filter((x) => !known.has(x) && !/\.[a-z0-9]+$/i.test(x));
  if (broken.length) add(3, 'broken-link', broken.length + ' toote andarooni link: ' + broken.slice(0, 4).join(', '));
  if (!inSitemap.has(p.url)) add(2, 'not-in-sitemap', 'sitemap.xml mein nahi');
  // canonical
  if (!p.canonical) add(3, 'canonical-missing', 'canonical nahi hai');
  else {
    const c = normPath(p.canonical, base + p.url);
    if (!/^https:\/\//.test(p.canonical)) add(3, 'canonical-relative', 'canonical poora URL nahi: ' + p.canonical);
    else if (!c || c.path !== p.url) add(3, 'canonical-other', 'canonical doosre safhe ki taraf: ' + p.canonical);
  }
  // Open Graph
  const ogMiss = ['title', 'description', 'image', 'url'].filter((k) => !p.og[k]);
  if (ogMiss.length) add(2, 'og-missing', 'og:' + ogMiss.join(', og:') + ' nahi');
  if (p.og.url && p.canonical && p.og.url !== p.canonical) add(2, 'og-url', 'og:url aur canonical alag');
  if (p.og.image && !/^https:\/\//.test(p.og.image)) add(2, 'og-image-relative', 'og:image poora URL nahi');
  if (!p.og.twitter) add(1, 'twitter-missing', 'twitter:card nahi');
  // schema
  if (p.ldBroken) add(3, 'schema-broken', p.ldBroken + ' toota JSON-LD');
  if (!p.ldTypes.length) add(2, 'schema-missing', 'koi structured data nahi');
  // keyword (URL ke alfaaz)
  const slug = p.url.split('/').filter(Boolean).pop() || '';
  const kw = tokens(slug).filter((t) => !STOP.has(t) && t.length > 2);
  if (kw.length) {
    const h1t = tokens(p.h1s[0] || ''); const tt = tokens(p.title); const pt = tokens(p.firstPara);
    const missH1 = kw.filter((k) => !h1t.includes(k));
    const missT = kw.filter((k) => !tt.includes(k));
    const missP = kw.filter((k) => !pt.includes(k));
    if (missH1.length) add(2, 'kw-h1', 'URL ka lafz H1 mein nahi: ' + missH1.join(', '));
    if (missT.length) add(2, 'kw-title', 'URL ka lafz title mein nahi: ' + missT.join(', '));
    if (!p.firstPara) add(1, 'kw-p1', 'pehla paragraph nahi mila');
    else if (missP.length === kw.length) add(2, 'kw-p1', 'pehle paragraph mein URL ka koi lafz nahi');
    else if (missP.length) add(1, 'kw-p1', 'pehle paragraph mein nahi: ' + missP.join(', '));
  }

  report.push({
    url: p.url, title: p.title, titleLen: p.title.length, desc: p.desc, descLen: p.desc.length,
    h1: p.h1s, words: p.words, inLinks: ia, inLinksContent: im, outLinksContent: outMain.size,
    images: p.imgs, schema: p.ldTypes, firstPara: p.firstPara.slice(0, 160),
    issues: I.sort((a, b) => b.sev - a.sev),
  });
}

/* ---------- sitemap mein, lekin indexed nahi ---------- */
const extra = [];
for (const s of inSitemap) {
  const p = pages.find((x) => x.url === s);
  if (!p) extra.push({ url: s, msg: 'sitemap mein hai lekin _site mein safha nahi' });
  else if (!isIndexed(p)) extra.push({ url: s, msg: 'sitemap mein hai lekin noindex/redirect hai' });
}

/* ---------- report ---------- */

fs.writeFileSync(OUT, JSON.stringify({ site: SITE_HOST, generated: new Date().toISOString(), indexed: indexed.length, totalHtml: pages.length, sitemapProblems: extra, pages: report }, null, 2));

const LABEL = {
  'title-missing': 'Title nahi', 'title-long': 'Title lamba', 'title-short': 'Title chhota', 'title-duplicate': 'Title duplicate',
  'desc-missing': 'Description nahi', 'desc-long': 'Description lambi', 'desc-short': 'Description chhoti', 'desc-duplicate': 'Description duplicate',
  'h1-missing': 'H1 nahi', 'h1-multiple': 'Ek se zyada H1', 'h1-weak': 'H1 kamzor', 'h1-duplicate': 'H1 duplicate',
  'heading-first': 'Pehla heading H1 nahi', 'heading-skip': 'Heading level chhalang', 'heading-empty': 'Khaali heading',
  'img-no-alt': 'Tasveer bina alt', 'img-empty-alt': 'alt="" (check)', 'img-no-size': 'Tasveer bina width/height',
  thin: 'Kam likhai', orphan: 'Orphan safha', 'no-contextual-in': 'Mazmoon se koi link nahi aata', 'few-out': 'Kam andarooni link',
  'broken-link': 'Toota link', 'not-in-sitemap': 'Sitemap mein nahi', 'canonical-missing': 'Canonical nahi',
  'canonical-relative': 'Canonical adhoora', 'canonical-other': 'Canonical ghalat safhe par', 'og-missing': 'OG tag nahi',
  'og-url': 'og:url ≠ canonical', 'og-image-relative': 'og:image adhoora', 'twitter-missing': 'Twitter card nahi',
  'schema-broken': 'Schema toota', 'schema-missing': 'Schema nahi', 'kw-h1': 'Keyword H1 mein nahi',
  'kw-title': 'Keyword title mein nahi', 'kw-p1': 'Keyword pehle paragraph mein nahi',
};

const byCode = {};
for (const r of report) for (const i of r.issues) (byCode[i.code] ||= { sev: i.sev, urls: [] }).urls.push(r.url);

console.log('\n================ ON-PAGE SEO AUDIT ================');
console.log('Indexed safhe: ' + indexed.length + '   (kul HTML: ' + pages.length + ')\n');
for (const [sev, name] of [[3, 'ZAROORI'], [2, 'BEHTAR HO'], [1, 'MALOOMAT']]) {
  const rows = Object.entries(byCode).filter(([, v]) => v.sev === sev).sort((a, b) => b[1].urls.length - a[1].urls.length);
  if (!rows.length) continue;
  console.log('--- ' + name + ' ---');
  for (const [code, v] of rows) {
    console.log('   ' + String(v.urls.length).padStart(3) + '  ' + (LABEL[code] || code));
    for (const u of v.urls.slice(0, 8)) console.log('          ' + u);
    if (v.urls.length > 8) console.log('          ... aur ' + (v.urls.length - 8));
  }
  console.log('');
}
if (extra.length) {
  console.log('--- SITEMAP ---');
  for (const e of extra) console.log('          ' + e.url + '  — ' + e.msg);
  console.log('');
}
const clean = report.filter((r) => !r.issues.some((i) => i.sev >= 2)).length;
console.log('Bilkul saaf safhe: ' + clean + ' / ' + report.length);
console.log('Poori tafseel: _seo-onpage.json  (yeh file chat mein bhej dein)');
console.log('Koi file nahi badli.\n');
