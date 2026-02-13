"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

export async function getAllActivePushSubscriptions() {
  const supabase = await createClient();

  const { data: subscriptions, error } = await supabase
    .from("user_push_subscriptions")
    .select("*")
    .eq("is_active", true);

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
