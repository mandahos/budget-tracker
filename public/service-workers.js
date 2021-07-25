const FILES_TO_CACHE = [
    "/",
    "./index.html",
    "./js/index.js",
    "./js/idb.js",
    "./css/styles.css",
];

const APP_PREFIX = 'BudgetTracker-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = APP_PREFIX + 'data_cache' + VERSION;

// Cache 
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('installing cache : ' + CACHE_NAME)
            return cache.addAll(FILES_TO_CACHE)
        })
    )
})

self.addEventListener('fetch', function (e) {
    console.log('fetch request : ' + e.request.url)
    if (e.request.url.includes('/api')) {
        e.respondWith(
            caches.open(DATA_CACHE_NAME)
                .then(cache => {
                    console.log(cache);
                    return fetch(e.request)
                        .then(response => {
                            if (response.status === 200) {
                                cache.put(e.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err => {
                            console.log(err);
                            // Network failed
                            return cache.match(e.request);
                        });
                })
                .catch(error => console.log(error))
        );
    } else {
        e.respondWith(
            fetch(e.request).catch(error => {
                console.log(error);
                return caches.match(e.request).then(response => {
                    if (response) {
                        return response;
                    } else if (
                        e.request.headers.get("accept").includes("text/html")
                    ) {
                        // return cached page
                        return caches.match(e.request.url);
                    }
                });
            })
        );
    }
})

// Delete 
self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            let cacheKeeplist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX);
            })
            cacheKeeplist.push(CACHE_NAME);

            return Promise.all(keyList.map(function (key, i) {
                if (cacheKeeplist.indexOf(key) === -1) {
                    console.log('deleting cache : ' + keyList[i]);
                    return caches.delete(keyList[i]);
                }
            }));
        })
    );
});