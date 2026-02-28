import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { FriendRequest } from "@/types/models";

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data: requests, error } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, created_at, sender:users!friend_requests_sender_id_fkey(display_name, id)",
    )
    .eq("receiver_id", session.user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error fetching friend requests",
      route: "/database/friend/get-friend-requests",
      method: "GET",
    });
    throw new Error("Error fetching friend requests");
  }

  return (requests as FriendRequest[]) ?? [];
}
