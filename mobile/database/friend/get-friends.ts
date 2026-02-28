import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { Friends } from "@/types/models";

export async function getFriends(): Promise<Friends[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data: friends, error } = await supabase
    .from("friends")
    .select(
      `
      id, user1_id, user2_id, created_at,
      user1:users!friends_user1_id_fkey(display_name, id, profile_picture),
      user2:users!friends_user2_id_fkey(display_name, id, profile_picture)
    `,
    )
    .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error fetching friends",
      route: "/database/friend/get-friends",
      method: "GET",
    });
    throw new Error("Error fetching friends");
  }

  if (!friends) return [];

  return friends.map((friend) => {
    const otherUser =
      friend.user1_id === session.user.id ? friend.user2 : friend.user1;
    return {
      id: friend.id,
      created_at: friend.created_at,
      user: otherUser,
    } as Friends;
  });
}
