import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function getTotalUnreadCount(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_total_unread_count");
  if (error) {
    handleError(error, { message: "Error fetching unread count", route: "database/chat/get-total-unread-count", method: "GET" });
    throw error;
  }
  return (data ?? 0) as number;
}
