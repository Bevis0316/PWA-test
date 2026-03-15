// 更改版本號，這會強迫瀏覽器重新安裝 Service Worker
const CACHE_NAME = 'finance-app-v2'; 

self.addEventListener('install', (event) => {
    self.skipWaiting(); // 強制立即更新，不等待舊版關閉
});

self.addEventListener('activate', (event) => {
    // 啟動新版時，把舊版本 (v1) 的快取垃圾清掉
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 改用 Network-First 策略：有網路就抓最新的，沒網路才讀取手機快取
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
