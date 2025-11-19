const CACHE_NAME = 'meus-trocados-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  // Bibliotecas externas (CDN) para garantir funcionamento offline
  'https://unpkg.com/@phosphor-icons/web',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Instalação: Armazena arquivos estáticos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all: app shell and content');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ativação: Limpa caches antigos se houver atualização
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Interceptação de Requisições (Fetch): Estratégia Cache First, falling back to Network
// Tenta pegar do cache. Se não tiver, pega da rede e salva no cache (para arquivos dinâmicos como fontes)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se está no cache, retorna o cache
      if (response) {
        return response;
      }
      
      // Se não está, faz a requisição na rede
      return fetch(event.request).then((networkResponse) => {
        // Verifica se a resposta é válida
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // Clona a resposta para salvar no cache também
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se falhar (sem internet e sem cache), poderia retornar uma página offline customizada aqui
        console.log('Sem internet e recurso não cacheado');
      });
    })
  );
});