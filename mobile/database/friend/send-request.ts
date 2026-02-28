import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function sendFriendRequest(identifier: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  if (!identifier || typeof identifier !== "string") {
    throw new Error("invalid identifier");
  }

  const { data: targetuser, error: lookUpError } = await supabase
    .from("users")
    .select("id")
    .ilike("display_name", identifier)
    .single();

  if (lookUpError || !targetuser) {
    return { error: true, message: "userNotFound" };
  }

  const receiverId = targetuser.id;

  if (receiverId === session.user.id) {
    return { error: true, message: "cannotSendToSelf" };
  }

  // Check for existing request and existing friendship in parallel
  const [existingResult, friendshipResult] = await Promise.all([
    supabase
      .from("friend_requests")
      .select("*")
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId},status.eq.pending),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id},status.eq.pending)`,
      )
      .maybeSingle(),
    supabase
      .from("friend_requests")
      .select("*")
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId},status.eq.accepted),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id},status.eq.accepted)`,
      )
      .maybeSingle(),
  ]);

  const { data: existingRequest, error: existingError } = existingResult;
  const { data: friendship, error: friendshipError } = friendshipResult;

  if (existingError) {
    handleError(existingError, {
      message: "Error checking existing friend request",
      route: "/database/friend/send-request",
      method: "POST",
    });
    throw new Error("Error checking existing friend request");
  }

  if (existingRequest) {
    return { error: true, message: "requestAlreadyExists" };
  }

  if (friendshipError) {
    handleError(friendshipError, {
      message: "Error checking friendship",
      route: "/database/friend/send-request",
      method: "POST",
    });
  }

  if (friendship) {
    return { error: true, message: "alreadyFriends" };
  }

  const { data: request, error } = await supabase
    .from("friend_requests")
    .insert([
      {
        sender_id: session.user.id,
        receiver_id: receiverId,
        status: "pending",
      },
    ])
    .select()
    .maybeSingle();

  if (error || !request) {
    handleError(error, {
      message: "Error creating friend request",
      route: "/database/friend/send-request",
      method: "POST",
    });
    throw new Error("Error creating friend request");
  }

  return { success: true };
}
