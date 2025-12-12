"use client";

import { useState, useEffect } from "react";
import { subscribeUser, unsubscribeUser } from "./actions";
import Toggle from "../toggle";
import toast from "react-hot-toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function serializeSubscription(sub: PushSubscription) {
  return {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime,
    keys: {
      p256dh: btoa(
        String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))
      ),
      auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
    },
  };
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [toggleState, setToggleState] = useState(false);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
    });

    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
    setToggleState(!!sub);
  }

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function subscribeToPush() {
    setToggleState(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      setSubscription(sub);
      await subscribeUser(serializeSubscription(sub));
    } catch {
      toast.error("Failed to subscribe to push notifications!");
      setToggleState(false);
    }
  }

  async function unsubscribeFromPush() {
    setToggleState(false);
    try {
      if (subscription) {
        await subscription?.unsubscribe();
        setSubscription(null);
        await unsubscribeUser(subscription.endpoint);
      }
    } catch {
      toast.error("Failed to unsubscribe from push notifications!");
      setToggleState(true);
    }
  }

  function handleToggle() {
    if (Notification.permission === "denied") {
      alert(
        "You have blocked push notifications. Please enable them in your browser settings."
      );
      return;
    }

    if (toggleState) {
      unsubscribeFromPush();
    } else {
      subscribeToPush();
    }
  }

  if (!isSupported) {
    return (
      <div>
        <h2 className="mb-6 underline">Push Notifications</h2>
        <p>Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="my-5 relative">
      <h2 className="mb-6 underline">Push Notifications</h2>
      <div className="flex items-center justify-between">
        <p>
          {subscription
            ? "Push notifications enabled"
            : "Allow web push notifications"}
        </p>
        <Toggle isOn={toggleState} onToggle={handleToggle} />
      </div>
    </div>
  );
}
