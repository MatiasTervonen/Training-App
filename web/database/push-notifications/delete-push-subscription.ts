"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

export async function deletePushSubscription(
  endpoint: string,
  userId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", userId);

  if (error) {
    handleError(error, {
      message: "Error deleting push subscription",
      method: "direct",
    });
    throw Error("Error deleting push subscription");
  }

  return { success: true };
}
