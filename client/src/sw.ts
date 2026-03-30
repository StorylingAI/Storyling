/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// ─── Precache build assets (injected by vite-plugin-pwa) ───
precacheAndRoute(self.__WB_MANIFEST);

// ─── Google Fonts: CacheFirst, 1 year ───
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── All local images (same-origin): NetworkFirst, cache for offline ───
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' && url.origin === self.location.origin,
  new NetworkFirst({
    cacheName: 'local-images',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── External images (CDN): NetworkFirst to avoid caching errors ───
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' && url.origin !== self.location.origin,
  new NetworkFirst({
    cacheName: 'external-images',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── Audio (local + external): CacheFirst, 30 days, max 100 ───
registerRoute(
  ({ request, url }) =>
    request.destination === 'audio' ||
    /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── All navigations: NetworkFirst with 3s timeout ───
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'navigations',
      networkTimeoutSeconds: 3,
    })
  )
);

// ─── Fallback: serve offline.html when navigation fails ───
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) return offlineResponse;
  }
  // For non-document requests (images, scripts, etc.), let the browser handle the error
  // instead of returning Response.error() which suppresses natural retry/fallback behavior
  return Response.error();
});

// ─── Push Notifications (preserved from original sw.js) ───
self.addEventListener('push', (event: PushEvent) => {
  if (event.data) {
    const data = event.data.json();
    const options: NotificationOptions = {
      body: data.body || 'Keep your learning streak alive!',
      icon: '/flip-mascot.png',
      badge: '/flip-mascot.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'weekly-goal-reminder',
      requireInteraction: false,
      data: {
        url: data.url || '/app/dashboard',
      },
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Storyling.ai Reminder',
        options
      )
    );
  }
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
});
