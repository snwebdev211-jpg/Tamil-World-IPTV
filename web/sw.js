const CACHE='santhos-shell-v1';
const ASSETS=['./index.html','./style.css','./app.js','./assets/snwd-logo.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin||url.pathname.includes('/playlists/'))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok&&ASSETS.some(path=>url.pathname.endsWith(path.replace('./','/')))){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone))}return response}).catch(()=>caches.match(event.request)))});
