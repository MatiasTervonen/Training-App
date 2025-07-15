import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: friends, error: friendsError } = await supabase
    .from("friends")
    .select(
      "id, user1_id, user2_id, created_at, user1:user1_id(display_name, id, profile_picture), user2:user2_id(display_name, id, profile_picture)"
    )
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (friendsError || !friends) {
    console.error("Supabase Fetch Error:", friendsError);
    return new Response(JSON.stringify({ error: friendsError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const friendsWithOtherUser = friends.map((friend) => {
    const otherUser = friend.user1_id === user.id ? friend.user2 : friend.user1;

    return {
      id: friend.id,
      created_at: friend.created_at,
      user: otherUser, // 👈 shape frontend expects
    };
  });

  return new Response(
    JSON.stringify({ friends: friendsWithOtherUser, currentUserId: user.id }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
