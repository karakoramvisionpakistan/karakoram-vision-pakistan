#!/usr/bin/env node
/**
 * env-check.mjs   (website ke folder mein)
 *
 * Code se sirf environment variables ke NAAM nikalti hai — jaise
 * SMTP_HOST, SMTP_PASS — taake aap Cloudflare Pages ke dashboard mein
 * ek ek mila lein.
 *
 * KISI FILE KA MATAN PRINT NAHI HOTA. Sirf naam, aur kis file mein mila.
 * Aap ne kaha tha functions/ mein secrets hain, is liye yeh script jaan
 * bujh kar matan ko haath nahi lagati.
 *
 * Ek cheez par alarm bajati hai: agar code mein aisa likha ho
 *
 *     env.SMTP_PASS || "asliPassword123"
 *
 * to woh password repo ke andar hai aur GitHub par ja chuka hai. Aisi
 * soorat mein naam dikhaya jata hai aur qeemat chhupa di jati hai.
 *
 *   node tools/env-check.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

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

say('\nENVIRONMENT VARIABLES — SIRF NAAM');
say('='.repeat(78));
say('   Kisi file ka matan print nahi hota.');

/* kahan dekhna hai. Alag alag jagah ke variables alag jagah set hote
   hain, is liye inhein mila kar dikhana ghalat tha:
     functions/  -> Cloudflare ke dashboard mein
     tools/      -> aap ke computer par, chalane se pehle
     src/        -> build ke waqt
   Aur yeh script khud ko scan nahi karti: is ke comment mein misaal ke
   taur par env.SMTP_PASS likha hai, jo pehle jhoot mooth fehrist mein
   aa gaya tha. */
const SELF = path.resolve(process.argv[1] || '');
const AREAS = [
  { dir: 'functions', label: 'Cloudflare (functions/)' },
  { dir: 'src', label: 'Build (src/)' },
  { dir: 'tools', label: 'Aap ka computer (tools/)' },
];
const fileArea = new Map();
const files = [];
for (const a of AREAS) {
  for (const f of walk(path.join(ROOT, a.dir))) {
    if (!/\.(js|mjs|cjs|ts|njk|json|toml)$/.test(f)) continue;
    if (path.resolve(f) === SELF) continue;
    fileArea.set(rel(f), a.label);
    files.push(f);
  }
}

/* ek bhi file ka matan bahar nahi jata — sirf in regex se naam.
   NAME do harf se shuru hota hai, teen se nahi: "env.DB" warna chhoot
   jata hai (D1 database ka binding bilkul isi shakal mein hai). */
const NAME = '([A-Z][A-Z0-9_]{1,})';
const PATTERNS = [
  new RegExp('\\benv\\s*\\.\\s*' + NAME, 'g'),
  new RegExp('\\benv\\s*\\[\\s*[\'"]' + NAME + '[\'"]\\s*\\]', 'g'),
  new RegExp('process\\.env\\s*\\.\\s*' + NAME, 'g'),
  new RegExp('process\\.env\\s*\\[\\s*[\'"]' + NAME + '[\'"]\\s*\\]', 'g'),
];

/* Destructuring:  const { SMTP_HOST, SMTP_PASS } = env;
   Yeh shakal pehle bilkul nazar nahi aati thi, aur asli code isi mein
   likha hai — is wajah se email ke paanch variable fehrist se gayab
   thay. Yahan { } ke andar se naam alag alag nikale jate hain. */
const DESTRUCTURE = /(?:const|let|var)\s*\{([^{}]+)\}\s*=\s*(?:[A-Za-z_$][\w$]*\s*\.\s*)?env\b/g;
const namesFromBraces = (inner) =>
  inner.split(',')
    .map((part) => part.split(':')[0].replace(/\.\.\./, '').trim())
    .filter((n) => /^[A-Z][A-Z0-9_]{1,}$/.test(n));

/* env.X || "qeemat"  —  yeh repo ke andar secret hota hai */
const FALLBACK = new RegExp(
  '\\benv\\s*(?:\\.\\s*|\\[\\s*[\'"])' + NAME + '(?:[\'"]\\s*\\])?\\s*(?:\\|\\||\\?\\?)\\s*([\'"])([^\'"]+)\\2',
  'g'
);

/* yeh fallback bezaraar hain, in par alarm nahi:
   sach/jhoot, ginti, localhost, raasta, chhota lafz —
   aur email, domain ya URL, kyunke woh secret nahi hote */
