#!/usr/bin/env node
/**
 * dump-rules.mjs   (website ke folder mein)
 *
 * Sirf un rules ka poora matan nikalta hai jo contrast patch ko rok rahe hain:
 *   - har woh rule jo `opacity` set karta hai aur dt / devcredit-role ko chhoota hai
 *   - .bk-footer-rating-links aur .eyebrow ke rules
 *   - aur un ke aas paas ka matan, taake pata chale kis block ka hissa hai
 *
 * KUCH BADALTA NAHI.
 *
 *   node tools/dump-rules.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
if (!fs.existsSync(CSS)) { console.log('XX  src/assets/css/input.css nahi mili'); process.exit(1); }
const lines = fs.readFileSync(CSS, 'utf8').split(/\r?\n/);

say('');
say('ROKNE WALE RULES KA POORA MATAN');
say('='.repeat(78));
say('   input.css: ' + lines.length + ' lines');

/* ek line se poora rule nikalo: selector (peechay) + body (aage) */
const ruleAt = (i) => {
  let start = i;
  for (let j = i; j >= 0 && i - j < 20; j--) {
    if (j < i && /[}{]\s*$/.test(lines[j])) { start = j + 1; break; }
    start = j;
  }
  let end = i, depth = 0;
  for (let k = start; k < lines.length && k - start < 40; k++) {
    depth += (lines[k].match(/\{/g) || []).length - (lines[k].match(/\}/g) || []).length;
    end = k;
    if (depth <= 0 && lines[k].includes('}')) break;
  }
  return [start, end];
};

const shown = new Set();
const dump = (title, test) => {
  say('');
  say(title);
  say('-'.repeat(78));
  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!test(lines[i])) continue;
    const [a, b] = ruleAt(i);
    const key = a + ':' + b;
    if (shown.has(key)) continue;
    shown.add(key);
    found++;
    say('');
    for (let k = Math.max(0, a - 2); k <= Math.min(lines.length - 1, b + 1); k++) {
      const mark = (k >= a && k <= b) ? ' | ' : ' . ';
      say('   ' + String(k + 1).padStart(5) + mark + lines[k].slice(0, 150));
    }
  }
  if (!found) say('   kuch nahi mila');
};

/* 1. har rule jahan opacity hai AUR dt ya devcredit-role ka zikr */
dump('1. opacity + (dt ya devcredit-role)', (l) =>
  /opacity\s*:/.test(l) || /\bdt\b\s*[,{]/.test(l) || /bk-devcredit-role/.test(l));

/* 2. rating links */
dump('2. .bk-footer-rating-links', (l) => /bk-footer-rating-links/.test(l));

/* 3. eyebrow */
dump('3. .eyebrow', (l) => /\beyebrow\b/.test(l));

/* 4. footer-cta ka aakhri rule */
dump('4. .bk-footer-cta', (l) => /bk-footer-cta/.test(l));

/* 5. kahan kahan !important hai */
say('');
say('5. POORI FILE MEIN !important');
say('-'.repeat(78));
let imp = 0;
lines.forEach((l, i) => { if (/!important/.test(l)) { imp++; say('   ' + String(i + 1).padStart(5) + ' | ' + l.trim().slice(0, 140)); } });
if (!imp) say('   kahin nahi');
else say('   kul ' + imp);

/* 6. version blocks ki fehrist */
say('');
say('6. VERSION BLOCKS');
say('-'.repeat(78));
lines.forEach((l, i) => { if (/===\s*V[\d.]+\s*(START|END)/.test(l)) say('   ' + String(i + 1).padStart(5) + ' | ' + l.trim().slice(0, 100)); });

say('');
say('='.repeat(78));
say('   Yeh matan mujhe bhej dein.');
say('');

fs.writeFileSync(path.join(ROOT, '_rules.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _rules.txt');
