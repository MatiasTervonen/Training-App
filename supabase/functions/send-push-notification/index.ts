import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
  sound: string;
  _collapseId?: string;
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

    if (payload.type === "INSERT" && payload.table === "feed_likes") {
      await handleFeedLike(supabase, payload.record);
    }

    if (payload.type === "INSERT" && payload.table === "feed_comments") {
      await handleFeedComment(supabase, payload.record);
    }

    if (payload.type === "INSERT" && payload.table === "chat_messages") {
      await handleChatMessage(supabase, payload.record);
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
  record: Record<string, unknown>,
) {
  const senderId = record.sender_id as string;
  const receiverId = record.receiver_id as string;

  // Look up sender's display name
  const { data: sender } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", senderId)
    .single();

  const senderName = sender?.display_name ?? "Someone";

  // Look up receiver's active push tokens
  const { data: tokens } = await supabase
    .from("user_push_mobile_subscriptions")
    .select("token")
    .eq("user_id", receiverId)
    .eq("is_active", true);

  // Insert notification into the notifications table
  await supabase.from("notifications").insert({
    user_id: receiverId,
    type: "friend_request",
    title: "New Friend Request",
    body: `${senderName} sent you a friend request`,
    data: {
      senderId,
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
        senderId,
      },
      channelId: "social",
      sound: "default",
    }));

    await sendExpoPushNotifications(messages);
  }
}

async function handleFriendAccepted(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
) {
  const senderId = record.sender_id as string;
  const receiverId = record.receiver_id as string;

  // Look up receiver's display name (the one who accepted)
  const { data: accepter } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", receiverId)
    .single();

  const accepterName = accepter?.display_name ?? "Someone";

  // Notify the original sender that their request was accepted
  const { data: tokens } = await supabase
    .from("user_push_mobile_subscriptions")
    .select("token")
    .eq("user_id", senderId)
    .eq("is_active", true);

  // Insert notification for the sender
  await supabase.from("notifications").insert({
    user_id: senderId,
    type: "friend_accepted",
    title: "Friend Request Accepted",
    body: `${accepterName} accepted your friend request`,
    data: {
      accepterId: receiverId,
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
        accepterId: receiverId,
      },
      channelId: "social",
      sound: "default",
    }));

    await sendExpoPushNotifications(messages);
  }
}

async function handleFeedLike(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
) {
  const likerId = record.user_id as string;
  const feedItemId = record.feed_item_id as string;

  // Get the feed item to find the post author
  const { data: feedItem } = await supabase
    .from("feed_items")
    .select("user_id, title")
    .eq("id", feedItemId)
    .single();

  if (!feedItem) return;

  // Don't notify yourself
  if (feedItem.user_id === likerId) return;

  // Get liker's display name
  const { data: liker } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", likerId)
    .single();

  const likerName = liker?.display_name ?? "Someone";

  // Get post author's push tokens
  const { data: tokens } = await supabase
    .from("user_push_mobile_subscriptions")
    .select("token")
    .eq("user_id", feedItem.user_id)
    .eq("is_active", true);

  // Insert in-app notification
  await supabase.from("notifications").insert({
    user_id: feedItem.user_id,
    type: "feed_like",
    title: "New Like",
    body: `${likerName} liked your post`,
    data: {
      feedItemId,
      likerId,
      likerName,
    },
  });

  // Send push
  if (tokens && tokens.length > 0) {
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: "New Like",
      body: `${likerName} liked your post`,
      data: { type: "feed_like", feedItemId },
      channelId: "social",
      sound: "default",
    }));
    await sendExpoPushNotifications(messages);
  }
}

