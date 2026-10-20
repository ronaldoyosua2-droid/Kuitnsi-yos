/* Service worker Kwitansi Yos Anugerah — supaya bisa di-install & tetap terbuka saat offline.
   Halaman utama: ambil versi terbaru dari internet dulu (update otomatis), bila offline pakai salinan.
   Library (Excel, font): pakai salinan, diperbarui diam-diam. Data/AI/Drive/cloud TIDAK disentuh. */
const CACHE = 'kwya-v1';
const INTI = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const LIB = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const halaman = req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (halaman) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.ok) { const c = await caches.open(CACHE); c.put('./index.html', res.clone()); }
        return res;
      } catch (err) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  if (url.origin === location.origin || LIB.test(req.url)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const lama = await c.match(req);
      const baru = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => null);
      return lama || (await baru) || Response.error();
    })());
  }
});
