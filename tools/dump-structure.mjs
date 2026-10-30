#!/usr/bin/env node
/**
 * dump-structure.mjs
 *
 * Sirf parhta hai, kuch likhta nahi.
 *
 * Dikhata hai:
 *   1. menu.json ka tree (label + url + level)
 *   2. .pages.yml ki collections (naam, path, fields ke naam)
 *   3. .pages.yml ki settings screens (naam + kaunsi file)
 *   4. expedition wala peak dropdown (jo kal banaya tha)
 *   5. page-control / banners jaisi listein — unki shakal
 *
 * Koi secret, token ya password ismein nahi aata.
 *
 *   node tools/dump-structure.mjs
 *   node tools/dump-structure.mjs > _structure.txt     (file mein save)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/* ---------------------------------------------------------- yaml ------- */

let YAML = null;
for (const m of ['yaml', 'js-yaml']) {
  try {
    const mod = await import(m);
    const lib = mod.default || mod;
    YAML = {
      which: m,
      parse: (s) => (typeof lib.parse === 'function' ? lib.parse(s) : lib.load(s)),
    };
    break;
  } catch {
    /* agli koshish */
  }
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git') || e.name === '_site') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const read = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};

/* ============================================ 1) menu.json ============= */

console.log('========== 1) MENU TREE ==========');

const menuPath = path.join(ROOT, 'src', '_data', 'menu.json');
const menuRaw = read(menuPath);

if (!menuRaw) {
  console.log('menu.json nahi mili: src/_data/menu.json');
} else {
  let menu;
  try {
    menu = JSON.parse(menuRaw);
  } catch (e) {
    console.log('menu.json parse nahi hui: ' + e.message);
  }

  if (menu) {
    console.log('top-level keys: ' + Object.keys(menu).join(', '));
    const items = Array.isArray(menu) ? menu : menu.items || menu.main || [];
    const show = (list, depth) => {
      for (const it of list || []) {
        const pad = '  '.repeat(depth);
        const kids = it.children || it.items || [];
        console.log(
          `${pad}- ${it.label || it.title || it.name || '(no label)'}` +
            `   url=${it.url || it.link || it.href || '-'}` +
            (kids.length ? `   [${kids.length} children]` : '')
        );
        if (kids.length) show(kids, depth + 1);
      }
    };
    show(items, 0);
    console.log('\n(ek item ki poori shakal:)');
    const first = (items[0] && (items[0].children || items[0].items || [])[0]) || items[0];
    console.log(JSON.stringify(first, null, 2).slice(0, 700));
  }
}

/* ============================================ 2) .pages.yml =========== */

console.log('\n========== 2) .pages.yml ==========');

const ymlPath = path.join(ROOT, '.pages.yml');
const ymlRaw = read(ymlPath);

if (!ymlRaw) {
  console.log('.pages.yml nahi mili.');
} else if (!YAML) {
  console.log('YAML parser mojood nahi (yaml / js-yaml dono nahi mile).');
  console.log('Sirf naam nikaal rahe hain:');
  for (const m of ymlRaw.matchAll(/^\s*-?\s*name:\s*(\S+)\s*$/gm)) {
    console.log('   ' + m[1]);
  }
} else {
  let doc = null;
  try {
    doc = YAML.parse(ymlRaw);
  } catch (e) {
    console.log('.pages.yml parse nahi hui: ' + e.message);
  }

  if (doc) {
    console.log('parser: ' + YAML.which);
    const content = doc.content || [];
    console.log('kul screens: ' + content.length + '\n');

    console.log('--- COLLECTIONS (list wali screens) ---');
    for (const c of content) {
      if (c.type !== 'collection') continue;
      const fields = (c.fields || []).map((f) => f.name).join(', ');
      console.log(`\n  name: ${c.name}`);
      console.log(`  label: ${c.label}`);
      console.log(`  path: ${c.path}`);
      console.log(`  filename: ${JSON.stringify(c.filename)}`);
      console.log(`  fields: ${fields}`);
    }

    console.log('\n--- SETTINGS (ek file wali screens) ---');
    for (const c of content) {
      if (c.type === 'collection') continue;
      console.log(`  ${String(c.name).padEnd(24)} ${String(c.label).padEnd(34)} ${c.file || '-'}`);
    }

    /* ---- peak dropdown ---- */
    console.log('\n--- EXPEDITION ka peak dropdown ---');
    let found = false;
    for (const c of content) {
      for (const f of c.fields || []) {
        const n = String(f.name || '').toLowerCase();
        const l = String(f.label || '').toLowerCase();
        if (n.includes('peak') || l.includes('peak') || n.includes('category')) {
          console.log(`  [${c.name}]`);
          console.log('  ' + JSON.stringify(f, null, 2).split('\n').join('\n  '));
          found = true;
        }
      }
    }
    if (!found) console.log('  (nahi mila)');
  }
}

/* ============================================ 3) listein =============== */

console.log('\n========== 3) PAGE / BANNER LISTEIN ==========');

const dataFiles = [
  ...walk(path.join(ROOT, 'content')),
  ...walk(path.join(ROOT, 'src', '_data')),
].filter((f) => /\.(json|ya?ml)$/i.test(f));

const interesting = dataFiles.filter((f) => {
  const b = path.basename(f).toLowerCase();
  return /page|banner|control|menu|section|nav/.test(b);
});

if (!interesting.length) {
  console.log('(koi aisi file nahi mili)');
}

for (const f of interesting) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const raw = read(f);
  if (raw == null) continue;
  console.log('\n--- ' + rel + '   (' + raw.length + ' chars)');
  if (!f.endsWith('.json')) {
    console.log(raw.split('\n').slice(0, 20).join('\n'));
    continue;
  }
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    console.log('  parse fail: ' + e.message);
    continue;
  }
  if (Array.isArray(obj)) {
    console.log('  array, ' + obj.length + ' items. Pehla item:');
    console.log('  ' + JSON.stringify(obj[0], null, 2).split('\n').join('\n  '));
  } else {
    const keys = Object.keys(obj);
    console.log('  object, ' + keys.length + ' keys:');
    console.log('  ' + keys.join(', ').slice(0, 900));
    const firstKey = keys[0];
    console.log('  pehli value (' + firstKey + '):');
    console.log('  ' + JSON.stringify(obj[firstKey], null, 2).slice(0, 500));
  }
}

console.log('\n========== KHATAM ==========');
