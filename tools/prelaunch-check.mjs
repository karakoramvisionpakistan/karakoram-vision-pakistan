#!/usr/bin/env node
/**
 * prelaunch-check.mjs   (website ke folder mein)
 *
 * Live karne se pehle ki jaanch. Zyada tar sirf dekhta hai; sirf ek cheez
 * theek karta hai jo poori tarah mehfooz hai (menu ke link ka aakhri slash).
 *
 * Dekhta hai:
 *   1. site.url aur kahin pages.dev to nahi likha
 *   2. menu ke woh link jo kisi safhe par nahi jate
 *   3. TRIP_DEBUG aur doosre debug ke nishan
 *   4. form kahan jata hai (formspree)
 *   5. Search Console / Bing ke verification code
 *   6. robots.txt aur sitemap
 *
 * menu.json Node se badli jati hai, PowerShell se nahi.
 *
 *   node tools/prelaunch-check.mjs            -> sirf dikhana
 *   node tools/prelaunch-check.mjs --write    -> menu ke link theek karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SRC = path.join(ROOT, 'src');
const SITEDIR = path.join(ROOT, '_site');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const blockers = [];
const warnings = [];

const walk = (dir, acc = [], skip = new Set(['node_modules', '_site', '.git', 'assets'])) => {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || skip.has(e.name) || /\.bak/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc, skip); else acc.push(f);
  }
  return acc;
};

const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

say('\nLIVE KARNE SE PEHLE KI JAANCH');
say('='.repeat(78));

/* ---------- 1. site.url ---------- */
say('');
say('1. WEBSITE KA PATA');
say('-'.repeat(78));
let site = {};
const SITEJSON = path.join(SRC, '_data', 'site.json');
try { site = JSON.parse(fs.readFileSync(SITEJSON, 'utf8')); }
catch (e) { say('   XX  site.json parh nahi saki: ' + e.message); blockers.push('site.json'); }

const url = site.url || '';
say('   site.url:  ' + (url || '[khaali]'));
if (!url) blockers.push('site.url khaali hai');
else if (/pages\.dev/.test(url)) { say('   XX  yeh abhi bhi preview ka pata hai'); blockers.push('site.url par pages.dev'); }
else say('   OK  asli domain hai');

/* kahin aur pages.dev? */
const files = walk(SRC);
const devHits = [];
for (const f of files) {
  if (!/\.(njk|json|md|js|mjs|css|txt|yml|html)$/.test(f)) continue;
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (t.includes('pages.dev')) devHits.push(rel(f));
}
say('');
say('   "pages.dev" kahin likha hua: ' + (devHits.length ? devHits.join(', ') : 'kahin nahi'));
if (devHits.length) warnings.push('pages.dev ' + devHits.length + ' file mein');

