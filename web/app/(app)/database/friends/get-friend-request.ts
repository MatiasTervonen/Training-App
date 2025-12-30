import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

export async function getFriendRequest() {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: requests, error: requestsError } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id, created_at, sender:users!sender_id(display_name, id)"
    )
    .eq("receiver_id", user.sub)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (requestsError || !requests) {
    handleError(requestsError, {
      message: "Error fetching friend requests",
      route: "serverActions: getFriendRequest",
      method: "GET",
    });
    throw new Error("Error fetching friend requests");
  }

  return requests;
}
