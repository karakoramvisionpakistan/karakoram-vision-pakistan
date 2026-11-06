#!/usr/bin/env node
/**
 * fix-final.mjs   (website ke folder mein, npm run build ke BAAD)
 *
 * Do kaam:
 *
 *   A. CONTRAST ka aakhri hissa — CSS block V11.29. Har rang browser mein
 *      canvas se naape hue background par tola gaya hai:
 *
 *        .bk-home-contact / .bk-landing-cta  .eyebrow   2.95 -> narangi
 *        .bk-footer-rating-links small                  4.40 -> #a8b6c9
 *        .bk-credential dt                              4.03 -> opacity 1
 *        .bk-devcredit-role                             4.14 -> opacity 1
 *        .bk-footer-cta                                 2.59 -> #0f172a
 *
 *      Narangi ki asli qeemat CMS se aati hai (theme-vars.css), is liye
 *      script use _site se parh kar hisaab lagati hai, andaze se nahi.
 *
 *      Har selector mein class jaan boojh kar 2-3 baar likhi hai: matlab
 *      wahi rehta hai, sirf wazan barhta hai. V11.28 `.bk-footer-cta` par
 *      isi liye haara tha ke footer ka koi do-wazan wala rule us se bhari tha.
 *
 *   B. functions/_middleware.js se pages.dev wali lines hatana. _routes.json
 *      middleware ko sirf /api/* par chalata hai, to woh lines baqi site par
 *      kabhi chali hi nahi — aur un ka comment ulta batata tha.
 *
 * SAB YA KUCH BHI NAHI. Backup: .bakfin
 *
 *   node tools/fix-final.mjs            <- sirf dikhata hai
 *   node tools/fix-final.mjs --write    <- likhta hai
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const fail = (m, d) => { fails.push(m); if (d) fails.push('        ' + d); };

/* ---------- WCAG ---------- */
const sg = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * sg(r) + 0.7152 * sg(g) + 0.0722 * sg(b);
const ratio = (a, b) => { const l = [lum(a), lum(b)].sort((x, y) => y - x); return (l[0] + 0.05) / (l[1] + 0.05); };
const hx = (h) => { const t = h.replace('#', ''); const f = t.length === 3 ? t.split('').map((c) => c + c).join('') : t; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };
const isHex = (s) => /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(s || '').trim());

/* ---------- files ---------- */
const files = new Map();
const load = (rel) => {
  if (files.has(rel)) return files.get(rel);
  const abs = path.join(ROOT, rel.split('/').join(path.sep));
  if (!fs.existsSync(abs)) return null;
  const orig = fs.readFileSync(abs, 'utf8');
  const hadCRLF = orig.includes('\r\n');
  const f = { abs, orig, origLF: hadCRLF ? orig.replace(/\r\n/g, '\n') : orig, hadCRLF, changed: false };
  f.text = f.origLF;
  files.set(rel, f);
  return f;
};

say('');
say('AAKHRI PATCH' + (WRITE ? '   (LIKH RAHA HOON)' : '   (SIRF DIKHA RAHA HOON)'));
say('='.repeat(78));

/* ==================================================================== */
/* A. CONTRAST                                                          */
/* ==================================================================== */
say('');
say('A. CONTRAST — V11.29');
say('-'.repeat(78));

/* asli narangi: CMS ki banai theme-vars.css se */
const tvPath = path.join(ROOT, '_site', 'assets', 'css', 'theme-vars.css');
let accent = null, accentHover = null;
if (fs.existsSync(tvPath)) {
  const tv = fs.readFileSync(tvPath, 'utf8');
  accent = ((tv.match(/--bk-accent\s*:\s*([^;]+);/) || [])[1] || '').trim();
  accentHover = ((tv.match(/--bk-accent-hover\s*:\s*([^;]+);/) || [])[1] || '').trim();
}
if (!isHex(accent) || !isHex(accentHover)) {
  fail('XX  _site/assets/css/theme-vars.css se narangi nahi parh saka — pehle npm run build chalayein',
    'mila: --bk-accent=' + accent + '  --bk-accent-hover=' + accentHover);
} else {
  say('   CMS ka narangi:  --bk-accent ' + accent + '   --bk-accent-hover ' + accentHover);
}

