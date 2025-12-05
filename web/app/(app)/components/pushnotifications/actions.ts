"use server";

import webpush from "web-push";
import {
  savePushSubscription,
  deletePushSubscription,
  getAllActivePushSubscriptions,
} from "@/app/(app)/database/pushSubscription";

webpush.setVapidDetails(
  "mailto:matias.tervonen@hotmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type WebPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function subscribeUser(sub: WebPushSubscription) {
  await savePushSubscription({
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    device_type: "desktop",
  });

  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  await deletePushSubscription(endpoint);

  return { success: true };
}

export async function sendNotification(message: string) {
  const { subscriptions, error } = await getAllActivePushSubscriptions();

  if (error || subscriptions?.length === 0) {
    return { success: false, error: "No active subscriptions found" };
  }

  const results = [];

  for (const sub of subscriptions!) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh ?? "",
            auth: sub.auth ?? "",
          },
        },
        JSON.stringify({
          title: "Test Notification",
          body: message,
          icon: "/icon.png",
        })
      );

      results.push({ endpoint: sub.endpoint, success: true });
    } catch (error: unknown) {
      const e = error as webpush.WebPushError;

      console.error("Error sending push notification:", error);

      if (e.statusCode === 410 || e.statusCode === 404) {
        await deletePushSubscription(sub.endpoint);
      }

      return { success: false, error: "Failed to send notification" };
    }
  }
}
