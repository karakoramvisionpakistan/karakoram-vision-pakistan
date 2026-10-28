// Three fixes: stale stylesheet, broken gallery thumbnails, badge label.
//
// 1. STALE STYLESHEET  (the real one)
//    base.njk asks for  site.css?v=11.15.0  - a number written by hand that
//    has not changed in a long time, while the file behind it changes on every
//    build. The service worker serves /assets/ from its cache first, so the
//    old stylesheet keeps coming back; a reload fetches the new one, the next
//    page serves the old one again. Exactly the flicker that was reported.
//
//    Two changes, because either alone leaves a hole:
//      * the address now carries a fingerprint of the file itself, so a
//        changed stylesheet is a changed address - for the service worker,
//        for the browser, and for Cloudflare's cache
//      * the service worker asks the network first for stylesheets and
//        scripts, falling back to its cache only when offline. Photos and
//        fonts stay cache-first, where being a little stale costs nothing.
//
// 2. BROKEN GALLERY THUMBNAILS  (mine)
//    The gallery and team pages wrote  {{ photo | srcsetAttr(...) }}  without
//    | safe. Nunjucks escapes the quotes in that, so the <img> tag came out
//    malformed and the browser could not load it. The full-size viewer uses a
//    plain src, which is why a photo appeared the moment it was clicked.
//
// 3. "AFFILIATED WITH" sits above the badges now, and a little bolder.
//
//   node tools/fix-cache-and-images.mjs           -> shows what will change
//   node tools/fix-cache-and-images.mjs --write   -> makes the change
// Safe to run twice.
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const writes = new Map();
let problems = 0;
const add = (file, text) => {
  try { if (fs.readFileSync(file, 'utf8') === text) return; } catch {}
  writes.set(file, text);
};
const say = (s) => console.log(`   ${s}`);

// ===================================================== 1. fingerprint
console.log('1. Stylesheet that would not update');

add('src/_data/assetVersion.js', `// A fingerprint of the built stylesheet, used in its address.
//
// The address used to end in a hand-written ?v=11.15.0 which nobody
// remembered to change, so every cache in the chain - the service worker, the
// browser, Cloudflare - went on serving yesterday's stylesheet.
//
// Now the number comes from the file's own contents. Same file, same address,
// cached hard and fast. One character different and it is a new address that
// nothing has ever seen, so the new one is fetched at once.
//
// build:css runs before eleventy, so the file is already there when this runs.
import fs from "node:fs";
import crypto from "node:crypto";

export default function () {
  try {
    const css = fs.readFileSync("src/assets/css/site.css");
    return crypto.createHash("sha1").update(css).digest("hex").slice(0, 10);
  } catch {
    // No stylesheet yet (a bare checkout, say). A changing value is safer
    // here than a fixed one - worst case something is fetched twice.
    return String(Date.now());
  }
}
`);
say('new: src/_data/assetVersion.js');

{
  const file = 'src/_includes/layouts/base.njk';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('assetVersion')) say('already fingerprinted: base.njk');
    else {
      let out = src;
      let n = 0;
      out = out.replace(/href="\/assets\/css\/site\.css\?v=[^"]*"/g, () => { n++; return 'href="/assets/css/site.css?v={{ assetVersion }}"'; });
      out = out.replace(/href="\/assets\/css\/theme-vars\.css\?v=[^"]*"/g, () => { n++; return 'href="/assets/css/theme-vars.css?v={{ assetVersion }}"'; });
      if (!n) { console.log('   !! could not find the stylesheet links - base.njk not touched'); problems++; }
      else { add(file, out); say(`${n} stylesheet link(s) now carry the fingerprint`); }
    }
  }
}

// ===================================================== service worker
{
  const file = 'src/sw.js';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('FRESH_FIRST')) say('already fixed: sw.js');
    else {
      add(file, `// Offline support.
//
// Stylesheets and scripts are asked for over the network first, and only come
// from the cache when there is no network. Everything else under /assets/ -
// photos, fonts - is served from the cache first, because a slightly old photo
// costs nothing while a slightly old stylesheet breaks the page.
//
// Bumping VERSION clears what older versions of this file left behind.
const VERSION='bk-v5';
const CORE=['/','/offline/','/assets/css/site.css','/assets/vendor/alpine.min.js','/assets/vendor/htmx.min.js','/assets/js/alpine-app.js','/assets/js/htmx-config.js','/assets/js/site-core.js'];

// Code and styling: always try the network first.
const FRESH_FIRST=/\\.(css|js)(\\?|$)/i;

self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;

  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(VERSION).then(cache=>cache.put(req,c));return r}).catch(()=>caches.match(req).then(r=>r||caches.match('/offline/'))));
    return;
  }

  if(!url.pathname.startsWith('/assets/'))return;

  if(FRESH_FIRST.test(url.pathname)){
    event.respondWith(
      fetch(req).then(r=>{const c=r.clone();caches.open(VERSION).then(cache=>cache.put(req,c));return r})
        .catch(()=>caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(r=>{const c=r.clone();caches.open(VERSION).then(cache=>cache.put(req,c));return r}).catch(()=>cached);
      return cached||network;
    })
  );
});
`);
      say('service worker: stylesheets and scripts come from the network first');
    }
  }
}

// ===================================================== 2. srcset escaping
console.log('\n2. Broken gallery thumbnails');
{
  let fixed = 0;
  for (const file of ['src/gallery/index.njk', 'src/our-team/index.njk']) {
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    // Lazy up to ") }}": the argument itself contains brackets - the media
    // query "(min-width:1024px) 25vw" - so stopping at the first bracket
    // matched nothing at all.
    const out = src.replace(/\{\{\s*([\w.]+)\s*\|\s*srcsetAttr\((.*?)\)\s*\}\}/g,
      (whole, value, args) => (whole.includes('| safe') ? whole : `{{ ${value} | srcsetAttr(${args}) | safe }}`));
    if (out === src) { say(`already fine: ${file}`); continue; }
    add(file, out);
    fixed++;
    say(`fixed: ${file}`);
  }
  if (fixed) say('the tag is written as HTML now instead of being escaped');
}

// ===================================================== 3. the label
console.log('\n3. "Affiliated with" label');
{
  const file = 'src/assets/css/input.css';
  if (!fs.existsSync(file)) { console.log(`   !! ${file} not found`); problems++; }
  else {
    const src = fs.readFileSync(file, 'utf8');
    const old = `.bk-affiliations { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.bk-affiliations-label {
  font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .12em;
  opacity: .5; margin: 0; white-space: nowrap;
}`;
    const neu = `.bk-affiliations { display: flex; flex-direction: column; align-items: flex-start; gap: .45rem; }
.bk-affiliations-label {
  font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
  opacity: .8; margin: 0; white-space: nowrap;
}`;
    if (src.includes(neu)) say('already done');
    else if (!src.includes(old)) { console.log('   !! the old rule is not there - run footer-and-filters.mjs first'); problems++; }
    else { add(file, src.replace(old, neu)); say('label sits above the badges now, and a little bolder'); }
  }
}

// ===================================================== go
console.log('');
if (problems) { console.log(`${problems} problem(s) - nothing was written.`); process.exit(1); }
if (!writes.size) { console.log('Nothing to change.'); process.exit(0); }

console.log(`${writes.size} file(s) will change:`);
for (const f of writes.keys()) console.log(`   ${f}`);
if (!WRITE) { console.log('\nNothing changed yet. Run again with --write to apply.'); process.exit(0); }

for (const [file, text] of writes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}
console.log('\nDone. Run "npm run build", then commit and push.');
console.log('Visitors still holding the old service worker get the new one on their next visit.');
