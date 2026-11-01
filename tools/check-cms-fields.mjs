#!/usr/bin/env node
/**
 * check-cms-fields.mjs   (website ke folder mein)
 *
 * Batati hai ke site.json ka kaun sa khaana CMS (.pages.yml) mein mojood
 * hai aur kaun sa nahi. Jo nahi hai, use client CMS se badal nahi sakta
 * — us ke liye file haath se kholni parti hai.
 *
 * KUCH BADALTI NAHI. Sirf dekhti hai.
 *
 * .pages.yml ko sirf parha jata hai, likha nahi. PowerShell ka
 * Get-Content/Set-Content us par kabhi na chalayein — yeh Node hai.
 *
 *   node tools/check-cms-fields.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const PAGES = path.join(ROOT, '.pages.yml');
const SITE = path.join(ROOT, 'src', '_data', 'site.json');

say('\nCMS MEIN KYA KYA BADLA JA SAKTA HAI');
say('='.repeat(78));

if (!fs.existsSync(PAGES)) { say('XX  .pages.yml nahi mili.'); process.exit(1); }
if (!fs.existsSync(SITE)) { say('XX  src/_data/site.json nahi mili.'); process.exit(1); }

let doc, site;
try { doc = yaml.load(fs.readFileSync(PAGES, 'utf8')); }
catch (e) { say('XX  .pages.yml parh nahi hoti: ' + e.message); process.exit(1); }
try { site = JSON.parse(fs.readFileSync(SITE, 'utf8')); }
catch (e) { say('XX  site.json parh nahi hoti: ' + e.message); process.exit(1); }

const entry = (doc.content || []).find((c) => c.name === 'site');
if (!entry) { say('XX  .pages.yml mein "site" wali entry nahi mili.'); process.exit(1); }

const fields = entry.fields || [];
const byName = new Map(fields.map((f) => [f.name, f]));

say('');
say('1. SITE.JSON KE KHAANE');
say('-'.repeat(78));
say('   OK = CMS mein mojood, client khud badal sakta hai');
say('   XX = CMS mein nahi, file haath se kholni paregi');
say('');

const missing = [];
for (const key of Object.keys(site)) {
  const f = byName.get(key);
  const val = site[key];
  const kind = Array.isArray(val) ? 'list' : (val && typeof val === 'object' ? 'object' : 'simple');
  if (!f) { missing.push(key); say('   XX  ' + key.padEnd(22) + '(' + kind + ')'); continue; }
  say('   OK  ' + key.padEnd(22) + '(' + kind + ')   type: ' + (f.type || '?'));
}

/* object ke andar ke khaane bhi dekho */
say('');
say('2. ANDAR KE KHAANE (sirf un ka jo CMS mein hain)');
say('-'.repeat(78));
const WATCH = ['ratings', 'developer', 'credentials', 'social', 'verification', 'forms'];
for (const key of WATCH) {
  const f = byName.get(key);
  const val = site[key];
  say('');
  if (!val || typeof val !== 'object' || Array.isArray(val)) { say('   ' + key + ': site.json mein object nahi'); continue; }
  if (!f) { say('   XX  ' + key + '  — CMS mein bilkul nahi hai'); continue; }
  const sub = new Map((f.fields || []).map((x) => [x.name, x]));
  say('   ' + key + '  (CMS mein ' + sub.size + ' khaane)');
  for (const k of Object.keys(val)) {
    const here = sub.get(k);
    const v = val[k];
    const shown = Array.isArray(v) ? '[' + v.length + (v.length === 1 ? ' cheez]' : ' cheezein]')
      : (v && typeof v === 'object' ? '{object}' : (String(v).trim() ? String(v).slice(0, 44) : '[khaali]'));
    say('      ' + (here ? 'OK ' : 'XX ') + k.padEnd(22) + shown);
  }
  const extra = [...sub.keys()].filter((k) => !(k in val));
  if (extra.length) say('      !!  CMS mein hain magar site.json mein nahi: ' + extra.join(', '));
}

say('');
say('='.repeat(78));
say('KHULASA');
say('');
if (!missing.length) say('   site.json ka har bara khaana CMS mein mojood hai.');
else {
  say('   Yeh bare khaane CMS mein nahi hain (' + missing.length + '):');
  for (const m of missing) say('      XX  ' + m);
}
say('');
say('   Ooper "2" wale hisse mein jo XX hain, woh andar ke khaane hain');
say('   jinhein client CMS se nahi badal sakta.');
say('');
say('   Yeh poora matan mujhe bhej dein — main un ko CMS mein jor dunga.');
say('');

fs.writeFileSync(path.join(ROOT, '_cmsfields.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _cmsfields.txt');
