import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function DeleteSession(
  session: Session,
  item_id: string,
  table: string
) {
  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", item_id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting session:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { success: false, error };
  }
}
