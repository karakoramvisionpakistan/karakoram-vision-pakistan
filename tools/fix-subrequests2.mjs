#!/usr/bin/env node
/**
 * fix-subrequests2.mjs   (cms-dashboard ke folder mein chalayein)
 *
 * Baqi teen jagah jahan har file ke liye alag GitHub request jati thi.
 * Pehli script ne sirf collection ki fehrist theek ki thi; yeh us ke
 * baad chalti hai aur usi getFilesBatch() ko istemal karti hai.
 *
 *   analytics.js    -> ab sab collections ki sab files EK sath
 *   sweep.js        -> matan batch se; sha sirf us file ka jo publish ho
 *   mediaUsage.js   -> content aur settings dono batch se
 *
 * analytics sab se buri thi: woh har collection ke andar har file ke liye
 * alag request bhejti thi. 16 collections x 50 files = 800 request ek hi
 * invocation mein. Ab taqreeban 20.
 *
 * SAB KUCH YA KUCH BHI NAHI. Backup bhi banti hai.
 *
 *   node .../fix-subrequests2.mjs            -> sirf dikhana
 *   node .../fix-subrequests2.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const say = (s = '') => console.log(s);

const GH = path.join(ROOT, 'functions', '_lib', 'github.js');
const AN = path.join(ROOT, 'functions', 'api', 'analytics.js');
const SW = path.join(ROOT, 'functions', 'api', 'scheduled', 'sweep.js');
const MU = path.join(ROOT, 'functions', '_lib', 'mediaUsage.js');

const problems = [];
const result = [];

/* ===================== analytics.js ===================== */

const AN_OLD = `  const perCollection = await Promise.all(
    schema.collections.map(async (collection) => {
      const entries = await gh.listDir(collection.path);
      const mdFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));
      const files = await Promise.all(mdFiles.map((e) => gh.getFile(\`\${collection.path}/\${e.name}\`)));

      let published = 0;
      let review = 0;
      let draft = 0;
      let trashed = 0;
      let lastEditedAt = null;
      let lastEditedTitle = null;

      files.forEach((file, i) => {
        const { data } = parseFrontmatter(file.content);
        if (data._trashed) {
          trashed++;
          return;
        }
        const status = workflowStatus(data);
        if (status === 'published') published++;
        else if (status === 'review') review++;
        else draft++;
      });

      const total = published + review + draft;
      return {
        name: collection.name,
        label: collection.label,
        total,
        published,
        review,
        draft,
        trashed
      };
    })
  );`;

const AN_NEW = `  // Pehle har collection ki fehrist, phir SAB collections ki SAB files
  // ek sath. Pehle yahan har collection ke andar har file ke liye alag
  // fetch jata tha (collections x files), jo Cloudflare ki subrequest ki
  // hadd foran paar kar deta tha aur poora safha 500 de deta tha.
  const listings = await Promise.all(
    schema.collections.map(async (collection) => {
      const entries = await gh.listDir(collection.path);
      const mdFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));
      return { collection, mdFiles };
    })
  );

  const allPaths = [];
  for (const { collection, mdFiles } of listings) {
    for (const e of mdFiles) allPaths.push(\`\${collection.path}/\${e.name}\`);
  }
  const texts = await gh.getFilesBatch(allPaths);

  const perCollection = listings.map(({ collection, mdFiles }) => {
    let published = 0;
    let review = 0;
    let draft = 0;
    let trashed = 0;

    for (const e of mdFiles) {
      const text = texts.get(\`\${collection.path}/\${e.name}\`);
      if (text == null) continue;
      const { data } = parseFrontmatter(text);
      if (data._trashed) {
        trashed++;
        continue;
      }
      const status = workflowStatus(data);
      if (status === 'published') published++;
      else if (status === 'review') review++;
      else draft++;
    }

    const total = published + review + draft;
    return {
      name: collection.name,
      label: collection.label,
      total,
      published,
      review,
      draft,
      trashed
    };
  });`;

/* ===================== sweep.js ===================== */

