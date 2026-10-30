#!/usr/bin/env node
/**
 * dump-structure2.mjs  — sirf parhta hai, kuch nahi badalta.
 *
 * Pehli dump mein settings screens ka "file" khali aaya tha, aur
 * hero_banners (Page banners) ka data kahin nazar nahi aaya.
 * Yeh script wahi khala bharti hai.
 *
 *   node tools/dump-structure2.mjs > _structure2.txt
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

let YAML = null;
for (const m of ['yaml', 'js-yaml']) {
  try {
    const mod = await import(m);
    const lib = mod.default || mod;
    YAML = { which: m, parse: (s) => (typeof lib.parse === 'function' ? lib.parse(s) : lib.load(s)) };
    break;
  } catch {}
}

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ============================================ 1) _data ================ */

console.log('========== 1) src/_data ki saari files ==========');
const dataDir = path.join(ROOT, 'src', '_data');
if (fs.existsSync(dataDir)) {
  for (const f of fs.readdirSync(dataDir)) {
    const st = fs.statSync(path.join(dataDir, f));
    console.log('  ' + f.padEnd(28) + st.size + ' bytes');
  }
} else {
  console.log('  src/_data nahi mila');
}

console.log('\n========== 1b) content/ ki saari files ==========');
const cDir = path.join(ROOT, 'content');
if (fs.existsSync(cDir)) {
  const walk = (d, pre = '') => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name), pre + e.name + '/');
      else console.log('  ' + pre + e.name);
    }
  };
  walk(cDir);
} else {
  console.log('  content/ nahi mila');
}

/* ============================================ 2) screens ============== */

console.log('\n========== 2) ZARURI SCREENS ki poori shakal ==========');

const ymlRaw = read(path.join(ROOT, '.pages.yml'));
if (!ymlRaw || !YAML) {
  console.log('.pages.yml ya YAML parser nahi mila.');
} else {
  const doc = YAML.parse(ymlRaw);
  const content = doc.content || [];

  console.log('\n--- ek settings screen ke saare keys (file ka naam kis key mein hai?) ---');
  const anySetting = content.find((c) => c.type !== 'collection');
  console.log('  ' + JSON.stringify(Object.keys(anySetting || {})));

  const WANTED = ['hero_banners', 'page_control', 'navigation', 'homepage', 'taxonomies'];
  for (const name of WANTED) {
    const screen = content.find((c) => c.name === name);
    console.log('\n--- ' + name + ' ---');
    if (!screen) { console.log('  (nahi mila)'); continue; }
    const copy = JSON.parse(JSON.stringify(screen));
    // bade fields ko chhota kar dein taake output qaabu mein rahe
    const trim = (fields) => (fields || []).map((f) => {
      const o = { name: f.name, label: f.label, type: f.type };
      if (f.list) o.list = f.list;
      if (f.options) o.options = Array.isArray(f.options) ? f.options.slice(0, 6) : f.options;
      if (f.fields) o.fields = trim(f.fields);
      return o;
    });
    console.log('  type: ' + copy.type);
    for (const k of Object.keys(copy)) {
      if (k === 'fields' || k === 'type') continue;
      const v = copy[k];
      console.log('  ' + k + ': ' + (typeof v === 'object' ? JSON.stringify(v).slice(0, 300) : v));
    }
    console.log('  fields:');
    console.log('  ' + JSON.stringify(trim(copy.fields), null, 2).split('\n').join('\n  ').slice(0, 2500));
  }

  /* ---- menu se judi hui aur cheezein ---- */
  console.log('\n--- MENU se judi hui aur jagahein (sliders ka sections field) ---');
  const sliders = content.find((c) => c.name === 'sliders');
  const sec = (sliders?.fields || []).find((f) => f.name === 'sections');
  console.log('  ' + JSON.stringify(sec, null, 2).split('\n').join('\n  ').slice(0, 1200));

  /* ---- journey collections ke menu switches ---- */
  console.log('\n--- JOURNEY forms ke menu switches (boolean fields) ---');
  for (const c of content) {
    if (c.type !== 'collection') continue;
    if (!['tours', 'trekking', 'expeditions', 'jeep_safaris', 'hunting_services'].includes(c.name)) continue;
    const bools = (c.fields || [])
      .filter((f) => f.type === 'boolean' && !/^published$/.test(f.name))
      .map((f) => `${f.name} ("${f.label}")`);
    console.log('  ' + c.name + ': ' + bools.join(', '));
  }
}

/* ============================================ 3) banners data ========= */

console.log('\n========== 3) BANNERS ka data ==========');
const guesses = ['heroBanners.json', 'banners.json', 'hero.json', 'heroBanners.yml'];
let shown = false;
for (const g of guesses) {
  const p = path.join(ROOT, 'src', '_data', g);
  const raw = read(p);
  if (!raw) continue;
  shown = true;
  console.log('--- src/_data/' + g + ' (' + raw.length + ' chars)');
  try {
    const obj = JSON.parse(raw);
    const keys = Array.isArray(obj) ? ['(array ' + obj.length + ')'] : Object.keys(obj);
    console.log('  keys: ' + keys.join(', ').slice(0, 600));
    const first = Array.isArray(obj) ? obj[0] : obj[keys[0]];
    console.log('  pehli value:');
    console.log('  ' + JSON.stringify(first, null, 2).slice(0, 700));
  } catch (e) {
    console.log('  parse fail: ' + e.message);
  }
}
if (!shown) console.log('  (andaze wale naam nahi mile — oopar wali list dekh kar bata doonga)');

/* ============================================ 4) landing pages ======== */

console.log('\n========== 4) SUB-MENU ke asal landing pages ==========');
const njk = [];
const walk2 = (d) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk2(p);
    else if (e.name === 'index.njk') njk.push(path.relative(ROOT, p).replace(/\\/g, '/'));
  }
};
walk2(path.join(ROOT, 'src'));
console.log('  ' + njk.length + ' index.njk files:');
for (const f of njk) console.log('    ' + f);

console.log('\n========== KHATAM ==========');
