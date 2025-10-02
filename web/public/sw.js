self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received:", event);
  if (event.data) {
    console.log("[Service Worker] Push data:", event.data.text());
    const data = event.data.json();
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
  console.log("Notification click received.");
  event.notification.close();
  event.waitUntil(clients.openWindow(self.location.origin));
});