const SW_OLD = `    const files = await Promise.all(mdFiles.map((e) => gh.getFile(\`\${collection.path}/\${e.name}\`).then((f) => ({ entry:e, file: f }))));

    for (const { entry, file } of files) {
      const { data, body } = parseFrontmatter(file.content);
      if (data._trashed || data.published) continue;
      if (!data._scheduled_at) continue;
      if (new Date(data._scheduled_at) > now) continue;

      const path = \`\${collection.path}/\${entry.name}\`;
      data.published = true;
      delete data._scheduled_at;
      delete data._in_review;

      await gh.putFile(path, stringifyFrontmatter(data, body), {
        message: \`Auto-publish (scheduled) \${path}\`,
        sha: file.sha
      });`;

const SW_NEW = `    // Matan ek hi request mein. GraphQL sha nahi deta, magar sha sirf us
    // file ke liye chahiye jo waqai publish ho rahi hai - aur aksar woh
    // ginti sifar hoti hai, kyunke zyada tar files mein _scheduled_at
    // hota hi nahi.
    const paths = mdFiles.map((e) => \`\${collection.path}/\${e.name}\`);
    const texts = await gh.getFilesBatch(paths);

    for (const entry of mdFiles) {
      const path = \`\${collection.path}/\${entry.name}\`;
      const text = texts.get(path);
      if (text == null) continue;
      const { data, body } = parseFrontmatter(text);
      if (data._trashed || data.published) continue;
      if (!data._scheduled_at) continue;
      if (new Date(data._scheduled_at) > now) continue;

      const current = await gh.getFile(path);
      data.published = true;
      delete data._scheduled_at;
      delete data._in_review;

      await gh.putFile(path, stringifyFrontmatter(data, body), {
        message: \`Auto-publish (scheduled) \${path}\`,
        sha: current.sha
      });`;

/* ===================== mediaUsage.js ===================== */

const MU_OLD1 = `  for (const c of schema.collections || []) {
    let entries = [];
    try { entries = await gh.listDir(c.path); } catch { continue; }

    const wanted = entries.filter((e) => e.type === 'file' && /\\.(md|json)$/i.test(e.name));
    const files = await Promise.all(
      wanted.map((e) => gh.getFile(\`\${c.path}/\${e.name}\`).catch(() => null))
    );

    files.forEach((file, i) => {
      if (!file) return;
      const name = wanted[i].name.replace(/\\.(md|json)$/i, '');
      sources.push({ label: \`\${c.label || c.name} — \${name}\`, text: file.content });
    });
  }`;

const MU_NEW1 = `  // Pehle sab collections ki fehristein, phir SAB files ek sath. Agar har
  // collection ka apna batch banta to ginti phir barh jati.
  const listings = await Promise.all(
    (schema.collections || []).map(async (c) => {
      try {
        const entries = await gh.listDir(c.path);
        return { c, wanted: entries.filter((e) => e.type === 'file' && /\\.(md|json)$/i.test(e.name)) };
      } catch {
        return { c, wanted: [] };
      }
    })
  );

  const contentPaths = [];
  for (const { c, wanted } of listings) {
    for (const e of wanted) contentPaths.push(\`\${c.path}/\${e.name}\`);
  }
  let contentTexts = new Map();
  try { contentTexts = await gh.getFilesBatch(contentPaths); } catch { contentTexts = new Map(); }

  for (const { c, wanted } of listings) {
    for (const e of wanted) {
      const text = contentTexts.get(\`\${c.path}/\${e.name}\`);
      if (text == null) continue;
      const name = e.name.replace(/\\.(md|json)$/i, '');
      sources.push({ label: \`\${c.label || c.name} — \${name}\`, text });
    }
  }`;

const MU_OLD2 = `  for (const f of schema.files || []) {
    let file = null;
    try { file = await gh.getFileSafe(f.path); } catch { file = null; }
    if (file) sources.push({ label: f.label || f.name, text: file.content });
  }`;

