"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CheckNotifications() {
  const router = useRouter();

  useEffect(() => {
    async function checkSubscription() {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();

        if (!sub) {
          toast.error(
            "You need to enable push notifications to use reminders.\nRedirecting to settings..."
          );
          setTimeout(() => router.push("/menu"), 2000);
        }
      }
    }

    checkSubscription();
  }, [router]);
}
