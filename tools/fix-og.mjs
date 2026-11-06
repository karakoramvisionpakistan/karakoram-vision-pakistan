#!/usr/bin/env node
/**
 * fix-og.mjs   (website ke folder mein)
 *
 * tools/og-images.mjs ko site se jorta hai. Chaar files:
 *
 *   1. package.json      — build:assets mein hero-crops ke baad og-images
 *   2. eleventy.config.js — naya filter "ogPick"
 *   3. layouts/base.njk   — og:image ab is tarteeb se chuna jata hai:
 *                           OG khana -> cover photo -> safhe ki hero photo ->
 *                           default banner. SVG kabhi nahi. JPG bani ho to wahi,
 *                           sath mein og:image:width / height / type.
 *   4. components/schema.njk — primaryImageOfPage bhi wahi tasweer
 *
 * SAB YA KUCH BHI NAHI. Backup: .bakog
 *
 *   node tools/fix-og.mjs            <- sirf dikhata hai
 *   node tools/fix-og.mjs --write    <- likhta hai
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const fail = (m, d) => { fails.push(m); if (d) fails.push('        ' + d); };

const files = new Map();
const load = (rel) => {
  if (files.has(rel)) return files.get(rel);
  const abs = path.join(ROOT, rel.split('/').join(path.sep));
  if (!fs.existsSync(abs)) return null;
  const orig = fs.readFileSync(abs, 'utf8');
  const hadCRLF = orig.includes('\r\n');
  const f = { rel, abs, orig, origLF: hadCRLF ? orig.replace(/\r\n/g, '\n') : orig, hadCRLF, changed: false };
  f.text = f.origLF;
  files.set(rel, f);
  return f;
};
const looseRe = (s) => {
  const toks = s.trim().match(/[A-Za-z0-9_$]+|[^\sA-Za-z0-9_$]/g) || [];
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let o = '';
  for (let i = 0; i < toks.length; i++) {
    if (i > 0) o += /[A-Za-z0-9_$]$/.test(toks[i - 1]) && /^[A-Za-z0-9_$]/.test(toks[i]) ? '\\s+' : '\\s*';
    o += esc(toks[i]);
  }
  return new RegExp(o);
};

say('');
say('OG PATCH' + (WRITE ? '   (LIKH RAHA HOON)' : '   (SIRF DIKHA RAHA HOON)'));
say('='.repeat(78));

if (!fs.existsSync(path.join(ROOT, 'tools', 'og-images.mjs'))) fail('XX  tools/og-images.mjs nahi mila — pehle woh rakhein');

/* ------------------------------------------------------------ 1. package.json */
say('');
say('1. package.json — build:assets');
say('-'.repeat(78));
const pk = load('package.json');
if (!pk) fail('XX  package.json nahi mili');
else if (pk.text.includes('tools/og-images.mjs')) say('   --  og-images pehle se build mein hai');
else {
  const needle = 'node tools/hero-crops.mjs && ';
  const n = pk.text.split(needle).length - 1;
  if (n !== 1) fail('XX  "' + needle.trim() + '" ' + n + ' jagah mila, 1 chahiye tha');
  else {
    pk.text = pk.text.replace(needle, needle + 'node tools/og-images.mjs && ');
    pk.changed = true;
    say('   OK  hero-crops ke foran baad og-images');
  }
}

