#!/usr/bin/env node
/**
 * fix-subrequests.mjs   (cms-dashboard ke folder mein chalayein)
 *
 * "Too many subrequests" wala masla hal karta hai.
 *
 * Abhi kya hota hai: collection ki fehrist kholte waqt code HAR markdown
 * file ke liye GitHub par ALAG request bhejta hai. Cloudflare ek request
 * ke andar itni baar bahar jaane nahi deta (Free: 50, Paid: 10,000) — aur
 * D1, KV, R2 ke calls bhi usi ginti mein aate hain. Content barhte hi
 * hadd paar ho jati hai aur poora safha 500 de deta hai.
 *
 * Ab kya hoga: GitHub ka GraphQL API ek hi request mein 100 files ka
 * matan de deta hai. 60 files = 1 request. 500 files = 5. Hadd kabhi
 * nahi chhuti.
 *
 * Do files badalti hain:
 *   functions/_lib/github.js                    -> naya getFilesBatch()
 *   functions/api/content/[collection]/index.js -> wahi istemal karega
 *
 * SAB KUCH YA KUCH BHI NAHI. Backup bhi banti hai.
 *
 *   node .../fix-subrequests.mjs            -> sirf dikhana
 *   node .../fix-subrequests.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const say = (s = '') => console.log(s);

const GH = path.join(ROOT, 'functions', '_lib', 'github.js');
const IDX = path.join(ROOT, 'functions', 'api', 'content', '[collection]', 'index.js');

const problems = [];
const result = {};

/* ---------- github.js ---------- */

const GH_ANCHOR = `  async getFileSafe(path, ref) {
    try {
      return await this.getFile(path, ref);
    } catch (e) {
      if (String(e.message).includes('404')) return null;
      throw e;
    }
  }`;

const GH_ADD = `

  // Kai files ka matan EK request mein, GraphQL se.
  //
  // REST ka /contents har file ke liye alag fetch maangta hai. Cloudflare
  // ek invocation mein utni baar bahar nahi jaane deta (Free: 50,
  // Paid: 10,000), aur D1/KV/R2 ke calls bhi usi ginti mein aate hain —
  // is liye bara collection kholte hi "Too many subrequests" aa jata tha.
  //
  // GraphQL mein har file ek alias ban jati hai, to 100 files = 1 request.
  // Wapas Map(path -> matan) milta hai; jo file na mile us ki qeemat null.
  async getFilesBatch(paths, ref) {
    const out = new Map();
    if (!paths || !paths.length) return out;
    const branch = ref || this.branch;
    const CHUNK = 100;

    try {
      for (let i = 0; i < paths.length; i += CHUNK) {
        const chunk = paths.slice(i, i + CHUNK);
        const aliases = chunk
          .map((p, j) => \`f\${j}: object(expression: \${JSON.stringify(\`\${branch}:\${p}\`)}) { ... on Blob { text } }\`)
          .join('\\n          ');
        const query = \`query {
        repository(owner: \${JSON.stringify(this.owner)}, name: \${JSON.stringify(this.repo)}) {
          \${aliases}
        }
      }\`;

        const res = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            Authorization: \`Bearer \${this.token}\`,
            'Content-Type': 'application/json',
            'User-Agent': 'karakoram-cms-dashboard'
          },
          body: JSON.stringify({ query })
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(\`GitHub GraphQL \${res.status} \${res.statusText}: \${text.slice(0, 200)}\`);
        }

        const body = await res.json();
        if (body.errors && body.errors.length) {
          throw new Error(\`GitHub GraphQL: \${body.errors.map((e) => e.message).join('; ').slice(0, 300)}\`);
        }
        const repo = body.data && body.data.repository;
        if (!repo) throw new Error('GitHub GraphQL: repository nahi mila');

        chunk.forEach((p, j) => {
          const node = repo[\`f\${j}\`];
          out.set(p, node && typeof node.text === 'string' ? node.text : null);
        });
      }
      return out;
    } catch (e) {
      // GraphQL na chale (token ki ijazat, ya GitHub ka masla) to chhote
      // collections purane tareeqe se chal jate hain. Bare collections par
      // woh waise bhi hadd paar kar dega, is liye wahan saaf error behtar
      // hai bajaye chup chaap 500 ke.
      if (paths.length > 25) throw e;
      const fallback = new Map();
      for (const p of paths) {
        const f = await this.getFileSafe(p, ref);
        fallback.set(p, f ? f.content : null);
      }
      return fallback;
    }
  }`;

/* ---------- index.js ---------- */

const IDX_ANCHOR = `  // Fetch every file in parallel instead of one-by-one — this is the #1 fix
  // for slow list loads (was previously N sequential GitHub API calls).
  const files = await Promise.all(mdFiles.map((entry) => gh.getFile(\`\${collection.path}/\${entry.name}\`)));`;

