/* Robbi Service Worker: offline-fähig + Push-Nachrichten */
const CACHE = 'robbi-v44';
const SHELL = ['./', 'index.html', 'style.css?v=44', 'app.js?v=44', 'games.js?v=44', 'speech.js?v=44', 'buddies.js?v=44', 'dialoge.js?v=44', 'firebase-config.js?v=44', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png',
  'sprachen.txt', 'farsi.txt', 'griechisch.txt', 'italienisch.txt', 'spanisch.txt', 'franzoesisch.txt', 'serbisch.txt',
  'saetze/farsi.txt?v=44', 'saetze/griechisch.txt?v=44', 'saetze/italienisch.txt?v=44', 'saetze/spanisch.txt?v=44', 'saetze/franzoesisch.txt?v=44', 'saetze/serbisch.txt?v=44',
  'bg/aegaeis.svg?v=44', 'bg/teheran.svg?v=44', 'bg/rom.svg?v=44', 'bg/sevilla.svg?v=44', 'bg/paris.svg?v=44', 'bg/belgrad.svg?v=44'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('robbi-') && k !== CACHE).map(k => caches.delete(k))))
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
  const d = e.notification.data || {};
  const isTest = d.test === '1' || (d.FCM_MSG && d.FCM_MSG.data && d.FCM_MSG.data.test === '1');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) { if (isTest) c.postMessage({ robbi: 'test' }); return c.focus(); }
    return self.clients.openWindow(isTest ? './?test=1' : './');
  }));
});
