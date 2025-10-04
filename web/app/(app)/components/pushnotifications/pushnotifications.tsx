"use client";

import { useState, useEffect } from "react";
import { subscribeUser, unsubscribeUser, sendNotification } from "./actions";
import Toggle from "../toggle";
import { useUserStore } from "../../lib/stores/useUserStore";

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
  const [message, setMessage] = useState("");
  const [toggleState, setToggleState] = useState(false);

  const role = useUserStore.getState().role;

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
    });

    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
    setToggleState(!!sub);
  }

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
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
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
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
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

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message);
      setMessage("");
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
      {subscription && role === "guest" && (
        <div className=" mt-5">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Test notification message"
            className="p-2 rounded border w-full mb-2 text-gray-100 placeholder:text-slate-400 border-slate-400 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
          />
          <button
            onClick={sendTestNotification}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Send Test Notification
          </button>
        </div>
      )}
    </div>
  );
}
