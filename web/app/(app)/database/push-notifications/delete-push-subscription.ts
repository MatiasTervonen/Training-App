"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

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