const CSSREL = 'src/assets/css/input.css';
const css = load(CSSREL);
if (!css) fail('XX  ' + CSSREL + ' nahi mili');

const DARK = '#0f172a';
const SLATE950 = [2, 6, 23];

const T = [];
if (isHex(accent)) {
  T.push({
    name: 'eyebrow (.bk-home-contact, .bk-landing-cta)',
    sels: ['.bk-home-contact .eyebrow.eyebrow', '.bk-landing-cta .eyebrow.eyebrow'],
    decl: 'color: var(--bk-accent, #ff5a1f);',
    keyClass: 'eyebrow', prop: 'color',
    tests: [[accent, SLATE950, 'CMS narangi'], ['#ff5a1f', SLATE950, 'fallback']],
    was: 2.95, px: 12, w: 900,
  });
  T.push({
    name: '.bk-footer-rating-links small',
    sels: ['.bk-footer-rating-links.bk-footer-rating-links small'],
    decl: 'color: #a8b6c9;',
    keyClass: 'bk-footer-rating-links', prop: 'color',
    tests: [['#a8b6c9', [21, 55, 122], 'neela panel']],
    was: 4.40, px: 10.4, w: 400,
  });
  T.push({
    name: '.bk-credential dt',
    sels: ['.bk-credential.bk-credential.bk-credential dt'],
    decl: 'opacity: 1;',
    keyClass: 'bk-credential', prop: 'opacity',
    fixed: 8.57, was: 4.03,
  });
  T.push({
    name: '.bk-devcredit-role',
    sels: ['.bk-devcredit-role.bk-devcredit-role.bk-devcredit-role'],
    decl: 'opacity: 1;',
    keyClass: 'bk-devcredit-role', prop: 'opacity',
    fixed: 8.26, was: 4.14,
  });
  T.push({
    name: '.bk-footer-cta',
    sels: ['.bk-footer-cta.bk-footer-cta.bk-footer-cta',
      '.bk-footer-cta.bk-footer-cta.bk-footer-cta:hover',
      '.bk-footer-cta.bk-footer-cta.bk-footer-cta:focus-visible'],
    decl: 'color: ' + DARK + ';',
    keyClass: 'bk-footer-cta', prop: 'color',
    tests: [[DARK, hx(accent), 'aam halat'], [DARK, hx(accentHover), 'hover']],
    was: 2.59, px: 14, w: 600,
  });
}

