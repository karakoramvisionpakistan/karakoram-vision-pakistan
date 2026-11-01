#!/usr/bin/env node
/**
 * git-ready.mjs   (website ke folder mein)
 *
 * Push se pehle ki jaanch. KUCH COMMIT YA PUSH NAHI KARTI.
 *
 * Teen cheezein dekhti hai:
 *
 *   1. KOI KEY YA PASSWORD GITHUB PAR JA RAHA HAI?
 *      Yeh sab se zaroori hai. Jo file commit hone wali hai, us mein
 *      key/password jaise matan dhoondti hai, aur .env, .dev.vars jaisi
 *      files dekhti hai ke woh gitignore mein hain ya nahi.
 *
 *   2. KOORA KACHRA COMMIT HO RAHA HAI?
 *      .bak* backup files, _*.txt dumps, node_modules, _site — yeh
 *      GitHub par nahi jane chahiye. --write ke saath .gitignore mein
 *      daal deti hai (sirf jorti hai, kuch mitati nahi).
 *
 *   3. KYA KYA BADLA HAI?
 *      Branch, remote, aur badli hui files ka khulasa.
 *
 * Aakhir mein commit ka command print karti hai — chalati nahi.
 *
 *   node tools/git-ready.mjs            -> sirf dikhana
 *   node tools/git-ready.mjs --write    -> .gitignore theek karna
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const stop = [];
const look = [];

/* stdio: git ke error terminal par na aayein — hum khud batate hain */
const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch { return null; }
};

say('\nPUSH SE PEHLE KI JAANCH');
say('='.repeat(78));
say('   Yeh kuch commit ya push nahi karti. Sirf dekhti hai.');

if (!git('rev-parse', '--git-dir')) {
  say('');
  say('XX  Yeh git repo nahi hai (ya git nahi mila).');
  process.exit(1);
}

/* ---------- branch aur remote ---------- */
say('');
say('1. REPO');
say('-'.repeat(78));
const branch = (git('rev-parse', '--abbrev-ref', 'HEAD') || '').trim();
const remote = (git('remote', 'get-url', 'origin') || '').trim();
say('   branch:  ' + (branch || '[nahi mila]'));
say('   origin:  ' + (remote || '[koi remote nahi]'));
if (!remote) { say('   XX  koi remote nahi — push kahan karein?'); stop.push('koi remote nahi'); }

const lastLog = (git('log', '-1', '--format=%h  %ad  %s', '--date=short') || '').trim();
say('   aakhri commit: ' + (lastLog || '[koi commit nahi]'));

git('fetch', '--quiet', 'origin');
const counts = (git('rev-list', '--left-right', '--count', 'HEAD...@{u}') || '').trim().split(/\s+/);
if (counts.length === 2) {
  const [ahead, behind] = counts.map(Number);
  say('   aap ' + ahead + ' commit aage, ' + behind + ' peechay hain');
  if (behind > 0) {
    say('   !!  GitHub par ' + behind + ' commit aisi hain jo aap ke paas nahi.');
    say('       Push se pehle "git pull --rebase" chalana parega.');
    look.push(behind + ' commit peechay');
  }
}

/* ---------- kya kya badla ---------- */
say('');
say('2. KYA KYA BADLA HAI');
say('-'.repeat(78));
const porcelain = git('status', '--porcelain') || '';
const lines = porcelain.split(/\r?\n/).filter(Boolean);

const changed = [], untracked = [], deleted = [];
for (const l of lines) {
  const code = l.slice(0, 2), f = l.slice(3).replace(/^"|"$/g, '');
  if (code === '??') untracked.push(f);
  else if (/D/.test(code)) deleted.push(f);
  else changed.push(f);
}

if (!lines.length) {
  say('   Kuch nahi badla — sab pehle se commit ho chuka hai.');
  say('');
  say('   Agar aap ko lagta hai badlav hona chahiye tha, to shayad aap');
  say('   ghalat folder mein hain. Yeh folder: ' + ROOT);
  fs.writeFileSync(path.join(ROOT, '_gitready.txt'), out.join('\n') + '\n', 'utf8');
  process.exit(0);
}

say('   badli hui:   ' + changed.length);
say('   nayi:        ' + untracked.length);
say('   mitai gayi:  ' + deleted.length);
say('');

/* folder ke hisab se khulasa */
const byDir = {};
for (const f of [...changed, ...untracked]) {
  const parts = f.split('/');
  /* folder chahiye, file ka naam nahi: aakhri hissa chhor dete hain */
  const d = parts.length === 1 ? '(jar)' : parts.slice(0, Math.min(2, parts.length - 1)).join('/');
  (byDir[d] = byDir[d] || []).push(f);
}
say('   folder ke hisab se:');
for (const d of Object.keys(byDir).sort()) say('      ' + String(byDir[d].length).padStart(4) + '  ' + d);