const MU_NEW2 = `  const settingsPaths = (schema.files || []).map((f) => f.path).filter(Boolean);
  let settingsTexts = new Map();
  try { settingsTexts = await gh.getFilesBatch(settingsPaths); } catch { settingsTexts = new Map(); }
  for (const f of schema.files || []) {
    const text = f.path ? settingsTexts.get(f.path) : null;
    if (text != null) sources.push({ label: f.label || f.name, text });
  }`;

/* ==================================================================== */

/* Anchor ko regex mein badal do jahan har jagah (space, nayi line,
   indentation) ek jaisi mani jati hai. Is tarah ek space ka farq ya
   CRLF/LF ka farq kuch bigarta nahi. Baqi har harf jaisa ka taisa
   milaya jata hai. */
const looseRe = (s) => {
  /* Matan ko tukron mein torte hain: lafz alag, aur har nishan (: , { ( )
     alag. Do lafzon ke darmiyan space lazmi hai; nishan ke aas paas space
     ho ya na ho, dono chalte hain. Is tarah "entry:e" aur "entry: e" ek
     hi cheez samjhe jate hain. */
  const toks = s.trim().match(/[A-Za-z0-9_$]+|[^\sA-Za-z0-9_$]/g) || [];
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let out = '';
  for (let i = 0; i < toks.length; i++) {
    if (i > 0) {
      const prevWord = /[A-Za-z0-9_$]$/.test(toks[i - 1]);
      const curWord = /^[A-Za-z0-9_$]/.test(toks[i]);
      out += prevWord && curWord ? '\\s+' : '\\s*';
    }
    out += esc(toks[i]);
  }
  return new RegExp(out);
};

/* Anchor na mile to asli matan dikha do, taake pata chale kya farq hai.
   Spaces ko · se dikhaya jata hai warna farq nazar nahi aata. */
const showNear = (text, anchor, out) => {
  const firstLine = anchor.split('\n')[0].trim();
  const needle = firstLine.slice(0, 40);
  const lines = text.split('\n');
  const want = anchor.split('\n').length;
  let at = lines.findIndex((l) => l.includes(needle));
  if (at < 0) {
    const key = (firstLine.match(/[A-Za-z_$][\w$]{6,}/g) || [])[0];
    if (key) at = lines.findIndex((l) => l.includes(key));
  }
  if (at < 0) { out('       (us jagah ka koi nishan hi nahi mila)'); return; }
  out('');
  out('       File mein wahan yeh likha hai:');
  for (let i = at; i < Math.min(lines.length, at + want + 2); i++) {
    out('       ' + String(i + 1).padStart(4) + ' |' + lines[i].replace(/ /g, '·').slice(0, 150));
  }
  out('');
};

const patch = (file, label, pairs, extraChecks = []) => {
  say('');
  say(label);
  say('-'.repeat(78));
  if (!fs.existsSync(file)) { say('   XX  file nahi mili'); problems.push(label + ': nahi mili'); return; }
  const raw = fs.readFileSync(file, 'utf8');

  /* Windows par git aksar CRLF likhta hai, aur ek hi repo mein kuch
     files LF aur kuch CRLF ho sakti hain. Milane se pehle sab ko LF
     kar lete hain; likhte waqt file ki apni shakal wapas de dete hain. */
  const hadCRLF = /\r\n/.test(raw);
  let t = raw.replace(/\r\n/g, '\n');
  const before = t;

  if (t.includes('getFilesBatch')) { say('   -- pehle se laga hua hai, chhora'); return; }

  for (const [old, neu, what] of pairs) {
    /* Spaces ka farq ab maayne nahi rakhta. Pehle yeh seedha matan se
       milaya jata tha, aur "entry: e" bajaye "entry:e" jaise ek harf ke
       farq se poora anchor nakaam ho jata tha. */
    const re = looseRe(old);
    const n = (t.match(new RegExp(re.source, 'g')) || []).length;
    if (n !== 1) {
      say('   XX  ' + what + ': ' + n + ' baar mila, ek chahiye');
      say('       (file ki shakal: ' + (hadCRLF ? 'CRLF' : 'LF') + ')');
      showNear(t, old, say);
      say('       File badal chuki hai. Kuch nahi likha.');
      problems.push(label + ': ' + what);
      return;
    }
    t = t.replace(re, () => neu);
    say('   OK  ' + what);
  }

  const ob = (t.match(/\{/g) || []).length, cb = (t.match(/\}/g) || []).length;
  if (ob !== cb) { say('   XX  braces barabar nahi: ' + ob + '/' + cb); problems.push(label + ': braces'); return; }
  const op = (t.match(/\(/g) || []).length, cp = (t.match(/\)/g) || []).length;
  if (op !== cp) { say('   XX  brackets barabar nahi: ' + op + '/' + cp); problems.push(label + ': brackets'); return; }

  for (const [must, why] of extraChecks) {
    if (!t.includes(must)) { say('   XX  ' + why); problems.push(label + ': ' + why); return; }
  }

  say('       ' + before.length + ' -> ' + t.length + ' harf, braces ' + ob + '/' + cb + ', brackets ' + op + '/' + cp
      + (hadCRLF ? '  [CRLF]' : ''));
  result.push([file, hadCRLF ? t.replace(/\n/g, '\r\n') : t]);
};

