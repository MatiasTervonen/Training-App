import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function POST(sender_id: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
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
      route: "/api/friend/accept",
      method: "POST",
    });
    return { error: true, message: "Error updating friend request" };
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
      route: "/api/friend/accept",
      method: "POST",
    });
    return { error: true, message: "Error creating friendship" };
  }

  return {
    success: true,
    friendship: { user1_id, user2_id },
  };
}