const HARMLESS = [
  /^(true|false|null|undefined)$/i,
  /^\d{1,6}$/,
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/,
  /^\//,                                        /* koi bhi raasta */
  /^(utf-?8|none|default|development|production|test|staging)$/i,
  /^[a-z][a-z0-9 _-]{0,14}$/i,                  /* chhota saada lafz */
  /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i,              /* email */
  /^(https?:)?\/\//i,                           /* URL */
  /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i,               /* domain */
];
const harmless = (v) => HARMLESS.some((re) => re.test(v));

const found = new Map();      /* naam -> Set(files) */
const bindings = new Set();   /* D1/KV/R2 — alag jagah set hote hain */
const hasDefault = new Set(); /* jin ki code mein default mojood hai */
const leaks = [];

for (const f of files) {
  let t;
  try { if (fs.statSync(f).size > 4 * 1024 * 1024) continue; t = fs.readFileSync(f, 'utf8'); }
  catch { continue; }

  const add = (n) => {
    if (!found.has(n)) found.set(n, new Set());
    found.get(n).add(rel(f));
  };

  for (const re of PATTERNS) for (const m of t.matchAll(re)) add(m[1]);
  for (const m of t.matchAll(DESTRUCTURE)) for (const n of namesFromBraces(m[1])) add(n);

  /* env.DB.prepare(...) — jis par method chalti ho woh variable nahi,
     binding hai (D1, KV, R2). Cloudflare mein woh "Bindings" ke neechay
     set hota hai, "Variables and Secrets" mein nahi. */
  for (const m of t.matchAll(new RegExp('\\benv\\s*\\.\\s*' + NAME + '\\s*\\.\\s*[a-z]', 'g'))) bindings.add(m[1]);

  /* env.X || kuch   ya   env.X ?? kuch  -> is ki default mojood hai,
     yani woh lazmi nahi. Code khud yeh bata deta hai. */
  for (const m of t.matchAll(new RegExp('\\benv\\s*\\.\\s*' + NAME + '\\s*(?:\\|\\||\\?\\?)', 'g'))) hasDefault.add(m[1]);
  for (const m of t.matchAll(/\b([A-Z][A-Z0-9_]{1,})\s*(?:\|\||\?\?)\s*[^;,)\s]/g)) {
    if (found.has(m[1])) hasDefault.add(m[1]);
  }

  for (const m of t.matchAll(FALLBACK)) {
    const n = m[1], val = m[3];
    if (harmless(val)) continue;
    if (/^(xxxx|placeholder|changeme|your|example|dummy)/i.test(val)) continue;
    /* qeemat kabhi poori nahi dikhai jati */
    leaks.push({ file: rel(f), name: n, hint: val.slice(0, 2) + '…(' + val.length + ' harf)' });
  }
}

say('');
say('1. KAUN SE VARIABLES, AUR KAHAN SET HOTE HAIN');
say('-'.repeat(78));
if (!found.size) say('   Koi environment variable istemal mein nahi.');
else {
  const byArea = new Map();
  for (const [n, fileSet] of found) {
    for (const f of fileSet) {
      const area = fileArea.get(f) || 'doosri jagah';
      if (!byArea.has(area)) byArea.set(area, new Map());
      if (!byArea.get(area).has(n)) byArea.get(area).set(n, []);
      byArea.get(area).get(n).push(f);
    }
  }
  for (const a of AREAS.map((x) => x.label).concat('doosri jagah')) {
    if (!byArea.has(a)) continue;
    const m = byArea.get(a);
    say('');
    say('   ' + a + '   —  ' + m.size + ' variable');
    for (const n of [...m.keys()].sort()) {
      const w = m.get(n);
      say('      ' + n.padEnd(26) + w.slice(0, 2).join(', ') + (w.length > 2 ? '  +' + (w.length - 2) : ''));
    }
  }
}

/* ---- Cloudflare ki fehrist: SIRF functions/ wale ---- */
say('');
say('2. CLOUDFLARE MEIN YEH HONE CHAHIYE');
say('-'.repeat(78));
const cfNames = [...found.keys()].filter((n) =>
  [...found.get(n)].some((f) => (fileArea.get(f) || '') === 'Cloudflare (functions/)')).sort();

