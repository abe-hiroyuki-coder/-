
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: '熟達っつぁん', body: '今日も気づきを記録しましょう！' };
  
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3665/3665930.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3665/3665930.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
