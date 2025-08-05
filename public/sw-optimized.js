// Optimized Service Worker for Daily Grace PWA
const CACHE_NAME = 'daily-grace-v1';
const STATIC_CACHE = 'daily-grace-static-v1';
const DYNAMIC_CACHE = 'daily-grace-dynamic-v1';
const API_CACHE = 'daily-grace-api-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'stale-while-revalidate',
  API: 'network-first',
  IMAGES: 'cache-first',
  FONTS: 'cache-first'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  STATIC: 30 * 24 * 60 * 60, // 30 days
  DYNAMIC: 24 * 60 * 60, // 24 hours
  API: 5 * 60, // 5 minutes
  IMAGES: 7 * 24 * 60 * 60, // 7 days
  FONTS: 365 * 24 * 60 * 60 // 1 year
};

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/daily-devotional',
  '/prayer-wall',
  '/journal',
  '/manifest.json',
  '/icons/optimized/icon-192x192.webp',
  '/icons/optimized/icon-512x512.webp'
];

// API endpoints for offline caching
const API_ENDPOINTS = [
  '/api/chat',
  '/api/seed-pinecone'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticResource(request)) {
    event.respondWith(handleStaticResource(request));
  } else if (isImage(request)) {
    event.respondWith(handleImage(request));
  } else if (isFont(request)) {
    event.respondWith(handleFont(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Daily Grace - New content available',
    icon: '/icons/optimized/icon-192x192.webp',
    badge: '/icons/optimized/favicon-32x32.webp',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/optimized/icon-192x192.webp'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/optimized/icon-192x192.webp'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Daily Grace', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions
function isStaticResource(request) {
  return request.url.includes('/_next/static/') || 
         request.url.includes('/static/') ||
         request.url.includes('/manifest.json');
}

function isImage(request) {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i.test(request.url);
}

function isFont(request) {
  return /\.(woff|woff2|ttf|eot)$/i.test(request.url) ||
         request.url.includes('fonts.googleapis.com') ||
         request.url.includes('fonts.gstatic.com');
}

function isAPIRequest(request) {
  return API_ENDPOINTS.some(endpoint => request.url.includes(endpoint));
}

// Cache strategies
async function handleStaticResource(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static resource fetch failed:', error);
    return new Response('Offline - Static resource unavailable', { status: 503 });
  }
}

async function handleImage(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Image fetch failed:', error);
    return new Response('Offline - Image unavailable', { status: 503 });
  }
}

async function handleFont(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Font fetch failed:', error);
    return new Response('Offline - Font unavailable', { status: 503 });
  }
}

async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Try to return cached response
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - API unavailable', { status: 503 });
  }
}

async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Page request failed:', error);
    
    // Return offline page
    const cache = await caches.open(STATIC_CACHE);
    const offlineResponse = await cache.match('/offline');
    
    if (offlineResponse) {
      return offlineResponse;
    }
    
    return new Response('Offline - Page unavailable', { status: 503 });
  }
}

async function handleBackgroundSync() {
  console.log('Service Worker: Processing background sync');
  
  // Here you would implement background sync logic
  // For example, syncing offline journal entries, prayer requests, etc.
  
  try {
    // Example: Sync offline journal entries
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      await syncOfflineData(offlineData);
    }
    
    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Utility functions for offline data management
async function getOfflineData() {
  // Implementation for getting offline data from IndexedDB
  return [];
}

async function syncOfflineData(data) {
  // Implementation for syncing offline data with the server
  console.log('Syncing offline data:', data);
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cacheNames = await caches.keys();
    const now = Date.now();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const date = response.headers.get('date');
          if (date) {
            const age = (now - new Date(date).getTime()) / 1000;
            const maxAge = getMaxAge(cacheName);
            
            if (age > maxAge) {
              await cache.delete(request);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}, 60 * 60 * 1000); // Run every hour

function getMaxAge(cacheName) {
  switch (cacheName) {
    case STATIC_CACHE:
      return CACHE_DURATIONS.STATIC;
    case DYNAMIC_CACHE:
      return CACHE_DURATIONS.DYNAMIC;
    case API_CACHE:
      return CACHE_DURATIONS.API;
    default:
      return CACHE_DURATIONS.DYNAMIC;
  }
}

console.log('Service Worker: Optimized service worker loaded'); 