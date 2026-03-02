import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { Notification } from "@/types/models";

export async function getNotifications(): Promise<Notification[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    handleError(error, {
      message: "Error fetching notifications",
      route: "/database/notifications/get-notifications",
      method: "GET",
    });
    throw new Error("Error fetching notifications");
  }

  return (data as Notification[]) ?? [];
}
