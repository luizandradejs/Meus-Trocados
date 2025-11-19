const CACHE_NAME = 'meus-trocados-v3'; // Mudei de v2 para v3 para forçar atualização
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  // Bibliotecas externas essenciais
  'https://unpkg.com/@phosphor-icons/web',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Instalação
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo SW a assumir imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ativação (Limpeza de cache antigo)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Interceptação (Cache First)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        console.log('Sem internet e recurso não cacheado');
      });
    })
  );
});