/* ---------- 2. menu ke toote link ---------- */
say('');
say('2. MENU KE LINK');
say('-'.repeat(78));
const MENU = path.join(SRC, '_data', 'menu.json');
let menuFixed = null;
if (!fs.existsSync(MENU)) say('   --  menu.json nahi mili');
else if (!fs.existsSync(SITEDIR)) say('   !!  _site nahi mila — pehle "npm run build" chalayein');
else {
  const raw = fs.readFileSync(MENU, 'utf8');
  const urls = [...raw.matchAll(/"url"\s*:\s*"(\/[^"]*)"/g)].map((m) => m[1]);
  const uniq = [...new Set(urls)];
  const dead = [], slashless = [], withQuery = [];

  /* path.join khud slash saaf kar deta hai, is liye seedha naam jorna
     parta hai — warna "/a/b" aur "/a/b/" ek hi lagte hain. */
  const inSite = (p) => SITEDIR + '/' + p.replace(/^\//, '');

  for (const u of uniq) {
    /* ?query aur #hash raaste ka hissa NAHI hain. "/search/?q=k2" ka safha
       "/search/" hai. Pehle yeh kaata nahi ja raha tha, is liye har aisa
       link jhoot mooth toota hua lagta tha. */
    const clean = u.split('#')[0].split('?')[0] || '/';
    const hadQuery = clean !== u;

    const bare = clean.replace(/^\//, '').replace(/\/$/, '');
    const isFile = fs.existsSync(inSite(clean)) && fs.statSync(inSite(clean)).isFile();
    const hasIndex = bare === '' || fs.existsSync(SITEDIR + '/' + bare + '/index.html');

    if (isFile) continue;                                 /* .pdf waghera */
    if (!hasIndex) { dead.push({ u, clean }); continue; }
    if (hadQuery) { withQuery.push(u); continue; }         /* theek hai */
    if (!clean.endsWith('/')) slashless.push(u);           /* safha hai, slash nahi */
  }

  say('   ' + uniq.length + ' link dekhe gaye.');
  if (withQuery.length) say('   OK  ' + withQuery.length + ' link query ke sath (jaise /search/?q=k2) — safha mojood hai');
  if (!dead.length && !slashless.length) say('   OK  sab theek — har link apne safhe par jata hai');

  for (const { u, clean } of dead) {
    const looksFile = /\.[a-z0-9]{2,5}$/i.test(clean);
    say('   XX  ' + u + '   -- ' + (looksFile ? 'yeh file _site mein nahi mili' : 'is ka koi safha hi nahi bana')
        + (clean !== u ? '   (dekha gaya raasta: ' + clean + ')' : ''));
    blockers.push('menu: ' + u);
  }
  for (const u of slashless) say('   !!  ' + u + '   ->   ' + u + '/   (aakhri slash ki kami)');

  if (slashless.length) {
    say('');
    say('      Safha mojood hai, bas link bina slash hai. Cloudflare khud');
    say('      slash wale pate par bhej deta hai, to toota nahi — magar');
    say('      har click par ek extra redirect lagta hai. Theek kar dena behtar.');
    let nt = raw;
    for (const u of slashless) {
      const from = '"' + u + '"', to = '"' + u + '/"';
      nt = nt.split(from).join(to);
    }
    try {
      JSON.parse(nt);
      const a = (raw.match(/"url"\s*:/g) || []).length, b = (nt.match(/"url"\s*:/g) || []).length;
      if (a !== b) { say('   XX  link ki ginti badal gayi (' + a + ' -> ' + b + ') — chhora'); blockers.push('menu.json'); }
      else menuFixed = nt;
    }
    catch (e) { say('   XX  badalne par JSON kharab ho gayi — chhora: ' + e.message); blockers.push('menu.json'); }
  }
}

/* ---------- 3. debug ke nishan ---------- */
say('');
say('3. DEBUG KE NISHAN');
say('-'.repeat(78));
/* functions/ bhi dekhna zaroori hai. Pehle sirf src/ dekhta tha, is liye
   TRIP_DEBUG jo functions/api/trip-request.js mein hai woh nazar nahi
   aaya aur script ne jhoot mooth "kahin nahi" kaha. */
const debugFiles = [...files, ...walk(path.join(ROOT, 'functions'))];
const DEBUG = ['TRIP_DEBUG', 'console.log(', 'debugger'];
let dn = 0;
for (const needle of DEBUG) {
  const hits = [];
  for (const f of debugFiles) {
    if (!/\.(njk|js|mjs|json|md)$/.test(f)) continue;
    let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const c = t.split(needle).length - 1;
    if (c) hits.push(rel(f) + ' (' + c + ')');
  }
  say('   ' + needle.padEnd(14) + (hits.length ? hits.join(', ') : 'kahin nahi'));
  if (needle === 'TRIP_DEBUG' && hits.length) { dn += hits.length; warnings.push('TRIP_DEBUG'); }
}
if (dn) {
  say('');
  say('   TRIP_DEBUG ki lines (jahan mili):');
  for (const f of debugFiles) {
    if (!/\.(njk|js|mjs|json|md)$/.test(f)) continue;
    let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (!t.includes('TRIP_DEBUG')) continue;
    t.split(/\r?\n/).forEach((l, i) => { if (l.includes('TRIP_DEBUG')) say('      ' + rel(f) + ':' + (i + 1) + '  ' + l.trim().slice(0, 100)); });
  }
  say('');
  say('   Yeh maine khud nahi hataya — code dekhe bagair hatana khatarnak hai.');
  say('   Yeh lines mujhe bhej dein, main theek kar dunga.');
}

/* ---------- 4. form kahan jata hai ---------- */
say('');
say('4. FORM KAHAN JATA HAI');
say('-'.repeat(78));
const FORMS_CFG = path.join(SRC, '_data', 'formsConfig.json');

/* ---- pehle dekho form ka koi raasta hai ya nahi ----
   Teen jagah ho sakta hai: formsConfig ka endpoint, functions/ ki koi
   file, ya khud safhe par action= / hx-post= / fetch(). Pehle main sirf
   "https://" dhoondta tha, is liye "/api/inquiry" jaisa relative raasta
   nazar hi nahi aata tha aur script jhoot mooth kehti thi ke form kahin
   nahi jata. */
const routes = [];

if (fs.existsSync(FORMS_CFG)) {
  try {
    const fc = JSON.parse(fs.readFileSync(FORMS_CFG, 'utf8'));
    const seek = (o, p = '') => {
      if (typeof o === 'string') {
        const s = o.trim();
        if (/^(https?:\/\/|\/)/.test(s)) routes.push({ where: 'formsConfig ' + p, what: s });
        return;
      }
      if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) seek(v, p ? p + '.' + k : k);
    };
    seek(fc);
  } catch (e) { say('   XX  formsConfig.json parh nahi saki: ' + e.message); }
}

const FN = path.join(ROOT, 'functions');
const fnFiles = fs.existsSync(FN) ? walk(FN, [], new Set(['node_modules'])) : [];
for (const f of fnFiles) if (/\.(js|mjs|ts)$/.test(f)) routes.push({ where: 'function', what: rel(f) });

const POSTPAT = /(hx-post\s*=\s*["']([^"']+)["']|<form\b[^>]*\baction\s*=\s*["']([^"']+)["']|fetch\s*\(\s*["'](\/[^"']*)["'])/gi;
const pageRoutes = [];
for (const f of files) {
  if (!/\.(njk|html|js|mjs|md)$/.test(f)) continue;
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  t.split(/\r?\n/).forEach((l, i) => {
    if (l.length > 400) return;
    for (const m of l.matchAll(POSTPAT)) {
      const target = m[2] || m[3] || m[4];
      if (!target || /^(mailto:|tel:|#)/.test(target)) continue;
      pageRoutes.push({ where: rel(f) + ':' + (i + 1), what: target });
    }
  });
}
routes.push(...pageRoutes);

/* ---- ab site.json ke khaane ---- */
const forms = site.forms || {};
const emptyFields = [];
for (const [k, v] of Object.entries(forms)) {
  const empty = !String(v || '').trim();
  say('   ' + (empty ? '-- ' : 'OK ') + k.padEnd(24) + (empty ? '[khaali]' : v));
  if (empty) emptyFields.push(k);
}

say('');
if (!routes.length) {
  say('   XX XX  FORM KA KOI RAASTA NAHI MILA.');
  say('           Na formsConfig mein endpoint, na functions/ mein koi file,');
  say('           na kisi safhe par action/hx-post. Aisi soorat mein form');
  say('           bhara ja sakta hai magar kahin pohnchta nahi.');
  blockers.push('form ka koi raasta nahi mila');
} else {
  /* ek hi raasta kai jagah mil sakta hai; pehli jagah rakhte hain
     (formsConfig pehle aata hai, aur woh zyada batata hai) */
  const seen = new Map();
  for (const r of routes) if (!seen.has(r.what)) seen.set(r.what, r);
  const uniq = [...seen.values()];
  say('   OK  form ka raasta mila (' + uniq.length + '):');
  for (const r of uniq.slice(0, 12)) say('         ' + r.what + '      [' + r.where + ']');
  if (uniq.length > 12) say('         ... aur ' + (uniq.length - 12));
  if (emptyFields.length) {
    say('');
    say('   !!  site.json ke ' + emptyFields.length + ' khaane khaali hain, magar form inhi par');
    say('       nahi chalta — raasta ooper wala hai. To yeh khaali khaane');
    say('       purane bache hue lagte hain, rokne wali baat nahi.');
    warnings.push('site.json ke form khaane khaali (istemal mein nahi)');
  }
  say('');
  say('   Yeh phir bhi asli site par bhar kar test karna zaroori hai —');
  say('   raasta mojood hona aur email pohnchna do alag baatein hain.');
}

/* ---------- 5. verification ---------- */
say('');
say('5. SEARCH CONSOLE / BING KE CODE');
say('-'.repeat(78));
const v = site.verification || {};
for (const k of ['google', 'bing', 'yandex']) {
  const val = String(v[k] || '').trim();
  say('   ' + (val ? 'OK ' : '-- ') + k.padEnd(10) + (val || '[khaali — submit karte waqt milega]'));
}

/* ---------- 6. robots aur sitemap ---------- */
say('');
say('6. ROBOTS AUR SITEMAP');
say('-'.repeat(78));
/* --- robots.txt: group ke hisab se parha jata hai ---
   Pehle main sirf "Disallow: /" dhoondta tha. Woh ghalat tha: achhe site
   par woh aam taur par AI crawlers ke liye hota hai. "User-agent: GPTBot"
   ke neechay "Disallow: /" ka matlab sirf GPTBot block hai — Google nahi.
   Ab har group alag dekha jata hai, aur alarm sirf us waqt bajta hai jab
   * ya Google/Bing khud block ho. */
const ROBOTS = path.join(SITEDIR, 'robots.txt');
if (!fs.existsSync(ROBOTS)) { say('   XX  _site/robots.txt nahi bana'); blockers.push('robots.txt'); }
else {
  const t = fs.readFileSync(ROBOTS, 'utf8');
  const groups = [];
  let cur = null;
  for (const line of t.split(/\r?\n/)) {
    const l = line.replace(/#.*$/, '').trim();
    if (!l) continue;
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase(), val = m[2].trim();
    if (key === 'user-agent') {
      /* lagatar User-agent lines ek hi group banati hain */
      if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
    } else if (cur && (key === 'disallow' || key === 'allow')) {
      cur.rules.push({ type: key, path: val });
    }
  }

  const SEARCH = ['*', 'googlebot', 'googlebot-image', 'bingbot', 'slurp', 'duckduckbot'];
  const blocked = [], aiBlocked = [];
  for (const g of groups) {
    const all = g.rules.some((r) => r.type === 'disallow' && r.path === '/');
    if (!all) continue;
    const allowAll = g.rules.some((r) => r.type === 'allow' && (r.path === '/' || r.path === ''));
    if (allowAll) continue;
    const matters = g.agents.some((a) => SEARCH.includes(a));
    (matters ? blocked : aiBlocked).push(g.agents.join(', '));
  }

  const pagesDev = t.includes('pages.dev');
  say('   ' + (blocked.length || pagesDev ? 'XX ' : 'OK ') + 'robots.txt'.padEnd(14) +
      t.length + ' harf, ' + groups.length + ' group');
  if (aiBlocked.length) {
    say('        -- yeh block hain (aur yeh theek hai, jaan bujh kar hoga):');
    for (const a of aiBlocked) say('              ' + a);
  }
  if (blocked.length) {
    say('        XX  SEARCH ENGINE KHUD BLOCK HAI:');
    for (const a of blocked) say('              ' + a);
    blockers.push('robots.txt: search engine block hai');
  } else say('        OK  Google/Bing block nahi hain');
  if (pagesDev) { say('        XX  pages.dev likha hai'); blockers.push('robots.txt par pages.dev'); }

  say('');
  say('   robots.txt ka poora matan:');
  for (const line of t.split(/\r?\n/)) say('      | ' + line);
}

/* --- sitemap --- */
const SM = path.join(SITEDIR, 'sitemap.xml');
say('');
if (!fs.existsSync(SM)) { say('   XX  _site/sitemap.xml nahi bana'); blockers.push('sitemap.xml'); }
else {
  const t = fs.readFileSync(SM, 'utf8');
  const n = (t.match(/<loc>/g) || []).length;
  const pagesDev = t.includes('pages.dev');
  say('   ' + (pagesDev || !n ? 'XX ' : 'OK ') + 'sitemap.xml'.padEnd(14) + n + ' safhe' +
      (pagesDev ? '   -- pages.dev likha hai' : ''));
  if (pagesDev) blockers.push('sitemap.xml par pages.dev');
  if (!n) blockers.push('sitemap khaali hai');
}

/* ---------- 7. FORM KA ASLI RAASTA ---------- */
say('');
say('7. FORM KA ASLI RAASTA (matan)');
say('-'.repeat(78));
say('   Yeh hissa faisla nahi karta, sirf dikhata hai — taake pata chale');
say('   form kahan POST karta hai.');

/* key jaisa matan chhupa dein */
const mask = (s) => String(s).replace(/([A-Za-z0-9_\-]{32,})/g, (m) => m.slice(0, 6) + '...[' + m.length + ' harf chhupaye]');

say('');
say('   src/_data/formsConfig.json:');
if (!fs.existsSync(FORMS_CFG)) say('      [file nahi hai]');
else for (const line of fs.readFileSync(FORMS_CFG, 'utf8').split(/\r?\n/)) say('      | ' + mask(line));

say('');
say('   <form> aur POST kahan hain:');
const FORMPAT = /(<form\b[^>]*>|action\s*=\s*["'][^"']*["']|hx-post\s*=\s*["'][^"']*["']|formspree|fetch\s*\(\s*["'][^"']*["']|\/api\/[a-z0-9\-_/]+)/gi;
let formHits = 0;
for (const f of files) {
  if (!/\.(njk|html|js|mjs|md)$/.test(f)) continue;
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const lines = t.split(/\r?\n/);
  const hit = [];
  lines.forEach((l, i) => {
    if (l.length > 400) return;
    const m = l.match(FORMPAT);
    if (m) hit.push('      ' + rel(f) + ':' + (i + 1) + '  ' + mask(l.trim().slice(0, 150)));
  });
  if (hit.length) { formHits += hit.length; for (const h of hit.slice(0, 8)) say(h); }
}
if (!formHits) say('      [kuch nahi mila]');

say('');
say('   functions/ mein kya hai (sirf naam, matan nahi — secrets ki wajah se):');
if (!fs.existsSync(FN)) say('      [functions folder nahi hai]');
else if (!fnFiles.length) say('      [khaali]');
else {
  for (const f of fnFiles.slice(0, 40)) say('      ' + rel(f) + '   (' + fs.statSync(f).size + ' harf)');
  if (fnFiles.length > 40) say('      ... aur ' + (fnFiles.length - 40));
}

/* ---------- khulasa ---------- */
say('');
say('='.repeat(78));
say('KHULASA');
say('');
if (blockers.length) {
  say('   ROKNE WALI BAATEIN (' + blockers.length + '):');
  for (const b of blockers) say('      XX  ' + b);
} else say('   Koi rokne wali baat nahi.');
if (warnings.length) {
  say('');
  say('   DEKH LENE WALI BAATEIN (' + warnings.length + '):');
  for (const w of warnings) say('      !!  ' + w);
}
say('');

fs.writeFileSync(path.join(ROOT, '_prelaunch.txt'), out.join('\n') + '\n', 'utf8');

if (!menuFixed) {
  console.log('-'.repeat(78));
  console.log('LIKHA: _prelaunch.txt   (menu mein badalne ko kuch nahi tha)');
  process.exit(0);
}
if (!WRITE) {
  console.log('-'.repeat(78));
  console.log('LIKHA: _prelaunch.txt');
  console.log('');
  console.log('Menu ke link theek karne ke liye:');
  console.log('   node tools/prelaunch-check.mjs --write');
  process.exit(0);
}
if (!fs.existsSync(MENU + '.bakmenu')) fs.copyFileSync(MENU, MENU + '.bakmenu');
fs.writeFileSync(MENU, menuFixed, 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: src/_data/menu.json   (backup: menu.json.bakmenu)');
console.log('LIKHA: _prelaunch.txt');
console.log('');
console.log('Agla qadam:  npm run build');
