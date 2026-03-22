// Service Worker for PWA support with offline detection
// Caches only HTML, CSS, JSON, and JS files - NOT images or other assets

const CACHE_NAME = 'watchhive-v1';
const PAGES_TO_CACHE = [
  '/',
  '/index.html',
];

// Check if the response should be cached (only HTML, CSS, JSON, and JS)
const shouldCache = (response, url) => {
  if (!response || response.status !== 200) {
    return false;
  }

  const contentType = response.headers.get('content-type') || '';
  
  // Only cache HTML, CSS, JSON, and JS
  if (contentType.includes('text/html') || 
      contentType.includes('text/css') || 
      contentType.includes('application/json') ||
      contentType.includes('application/javascript') ||
      contentType.includes('text/javascript') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.js')) {
    return true;
  }

  return false;
};

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app pages');
      return cache.addAll(PAGES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // For API calls, fetch from network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const clonedResponse = response.clone();
          
          // Only cache if it's JSON
          if (shouldCache(clonedResponse, url)) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try cache fallback for API calls
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline notification
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        })
    );
    return;
  }

  // For page navigation, try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not cached - fetch from network naturally
      return fetch(request)
        .then((response) => {
          // Clone and cache only HTML/CSS/JSON responses
          const clonedResponse = response.clone();
          if (shouldCache(clonedResponse, url)) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        });
    })
  );
});
