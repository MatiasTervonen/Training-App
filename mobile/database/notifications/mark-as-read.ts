import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function markAsRead(notificationId: string): Promise<void> {
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
    .eq("id", notificationId)
    .eq("user_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error marking notification as read",
      route: "/database/notifications/mark-as-read",
      method: "UPDATE",
    });
    throw new Error("Error marking notification as read");
  }
}
