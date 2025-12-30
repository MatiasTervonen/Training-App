import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

export async function getFirends() {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: friends, error: friendsError } = await supabase
    .from("friends")
    .select(
      `
        id,
        user1_id, 
        user2_id, 
        created_at, 
        user1:users!friends_user1_id_fkey(display_name, id, profile_picture), 
        user2:users!friends_user2_id_fkey(display_name, id, profile_picture)`
    )
    .or(`user1_id.eq.${user.sub},user2_id.eq.${user.sub}`)
    .order("created_at", { ascending: false });

  if (friendsError || !friends) {
    handleError(friendsError, {
      message: "Error fetching friends",
      route: "serverActions: getFriends",
      method: "GET",
    });
    throw new Error("Error fetching friends");
  }

  const friendsWithOtherUser = friends.map((friend) => {
    const otherUser =
      friend.user1_id === user.sub ? friend.user2 : friend.user1;

    return {
      id: friend.id,
      created_at: friend.created_at,
      user: otherUser,
    };
  });

  return friendsWithOtherUser;
}