/* ------------------------------------------------------------ 2. eleventy.config.js */
say('');
say('2. eleventy.config.js — ogPick filter');
say('-'.repeat(78));
const cfgRel = ['eleventy.config.js', 'eleventy.config.mjs', '.eleventy.js', 'eleventy.config.cjs'].find((n) => fs.existsSync(path.join(ROOT, n)));
const cfg = cfgRel ? load(cfgRel) : null;
if (!cfg) fail('XX  eleventy config nahi mili');
else if (/addFilter\(\s*["']ogPick["']/.test(cfg.text)) say('   --  ogPick pehle se hai');
else {
  if (!/addFilter\(\s*["']heroKey["']/.test(cfg.text)) fail('XX  heroKey filter nahi mila — base.njk usi se safhe ki hero photo dhoondhega');
  const L = cfg.text.split('\n');
  const start = L.findIndex((l) => /addFilter\(\s*["']heroPicture["']/.test(l));
  let end = -1;
  if (start >= 0) for (let i = start + 1; i < Math.min(L.length, start + 40); i++) if (/^\s*\}\);\s*$/.test(L[i])) { end = i; break; }
  if (start < 0 || end < 0) fail('XX  heroPicture filter ka aakhir nahi mila');
  else {
    const ind = (L[start].match(/^\s*/) || [''])[0];
    const block = [
      '',
      ind + '// Share image (og:image): pehli asli photo, SVG chhor kar. Agar us ki',
      ind + '// 1200x630 JPG tools/og-images.mjs ne banai hai to wahi, naap ke sath.',
      ind + 'eleventyConfig.addFilter("ogPick", (candidates, ogMap, fallback) => {',
      ind + '  const map = ogMap || {};',
      ind + '  for (const raw of candidates || []) {',
      ind + '    const v = String(raw || "").trim();',
      ind + '    if (!v || /\\.svg(\\?|$)/i.test(v)) continue;',
      ind + '    if (/apricot[-_ ]?tours|beyond[-_ ]?karakoram/i.test(v)) continue;',
      ind + '    const hit = map[v];',
      ind + '    if (hit) return { src: hit.src, w: hit.w, h: hit.h, type: "image/jpeg" };',
      ind + '    return { src: v, w: 0, h: 0, type: "" };',
      ind + '  }',
      ind + '  return { src: fallback || "", w: 0, h: 0, type: "" };',
      ind + '});',
    ];
    L.splice(end + 1, 0, ...block);
    cfg.text = L.join('\n');
    cfg.changed = true;
    say('   OK  heroPicture ke baad (line ' + (end + 2) + ')');
  }
}

/* ------------------------------------------------------------ 3. base.njk */
say('');
say('3. src/_includes/layouts/base.njk');
say('-'.repeat(78));
const base = load('src/_includes/layouts/base.njk');
if (!base) fail('XX  base.njk nahi mili');
else if (base.text.includes('socialPick')) say('   --  pehle se laga hua');
else {
  const B = looseRe("{% set socialImage = seo.social_image | safeMedia(pageImage, site.seo.default_social_image) | absoluteUrl(site.url) %}");
  const C = looseRe('<meta property="og:image" content="{{ socialImage }}">');
  const mb = base.text.match(B), mc = base.text.match(C);
  if (!mb) fail('XX  socialImage wali line nahi mili');
  if (!mc) fail('XX  og:image wali meta line nahi mili');
  if (mb && mc) {
    const indB = (base.text.slice(0, base.text.indexOf(mb[0])).match(/[ \t]*$/) || [''])[0];
    base.text = base.text.replace(mb[0], [
      '{% set heroCfgHead = heroSettings | heroConfig(page.url | heroKey) %}',
      indB + '{% set socialPick = [seo.social_image, cover_image, cover_source, heroCfgHead.image] | ogPick(ogImages, site.seo.default_social_image) %}',
      indB + '{% set socialImage = socialPick.src | absoluteUrl(site.url) %}',
    ].join('\n'));
    const mc2 = base.text.match(C);
    const indC = (base.text.slice(0, base.text.indexOf(mc2[0])).match(/[ \t]*$/) || [''])[0];
    base.text = base.text.replace(mc2[0], mc2[0] + '\n' + indC
      + '{% if socialPick.w %}<meta property="og:image:width" content="{{ socialPick.w }}"><meta property="og:image:height" content="{{ socialPick.h }}"><meta property="og:image:type" content="{{ socialPick.type }}">{% endif %}');
    base.changed = true;
    say('   OK  socialImage ab ogPick se');
    say('   OK  og:image:width / height / type');
  }
}

/* ------------------------------------------------------------ 4. schema.njk */
say('');
say('4. src/_includes/components/schema.njk');
say('-'.repeat(78));
const sch = load('src/_includes/components/schema.njk');
if (!sch) fail('XX  schema.njk nahi mili');
else if (sch.text.includes('socialPick')) say('   --  pehle se laga hua');
else {
  const A = looseRe("{% set primaryImagePath = (seo.social_image or cover_image) | safeMedia('', site.seo.default_social_image) %}");
  const m = sch.text.match(A);
  if (!m) fail('XX  primaryImagePath wali line nahi mili');
  else {
    sch.text = sch.text.replace(m[0],
      "{% set primaryImagePath = socialPick.src if (socialPick and socialPick.src) else ((seo.social_image or cover_image) | safeMedia('', site.seo.default_social_image)) %}");
    sch.changed = true;
    say('   OK  primaryImageOfPage bhi wahi tasweer');
  }
}

/* ------------------------------------------------------------ jaanch */
say('');
say('JAANCH');
say('-'.repeat(78));
const check = (ok, label) => { say('   ' + (ok ? 'OK  ' : 'XX  ') + label); if (!ok) fail('XX  jaanch nakaam: ' + label); };
if (pk && pk.changed) {
  let j = null; try { j = JSON.parse(pk.text); } catch { /* */ }
  check(!!j, 'package.json sahi JSON');
  check(j && /hero-crops\.mjs && node tools\/og-images\.mjs && node tools\/image-sizes/.test(j.scripts['build:assets'] || ''), 'build ki tarteeb: hero-crops -> og-images -> image-sizes');
}
if (cfg && cfg.changed) {
  check((cfg.text.match(/addFilter\(/g) || []).length === (cfg.origLF.match(/addFilter\(/g) || []).length + 1, 'sirf ek naya filter');
  if (!fails.length) {
    const tmp = path.join(ROOT, '_cfgcheck.tmp' + path.extname(cfgRel));
    try {
      fs.writeFileSync(tmp, cfg.text, 'utf8');
      execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
      check(true, 'config ko Node ne bina ghalti ke parh liya');
    } catch (e) {
      check(false, 'config syntax: ' + String(e.stderr || e.message).split('\n').filter(Boolean).slice(0, 3).join(' | ').slice(0, 160));
    } finally { try { fs.unlinkSync(tmp); } catch { /* */ } }
  }
}
/* Farq gino, kul nahi: schema.njk mein JSON hai aur JSON khud `}}` par band
   hota hai. Jo hum ne joda, us mein jitne khulte hain utne hi band hon. */
const cnt = (s, re) => (s.match(re) || []).length;
for (const f of [base, sch]) {
  if (!f || !f.changed) continue;
  const d = (re) => cnt(f.text, re) - cnt(f.origLF, re);
  check(d(/\{%/g) === d(/%\}/g), f.rel + ': nayi lines mein har {% ka %}  (+' + d(/\{%/g) + ')');
  check(d(/\{\{/g) === d(/\}\}/g), f.rel + ': nayi lines mein har {{ ka }}  (+' + d(/\{\{/g) + ')');
}
if (base && base.changed) {
  check((base.text.match(/property="og:image"/g) || []).length === 1, 'og:image ki line ek hi hai');
  check(base.text.includes('{% set socialImage = socialPick.src'), 'socialImage nayi tarteeb se');
}

/* ------------------------------------------------------------ nateeja */
say('');
say('='.repeat(78));
if (fails.length) {
  say('');
  say('   RUK GAYA — KUCH BHI NAHI BADLA');
  say('');
  for (const f of fails) say('   ' + f);
  fs.writeFileSync(path.join(ROOT, '_og_fix.txt'), out.join('\n') + '\n', 'utf8');
  console.log('-'.repeat(78)); console.log('LIKHA: _og_fix.txt');
  process.exit(1);
}
if (!WRITE) {
  say('');
  say('   Sab jaanch saaf. Abhi kuch likha NAHI.   Lagane ke liye:   node tools/fix-og.mjs --write');
  say('');
} else {
  say('');
  for (const [r, f] of files) {
    if (!f.changed) continue;
    fs.copyFileSync(f.abs, f.abs + '.bakog');
    fs.writeFileSync(f.abs, f.hadCRLF ? f.text.replace(/\n/g, '\r\n') : f.text, 'utf8');
    say('   LIKHA: ' + r + '   (backup: ' + path.basename(f.abs) + '.bakog)');
  }
  say('');
  say('   Ab:   npm run build');
  say('   Phir: node tools/og-images.mjs --verify');
  say('');
}
fs.writeFileSync(path.join(ROOT, '_og_fix.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78)); console.log('LIKHA: _og_fix.txt');
