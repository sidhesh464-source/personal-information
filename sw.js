const CACHE_NAME = 'luxe-details-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon.png',
    '/bg.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap',
    'https://unpkg.com/lucide@latest'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching shell assets');
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cacheRes) => {
            return cacheRes || fetch(e.request);
        })
    );
});
