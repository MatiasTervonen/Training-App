"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

// Save push notification subscription to the database

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

// Delete push notification subscription from the database

export async function deletePushSubscription(endpoint: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    handleError(error, {
      message: "Error deleting push subscription",
      method: "direct",
    });
    throw Error("Error deleting push subscription");
  }

  return { success: true };
}

// Get all active push subscriptions from the database

export async function getAllActivePushSubscriptions() {
  const supabase = await createClient();

  const { data: subscriptions, error } = await supabase
    .from("user_push_subscriptions")
    .select("*")
    .eq("is_active", true)

  if (error) {
    handleError(error, {
      message: "Error fetching active push subscriptions",
      method: "GET",
    });
    return {
      subscriptions: [],
      error: "Failed to fetch active push subscriptions",
    };
  }

  return { subscriptions: subscriptions || [] };
}
