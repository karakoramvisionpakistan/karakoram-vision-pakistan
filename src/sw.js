// Offline support.
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
const FRESH_FIRST=/\.(css|js)(\?|$)/i;

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
