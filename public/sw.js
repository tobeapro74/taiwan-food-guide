// 대만맛집정보 Service Worker
const CACHE_NAME = 'taiwan-food-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/favicon.svg',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'
];

// 설치 이벤트
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('캐시 열기 성공');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // 새 서비스 워커 즉시 활성화
                return self.skipWaiting();
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // 현재 캐시 버전이 아닌 이전 캐시 삭제
                    if (cacheName !== CACHE_NAME) {
                        console.log('이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // 모든 클라이언트에서 즉시 제어 시작
            return self.clients.claim();
        })
    );
});

// Fetch 이벤트
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 외부 도메인 요청은 Service Worker가 처리하지 않음
    if (url.origin !== self.location.origin) {
        return;
    }

    // POST 요청은 캐시할 수 없으므로 네트워크로 전달
    if (event.request.method !== 'GET') {
        return;
    }

    // API 요청은 네트워크 우선
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // API 응답 캐시 (성공 응답만)
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // 네트워크 실패 시 캐시에서 반환
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 정적 자원은 캐시 우선, 네트워크 폴백
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // 캐시에서 반환하면서 백그라운드에서 업데이트
                    fetch(event.request).then(networkResponse => {
                        if (networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse);
                            });
                        }
                    }).catch(() => {});
                    return response;
                }

                // 캐시에 없으면 네트워크에서 가져오기
                return fetch(event.request).then(response => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // 오프라인이고 캐시에도 없는 경우
                if (event.request.destination === 'document') {
                    return caches.match('/');
                }
            })
    );
});

// 푸시 알림 (향후 확장용)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : '새로운 맛집 정보가 있습니다!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('대만맛집정보', options)
    );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