say('\nCMS DASHBOARD — BAQI TEEN JAGAH');
say('='.repeat(78));
say('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.');

/* getFilesBatch mojood hai? */
if (!fs.existsSync(GH)) { say('\n   XX  functions/_lib/github.js nahi mili.'); problems.push('github.js nahi mili'); }
else if (!fs.readFileSync(GH, 'utf8').includes('getFilesBatch')) {
  say('');
  say('   XX  github.js mein getFilesBatch() nahi hai.');
  say('       Pehle fix-subrequests.mjs --write chalayein, phir yeh.');
  problems.push('getFilesBatch nahi hai');
}

if (!problems.length) {
  patch(AN, '1. functions/api/analytics.js', [
    [AN_OLD, AN_NEW, 'sab collections ki files ek sath'],
  ], [
    ['workflowStatus(data)', 'workflowStatus ka istemal gayab ho gaya'],
    ['perCollection.reduce', 'totals wala hissa toot gaya'],
  ]);

  patch(SW, '2. functions/api/scheduled/sweep.js', [
    [SW_OLD, SW_NEW, 'matan batch se, sha sirf publish wali file ka'],
  ], [
    ['stringifyFrontmatter(data, body)', 'publish karne wala hissa toot gaya'],
    ['notifyPublished', 'ittila bhejne wala hissa gayab'],
  ]);

  patch(MU, '3. functions/_lib/mediaUsage.js', [
    [MU_OLD1, MU_NEW1, 'content ki files batch se'],
    [MU_OLD2, MU_NEW2, 'settings ki files batch se'],
  ], [
    ['IMAGE_NAME', 'photo dhoondne wala hissa gayab'],
    ['usageOf', 'usageOf gayab'],
  ]);
}

say('');
say('='.repeat(78));
if (problems.length) {
  say('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) say('          ' + m);
  say('');
  say('   Yeh list mujhe bhej dein.');
  process.exit(1);
}
if (!result.length) { say('   Kuch badalna nahi tha — sab pehle se laga hua hai.'); process.exit(0); }

say('   Sab theek. Files badlengi: ' + result.length);
say('');
say('   analytics pehle: 16 collections x har file = sainkron request');
say('              ab:   16 fehristein + taqreeban 2 batch');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node ' + process.argv[1] + ' --write');
  process.exit(0);
}

for (const [f, text] of result) {
  if (!fs.existsSync(f + '.baksub2')) fs.copyFileSync(f, f + '.baksub2');
  fs.writeFileSync(f, text, 'utf8');
  say('LIKHA: ' + path.relative(ROOT, f).split(path.sep).join('/'));
}
say('');
say('backup: *.baksub2');
say('');
say('Agla qadam: commit aur push. Phir dashboard ka home page dekhein.');
