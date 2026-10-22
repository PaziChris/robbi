/* Robbi Service Worker: offline-fähig + Push-Nachrichten */
const CACHE = 'robbi-v24';
const SHELL = ['./', 'index.html', 'style.css?v=24', 'app.js?v=24', 'games.js?v=24', 'firebase-config.js?v=24', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png',
  'sprachen.txt', 'farsi.txt', 'griechisch.txt', 'italienisch.txt', 'spanisch.txt',
  'saetze/farsi.txt?v=24', 'saetze/griechisch.txt?v=24', 'saetze/italienisch.txt?v=24', 'saetze/spanisch.txt?v=24'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Eigene Dateien: immer frisch vom Server holen (am Browser-Zwischenspeicher vorbei),
   damit Seite und Design nie aus verschiedenen Versionen stammen. Offline: Cache. */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});

/* Push: Firebase Cloud Messaging */
try {
  importScripts('firebase-config.js');
  if (self.FIREBASE_CONFIG && !String(self.FIREBASE_CONFIG.apiKey).startsWith('DEIN')) {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
                  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    firebase.initializeApp(self.FIREBASE_CONFIG);
    // Nachrichten mit "notification"-Teil zeigt Firebase automatisch an.
    firebase.messaging();
  }
} catch (err) { /* ohne Firebase läuft die App trotzdem */ }

/* Tippen auf die Benachrichtigung öffnet Robbi */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
