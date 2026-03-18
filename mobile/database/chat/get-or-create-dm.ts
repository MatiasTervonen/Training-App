import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getOrCreateDm(friendId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_dm", {
    p_friend_id: friendId,
  });

  if (error) {
    handleError(error, {
      message: "Error creating conversation",
      route: "/database/chat/get-or-create-dm",
      method: "POST",
    });
    throw new Error("Error creating conversation");
  }

  return data as unknown as string;
}
