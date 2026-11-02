#!/usr/bin/env node
/**
 * fix-hero-a11y.mjs   (website ke folder mein)
 *
 * PageSpeed ki ARIA wali teen ghaltiyan — jar hero slider mein hai.
 *
 *   1. role="tablist"  ->  role="group"
 *      tablist apne andar role="tab" maangta hai; dots saaday button hain.
 *      Carousel ke dots asal mein tabs hote hi nahi, is liye wada hi hata dete hain.
 *
 *   2. aria-selected  ->  aria-current   (template aur JS, dono mein)
 *      aria-selected saaday button par jaiz nahi; sirf tab/option/row par chalta hai.
 *
 *   3. inert           (template aur JS, dono mein)
 *      Jo slides nazar nahi aa rahin un par aria-hidden to hai, magar un ke
 *      "Plan a trip" link par keyboard ka focus ab bhi ja sakta hai. inert
 *      us hisse ko focus aur click, dono se nikaal deta hai.
 *
 * SAB YA KUCH BHI NAHI. Backup: .bakhero
 *
 *   node tools/fix-hero-a11y.mjs            <- sirf dikhata hai
 *   node tools/fix-hero-a11y.mjs --write    <- likhta hai
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const fails = [];
const steps = [];
const fail = (m, d) => { fails.push(m); if (d) fails.push('        ' + d); };

/* ---------- file padhna, CRLF ka khayal ---------- */
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

/* ---------- nukta-posi se bemutaliq milaan ----------
   Ek space ka farq poora kaam rok deta hai. Yeh tokens par milata hai. */
const looseRe = (s) => {
  const toks = s.trim().match(/[A-Za-z0-9_$]+|[^\sA-Za-z0-9_$]/g) || [];
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let o = '';
  for (let i = 0; i < toks.length; i++) {
    if (i > 0) {
      const pw = /[A-Za-z0-9_$]$/.test(toks[i - 1]);
      const cw = /^[A-Za-z0-9_$]/.test(toks[i]);
      o += pw && cw ? '\\s+' : '\\s*';
    }
    o += esc(toks[i]);
  }
  return new RegExp(o);
};
const show = (s) => s.replace(/ /g, '·');

say('');
say('HERO ARIA PATCH' + (WRITE ? '   (LIKH RAHA HOON)' : '   (SIRF DIKHA RAHA HOON)'));
say('='.repeat(78));

/* ==================================================================== */
/* pehle jaanch lein ke jin cheezon ko haath lagana hai woh kitni jagah  */
/* ==================================================================== */
say('');
say('0. PEHLE GIN LETE HAIN — kahin aur to nahi?');
say('-'.repeat(78));

const countIn = (dir, re) => {
  const hits = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.') || /\.bak/.test(e.name)) continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.(njk|js|mjs|html)$/.test(e.name) && !/\.min\./.test(e.name)) {
        let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
        t.split(/\r?\n/).forEach((l, i) => { if (re.test(l)) hits.push([path.relative(ROOT, f).split(path.sep).join('/'), i + 1, l.trim().slice(0, 100)]); });
      }
    }
  };
  walk(path.join(ROOT, dir));
  return hits;
};

