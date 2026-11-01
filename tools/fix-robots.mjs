#!/usr/bin/env node
/**
 * fix-robots.mjs   (website ke folder mein)
 *
 * robots.txt mein Anthropic aur Perplexity ke bots ka zikr jorta hai,
 * aap ki policy ke mutabiq: training se bahar, search mein shamil.
 *
 *   Block (training):   ClaudeBot, anthropic-ai, CCBot
 *   Allow (search):     Claude-SearchBot, Claude-User,
 *                       PerplexityBot, Perplexity-User
 *
 * PARSE KAR KE DOBARA NAHI LIKHI JATI. Sirf Sitemap wali line se pehle
 * naya matan daala jata hai; baqi file ka ek harf nahi badalta. Parse
 * sirf JAANCH ke liye hota hai.
 *
 * Ek bhi jaanch nakaam ho to kuch nahi likha jata.
 *
 *   node tools/fix-robots.mjs            -> sirf dikhana
 *   node tools/fix-robots.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SRC = path.join(ROOT, 'src');
const say = (s = '') => console.log(s);
const problems = [];

const walk = (dir, acc = []) => {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc); else acc.push(f);
  }
  return acc;
};
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

/* ---- robots.txt ko group ke hisab se parhna ---- */
const parse = (t) => {
  const groups = [];
  let cur = null;
  for (const line of t.split(/\r?\n/)) {
    const l = line.replace(/#.*$/, '').trim();
    if (!l || /[{}%]/.test(l)) continue;          /* Nunjucks lines chhor do */
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase(), val = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
    } else if (cur && (key === 'disallow' || key === 'allow')) {
      cur.rules.push({ type: key, path: val });
    }
  }
  return groups;
};
const blocksAll = (g) =>
  g.rules.some((r) => r.type === 'disallow' && r.path === '/') &&
  !g.rules.some((r) => r.type === 'allow' && (r.path === '/' || r.path === ''));
const groupFor = (groups, agent) => groups.find((g) => g.agents.includes(agent.toLowerCase()));

/* ---- jorne wala matan ---- */
const BLOCK = `# Anthropic: search and user-initiated fetches are allowed; training crawl is opted out.
User-agent: Claude-SearchBot
User-agent: Claude-User
Allow: /

User-agent: ClaudeBot
User-agent: anthropic-ai
Disallow: /

# Perplexity answers may cite public pages.
User-agent: PerplexityBot
User-agent: Perplexity-User
Allow: /

# Common Crawl feeds third-party model training.
User-agent: CCBot
Disallow: /

`;

const ALLOWED = ['claude-searchbot', 'claude-user', 'perplexitybot', 'perplexity-user'];
const BLOCKED = ['claudebot', 'anthropic-ai', 'ccbot'];

say('\nrobots.txt — ANTHROPIC AUR PERPLEXITY');
say('='.repeat(78));
say('   Sab kuch ya kuch bhi nahi: ek jaanch nakaam ho to file nahi likhti.');

/* ---- source file dhoondo ---- */
say('');
say('1. SOURCE FILE');
say('-'.repeat(78));
const cands = walk(SRC).filter((f) => {
  if (!/robots/i.test(path.basename(f))) return false;
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { return false; }
  return /User-agent\s*:/i.test(t);
});

if (!cands.length) {
  say('   XX  src mein robots ki koi source file nahi mili.');
  say('       Shayad woh static folder se copy hoti hai. Yeh chalayein');
  say('       aur natija mujhe bhejein:');
  say('');
  say('         node -e "const fs=require(\'fs\'),p=require(\'path\');' +
      '(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true}))' +
      '{if(e.name[0]===\'.\'||e.name===\'node_modules\')continue;' +
      'const f=p.join(d,e.name);if(e.isDirectory())w(f);' +
      'else if(/robots/i.test(e.name))console.log(f)}})(\'.\')"');
  process.exit(1);
}
if (cands.length > 1) {
  say('   XX  ek se zyada file mili, faisla main khud nahi karunga:');
  for (const f of cands) say('          ' + rel(f));
  process.exit(1);
}

const FILE = cands[0];
const before = fs.readFileSync(FILE, 'utf8');
say('   ' + rel(FILE) + '   (' + before.length + ' harf)');

