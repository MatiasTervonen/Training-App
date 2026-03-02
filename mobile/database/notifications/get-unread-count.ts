import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getUnreadCount(): Promise<number> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("is_read", false);

  if (error) {
    handleError(error, {
      message: "Error fetching unread count",
      route: "/database/notifications/get-unread-count",
      method: "GET",
    });
    throw new Error("Error fetching unread count");
  }

  return count ?? 0;
}
