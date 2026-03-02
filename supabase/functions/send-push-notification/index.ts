import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: string;
    created_at: string;
  };
  old_record?: {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: string;
    created_at: string;
  };
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
  sound: string;
}

Deno.serve(async (req: Request) => {
  // Verify the request is from our Supabase webhook
  const webhookSecret = req.headers.get("x-webhook-secret");
  if (webhookSecret !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const payload: WebhookPayload = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Determine notification type based on event
    if (payload.type === "INSERT" && payload.table === "friend_requests") {
      await handleFriendRequest(supabase, payload.record);
    } else if (
      payload.type === "UPDATE" &&
      payload.table === "friend_requests" &&
      payload.record.status === "accepted" &&
      payload.old_record?.status === "pending"
    ) {
      await handleFriendAccepted(supabase, payload.record);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleFriendRequest(
  supabase: ReturnType<typeof createClient>,
  record: WebhookPayload["record"],
) {
  // Look up sender's display name
  const { data: sender } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", record.sender_id)
    .single();

  const senderName = sender?.display_name ?? "Someone";

  // Look up receiver's active push tokens
  const { data: tokens } = await supabase
    .from("user_push_mobile_subscriptions")
    .select("token")
    .eq("user_id", record.receiver_id)
    .eq("is_active", true);

  // Insert notification into the notifications table
  await supabase.from("notifications").insert({
    user_id: record.receiver_id,
    type: "friend_request",
    title: "New Friend Request",
    body: `${senderName} sent you a friend request`,
    data: {
      senderId: record.sender_id,
      senderName,
      requestId: record.id,
    },
  });

  // Send push notifications to all devices
  if (tokens && tokens.length > 0) {
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: "New Friend Request",
      body: `${senderName} sent you a friend request`,
      data: {
        type: "friend_request",
        senderId: record.sender_id,
      },
      channelId: "social",
      sound: "default",
    }));

    await sendExpoPushNotifications(messages);
  }
}

async function handleFriendAccepted(
  supabase: ReturnType<typeof createClient>,
  record: WebhookPayload["record"],
) {
  // Look up receiver's display name (the one who accepted)
  const { data: accepter } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", record.receiver_id)
    .single();

  const accepterName = accepter?.display_name ?? "Someone";

  // Notify the original sender that their request was accepted
  const { data: tokens } = await supabase
    .from("user_push_mobile_subscriptions")
    .select("token")
    .eq("user_id", record.sender_id)
    .eq("is_active", true);

  // Insert notification for the sender
  await supabase.from("notifications").insert({
    user_id: record.sender_id,
    type: "friend_accepted",
    title: "Friend Request Accepted",
    body: `${accepterName} accepted your friend request`,
    data: {
      accepterId: record.receiver_id,
      accepterName,
      requestId: record.id,
    },
  });

  // Send push notifications
  if (tokens && tokens.length > 0) {
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: "Friend Request Accepted",
      body: `${accepterName} accepted your friend request`,
      data: {
        type: "friend_accepted",
        accepterId: record.receiver_id,
      },
      channelId: "social",
      sound: "default",
    }));

    await sendExpoPushNotifications(messages);
  }
}

async function sendExpoPushNotifications(messages: ExpoPushMessage[]) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Expo push API error:", errorBody);
  }
}
