const CACHE = "needmore-v13";
const ASSETS = [
  "./", "./index.html", "./app.js",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./manifest.webmanifest"
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((a) => fetch(a, { cache: "reload" }).then((r) => c.put(a, r)).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
// Võrk-esimesena: äpi uuendused (app.js, index.html) jõuavad kohe kohale.
// Kui võrku pole (nt lennukirežiim), kasutatakse viimati salvestatud koopiat.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Only handle same-origin GETs; let Firebase/Google/fonts/AI-funktsioon pass straight through.
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/.netlify/functions/")) return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
