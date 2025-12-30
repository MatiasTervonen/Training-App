"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function savePushSubscription(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
  device_type?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("user_push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      device_type: subscription.device_type ?? "web",
      updated_at: new Date().toISOString(),
      is_active: true,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    handleError(error, {
      message: "Error saving push subscription",
      method: "POST",
    });
    throw new Error("Failed to save push subscription");
  }

  return { success: true };
}
