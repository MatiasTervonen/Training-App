import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { identifier } = body;

  if (!identifier || typeof identifier !== "string") {
    return new Response(JSON.stringify({ error: "Invalid identifier" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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
    console.error("Supabase Lookup Error:", lookUpError);
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const receiverId = targetuser.id;

  // Check if the receiverId is the same as the user's id

  if (receiverId === user.sub) {
    return new Response(
      JSON.stringify({ error: "You cannot send a friend request to yourself" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
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
    console.error("Supabase Check Error:", existingError);
    return new Response(JSON.stringify({ error: existingError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (existingRequest) {
    return new Response(
      JSON.stringify({ error: "Friend request already exists" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
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
    console.error("Supabase Friendship Check Error:", friendshipError);
    return new Response(JSON.stringify({ error: friendshipError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (friendship) {
    return new Response(JSON.stringify({ error: "You are already friends" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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
    console.error("Supabase Insert Error:", error);
    return new Response(JSON.stringify({ error: error?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, request: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
