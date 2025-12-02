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

  const isUUID = (str: string) =>
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      str
    );

  let targetuser = null;
  let lookUpError = null;

  if (isUUID(identifier)) {
    const result = await supabase
      .from("users")
      .select("id")
      .eq("id", identifier)
      .single();

    targetuser = result.data;
    lookUpError = result.error;
  } else {
    const result = await supabase
      .from("users")
      .select("id")
      .eq("display_name", identifier)
      .single();

    targetuser = result.data;
    lookUpError = result.error;
  }

  if (lookUpError || !targetuser) {
    handleError(lookUpError, {
      message: "Error fetching user",
      route: "/database/friend/send-request",
      method: "POST",
    });
    throw new Error("Error fetching user");
  }

  const receiverId = targetuser.id;

  // Check if the receiverId is the same as the user's id

  if (receiverId === session.user.id) {
    return {
      error: true,
      message: "You cannot send a friend request to yourself",
    };
  }

  // Check if a friend request already exists
  const { data: existingRequest, error: existingError } = await supabase
    .from("friend_requests")
    .select("*")
    .or(
      `and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId},status.eq.pending),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id},status.eq.pending)`
    )
    .maybeSingle();

  if (existingError) {
    handleError(existingError, {
      message: "Error checking existing friend request",
      route: "/database/friend/send-request",
      method: "POST",
    });
    throw new Error("Error checking existing friend request");
  }

  if (existingRequest) {
    return { error: true, message: "Friend request already exists" };
  }

  // Check if the user are already friends

  const { data: friendship, error: friendshipError } = await supabase
    .from("friend_requests")
    .select("*")
    .or(
      `and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId},status.eq.accepted),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id},status.eq.accepted)`
    )
    .maybeSingle();

  if (friendshipError) {
    handleError(friendshipError, {
      message: "Error checking friendship",
      route: "/database/friend/send-request",
      method: "POST",
    });
  }
  if (friendship) {
    throw new Error("Error checking friendship");
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
