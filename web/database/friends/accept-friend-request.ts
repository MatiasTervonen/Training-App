import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function acceptFriendRequest(sender_id: string) {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: request, error: updateError } = await supabase
    .from("friend_requests")
    .update({
      status: "accepted",
    })
    .eq("sender_id", sender_id)
    .eq("receiver_id", user.sub)
    .select()
    .single();

  if (updateError || !request) {
    handleError(updateError, {
      message: "Error updating friend request",
      route: "serverAction: acceptFriendRequest",
      method: "POST",
    });
    throw new Error("Error updating friend request");
  }

  const [user1_id, user2_id] =
    sender_id < user.sub ? [sender_id, user.sub] : [user.sub, sender_id];

  const { error: insertError } = await supabase.from("friends").insert([
    {
      user1_id,
      user2_id,
    },
  ]);

  if (insertError) {
    handleError(insertError, {
      message: "Error creating friendship",
      route: "/api/friend/accept",
      method: "POST",
    });
    throw new Error("Error creating friendship");
  }

  return { success: true, friendship: { user1_id, user2_id } };
}
