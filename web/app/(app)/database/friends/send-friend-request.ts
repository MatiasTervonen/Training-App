import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";


export async function sendFriendRequest(identifier: string) {
    const supabase = createClient();
  
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
  