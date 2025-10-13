import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function DeleteSession(item_id: string, table: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", item_id)
      .eq("user_id", session.user.id);

    if (error) {
      handleError(error, {
        message: "Error deleting session",
        route: "/api/feed/deleteSession",
        method: "DELETE",
      });
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { success: false, error };
  }
}
