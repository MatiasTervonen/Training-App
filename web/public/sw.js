self.addEventListener("push", function (event) {

  if (event.data) {
    const payload = event.data.json();

    const data = payload.notification || payload;

    const options = {
      body: data.body,
      icon: data.icon || "/icon.png",
      badge: "/small-notification-icon.png",
      vibrate: [200, 100, 200, 100, 400],
      requireInteraction: true,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(self.location.origin));
});
