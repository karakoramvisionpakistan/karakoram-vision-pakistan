#!/usr/bin/env node
/**
 * seo-audit.mjs   (website ke folder mein, npm run build ke baad)
 *
 * Bani hui website ko naap kar batata hai ke muqable ke saamne kahan
 * khaRe hain. Kuch badalta nahi.
 *
 *   npm run build
 *   node tools/seo-audit.mjs > _seo.txt
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = path.join(ROOT, '_site');
if (!fs.existsSync(SITE)) { console.log('XX  _site nahi mila. Pehle: npm run build'); process.exit(1); }

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const files = walk(SITE).filter((f) => f.endsWith('.html'));

/* ---- har safhe ki paimaish ---- */

const pages = files.map((f) => {
  const html = read(f) || '';
  const rel = '/' + path.relative(SITE, f).replace(/\\/g, '/');
  const url = rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;

  // sirf <main> ka matn — header aur footer ki ginti nahi
  const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || html;
  const text = main
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = text ? text.split(' ').length : 0;
  const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
  const desc = ((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || '').trim();

  const internal = [...main.matchAll(/<a\b[^>]*href=["'](\/[^"'#?]*)["']/gi)].map((m) => m[1]);
  const uniqueInternal = new Set(internal).size;

  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((m) => {
      try {
        const parsed = JSON.parse(m[1]);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        return arr.flatMap((o) => (o['@graph'] ? o['@graph'] : [o])).map((o) => o['@type']).filter(Boolean);
      } catch { return ['(toota hua JSON-LD)']; }
    });

  return {
    url, words, title, desc,
    h1: (html.match(/<h1\b/gi) || []).length,
    h2: (html.match(/<h2\b/gi) || []).length,
    internal: uniqueInternal,
    images: (html.match(/<img\b/gi) || []).length,
    schema: [...new Set(ld.flat())],
    faq: /Frequently asked questions/i.test(html),
    noindex: /name=["']robots["'][^>]+noindex/i.test(html),
  };
});

const journeys = pages.filter((p) => /^\/(tours|trekking|expeditions|jeep-safaris|hunting-services)\/[^/]+\/$/.test(p.url) && !p.noindex);

console.log('\n================ APNI WEBSITE KI PAIMAISH ================');
console.log(pages.length + ' safhe, un mein ' + journeys.length + ' journey safhe\n');

/* ---- likhai ki lambai ---- */

console.log('--- LIKHAI KI LAMBAI (muqabil ke safhe par 3,000-3,500 lafz hain) ---\n');
const sorted = [...journeys].sort((a, b) => a.words - b.words);
for (const p of sorted) {
  const bar = p.words < 600 ? ' <-- bohat chhota' : p.words < 1200 ? ' <-- chhota' : '';
  console.log('   ' + String(p.words).padStart(5) + '  ' + p.url.padEnd(48) + bar);
}
const avg = Math.round(journeys.reduce((s, p) => s + p.words, 0) / (journeys.length || 1));
console.log('\n   Ausat: ' + avg + ' lafz   |   600 se kam: ' +
  journeys.filter((p) => p.words < 600).length + '   |   1200 se kam: ' +
  journeys.filter((p) => p.words < 1200).length);

/* ---- title aur description ---- */

console.log('\n--- TITLE AUR DESCRIPTION ---\n');
const longT = pages.filter((p) => p.title.length > 62 && !p.noindex);
const shortT = pages.filter((p) => p.title && p.title.length < 30 && !p.noindex);
const longD = pages.filter((p) => p.desc.length > 160 && !p.noindex);
const shortD = pages.filter((p) => p.desc && p.desc.length < 90 && !p.noindex);

console.log('   title 62 harf se lamba (Google kaat deta hai): ' + longT.length);
for (const p of longT.slice(0, 10)) console.log('        ' + String(p.title.length).padStart(3) + '  ' + p.url);
console.log('   description 160 se lambi: ' + longD.length);
for (const p of longD.slice(0, 10)) console.log('        ' + String(p.desc.length).padStart(3) + '  ' + p.url);
console.log('   description 90 se chhoti (jagah zaya): ' + shortD.length);
for (const p of shortD.slice(0, 10)) console.log('        ' + String(p.desc.length).padStart(3) + '  ' + p.url);
if (shortT.length) {
  console.log('   title 30 se chhota: ' + shortT.length);
  for (const p of shortT.slice(0, 6)) console.log('        ' + p.url);
}

/* ---- andarooni links ---- */

console.log('\n--- ANDAROONI LINKS (mazmoon ke andar se doosre safhon tak) ---\n');
const weak = journeys.filter((p) => p.internal < 3).sort((a, b) => a.internal - b.internal);
console.log('   3 se kam links wale journey safhe: ' + weak.length + ' / ' + journeys.length);
for (const p of weak.slice(0, 15)) console.log('        ' + String(p.internal).padStart(2) + '  ' + p.url);
console.log('\n   Muqabil har safhe par darjanon andarooni link lagata hai.');
console.log('   Yeh Google ko raasta deta hai aur visitor ko website par rokta hai.');

/* ---- structured data ---- */

console.log('\n--- STRUCTURED DATA (Google aur AI isi se samajhte hain) ---\n');
const types = {};
for (const p of pages) for (const t of p.schema) types[t] = (types[t] || 0) + 1;
for (const [t, n] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
  console.log('   ' + String(n).padStart(4) + '  ' + t);
}
const noSchema = journeys.filter((p) => !p.schema.length);
if (noSchema.length) {
  console.log('\n   Bina structured data ke journey safhe: ' + noSchema.length);
  for (const p of noSchema.slice(0, 10)) console.log('        ' + p.url);
}

/* ---- FAQ ---- */

const noFaq = journeys.filter((p) => !p.faq);
console.log('\n--- FAQ ---\n');
console.log('   FAQ wale journey safhe: ' + (journeys.length - noFaq.length) + ' / ' + journeys.length);
if (noFaq.length) for (const p of noFaq.slice(0, 15)) console.log('        nahi:  ' + p.url);

/* ---- GEO ---- */

console.log('\n--- GEO (AI assistants ke liye) ---\n');
for (const f of ['llms.txt', 'llms-full.txt', 'robots.txt', 'sitemap.xml', 'feed.xml']) {
  const t = read(path.join(SITE, f));
  console.log('   ' + f.padEnd(16) + (t ? (t.length + ' chars') : 'NAHI HAI'));
}

const robots = read(path.join(SITE, 'robots.txt')) || '';
if (/Disallow:\s*\/\s*$/m.test(robots)) {
  console.log('\n   !! robots.txt poori website ko rok raha hai.');
}
console.log('\n   robots.txt:');
for (const line of robots.split(/\r?\n/).slice(0, 14)) console.log('      ' + line);

/* ---- noindex ---- */

const hidden = pages.filter((p) => p.noindex);
console.log('\n--- GOOGLE SE CHHUPE SAFHE: ' + hidden.length + ' ---');
for (const p of hidden) console.log('        ' + p.url);

console.log('\n================ KHATAM ================\n');
