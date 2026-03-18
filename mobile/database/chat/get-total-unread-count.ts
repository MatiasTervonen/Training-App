import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getTotalUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc("get_total_unread_count");

  if (error) {
    handleError(error, {
      message: "Error fetching unread count",
      route: "/database/chat/get-total-unread-count",
      method: "GET",
    });
    throw new Error("Error fetching unread count");
  }

  return (data as number) ?? 0;
}
