"use server";

import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";

export async function getFirends() {
  const supabase = await createClient();

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

// send friend request

export async function sendFriendRequest(identifier: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  if (!identifier || typeof identifier !== "string") {
    throw new Error("Invalid identifier");
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

  if (lookUpError && lookUpError.code !== "PGRST116") {
    // PGRST116 = "No rows found" for .single()
    handleError(lookUpError, {
      message: "Database lookup error",
      route: "sendFriendRequest",
    });
    throw new Error("Database lookup failed");
  }

  if (!targetuser) {
    return { message: "User does not exist" };
  }

  const receiverId = targetuser.id;

  // Check if the receiverId is the same as the user's id

  if (receiverId === user.sub) {
    return {
      message: "You cannot send a friend request to yourself",
    };
  }

  // Check if a friend request already exists
  const { data: existingRequest, error: existingError } = await supabase
    .from("friend_requests")
    .select("*")
    .or(
      `and(sender_id.eq.${user.sub},receiver_id.eq.${receiverId},status.eq.pending),and(sender_id.eq.${receiverId},receiver_id.eq.${user.sub},status.eq.pending)`
    )
    .maybeSingle();

  if (existingError) {
    handleError(existingError, {
      message: "Error checking existing friend request",
      route: "/api/friend/send-request",
      method: "POST",
    });
    throw new Error("Error checking existing friend request");
  }

  if (existingRequest) {
    return {
      message: "Friend request already exists",
    };
  }

  // Check if the user are already friends

  const { data: friendship, error: friendshipError } = await supabase
    .from("friend_requests")
    .select("*")
    .or(
      `and(sender_id.eq.${user.sub},receiver_id.eq.${receiverId},status.eq.accepted),and(sender_id.eq.${receiverId},receiver_id.eq.${user.sub},status.eq.accepted)`
    )
    .maybeSingle();

  if (friendshipError) {
    handleError(friendshipError, {
      message: "Error checking friendship",
      route: "/api/friend/send-request",
      method: "POST",
    });
  }
  if (friendship) {
    return {
      message: "You are already friends",
    };
  }

  const { data: request, error } = await supabase
    .from("friend_requests")
    .insert([
      {
        sender_id: user.sub,
        receiver_id: receiverId,
        status: "pending",
      },
    ])
    .select()
    .maybeSingle();

  if (error || !request) {
    handleError(error, {
      message: "Error creating friend request",
      route: "/api/friend/send-request",
      method: "POST",
    });
    throw new Error("Error creating friend request");
  }

  return { success: true, request: data };
}

// Delete Friend

export async function deleteFriend(friendId: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  if (!friendId || typeof friendId !== "string") {
    throw new Error("Invalid friend ID");
  }

  // get the other user's ID

  const { data: friendData, error: friendError } = await supabase
    .from("friends")
    .select("user1_id, user2_id")
    .eq("id", friendId)
    .single();

  if (friendError || !friendData) {
    handleError(friendError, {
      message: "Error fetching friend data",
      route: "serverAction: deleteFriend",
      method: "DELETE",
    });
    throw new Error("Error fetching friend data");
  }

  // Determine the other user's ID
  const otherUserId =
    friendData.user1_id === user.sub
      ? friendData.user2_id
      : friendData.user1_id;

  const { error: deleteError } = await supabase
    .from("friends")
    .delete()
    .or(`user1_id.eq.${user.sub},user2_id.eq.${user.sub}`)
    .eq("id", friendId);

  if (deleteError) {
    handleError(deleteError, {
      message: "Error deleting friendship",
      route: "serverAction: deleteFriend",
      method: "DELETE",
    });
    throw new Error("Error deleting friendship");
  }

  // Optionally, you can also delete any related friend requests
  const { error: requestDeleteError } = await supabase
    .from("friend_requests")
    .delete()
    .or(
      `and(sender_id.eq.${user.sub},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.sub})`
    )
    .eq("status", "accepted");

  if (requestDeleteError) {
    handleError(requestDeleteError, {
      message: "Error deleting related friend requests",
      route: "serverAction: deleteFriend",
      method: "DELETE",
    });
    throw new Error("Error deleting related friend requests");
  }

  return { success: true };
}

// Get friend request

export async function getFriendRequest() {
  const supabase = await createClient();

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

// Accept friend request

export async function acceptFriendRequest(sender_id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

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
      route: "serverAction: acceptFriendRequest",
      method: "POST",
    });
    throw new Error("Error updating friend request");
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
    throw new Error("Error creating friendship");
  }

  return { success: true, friendship: { user1_id, user2_id } };
}