const selHits = countIn('src', /aria-selected/);
const tabHits = countIn('src', /role\s*=\s*["']tablist["']/);
say('   aria-selected:');
for (const [f, n, l] of selHits) say('      ' + f + ':' + n + '   ' + l);
say('   role="tablist":');
for (const [f, n, l] of tabHits) say('      ' + f + ':' + n + '   ' + l);
if (!selHits.length) fail('XX  aria-selected kahin nahi mila');
if (!tabHits.length) fail('XX  role="tablist" kahin nahi mila');
if (selHits.length > 2) fail('XX  aria-selected ' + selHits.length + ' jagah hai — patch sirf 2 ke liye bana hai (template + JS)');
if (tabHits.length > 1) fail('XX  role="tablist" ' + tabHits.length + ' jagah hai — patch sirf hero ke liye bana hai');

/* ==================================================================== */
/* 1. TEMPLATE                                                          */
/* ==================================================================== */
say('');
say('1. src/_includes/components/landing-hero.njk');
say('-'.repeat(78));

const TREL = 'src/_includes/components/landing-hero.njk';
const tpl = load(TREL);

if (!tpl) fail('XX  ' + TREL + ' nahi mili');
else {
  /* (a) tablist -> group */
  const mTab = tpl.text.match(/(<div[^>]*\bbk-hero-dots\b[^>]*\brole\s*=\s*)(["'])tablist\2/);
  if (!mTab) fail('XX  bk-hero-dots par role="tablist" nahi mila');
  else {
    tpl.text = tpl.text.replace(mTab[0], mTab[1] + mTab[2] + 'group' + mTab[2]);
    say('   OK  role="tablist"  ->  role="group"');
  }

  /* (b) aria-selected -> aria-current, sirf dots wali line par */
  const lines = tpl.text.split('\n');
  let dotLine = -1;
  lines.forEach((l, i) => { if (/data-hero-dot/.test(l) && /aria-selected/.test(l)) dotLine = i; });
  if (dotLine < 0) fail('XX  dots wali line (data-hero-dot + aria-selected) nahi mili');
  else {
    const before = lines[dotLine];
    lines[dotLine] = before.replace(/\baria-selected\b/g, 'aria-current');
    say('   OK  line ' + (dotLine + 1) + ':  aria-selected  ->  aria-current');
    tpl.text = lines.join('\n');
  }

  /* (c) inert — slides wali loop line par */
  const lines2 = tpl.text.split('\n');
  let slideLine = -1;
  lines2.forEach((l, i) => {
    if (/<article[^>]*\bbk-hero-slide\b/.test(l) && /data-hero-slide/.test(l) && /loop\.first/.test(l)) slideLine = i;
  });
  if (slideLine < 0) fail('XX  slides wali loop line nahi mili', 'chahiye thi: <article class="bk-hero-slide{% if loop.first %}...  data-hero-slide ...');
  else if (/\binert\b/.test(lines2[slideLine])) fail('XX  us line par inert pehle se hai — patch dobara nahi lagta');
  else {
    lines2[slideLine] = lines2[slideLine].replace(/\bdata-hero-slide\b/, 'data-hero-slide{% if not loop.first %} inert{% endif %}');
    say('   OK  line ' + (slideLine + 1) + ':  pehli ke alawa har slide par inert');
    tpl.text = lines2.join('\n');
  }

  if (tpl.text !== tpl.origLF) { tpl.changed = true; steps.push(TREL + '  —  role=group, aria-current, inert'); }
}

/* ==================================================================== */
/* 2. JS                                                                */
/* ==================================================================== */
say('');
say('2. src/assets/js/site-core.js');
say('-'.repeat(78));

const JREL = 'src/assets/js/site-core.js';
const js = load(JREL);

if (!js) fail('XX  ' + JREL + ' nahi mili');
else {
  /* (a) aria-hidden wali line ke sath inert */
  const aHidden = "slide.setAttribute('aria-hidden', String(index !== active));";
  const reH = looseRe(aHidden);
  const mH = js.text.match(reH);
  if (!mH) {
    fail('XX  JS mein aria-hidden wali line nahi mili');
    const near = js.text.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /aria-hidden/.test(l) && /slide/i.test(l));
    for (const [n, l] of near.slice(0, 4)) fails.push('        asli line ' + n + ':  ' + show(l.trim().slice(0, 110)));
  } else {
    const indent = (js.text.slice(0, js.text.indexOf(mH[0])).match(/\n([ \t]*)$/) || [, '          '])[1];
    js.text = js.text.replace(mH[0], mH[0] + '\n' + indent + "slide.toggleAttribute('inert', index !== active);");
    say('   OK  aria-hidden ke sath  slide.toggleAttribute(\'inert\', index !== active)');
  }

  /* (b) aria-selected -> aria-current */
  const aSel = "dot.setAttribute('aria-selected', String(index === active));";
  const reS = looseRe(aSel);
  const mS = js.text.match(reS);
  if (!mS) {
    fail('XX  JS mein aria-selected wali line nahi mili');
    const near = js.text.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /aria-selected/.test(l));
    for (const [n, l] of near.slice(0, 4)) fails.push('        asli line ' + n + ':  ' + show(l.trim().slice(0, 110)));
  } else {
    js.text = js.text.replace(mS[0], mS[0].replace('aria-selected', 'aria-current'));
    say('   OK  dot.setAttribute(\'aria-selected\' ...)  ->  \'aria-current\'');
  }

  if (js.text !== js.origLF) { js.changed = true; steps.push(JREL + '  —  inert toggle, aria-current'); }
}

/* ==================================================================== */
/* JAANCH                                                               */
/* ==================================================================== */
say('');
say('JAANCH');
say('-'.repeat(78));
const check = (ok, label) => { say('   ' + (ok ? 'OK  ' : 'XX  ') + label); if (!ok) fail('XX  jaanch nakaam: ' + label); };

if (tpl && tpl.changed) {
  check(!/role\s*=\s*["']tablist["']/.test(tpl.text), 'template mein role="tablist" nahi raha');
  check(/bk-hero-dots[^>]*role\s*=\s*["']group["']/.test(tpl.text), 'bk-hero-dots par role="group" aa gaya');
  check(!/aria-selected/.test(tpl.text), 'template mein aria-selected nahi raha');
  check(/data-hero-dot[^>]*aria-current/.test(tpl.text), 'dots par aria-current aa gaya');
  check(/data-hero-slide\{%\s*if\s+not\s+loop\.first\s*%\}\s*inert\{%\s*endif\s*%\}/.test(tpl.text), 'slides par shart ke sath inert aa gaya');
  const o = (tpl.origLF.match(/\{%/g) || []).length, n = (tpl.text.match(/\{%/g) || []).length;
  check(n === o + 2, 'Nunjucks ke {% %} theek gine  (' + o + ' -> ' + n + ', do naye)');
  check((tpl.text.match(/\{%/g) || []).length === (tpl.text.match(/%\}/g) || []).length, 'har {% ka %} mojood');
  check(tpl.text.split('\n').length === tpl.origLF.split('\n').length, 'lines ki ginti waisi hi hai');
  check((tpl.text.match(/<article/g) || []).length === (tpl.origLF.match(/<article/g) || []).length, '<article> ki ginti waisi hi hai');
}
if (js && js.changed) {
  check(!/aria-selected/.test(js.text), 'JS mein aria-selected nahi raha');
  check(/dot\.setAttribute\(\s*'aria-current'/.test(js.text), 'JS mein aria-current aa gaya');
  check(/toggleAttribute\(\s*'inert'\s*,\s*index\s*!==\s*active\s*\)/.test(js.text), 'JS mein inert ka toggle aa gaya');
  check(/setAttribute\(\s*'aria-hidden'\s*,\s*String\(index\s*!==\s*active\)\s*\)/.test(js.text), 'aria-hidden wali purani line bhi bacchi hai');
  check(js.text.split('\n').length === js.origLF.split('\n').length + 1, 'sirf ek nayi line jori  (' + js.origLF.split('\n').length + ' -> ' + js.text.split('\n').length + ')');
  const ob = (js.text.match(/\{/g) || []).length, cb = (js.text.match(/\}/g) || []).length;
  check(ob === cb, 'JS ke bracket barabar hain  (' + ob + ' { / ' + cb + ' })');
  const op = (js.text.match(/\(/g) || []).length, cp = (js.text.match(/\)/g) || []).length;
  check(op === cp, 'JS ke ( ) barabar hain  (' + op + ' / ' + cp + ')');
}

/* JS waqai chalti hai? node se parhwa kar dekh lete hain */
if (js && js.changed && !fails.length) {
  const tmp = path.join(ROOT, '_jscheck.tmp.mjs');
  try {
    fs.writeFileSync(tmp, 'export default function(){\n' + js.text + '\n}\n', 'utf8');
    await import('node:url').then(async (u) => { await import(u.pathToFileURL(tmp).href); });
    check(true, 'badli hui JS ko Node ne bina ghalti ke parh liya');
  } catch (e) {
    check(false, 'JS mein syntax ghalti: ' + String(e.message).slice(0, 90));
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
  fs.writeFileSync(path.join(ROOT, '_heroa11y.txt'), out.join('\n') + '\n', 'utf8');
  console.log('-'.repeat(78));
  console.log('LIKHA: _heroa11y.txt');
  process.exit(1);
}

say('');
say('   JO HOGA:');
for (const s of steps) say('      ' + s);

if (!WRITE) {
  say('');
  say('   Sab jaanch saaf. Abhi kuch likha NAHI.');
  say('   Lagane ke liye:   node tools/fix-hero-a11y.mjs --write');
  say('');
} else {
  say('');
  for (const [rel, f] of files) {
    if (!f.changed) continue;
    fs.copyFileSync(f.abs, f.abs + '.bakhero');
    fs.writeFileSync(f.abs, f.hadCRLF ? f.text.replace(/\n/g, '\r\n') : f.text, 'utf8');
    say('   LIKHA: ' + rel + '   (backup: ' + path.basename(f.abs) + '.bakhero)');
  }
  say('');
  say('   Ab:   npm run build');
  say('');
}

fs.writeFileSync(path.join(ROOT, '_heroa11y.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _heroa11y.txt');