async function handleFeedComment(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
) {
  const commenterId = record.user_id as string;
  const feedItemId = record.feed_item_id as string;
  const parentId = record.parent_id as string | null;

  // Get commenter's display name
  const { data: commenter } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", commenterId)
    .single();

  const commenterName = commenter?.display_name ?? "Someone";

  if (parentId) {
    // REPLY: notify the parent comment author
    const { data: parentComment } = await supabase
      .from("feed_comments")
      .select("user_id")
      .eq("id", parentId)
      .single();

    if (!parentComment) return;
    if (parentComment.user_id === commenterId) return;

    const { data: tokens } = await supabase
      .from("user_push_mobile_subscriptions")
      .select("token")
      .eq("user_id", parentComment.user_id)
      .eq("is_active", true);

    await supabase.from("notifications").insert({
      user_id: parentComment.user_id,
      type: "feed_reply",
      title: "New Reply",
      body: `${commenterName} replied to your comment`,
      data: {
        feedItemId,
        commentId: record.id,
        commenterId,
        commenterName,
      },
    });

    if (tokens && tokens.length > 0) {
      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.token,
        title: "New Reply",
        body: `${commenterName} replied to your comment`,
        data: { type: "feed_reply", feedItemId },
        channelId: "social",
        sound: "default",
      }));
      await sendExpoPushNotifications(messages);
    }
  } else {
    // TOP-LEVEL COMMENT: notify the post author
    const { data: feedItem } = await supabase
      .from("feed_items")
      .select("user_id")
      .eq("id", feedItemId)
      .single();

    if (!feedItem) return;
    if (feedItem.user_id === commenterId) return;

    const { data: tokens } = await supabase
      .from("user_push_mobile_subscriptions")
      .select("token")
      .eq("user_id", feedItem.user_id)
      .eq("is_active", true);

    await supabase.from("notifications").insert({
      user_id: feedItem.user_id,
      type: "feed_comment",
      title: "New Comment",
      body: `${commenterName} commented on your post`,
      data: {
        feedItemId,
        commentId: record.id,
        commenterId,
        commenterName,
      },
    });

    if (tokens && tokens.length > 0) {
      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.token,
        title: "New Comment",
        body: `${commenterName} commented on your post`,
        data: { type: "feed_comment", feedItemId },
        channelId: "social",
        sound: "default",
      }));
      await sendExpoPushNotifications(messages);
    }
  }
}

async function handleChatMessage(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
) {
  const senderId = record.sender_id as string;
  const conversationId = record.conversation_id as string;
  const messageType = record.message_type as string;
  const content = record.content as string | null;

  // Get sender's display name
  const { data: sender } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", senderId)
    .single();

  const senderName = sender?.display_name ?? "Someone";

  // Get the other participant in the conversation
  const { data: participants } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId)
    .eq("is_active", true);

  if (!participants || participants.length === 0) return;

  // Build notification body based on message type
  let body: string;
  switch (messageType) {
    case "image":
      body = `📷 ${senderName} sent a photo`;
      break;
    case "video":
      body = `🎥 ${senderName} sent a video`;
      break;
    case "voice":
      body = `🎤 ${senderName} sent a voice message`;
      break;
    case "location":
      body = `📍 ${senderName} shared a location`;
      break;
    default:
      body = `${senderName}: ${content?.slice(0, 100) ?? ""}`;
      break;
  }

  // Notify each participant (supports future group chats)
  for (const participant of participants) {
    const recipientId = participant.user_id;

    // Get recipient's push tokens (include platform to send differently per OS)
    const { data: tokens } = await supabase
      .from("user_push_mobile_subscriptions")
      .select("token, platform")
      .eq("user_id", recipientId)
      .eq("is_active", true);

    // Push notification only — no in-app notification for chat messages
    // (chat has its own unread count badge, bell notifications would flood)
    if (tokens && tokens.length > 0) {
      const messages: ExpoPushMessage[] = tokens.map((t) => {
        if (t.platform === "android") {
          // Android: send data-only (no title/body) so onMessageReceived fires in all states.
          // Our native ChatFirebaseMessagingDelegate extracts title/message/tag from the body
          // JSON and builds the notification with a stable tag for automatic replacement.
          return {
            to: t.token,
            data: {
              type: "chat_message",
              conversationId,
              senderId,
              tag: `chat:${conversationId}`,
              title: senderName,
              message: body,
            },
            channelId: "social",
            sound: "default",
          };
        }
        // iOS: send with title/body so APNs displays it; collapseId handles replacement.
        return {
          to: t.token,
          title: senderName,
          body,
          data: {
            type: "chat_message",
            conversationId,
            senderId,
          },
          channelId: "social",
          sound: "default",
          collapseId: `chat:${conversationId}`,
        };
      });
      await sendExpoPushNotifications(messages);
    }
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
