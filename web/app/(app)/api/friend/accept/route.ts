import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { sender_id } = body;

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
      route: "/api/friend/accept",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: updateError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(
      JSON.stringify({ error: "Friendship creation failed." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, friendship: { user1_id, user2_id } }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
