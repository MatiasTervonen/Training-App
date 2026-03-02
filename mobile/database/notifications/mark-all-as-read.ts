import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function markAllAsRead(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", session.user.id)
    .eq("is_read", false);

  if (error) {
    handleError(error, {
      message: "Error marking all notifications as read",
      route: "/database/notifications/mark-all-as-read",
      method: "UPDATE",
    });
    throw new Error("Error marking all notifications as read");
  }
}