/* hisaab */
if (css && T.length) {
  say('');
  for (const t of T) {
    if (t.fixed) {
      say('   ' + t.name.padEnd(46) + t.was.toFixed(2) + ' -> ' + t.fixed.toFixed(2) + '   OK   (opacity hatane se, browser ka naap)');
      continue;
    }
    const need = (t.px >= 24 || (t.px >= 18.66 && t.w >= 700)) ? 3 : 4.5;
    const parts = [];
    let worst = 99;
    for (const [fg, bg, label] of t.tests) {
      const r = ratio(hx(fg), bg);
      worst = Math.min(worst, r);
      parts.push(label + ' ' + r.toFixed(2));
    }
    say('   ' + t.name.padEnd(46) + t.was.toFixed(2) + ' -> ' + worst.toFixed(2) + '   ' + (worst >= need ? 'OK ' : 'XX ') + '  (' + parts.join(', ') + ')');
    if (worst < need) fail('XX  ' + t.name + ' naye rang par bhi ' + need + ' tak nahi pohnchta (' + worst.toFixed(2) + ')');
    t.after = worst;
  }

  /* !important: sirf usi property par jo hum badal rahe hain */
  say('');
  say('   !important ki jaanch (sirf jo property hum badal rahe hain):');
  const lines = css.text.split('\n');
  for (const t of T) {
    const kc = new RegExp('\\.' + t.keyClass + '(?![\\w-])');
    const pr = new RegExp('(^|[;{\\s])' + t.prop + '\\s*:[^;}]*!important');
    let hit = null;
    for (let i = 0; i < lines.length; i++) {
      if (!kc.test(lines[i])) continue;
      /* selector se { tak, phir body } tak */
      let j = i, sel = lines[i];
      while (!sel.includes('{') && j + 1 < lines.length && j - i < 5) { j++; sel += ' ' + lines[j]; }
      if (!sel.includes('{')) continue;
      let body = sel.slice(sel.indexOf('{')), k = j;
      while (!body.includes('}') && k + 1 < lines.length && k - j < 40) { k++; body += '\n' + lines[k]; }
      if (kc.test(sel.split('{')[0]) && pr.test(body)) { hit = i + 1; break; }
    }
    say('      ' + t.name.padEnd(46) + (hit ? 'XX  line ' + hit : 'OK'));
    if (hit) fail('XX  ' + t.name + ': line ' + hit + ' par ' + t.prop + ' !important hai — yeh patch us se nahi jeet sakta');
  }

  /* button par inline style to nahi? */
  const idx = path.join(ROOT, '_site', 'index.html');
  if (fs.existsSync(idx)) {
    const html = fs.readFileSync(idx, 'utf8');
    const tag = (html.match(/<a[^>]*\bbk-footer-cta\b[^>]*>/) || [])[0];
    say('');
    say('   footer button ka asli tag:');
    say('      ' + (tag ? tag.slice(0, 140) : '(homepage par nahi mila)'));
    if (tag && /\bstyle\s*=/.test(tag)) fail('XX  footer button par inline style="" hai — CSS us se nahi jeet sakti', tag.slice(0, 140));
  }

  if (!/===\s*V11\.28\s*END\s*===/.test(css.text)) fail('XX  V11.28 ka marker nahi mila');
  if (/===\s*V11\.29\s*/.test(css.text)) fail('XX  V11.29 pehle se mojood hai — patch dobara nahi lagta');

  if (!fails.length) {
    const b = [];
    b.push('/* === V11.29 START === */');
    b.push('/* Contrast ka aakhri hissa. Rang browser mein canvas se naape gaye hain.');
    b.push('   Narangi CMS se aata hai (theme-vars.css: ' + accent + ' / ' + accentHover + ').');
    b.push('   Class jaan boojh kar 2-3 baar likhi hai — matlab wahi, wazan zyada —');
    b.push('   kyunki V11.28 `.bk-footer-cta` par footer ke bhari rule se haar gaya tha. */');
    for (const t of T) {
      b.push('');
      b.push('/* ' + t.name + ': ' + t.was.toFixed(2) + ' -> ' + (t.fixed || t.after).toFixed(2) + ' */');
      b.push(t.sels.join(',\n') + ' {');
      b.push('  ' + t.decl);
      b.push('}');
    }
    b.push('/* === V11.29 END === */');
    css.text = css.text.replace(/\s*$/, '\n') + '\n' + b.join('\n') + '\n';
    css.changed = true;
  }
}

/* ==================================================================== */
/* B. MIDDLEWARE                                                        */
/* ==================================================================== */
say('');
say('B. functions/_middleware.js — pages.dev wali lines hatana');
say('-'.repeat(78));

const MREL = 'functions/_middleware.js';
const mw = load(MREL);
if (!mw) fail('XX  ' + MREL + ' nahi mili');
else if (!/pages\.dev/.test(mw.text)) {
  say('   --  pages.dev ka zikr nahi — pehle hi saaf hai, kuch nahi karna');
} else {
  const re = /\n[ \t]*\/\* Site ka asli pata[\s\S]*?Response\.redirect\([^;]*\);\s*\n[ \t]*\}\s*\n(\s*\n)?/;
  const m = mw.text.match(re);
  if (!m) fail('XX  pages.dev wala block pehchana nahi gaya — haath se dekhna hoga');
  else {
    mw.text = mw.text.replace(m[0], '\n');
    mw.changed = true;
    say('   OK  ' + m[0].split('\n').filter(Boolean).length + ' lines hatayi');
    /* kya ab file wahi hai jo fix-headers se pehle thi? */
    const bak = mw.abs + '.bakhdr';
    if (fs.existsSync(bak)) {
      const b = fs.readFileSync(bak, 'utf8').replace(/\r\n/g, '\n');
      say('   ' + (b.trim() === mw.text.trim() ? 'OK  ab file bilkul wahi hai jo fix-headers se pehle thi'
        : '--  file .bakhdr se thori alag hai (shayad beech mein kisi ne badli) — koi masla nahi'));
    }
  }
}

