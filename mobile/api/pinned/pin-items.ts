import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function pinItems(item_id: string, table: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { data, error } = await supabase
    .from("pinned_items")
    .upsert([{ user_id: session.user.id, item_id, table }])
    .select()
    .single();

  if (error || !data) {
    handleError(error, {
      message: "Error fetching user preferences",
      route: "/api/settings/get-settings",
      method: "GET",
    });
    return { error: true, message: "Error fetching pinned item" };
  }

  return {
    success: true,
    pinnedItem: data,
  };
}