if (!cfNames.length) say('   -- functions/ koi environment variable nahi maangta.');
else {
  say('   Workers & Pages  >  karakoram-vision-pakistan  >  Settings  >');
  say('   Variables and Secrets. "Production" ke liye hon — sirf');
  say('   "Preview" kaafi nahi:');
  say('');
  /* DEBUG wale production mein set NAHI hone chahiye — inhein checklist
     mein daalna ghalat hoga */
  const debugVars = cfNames.filter((n) => /DEBUG|VERBOSE|TRACE/.test(n));
  const bind = cfNames.filter((n) => bindings.has(n) && !debugVars.includes(n));
  const rest = cfNames.filter((n) => !debugVars.includes(n) && !bind.includes(n));
  const must = rest.filter((n) => !hasDefault.has(n));
  const opt = rest.filter((n) => hasDefault.has(n));

  say('   LAZMI — in ke bagair us hissa ka kaam ruk jata hai:');
  for (const n of must) say('      [ ]  ' + n + (/PASS|TOKEN|KEY|SECRET/.test(n) ? '   <- "Secret" rakhein' : ''));

  if (opt.length) {
    say('');
    say('   MARZI — code mein in ki default mojood hai:');
    for (const n of opt) say('      [ ]  ' + n);
  }

  if (bind.length) {
    say('');
    say('   YEH VARIABLE NAHI, BINDING HAI — alag jagah set hoti hai:');
    say('   Settings > Bindings  (D1 / KV / R2), "Variables" mein nahi.');
    for (const n of bind) say('      [ ]  ' + n);
  }

  if (debugVars.length) {
    say('');
    say('   Aur yeh production mein set NA karein:');
    for (const n of debugVars) say('      [X]  ' + n);
    say('       Yeh debug ke liye hain. Set hon to API tafseeli jawab deta');
    say('       hai, jo bahar nahi jana chahiye. Agar Cloudflare mein pehle');
    say('       se mojood ho to hata dein.');
  }
}

/* email ka raasta hai ya nahi — yeh asli sawal hai */
say('');
say('3. EMAIL KA RAASTA');
say('-'.repeat(78));
const mail = cfNames.filter((n) => /SMTP|MAIL|EMAIL|SENDGRID|RESEND|POSTMARK|MAILGUN|SES_/.test(n));
const creds = cfNames.filter((n) => /PASS|USER|HOST|PORT|API_?KEY|TOKEN/.test(n));
if (mail.length) say('   email se mutalliq: ' + mail.join(', '));
else say('   -- email se mutalliq koi variable nahi.');
if (!mail.some((n) => /PASS|API_?KEY|TOKEN|USER/.test(n))) {
  say('');
  say('   !!  Email bhejne ki koi chaabi (password/API key) nazar nahi aati.');
  say('       Agar form email bhejta hai to use kisi chaabi ki zaroorat hoti');
  say('       hai. Do imkanat hain: ya email bhejta hi nahi aur tafseel');
  say('       kahin aur (sheet/dashboard) jati hai, ya chaabi code ke andar');
  say('       likhi hui hai. Yeh dekhna zaroori hai.');
}
if (creds.length) {
  say('');
  say('   chaabi jaise naam: ' + creds.join(', '));
}

/* ---------- leak ---------- */
say('');
say('4. KOI PASSWORD CODE KE ANDAR?');
say('-'.repeat(78));
if (!leaks.length) say('   OK  code mein koi hardcoded qeemat nahi mili');
else {
  say('   XX XX  ' + leaks.length + ' jagah code ke andar qeemat likhi hui hai:');
  say('');
  for (const l of leaks) say('      ' + l.file + '   ' + l.name + '  =  ' + l.hint);
  say('');
  say('   Yeh "env.X || qeemat" ki shakal mein hai, yani agar Cloudflare');
  say('   mein variable na ho to code apni qeemat istemal karta hai. Agar');
  say('   woh asli password hai to woh GitHub par ja chuka hai aur use');
  say('   BADALNA parega — hatana kaafi nahi, history mein reh jata hai.');
  say('   Maine qeemat jaan bujh kar chhupai hai. Naam mujhe bhej dein.');
}

/* ---------- misaal wali file ---------- */
say('');
say('5. KOI MISAAL WALI FILE?');
say('-'.repeat(78));
const samples = ['.dev.vars.example', '.env.example', 'wrangler.toml', '.dev.vars.sample', 'README.md']
  .filter((f) => fs.existsSync(path.join(ROOT, f)));
if (!samples.length) say('   -- koi nahi mili');
else for (const s of samples) say('   ' + s + '   (' + fs.statSync(path.join(ROOT, s)).size + ' harf)');
say('');
say('   Agar in mein se koi variables ki fehrist rakhti hai to woh');
say('   milane ke liye sab se achhi cheez hai.');

say('');
say('='.repeat(78));
say('AGLA QADAM');
say('');
say('   1. Cloudflare dashboard kholein aur ooper wali fehrist mila lein.');
say('   2. Agar koi variable gayab ho to form kaam nahi karega.');
say('   3. Variable jorne ke baad DOBARA DEPLOY karna parta hai —');
say('      sirf save karne se chalu functions ko nahi milte.');
say('   4. Phir asli site par form bhar kar dekhein ke email aaya.');
say('');

fs.writeFileSync(path.join(ROOT, '_env.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _env.txt   (is mein sirf naam hain, koi qeemat nahi)');