/* ==================================================================== */
/* JAANCH                                                               */
/* ==================================================================== */
say('');
say('JAANCH');
say('-'.repeat(78));
const check = (ok, label) => { say('   ' + (ok ? 'OK  ' : 'XX  ') + label); if (!ok) fail('XX  jaanch nakaam: ' + label); };

if (css && css.changed) {
  const o = (css.text.match(/\{/g) || []).length, c = (css.text.match(/\}/g) || []).length;
  check(o === c, 'CSS ke bracket barabar  (' + o + ' / ' + c + ')');
  check(/===\s*V11\.29\s*END\s*===\s*\*\/\s*$/.test(css.text), 'V11.29 file ke sab se aakhir mein');
  check(css.text.startsWith(css.origLF.replace(/\s*$/, '')), 'purana CSS chhua nahi, sirf aakhir mein jora');
  check(css.text.length > css.origLF.length, 'file bari hui  (+' + (css.text.length - css.origLF.length) + ' harf)');
  check(!/!important/.test(css.text.slice(css.origLF.length)), 'naye block mein koi !important nahi');
  for (const t of T) check(css.text.includes(t.sels[0]), 'block mein: ' + t.name);
}
if (mw && mw.changed) {
  check(!/pages\.dev/.test(mw.text), 'middleware mein pages.dev nahi raha');
  check(/context\.next\(\)/.test(mw.text), 'context.next() bacha hua');
  check(mw.text.includes("headers.set('X-Content-Type-Options'"), 'purane headers bache hue');
  const ob = (mw.text.match(/\{/g) || []).length, cb = (mw.text.match(/\}/g) || []).length;
  check(ob === cb, 'middleware ke bracket barabar  (' + ob + ' / ' + cb + ')');
  if (!fails.length) {
    const tmp = path.join(ROOT, '_mwcheck.tmp.mjs');
    try {
      fs.writeFileSync(tmp, mw.text, 'utf8');
      const u = await import('node:url');
      await import(u.pathToFileURL(tmp).href);
      check(true, 'middleware ko Node ne bina ghalti ke parh liya');
    } catch (e) { check(false, 'middleware syntax: ' + String(e.message).slice(0, 80)); }
    finally { try { fs.unlinkSync(tmp); } catch { } }
  }
}

/* ==================================================================== */
say('');
say('='.repeat(78));
if (fails.length) {
  say('');
  say('   RUK GAYA — KUCH BHI NAHI BADLA');
  say('');
  for (const f of fails) say('   ' + f);
  say('');
  fs.writeFileSync(path.join(ROOT, '_final.txt'), out.join('\n') + '\n', 'utf8');
  console.log('-'.repeat(78));
  console.log('LIKHA: _final.txt');
  process.exit(1);
}

say('');
say('   JO HOGA:');
for (const [rel, f] of files) if (f.changed) say('      ' + rel);
say('');
say('   DEKHNE MEIN KYA BADLEGA:');
say('      - "START A CONVERSATION" neele se narangi');
say('      - footer: "Google reviews" / "Traveller reviews" thore roshan');
say('      - footer: "GOVERNMENT LICENCE", "MEMBER OF", "REGISTERED WITH",');
say('        "SOFTWARE DEVELOPER" ab dhundle nahi, poore roshan');
say('      - "Subscribe by email" ka matan safaid se gehra');

if (!WRITE) {
  say('');
  say('   Abhi kuch likha NAHI.   Lagane ke liye:   node tools/fix-final.mjs --write');
  say('');
} else {
  say('');
  for (const [rel, f] of files) {
    if (!f.changed) continue;
    fs.copyFileSync(f.abs, f.abs + '.bakfin');
    fs.writeFileSync(f.abs, f.hadCRLF ? f.text.replace(/\n/g, '\r\n') : f.text, 'utf8');
    say('   LIKHA: ' + rel + '   (backup: ' + path.basename(f.abs) + '.bakfin)');
  }
  say('');
  say('   Ab:   npm run build');
  say('');
}
fs.writeFileSync(path.join(ROOT, '_final.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _final.txt');