const IDX_NEW = `  // Sab files ka matan EK GraphQL request mein. Pehle yahan har file ke
  // liye alag fetch jata tha, aur Cloudflare ki subrequest ki hadd paar
  // hote hi poora safha 500 de deta tha. Ab collection kitna bhi bara ho,
  // har 100 files par sirf ek request.
  const paths = mdFiles.map((entry) => \`\${collection.path}/\${entry.name}\`);
  const texts = await gh.getFilesBatch(paths);
  const files = paths.map((p) => ({ content: texts.get(p) || '' }));`;

/* ==================================================================== */

say('\nCMS DASHBOARD — "TOO MANY SUBREQUESTS" KA HAL');
say('='.repeat(78));
say('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

/* ---- 1 ---- */
say('1. functions/_lib/github.js');
say('-'.repeat(78));
if (!fs.existsSync(GH)) { say('   XX  file nahi mili — kya aap dashboard ke folder mein hain?'); problems.push('github.js nahi mili'); }
else {
  const t = fs.readFileSync(GH, 'utf8');
  if (t.includes('getFilesBatch')) say('   -- getFilesBatch pehle se mojood hai, chhora');
  else {
    const n = t.split(GH_ANCHOR).length - 1;
    if (n !== 1) { say('   XX  jagah ' + n + ' baar mili, ek chahiye'); problems.push('github.js anchor'); }
    else {
      const nt = t.split(GH_ANCHOR).join(GH_ANCHOR + GH_ADD);
      const ob = (nt.match(/\{/g) || []).length, cb = (nt.match(/\}/g) || []).length;
      if (ob !== cb) { say('   XX  braces barabar nahi: ' + ob + '/' + cb); problems.push('github.js braces'); }
      else {
        say('   OK  naya method getFilesBatch() — getFileSafe ke foran baad');
        say('       ' + t.length + ' -> ' + nt.length + ' harf, braces ' + ob + '/' + cb);
        say('       purane methods mein se ek bhi nahi badla');
        result[GH] = nt;
      }
    }
  }
}

/* ---- 2 ---- */
say('');
say('2. functions/api/content/[collection]/index.js');
say('-'.repeat(78));
if (!fs.existsSync(IDX)) { say('   XX  file nahi mili'); problems.push('index.js nahi mili'); }
else {
  const t = fs.readFileSync(IDX, 'utf8');
  if (t.includes('getFilesBatch')) say('   -- pehle se laga hua hai, chhora');
  else {
    const n = t.split(IDX_ANCHOR).length - 1;
    if (n !== 1) {
      say('   XX  purani line ' + n + ' baar mili, ek chahiye');
      say('       Shayad file badal chuki hai. Kuch nahi likha.');
      problems.push('index.js anchor');
    } else {
      const nt = t.split(IDX_ANCHOR).join(IDX_NEW);
      const ob = (nt.match(/\{/g) || []).length, cb = (nt.match(/\}/g) || []).length;
      const stillUsesContent = nt.includes('parseFrontmatter(file.content)');
      if (ob !== cb) { say('   XX  braces barabar nahi: ' + ob + '/' + cb); problems.push('index.js braces'); }
      else if (!stillUsesContent) { say('   XX  file.content ab istemal nahi ho raha — kuch toot gaya'); problems.push('index.js content'); }
      else {
        say('   OK  ab getFilesBatch() istemal hoga');
        say('       ' + t.length + ' -> ' + nt.length + ' harf, braces ' + ob + '/' + cb);
        say('       { content } ki shakal waisi hi hai, parseFrontmatter chalta rahega');
        say('       baqi poori file (POST, workflowStatus, cache) bilkul nahi chhui');
        result[IDX] = nt;
      }
    }
  }
}

/* ---- faisla ---- */
say('');
say('='.repeat(78));
if (problems.length) {
  say('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) say('          ' + m);
  say('');
  say('   Yeh list mujhe bhej dein.');
  process.exit(1);
}
if (!Object.keys(result).length) { say('   Kuch badalna nahi tha — sab pehle se laga hua hai.'); process.exit(0); }

say('   Sab theek. Files badlengi: ' + Object.keys(result).length);
say('');
say('   Asar: 60 files wala collection pehle 60 request bhejta tha,');
say('         ab 1 bhejega. Hadd kabhi nahi chhuegi.');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node ' + process.argv[1] + ' --write');
  process.exit(0);
}

for (const [f, text] of Object.entries(result)) {
  if (!fs.existsSync(f + '.baksub')) fs.copyFileSync(f, f + '.baksub');
  fs.writeFileSync(f, text, 'utf8');
  say('LIKHA: ' + path.relative(ROOT, f).split(path.sep).join('/'));
}
say('');
say('backup: *.baksub');
say('');
say('Agla qadam: dashboard ka repo commit aur push karein.');
say('Cloudflare build karega, phir Menu Pages dobara kholein.');
