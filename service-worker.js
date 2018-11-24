const cacheName = 'weatherPWA-step-6-1';
const dataCacheName = 'weatherData-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/styles/inline.css',
  '/images/clear.png',
  '/images/cloudy-scattered-showers.png',
  '/images/cloudy.png',
  '/images/fog.png',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/partly-cloudy.png',
  '/images/rain.png',
  '/images/scattered-showers.png',
  '/images/sleet.png',
  '/images/snow.png',
  '/images/thunderstorm.png',
  '/images/wind.png'
];

self.addEventListener('install', e => {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('[ServiceWorker] Caching App Shell');
      // cache.addAll is atomic. If any of the URLs fail, the whole operation fails
      return cache.addAll(filesToCache);
    })
  );
});

// Ensures that service worker updates its cache whenever any
// of the app shell files change.
self.addEventListener('activate', e => {
  console.log('[ServiceWorker] activate');
  e.waitUntil(
    // Updates the cache when any of the app shell files change
    // in order for this to work, you must increment the cacheName variable at the top of this file.
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== cacheName && key !== dataCacheName) {
            console.log('[ServiceWorker] removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Service workers provide the ability to intercept requests made
// from our Progressive Web App and handle them within the service
// worker. That means we can determine how we want to handle the
// request and potentially serve our own cached response.
self.addEventListener('fetch', e => {
  console.log('[ServiceWorker] fetch', e.request.url);
  const dataUrl = 'https://query.yahooapis.com/v1/public/yql';
  if (~e.request.url.indexOf(dataUrl)) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(cache => {
        return fetch(e.request).then(response => {
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    e.respondWith(
      // matches the web request that triggered the fetch event and
      // checks to see if it is available in the cache.
      // it will then respond with either the cached version, or uses
      // fetch to get the copy from the network.
      // The response is passed back to the web page with e.respondWith
      /*
       * The app is asking for app shell files. In this scenario the app uses the
       * "Cache, falling back to the network" offline strategy:
       * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
       */
      caches.match(e.request).then(resp => resp || fetch(e.request))
    );
  }
});
