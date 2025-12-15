import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function POST(sender_id: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data: request, error: updateError } = await supabase
    .from("friend_requests")
    .update({
      status: "accepted",
    })
    .eq("sender_id", sender_id)
    .eq("receiver_id", session.user.id)
    .select()
    .single();

  if (updateError || !request) {
    handleError(updateError, {
      message: "Error updating friend request",
      route: "/database/friend/accept",
      method: "POST",
    });
    throw new Error("Error updating friend request");
  }

  const [user1_id, user2_id] =
    sender_id < session.user.id
      ? [sender_id, session.user.id]
      : [session.user.id, sender_id];

  const { error: insertError } = await supabase.from("friends").insert([
    {
      user1_id,
      user2_id,
    },
  ]);

  if (insertError) {
    handleError(insertError, {
      message: "Error creating friendship",
      route: "/database/friend/accept",
      method: "POST",
    });
    throw new Error("Error updating friend request");
  }

  return {
    success: true,
    friendship: { user1_id, user2_id },
  };
}