/* ---- pehle se laga hua? ---- */
const gBefore = parse(before);
const already = ALLOWED.concat(BLOCKED).filter((a) => groupFor(gBefore, a));
if (already.length) {
  say('');
  say('   -- yeh pehle se mojood hain: ' + already.join(', '));
  say('      Dobara jorne se do group ban jate hain aur bot confuse hota');
  say('      hai. Kuch nahi badla.');
  process.exit(0);
}

/* ---- jagah ---- */
say('');
say('2. JAGAH');
say('-'.repeat(78));
const sitemapLines = before.split(/\r?\n/).filter((l) => /^\s*Sitemap\s*:/i.test(l));
if (sitemapLines.length !== 1) {
  say('   XX  "Sitemap:" line ' + sitemapLines.length + ' baar mili, ek chahiye.');
  problems.push('Sitemap line');
}
const ANCHOR = sitemapLines[0];
let after = before;
if (!problems.length) {
  const n = before.split(ANCHOR).length - 1;
  if (n !== 1) { say('   XX  anchor ' + n + ' baar mila'); problems.push('anchor'); }
  else {
    after = before.split(ANCHOR).join(BLOCK + ANCHOR);
    say('   OK  naya matan "Sitemap:" line se foran pehle');
  }
}

/* ---- jaanch ---- */
say('');
say('3. JAANCH');
say('-'.repeat(78));
if (!problems.length) {
  const gAfter = parse(after);
  const checks = [];

  /* purane group waise hi */
  const star = groupFor(gAfter, '*');
  checks.push(['* ko Allow: / mila hua hai', !!star && !blocksAll(star)]);
  checks.push(['Googlebot block nahi hai', !groupFor(gAfter, 'googlebot') || !blocksAll(groupFor(gAfter, 'googlebot'))]);
  checks.push(['GPTBot pehle ki tarah block', !!groupFor(gAfter, 'gptbot') && blocksAll(groupFor(gAfter, 'gptbot'))]);
  checks.push(['Google-Extended pehle ki tarah block', !!groupFor(gAfter, 'google-extended') && blocksAll(groupFor(gAfter, 'google-extended'))]);
  checks.push(['OAI-SearchBot pehle ki tarah allow', !!groupFor(gAfter, 'oai-searchbot') && !blocksAll(groupFor(gAfter, 'oai-searchbot'))]);

  /* naye */
  for (const a of ALLOWED) {
    const g = groupFor(gAfter, a);
    checks.push([a + ' allow hai', !!g && !blocksAll(g)]);
  }
  for (const a of BLOCKED) {
    const g = groupFor(gAfter, a);
    checks.push([a + ' block hai', !!g && blocksAll(g)]);
  }

  /* koi bot do group mein na ho */
  const seen = new Map();
  let dup = null;
  for (const g of gAfter) for (const a of g.agents) {
    if (seen.has(a)) dup = a; else seen.set(a, true);
  }
  checks.push(['koi bot do group mein nahi', !dup, dup || '']);

  /* baqi file waisi hi */
  const untouched = before.split(ANCHOR)[0] === after.split(BLOCK + ANCHOR)[0]
    && before.split(ANCHOR)[1] === after.split(BLOCK + ANCHOR)[1];
  checks.push(['baqi file ka ek harf nahi badla', untouched]);

  for (const [label, pass, extra] of checks) {
    if (!pass) problems.push(label);
    say('   ' + (pass ? 'OK ' : 'XX ') + label + (extra ? '  (' + extra + ')' : ''));
  }

  say('');
  say('   group: ' + gBefore.length + ' -> ' + gAfter.length);
  say('   harf:  ' + before.length + ' -> ' + after.length);
}

/* ---- faisla ---- */
say('');
say('='.repeat(78));
if (problems.length) {
  say('XX XX XX  ' + problems.length + ' masle — FILE NAHI LIKHI:');
  for (const p of problems) say('          ' + p);
  say('');
  say('   Yeh list mujhe bhej dein.');
  process.exit(1);
}

say('   Jo jora ja raha hai:');
say('');
for (const line of BLOCK.replace(/\n+$/, '').split('\n')) say('      | ' + line);
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-robots.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bakrobots')) fs.copyFileSync(FILE, FILE + '.bakrobots');
fs.writeFileSync(FILE, after, 'utf8');
say('LIKHA: ' + rel(FILE) + '   (backup: ' + path.basename(FILE) + '.bakrobots)');
say('');
say('Agla qadam:  npm run build');
say('Phir dekhein: _site/robots.txt');
