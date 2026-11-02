#!/usr/bin/env node
/**
 * fix-headers.mjs   (website ke folder mein)
 *
 * Do kaam:
 *
 *   1. CSP mein cloudflareinsights.com jorta hai.
 *      Abhi script-src mein static.cloudflareinsights.com to hai, magar
 *      connect-src mein woh pata nahi jahan beacon apna data bhejta hai.
 *      Is liye Cloudflare Web Analytics khamoshi se ruka hua hai.
 *
 *   2. karakoram-vision-pakistan-6od.pages.dev par aane wale ko 301 se
 *      www.karakoramvision.com par bhej deta hai.
 *      PREVIEW walon ko haath nahi lagata — woh aap ke apne kaam ke liye
 *      zaroori hain. Sirf production wale ek pate par lagta hai.
 *
 * SAB YA KUCH BHI NAHI. Backup: .bakhdr
 *
 *   node tools/fix-headers.mjs            <- sirf dikhata hai
 *   node tools/fix-headers.mjs --write    <- likhta hai
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const fail = (m, d) => { fails.push(m); if (d) fails.push('        ' + d); };

const PROD_HOST = 'karakoram-vision-pakistan-6od.pages.dev';
const SITE = 'https://www.karakoramvision.com';
const BEACON = 'https://cloudflareinsights.com';

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
say('HEADERS PATCH' + (WRITE ? '   (LIKH RAHA HOON)' : '   (SIRF DIKHA RAHA HOON)'));
say('='.repeat(78));

/* ==================================================================== */
/* 1. CSP                                                               */
/* ==================================================================== */
say('');
say('1. src/_headers  —  CSP mein beacon ka pata');
say('-'.repeat(78));

const HREL = 'src/_headers';
const hdr = load(HREL);

