import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { getDeviceId } from "@/utils/deviceId";

export async function getPushEnabled() {
  const deviceId = await getDeviceId();

  const { data, error } = await supabase
    .from("user_push_mobile_subscriptions")
    .select("id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    handleError(error, {
      message: "Error getting push enabled",
      route: "/database/pushState/get-push-enabled",
      method: "GET",
    });
    throw new Error("Error getting push enabled");
  }

  return !!data;
}
