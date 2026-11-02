#!/usr/bin/env node
/**
 * dump-for-patch.mjs   (website ke folder mein)
 *
 * Patch likhne se pehle do cheezein nikalta hai:
 *
 *   1. llms.txt banane wali template, poori
 *   2. Un buttons ke CSS ke POORE rules, line number aur aas paas ke
 *      matan ke sath — taake pata chale kaun sa rule kab lagta hai
 *      (media query, hover, dark mode waghera)
 *
 * KUCH BADALTA NAHI.
 *
 *   node tools/dump-for-patch.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say('\nPATCH KE LIYE ZAROORI MATAN');
say('='.repeat(78));

/* ---------- 1. llms.txt ki template ---------- */
say('');
say('1. src/llms.txt.njk');
say('-'.repeat(78));
const LLMS = path.join(ROOT, 'src', 'llms.txt.njk');
if (!fs.existsSync(LLMS)) say('   XX  file nahi mili');
else {
  const lines = fs.readFileSync(LLMS, 'utf8').split(/\r?\n/);
  say('   ' + lines.length + ' lines');
  say('');
  lines.forEach((l, i) => say('   ' + String(i + 1).padStart(4) + ' | ' + l));
}

/* ---------- 2. button ke CSS rules ---------- */
say('');
say('2. BUTTON KE CSS RULES (poore, aas paas ke matan ke sath)');
say('-'.repeat(78));

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
if (!fs.existsSync(CSS)) { say('   XX  src/assets/css/input.css nahi mili'); }
else {
  const text = fs.readFileSync(CSS, 'utf8');
  const lines = text.split(/\r?\n/);

  /* jin selectors ka matan chahiye */
  const WANT = [
    'bk-mobile-toggle',
    'bk-footer-cta',
    'bk-newsletter-form',
    'bk-footer-top > a',
    'bk-accent',
  ];

  /* har woh line jahan in mein se koi mile, us ka poora rule nikaal lo */
  const marks = new Set();
  lines.forEach((l, i) => { if (WANT.some((w) => l.includes(w))) marks.add(i); });

  /* rule ki shuruaat aur aakhir dhoondo: { se pehle ka selector, } tak */
  const blocks = [];
  for (const i of [...marks].sort((a, b) => a - b)) {
    let start = i, end = i;
    /* peechay: jab tak koi line } ya { par khatam na ho */
    let depth = 0;
    for (let j = i; j >= 0 && i - j < 25; j--) {
      const l = lines[j];
      if (l.includes('}') && j < i) { start = j + 1; break; }
      if (l.includes('{') ) { start = j; if (j < i) break; }
      start = j;
    }
    for (let j = i; j < lines.length && j - i < 25; j++) {
      end = j;
      depth += (lines[j].match(/\{/g) || []).length;
      depth -= (lines[j].match(/\}/g) || []).length;
      if (lines[j].includes('}') && depth <= 0) break;
    }
    blocks.push([Math.max(0, start - 2), Math.min(lines.length - 1, end + 1)]);
  }

  /* ek doosre mein ghuse hue blocks mila do */
  blocks.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const b of blocks) {
    const last = merged[merged.length - 1];
    if (last && b[0] <= last[1] + 2) last[1] = Math.max(last[1], b[1]);
    else merged.push([...b]);
  }

  say('   input.css: ' + lines.length + ' lines, ' + merged.length + ' jagah mili');
  let shown = 0;
  for (const [a, b] of merged) {
    if (shown > 400) { say(''); say('   ... (bohat zyada, baqi chhora)'); break; }
    say('');
    say('   ---- lines ' + (a + 1) + '–' + (b + 1) + ' ----');
    for (let i = a; i <= b; i++) { say('   ' + String(i + 1).padStart(5) + ' | ' + lines[i].slice(0, 160)); shown++; }
  }
}

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein — phir patch likh dunga.');
say('');

fs.writeFileSync(path.join(ROOT, '_patchsrc.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _patchsrc.txt');
