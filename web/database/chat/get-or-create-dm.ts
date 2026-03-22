import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function getOrCreateDm(friendId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_or_create_dm", {
    p_friend_id: friendId,
  });
  if (error) {
    handleError(error, { message: "Error creating DM", route: "database/chat/get-or-create-dm", method: "POST" });
    throw error;
  }
  return data as string;
}
