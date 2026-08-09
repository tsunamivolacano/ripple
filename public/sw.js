// RIPPLE Background Service Worker for Web Push & Scheduled Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications from server
self.addEventListener('push', (event) => {
  let data = {
    title: 'RIPPLE Deadline Alert',
    body: 'You have an upcoming activity deadline.',
    url: '/',
    icon: '/placeholder.svg'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      itemId: data.itemId,
      itemType: data.itemType
    },
    actions: [
      { action: 'open', title: 'Open RIPPLE' },
      { action: 'close', title: 'Dismiss' }
    ],
    tag: data.itemId ? `ripple-${data.itemId}` : 'ripple-notification',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Click Action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background sync / timer check when browser wakes or periodically
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-ripple-reminders') {
    event.waitUntil(checkPendingReminders());
  }
});

async function checkPendingReminders() {
  // Can fetch from indexedDB or local cache if needed
}