if (!hdr) fail('XX  ' + HREL + ' nahi mili');
else {
  const lines = hdr.text.split('\n');
  let cspLine = -1;
  lines.forEach((l, i) => { if (/Content-Security-Policy\s*:/i.test(l)) cspLine = i; });

  if (cspLine < 0) fail('XX  Content-Security-Policy wali line nahi mili');
  else {
    const l = lines[cspLine];
    say('   line ' + (cspLine + 1) + ' mili');

    if (l.includes(BEACON + ';') || new RegExp('connect-src[^;]*' + BEACON.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(l)) {
      fail('XX  connect-src mein ' + BEACON + ' pehle se hai — patch dobara nahi lagta');
    } else {
      const m = l.match(/connect-src\s+'self'/);
      if (!m) {
        fail("XX  connect-src 'self' nahi mila");
        const c = l.match(/connect-src[^;]*/);
        if (c) fails.push('        asli: ' + c[0].slice(0, 140));
      } else {
        lines[cspLine] = l.replace(m[0], m[0] + ' ' + BEACON);
        hdr.text = lines.join('\n');
        hdr.changed = true;
        const now = lines[cspLine].match(/connect-src[^;]*/)[0];
        say('   OK  connect-src ab:');
        say('          ' + now.slice(0, 150));
      }
    }
  }
}

/* ==================================================================== */
/* 2. pages.dev -> asli domain                                          */
/* ==================================================================== */
say('');
say('2. functions/_middleware.js  —  pages.dev se asli domain par 301');
say('-'.repeat(78));

const MREL = 'functions/_middleware.js';
const mw = load(MREL);

if (!mw) fail('XX  ' + MREL + ' nahi mili');
else if (/PROD_HOST|pages\.dev/.test(mw.text)) {
  fail('XX  us mein pages.dev ka zikr pehle se hai — patch dobara nahi lagta');
} else {
  const anchor = mw.text.match(/export\s+async\s+function\s+onRequest\s*\(\s*(\w+)\s*\)\s*\{/);
  if (!anchor) {
    fail('XX  onRequest ka aghaz nahi mila');
    mw.text.split('\n').slice(0, 4).forEach((l, i) => fails.push('        line ' + (i + 1) + ': ' + l.slice(0, 110)));
  } else {
    const ctx = anchor[1];
    const block = [
      '',
      '  /* Site ka asli pata www.karakoramvision.com hai. Jo seedha production',
      '     wale pages.dev par aaye, use wahan bhej dete hain — taake ek hi pata',
      '     rahe aur search engines ko shak na ho.',
      '     Preview ke pate (<hash>.karakoram-vision-pakistan.pages.dev) is se',
      '     bache rehte hain, kyunki unka host alag hota hai. */',
      '  const url = new URL(' + ctx + '.request.url);',
      "  if (url.hostname === '" + PROD_HOST + "') {",
      "    return Response.redirect('" + SITE + "' + url.pathname + url.search, 301);",
      '  }',
      '',
    ].join('\n');
    mw.text = mw.text.replace(anchor[0], anchor[0] + block);
    mw.changed = true;
    say('   OK  ' + PROD_HOST);
    say('          ->  ' + SITE + ' (301)');
    say('   OK  preview ke pate waise hi rahenge');
  }
}

/* ==================================================================== */
/* JAANCH                                                               */
/* ==================================================================== */
say('');
say('JAANCH');
say('-'.repeat(78));
const check = (ok, label) => { say('   ' + (ok ? 'OK  ' : 'XX  ') + label); if (!ok) fail('XX  jaanch nakaam: ' + label); };

if (hdr && hdr.changed) {
  const L = hdr.text.split('\n');
  const o = hdr.origLF.split('\n');
  check(L.length === o.length, 'lines ki ginti waisi hi hai  (' + o.length + ')');
  const csp = L.find((l) => /Content-Security-Policy/i.test(l));
  check(/connect-src\s+'self'\s+https:\/\/cloudflareinsights\.com/.test(csp), 'beacon ka pata connect-src mein aa gaya');
  for (const must of ["default-src 'self'", "object-src 'none'", 'upgrade-insecure-requests', 'https://*.tawk.to', 'https://formspree.io']) {
    check(csp.includes(must), 'CSP mein bacha hua: ' + must);
  }
  check((csp.match(/;/g) || []).length === (o.find((l) => /Content-Security-Policy/i.test(l)).match(/;/g) || []).length,
    'CSP ke hissay utne hi hain (koi ; kam ya zyada nahi)');
  check(hdr.text.includes('/assets/*') && hdr.text.includes('Cache-Control'), 'baqi headers chhue nahi gaye');
}
if (mw && mw.changed) {
  check(mw.text.includes(PROD_HOST), 'production host likha gaya');
  check(mw.text.includes(SITE), 'asli domain likha gaya');
  check(mw.text.includes('Response.redirect') && mw.text.includes('301'), '301 ka intezam mojood');
  check(/context\.next\(\)|\.next\(\)/.test(mw.text), 'purana context.next() bacha hua hai');
  check(mw.text.includes("headers.set('X-Content-Type-Options'"), 'purane headers bache hue hain');
  const ob = (mw.text.match(/\{/g) || []).length, cb = (mw.text.match(/\}/g) || []).length;
  check(ob === cb, 'bracket barabar hain  (' + ob + ' / ' + cb + ')');
  const op = (mw.text.match(/\(/g) || []).length, cp = (mw.text.match(/\)/g) || []).length;
  check(op === cp, '( ) barabar hain  (' + op + ' / ' + cp + ')');
}

/* JS waqai chalti hai? */
if (mw && mw.changed && !fails.length) {
  const tmp = path.join(ROOT, '_mwcheck.tmp.mjs');
  try {
    fs.writeFileSync(tmp, mw.text, 'utf8');
    const u = await import('node:url');
    await import(u.pathToFileURL(tmp).href);
    check(true, 'badli hui middleware ko Node ne bina ghalti ke parh liya');
  } catch (e) {
    check(false, 'middleware mein syntax ghalti: ' + String(e.message).slice(0, 90));
  } finally { try { fs.unlinkSync(tmp); } catch { } }
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
  fs.writeFileSync(path.join(ROOT, '_headers_fix.txt'), out.join('\n') + '\n', 'utf8');
  console.log('-'.repeat(78));
  console.log('LIKHA: _headers_fix.txt');
  process.exit(1);
}

say('');
say('   JO HOGA:');
for (const [rel, f] of files) if (f.changed) say('      ' + rel);
say('');
say('   ASAR:');
say('      - Cloudflare Web Analytics chalne lagega (abhi khamoshi se ruka hua hai)');
say('      - pages.dev par aane wala asli domain par chala jayega');
say('      - preview ke pate waise hi kaam karte rahenge');

if (!WRITE) {
  say('');
  say('   Abhi kuch likha NAHI.');
  say('   Lagane ke liye:   node tools/fix-headers.mjs --write');
  say('');
} else {
  say('');
  for (const [rel, f] of files) {
    if (!f.changed) continue;
    fs.copyFileSync(f.abs, f.abs + '.bakhdr');
    fs.writeFileSync(f.abs, f.hadCRLF ? f.text.replace(/\n/g, '\r\n') : f.text, 'utf8');
    say('   LIKHA: ' + rel + '   (backup: ' + path.basename(f.abs) + '.bakhdr)');
  }
  say('');
  say('   Ab:   npm run build');
  say('');
}

fs.writeFileSync(path.join(ROOT, '_headers_fix.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _headers_fix.txt');
