import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteSession(id: string, type: string) {
  console.log("deleting session", id, type);

  const { error } = await supabase.rpc("feed_delete_session", {
    p_id: id,
    p_type: type,
  });

  if (error) {
    console.log("error deleting session", error);
    handleError(error, {
      message: "Error deleting session",
      route: "/database/feed/deleteSession",
      method: "DELETE",
    });
    throw new Error("Error deleting session");
  }

  return { success: true };
}
