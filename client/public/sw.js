// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Keep your learning streak alive!',
      icon: '/flip-mascot.png',
      badge: '/flip-mascot.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'weekly-goal-reminder',
      requireInteraction: false,
      data: {
        url: data.url || '/app/dashboard'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Storyling.ai Reminder', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
