/* Prayer House - sw.js
 * Caches the application SHELL only (HTML, CSS, JS, manifest).
 * Live API traffic (cross-origin POSTs to Google Apps Script) is never touched or cached here.
 */
var DV_CACHE = 'dv-shell-v1';
var DV_SHELL = [
  './', './index.html', './styles.css', './app.js', './api.js', './prayer-wall.js',
  './cover-page.js', './QRcode.js', './computer-blocker.js', './manifest.json',
  './admin.html', './admin-manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(DV_CACHE).then(function (c) {
      return Promise.all(DV_SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== DV_CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never intercept the live API

  // Stale-while-revalidate for shell files
  e.respondWith(
    caches.open(DV_CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function () { return null; });
        if (hit) return hit;
        return net.then(function (res) {
          if (res) return res;
          if (req.mode === 'navigate') return cache.match('./index.html');
          return new Response('', { status: 504 });
        });
      });
    })
  );
});
