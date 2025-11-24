const CACHE_NAME = 'meus-trocados-v4';
const DYNAMIC_CACHE = 'meus-trocados-dynamic-v4';
const STATIC_CACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/@phosphor-icons/web',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. INSTALAÇÃO - Cache de arquivos estáticos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando arquivos estáticos');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .catch((error) => {
        console.error('[Service Worker] Erro no cache:', error);
      })
  );
});

// 2. ATIVAÇÃO - Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[Service Worker] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  return self.clients.claim();
});

// 3. FETCH - Estratégia Cache First com Network Fallback
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e chrome-extension
  if (event.request.method !== 'GET' || event.request.url.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Retorna do cache e atualiza em background
          updateCache(event.request);
          return cachedResponse;
        }

        // Se não está no cache, busca da rede
        return fetch(event.request)
          .then((networkResponse) => {
            // Valida resposta antes de cachear
            if (!networkResponse || networkResponse.status !== 200 || 
                (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse;
            }

            // Cacheia dinamicamente recursos externos
            if (shouldCacheDynamic(event.request.url)) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }

            return networkResponse;
          })
          .catch(() => {
            // Fallback para página offline (opcional)
            console.log('[Service Worker] Sem conexão e recurso não cacheado');
            // return caches.match('./offline.html'); // Se você criar uma página offline
          });
      })
  );
});

// Função auxiliar para atualizar cache em background
function updateCache(request) {
  fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => console.log('[Service Worker] Falha ao atualizar cache em background'));
}

// Decide se deve cachear dinamicamente
function shouldCacheDynamic(url) {
  return url.includes('cdnjs.cloudflare.com') || 
         url.includes('unpkg.com') || 
         url.includes('googleapis.com');
}

// 4. SINCRONIZAÇÃO EM BACKGROUND (para futuras features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  console.log('[Service Worker] Sincronizando transações pendentes...');
  // Aqui você pode implementar sincronização de dados quando voltar online
}

// 5. NOTIFICAÇÕES PUSH (para lembretes futuros)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'notification-tag',
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Meus Trocados', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});