/* ---------- 3. KOORA ---------- */
say('');
say('3. KOORA KACHRA');
say('-'.repeat(78));

const JUNK = [
  { pat: /\.bak[a-z0-9]*$/i, label: 'backup files (.bak*)', ignore: '*.bak*' },
  { pat: /^_[^/]*\.txt$/, label: 'dump files (_*.txt)', ignore: '_*.txt' },
  { pat: /^node_modules\//, label: 'node_modules', ignore: 'node_modules/' },
  { pat: /^_site\//, label: '_site (bana hua site)', ignore: '_site/' },
  { pat: /^\.wrangler\//, label: '.wrangler', ignore: '.wrangler/' },
  { pat: /(^|\/)\.DS_Store$/, label: '.DS_Store', ignore: '.DS_Store' },
  { pat: /(^|\/)Thumbs\.db$/i, label: 'Thumbs.db', ignore: 'Thumbs.db' },
];

const all = [...changed, ...untracked];
const needIgnore = [];
let junkTotal = 0;
for (const j of JUNK) {
  const hits = all.filter((f) => j.pat.test(f));
  if (!hits.length) continue;
  junkTotal += hits.length;
  say('   XX  ' + String(hits.length).padStart(4) + '  ' + j.label);
  for (const h of hits.slice(0, 5)) say('            ' + h);
  if (hits.length > 5) say('            ... aur ' + (hits.length - 5));
  needIgnore.push(j.ignore);
}
if (!junkTotal) say('   OK  koi koora commit nahi ho raha');

/* ---------- 4. KEY / PASSWORD ---------- */
say('');
say('4. KOI KEY YA PASSWORD?');
say('-'.repeat(78));
say('   Yeh sab se zaroori jaanch hai. GitHub par gaya hua secret wapas');
say('   nahi aata — use badalna parta hai.');
say('');

/* khatarnak naam wali files */
const SECRET_FILES = [
  /(^|\/)\.env($|\.)/, /(^|\/)\.dev\.vars$/, /\.pem$/, /\.p12$/, /\.pfx$/,
  /(^|\/)id_rsa$/, /\.key$/, /(^|\/)credentials\.json$/, /(^|\/)service-account.*\.json$/,
];
/* in mein se jo pehle se tracked hain, woh GitHub par pehle se ja chuki hain */
const tracked = new Set((git('ls-files') || '').split(/\r?\n/).filter(Boolean));

const risky = all.filter((f) => SECRET_FILES.some((p) => p.test(f)));
const riskyTracked = [...tracked].filter((f) => SECRET_FILES.some((p) => p.test(f)));

if (riskyTracked.length) {
  say('   XX XX  Yeh files GITHUB PAR PEHLE SE MOJOOD HAIN:');
  for (const f of riskyTracked) say('             ' + f);
  say('');
  say('          Yeh kisi purani commit mein ja chuki hain. .gitignore ab');
  say('          jorne se woh wapas nahi aatin — git history mein rehti hain.');
  say('          Agar in mein asli key ya password hai to use BADALNA parega.');
  say('          Mujhe batayein, main agla qadam bata dunga.');
  say('');
  for (const f of riskyTracked) stop.push('GitHub par pehle se: ' + f);
}

const riskyNew = risky.filter((f) => !tracked.has(f));
if (riskyNew.length) {
  say('   XX  Yeh files ab commit hone wali hain:');
  for (const f of riskyNew) say('          ' + f);
  say('');
  say('       Aisi files GitHub par kabhi nahi jani chahiye. Main inhein');
  say('       .gitignore mein daal raha hoon (neechay dekhein).');
  for (const f of riskyNew) { stop.push('secret file: ' + f); needIgnore.push(f); }
}

if (!risky.length && !riskyTracked.length) say('   OK  .env / .dev.vars / key jaisi koi file commit nahi ho rahi');

/* matan ke andar */
const PATTERNS = [
  { re: /AKIA[0-9A-Z]{16}/, name: 'AWS access key' },
  { re: /\bsk_(live|test)_[0-9a-zA-Z]{16,}/, name: 'Stripe key' },
  { re: /\b(ghp_|github_pat_)[0-9A-Za-z_]{20,}/, name: 'GitHub token' },
  { re: /\bAIza[0-9A-Za-z_\-]{35}\b/, name: 'Google API key' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, name: 'private key' },
  { re: /\bxox[baprs]-[0-9A-Za-z-]{10,}/, name: 'Slack token' },
  /* ["']? zaroori hai: JSON mein key ke baad quote aata hai —
     "password": "..."  — us ke bagair yeh line pakri nahi jati thi. */
  { re: /\b(password|passwd|secret|api[-_]?key|access[-_]?token|auth[-_]?token)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i, name: 'password/key likha hua' },
];
/* yeh chhor do — placeholder ya form ke khaane hain */
const SAFE = [
  /XXXXX/, /\benv\./, /process\.env/, /\{\{/, /\{%/,
  /your[-_]?(key|token|password|secret)/i, /example/i, /placeholder/i,
  /\bchangeme\b/i, /\bdummy\b/i, /<input/i, /type=["']password/i,
  /autocomplete/i, /\bnull\b/, /""\s*[,}]?$/,
];

const TEXT = /\.(njk|js|mjs|cjs|ts|json|md|css|html|txt|yml|yaml|toml|sh|ps1)$/i;
const found = [];
for (const f of all) {
  if (!TEXT.test(f)) continue;
  /* jo koora gitignore ho raha hai use scan karne ka faida nahi — aur
     is script ki apni output file (_gitready.txt) bhi usi mein hai,
     warna pichhle run ke nataij dobara ginay jate hain. */
  if (JUNK.some((j) => j.pat.test(f))) continue;
  if (f === '.gitignore') continue;
  const p = path.join(ROOT, f);
  let t;
  try { if (!fs.existsSync(p) || fs.statSync(p).size > 2 * 1024 * 1024) continue; t = fs.readFileSync(p, 'utf8'); }
  catch { continue; }
  t.split(/\r?\n/).forEach((line, i) => {
    if (line.length > 600) return;
    for (const { re, name } of PATTERNS) {
      if (!re.test(line)) continue;
      if (SAFE.some((s) => s.test(line))) continue;
      found.push({ f, n: i + 1, name, line: line.trim().slice(0, 90) });
      break;
    }
  });
}
say('');
if (!found.length) say('   OK  kisi file ke andar key ya password jaisa matan nahi mila');
else {
  say('   XX  ' + found.length + ' jagah shak hua:');
  for (const h of found.slice(0, 25)) {
    say('          ' + h.f + ':' + h.n + '   [' + h.name + ']');
    say('             ' + h.line);
  }
  if (found.length > 25) say('          ... aur ' + (found.length - 25));
  say('');
  say('       Har ek asli secret nahi hota — kuch jhooti ghabrahat bhi hoti');
  say('       hai. Magar push se pehle in par nazar daal lein. Yeh list');
  say('       mujhe bhej dein to main bata dunga kaun asli hai.');
  for (const h of found.slice(0, 10)) stop.push('shak: ' + h.f + ':' + h.n);
}

/* ---------- .gitignore ---------- */
say('');
say('5. .gitignore');
say('-'.repeat(78));
const GI = path.join(ROOT, '.gitignore');
let giNew = null;
const existing = fs.existsSync(GI) ? fs.readFileSync(GI, 'utf8') : '';
if (!fs.existsSync(GI)) say('   !!  .gitignore nahi hai');
const haveLines = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
const toAdd = [...new Set(needIgnore)].filter((l) => !haveLines.has(l));

if (!toAdd.length) say('   OK  jo jorna tha woh pehle se mojood hai');
else {
  say('   Yeh lines jorni hain:');
  for (const l of toAdd) say('      ' + l);
  const MARK = '# --- push se pehle jori gayi (Claude) ---';
  giNew = (existing ? existing.replace(/\s*$/, '\n') : '') + '\n' + MARK + '\n' + toAdd.join('\n') + '\n';
  say('');
  say('   Sirf jora ja raha hai — purani lines ko haath nahi lagta.');
}

/* ---------- khulasa ---------- */
say('');
say('='.repeat(78));
say('KHULASA');
say('');
if (stop.length) {
  say('   PEHLE DEKH LEIN (' + stop.length + '):');
  for (const s of stop.slice(0, 15)) say('      XX  ' + s);
  if (stop.length > 15) say('      ... aur ' + (stop.length - 15));
  say('');
  say('   Yeh khulasa mujhe bhej dein. Commit ka command uske baad.');
} else if (look.length) {
  say('   Koi rokne wali baat nahi, magar dekh lein:');
  for (const l of look) say('      !!  ' + l);
} else {
  say('   Sab saaf. Commit kar sakte hain.');
}
say('');

fs.writeFileSync(path.join(ROOT, '_gitready.txt'), out.join('\n') + '\n', 'utf8');

if (giNew && WRITE) {
  if (fs.existsSync(GI) && !fs.existsSync(GI + '.bakgit')) fs.copyFileSync(GI, GI + '.bakgit');
  fs.writeFileSync(GI, giNew, 'utf8');
  console.log('-'.repeat(78));
  console.log('LIKHA: .gitignore' + (fs.existsSync(GI + '.bakgit') ? '   (backup: .gitignore.bakgit)' : ''));
  console.log('');
  console.log('Ab dobara chalayein taake ginti theek dikhe:');
  console.log('   node tools/git-ready.mjs');
} else if (giNew) {
  console.log('-'.repeat(78));
  console.log('LIKHA: _gitready.txt');
  console.log('');
  console.log('.gitignore theek karne ke liye:');
  console.log('   node tools/git-ready.mjs --write');
} else {
  console.log('-'.repeat(78));
  console.log('LIKHA: _gitready.txt');
}
