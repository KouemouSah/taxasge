// TaxasGE Service Worker - Offline Strategy Complete
const CACHE_NAME = 'taxasge-v1.2.0'
const OFFLINE_URL = '/offline'
const API_CACHE_NAME = 'taxasge-api-v1'

// URLs critiques à mettre en cache
const STATIC_CACHE_URLS = [
  '/',
  '/search',
  '/calculate',
  '/chat',
  '/offline',
  '/manifest.json',
  // Assets critiques seront ajoutés dynamiquement
]

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Service Worker: Mise en cache des ressources critiques')
      return cache.addAll(STATIC_CACHE_URLS)
    })
  )
  
  // Force activation immédiate
  self.skipWaiting()
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activation...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Service Worker: Suppression ancien cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Prendre contrôle immédiatement
  self.clients.claim()
})

// Stratégies de cache par type de requête
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // API calls - Network First avec fallback cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache les réponses API réussies
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback vers cache API
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('📱 Service Worker: Réponse API depuis cache offline')
              return cachedResponse
            }
            // Si pas de cache, retourner réponse offline
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Données non disponibles hors ligne',
                offline: true 
              }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          })
        })
    )
    return
  }
  
  // Pages HTML - Stale While Revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          // Fetch en arrière-plan pour mise à jour
          const fetchPromise = fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, networkResponse.clone())
                })
              }
              return networkResponse
            })
            .catch(() => {
              // Si réseau échoue et pas de cache, page offline
              if (!cachedResponse) {
                return caches.match(OFFLINE_URL)
              }
            })
          
          // Retourner cache immédiatement si disponible
          return cachedResponse || fetchPromise
        })
    )
    return
  }
  
  // Assets statiques - Cache First
  if (request.url.includes('/_next/static/') || 
      request.url.includes('/icons/') ||
      request.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, networkResponse.clone())
              })
            }
            return networkResponse
          })
        })
    )
    return
  }
  
  // Autres requêtes - Network First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request)
    })
  )
})

// Background Sync pour actions offline
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background Sync:', event.tag)
  
  if (event.tag === 'sync-calculations') {
    event.waitUntil(syncCalculations())
  }
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites())
  }
})

// Synchronisation calculs offline
async function syncCalculations() {
  try {
    const calculations = await getOfflineCalculations()
    
    for (const calc of calculations) {
      try {
        await fetch('/api/calculations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(calc)
        })
        
        // Supprimer du stockage offline après sync réussie
        await removeOfflineCalculation(calc.id)
      } catch (error) {
        console.error('❌ Sync calculation failed:', error)
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error)
  }
}

// Synchronisation favoris offline
async function syncFavorites() {
  try {
    const favorites = await getOfflineFavorites()
    
    await fetch('/api/favorites/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites })
    })
    
    await clearOfflineFavorites()
  } catch (error) {
    console.error('❌ Favorites sync failed:', error)
  }
}

// Helpers pour IndexedDB (implémentation simplifiée)
async function getOfflineCalculations() {
  // Récupérer calculs stockés offline
  return []
}

async function removeOfflineCalculation(id) {
  // Supprimer calcul après sync
}

async function getOfflineFavorites() {
  // Récupérer favoris offline
  return []
}

async function clearOfflineFavorites() {
  // Nettoyer favoris après sync
}

// Notification de mise à jour disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('🚀 TaxasGE Service Worker: Initialisé avec succès')