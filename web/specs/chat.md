# Web Chat Feature

## Overview

Port the mobile 1-on-1 chat to the web app. The entire backend (tables, RPC functions, RLS, Realtime publications) already exists — this spec covers only the **web frontend**.

This is the first feature on web using Supabase Realtime.

---

## Scope

### In v1

| Feature | Notes |
|---------|-------|
| Text messaging | Real-time via Supabase Realtime |
| Conversation list | With last message preview, unread badges |
| Unread count badge | In navbar chat icon |
| Read receipts | Single/double checkmark |
| Typing indicators | Broadcast-based, ephemeral |
| Reactions | Emoji pills on messages |
| Replies | Quoted reply with click-to-scroll |
| Message deletion | Soft delete (own messages only) |
| Forwarding | Forward message to another friend |
| Link previews | Auto-fetch URL metadata |
| New chat | Friend picker modal |
| Responsive layout | Split view on desktop, stacked on mobile |

### NOT in v1 (future)

- Image/video/voice messages (needs web file picker + upload UI)
- Session sharing (needs web session card components)
- Location sharing (needs web map integration)
- Group chats
- Push notifications (web-push integration)
- Message search

---

## Design Decisions

### Desktop layout: split view

On `lg:` and above, the chat page shows a two-panel layout:
- **Left panel** (320px): conversation list, always visible
- **Right panel** (flex-1): active conversation, or empty state

This avoids full-page navigation for every conversation switch and feels native on desktop.

On mobile (`< lg:`), use stacked routing:
- `/chat` shows conversation list
- `/chat/[conversationId]` shows the chat screen (full page)

### Reuse mobile's database layer pattern

The web's `database/` functions use the same `supabase.rpc()` calls as mobile. The RPC function signatures are identical — only the Supabase client import differs (`@/utils/supabase/client` instead of mobile's `@/lib/supabase`).

### Reuse mobile's React Query hooks pattern

Same query keys, same cache structure, same optimistic update strategy. This keeps both apps' caches interchangeable and makes the code easy to cross-reference.

### Realtime: same channel/event structure as mobile

- Per-conversation channel: `chat:${conversationId}` for postgres_changes (INSERT, UPDATE)
- Per-conversation broadcast channel: `chat-typing:${conversationId}` for typing/read events
- Global channel for unread badge updates (invalidate on any message INSERT)

---

## File Structure

```
web/
  database/
    chat/
      get-or-create-dm.ts
      get-conversations.ts
      get-messages.ts
      send-message.ts
      mark-conversation-read.ts
      get-total-unread-count.ts
      toggle-reaction.ts
      delete-message.ts
      forward-message.ts
      fetch-link-preview.ts
      get-other-last-read.ts
  features/
    chat/
      hooks/
        useConversations.ts
        useMessages.ts
        useSendMessage.ts
        useMarkRead.ts
        useTotalUnreadCount.ts
        useChatRealtime.ts
        useTypingIndicator.ts
        useDeleteMessage.ts
        useToggleReaction.ts
        useForwardMessage.ts
        useOtherLastRead.ts
      components/
        ChatLayout.tsx              -- Desktop split view container
        ConversationList.tsx         -- Left panel: list of conversations
        ConversationItem.tsx         -- Single conversation row
        ChatView.tsx                 -- Right panel: message list + input
        ChatBubble.tsx               -- Single message bubble
        ChatInput.tsx                -- Text input + send button
        DateSeparator.tsx            -- Date divider between messages
        ReplyPreview.tsx             -- Quoted reply in bubble
        ReactionPills.tsx            -- Emoji reaction display
        MessageContextMenu.tsx       -- Right-click/click context menu
        TypingIndicator.tsx          -- "typing..." animation
        FriendPickerModal.tsx        -- Modal to pick friend for new chat / forward
        LinkPreviewCard.tsx          -- URL preview card in bubble/input
        ChatEmptyState.tsx           -- No conversation selected state
  types/
    chat.ts
  app/
    (app)/
      chat/
        page.tsx                     -- Conversation list (mobile) / split view (desktop)
        [conversationId]/
          page.tsx                   -- Individual chat screen (mobile full page)
  app/lib/i18n/locales/
    en/
      chat.json
    fi/
      chat.json
```

---

## Types

### `types/chat.ts`

Port directly from mobile's `types/chat.ts`. Same types used by the same RPC functions.

```ts
type MessageType = "text" | "image" | "video" | "voice" | "session_share" | "location";

type ReactionSummary = {
  emoji: string;
  count: number;
  user_reacted: boolean;
};

type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  created_at: string;
  sender_display_name: string;
  sender_profile_picture: string | null;
  media_storage_path: string | null;
  media_thumbnail_path: string | null;
  media_duration_ms: number | null;
  link_preview: LinkPreview | null;
  deleted_at: string | null;
  reply_to_message_id: string | null;
  reply_to_content: string | null;
  reply_to_sender_name: string | null;
  reply_to_message_type: MessageType | null;
  reply_to_deleted_at: string | null;
  reactions: ReactionSummary[];
};

type Conversation = {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string | null;
  updated_at: string;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  last_message_type: MessageType | null;
  unread_count: number;
  other_user_id: string | null;
  other_user_display_name: string | null;
  other_user_profile_picture: string | null;
  is_active: boolean;
};
```

---

## Database Functions

All functions follow the web's existing pattern: `createClient()` from `@/utils/supabase/client`, `handleError()` from `@/utils/handleError`.

### `get-conversations.ts`
```ts
import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { Conversation } from "@/types/chat";

export async function getConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_conversations");
  if (error) {
    handleError(error, { message: "Error fetching conversations", route: "database/chat/get-conversations", method: "GET" });
    throw error;
  }
  return (data ?? []) as Conversation[];
}
```

### `get-messages.ts`
```ts
const PAGE_SIZE = 50;

export async function getMessages(
  conversationId: string,
  limit: number = PAGE_SIZE,
  before?: string
): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_messages", {
    p_conversation_id: conversationId,
    p_limit: limit,
    ...(before ? { p_before: before } : {}),
  });
  if (error) {
    handleError(error, { message: "Error fetching messages", route: "database/chat/get-messages", method: "GET" });
    throw error;
  }
  return (data ?? []) as ChatMessage[];
}
```

### `send-message.ts`
```ts
export async function sendMessage(
  conversationId: string,
  content: string,
  replyToMessageId?: string
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_content: content,
    p_message_type: "text",
    ...(replyToMessageId ? { p_reply_to_message_id: replyToMessageId } : {}),
  });
  if (error) {
    handleError(error, { message: "Error sending message", route: "database/chat/send-message", method: "POST" });
    throw error;
  }
  return data as string;
}
```

### `get-or-create-dm.ts`
```ts
export async function getOrCreateDm(friendId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_or_create_dm", {
    p_friend_id: friendId,
  });
  if (error) {
    handleError(error, { message: "Error creating DM", route: "database/chat/get-or-create-dm", method: "POST" });
    throw error;
  }
  return data as string;
}
```

### `mark-conversation-read.ts`
```ts
export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) {
    handleError(error, { message: "Error marking conversation read", route: "database/chat/mark-conversation-read", method: "POST" });
    throw error;
  }
}
```

### `get-total-unread-count.ts`
```ts
export async function getTotalUnreadCount(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_total_unread_count");
  if (error) {
    handleError(error, { message: "Error fetching unread count", route: "database/chat/get-total-unread-count", method: "GET" });
    throw error;
  }
  return (data ?? 0) as number;
}
```

### `toggle-reaction.ts`
```ts
export async function toggleReaction(messageId: string, emoji: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("toggle_reaction", {
    p_message_id: messageId,
    p_emoji: emoji,
  });
  if (error) {
    handleError(error, { message: "Error toggling reaction", route: "database/chat/toggle-reaction", method: "POST" });
    throw error;
  }
  return data as boolean;
}
```

### `delete-message.ts`
```ts
export async function deleteMessage(messageId: string): Promise<{ media_path: string | null; thumbnail_path: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("delete_message", {
    p_message_id: messageId,
  });
  if (error) {
    handleError(error, { message: "Error deleting message", route: "database/chat/delete-message", method: "POST" });
    throw error;
  }
  return data as { media_path: string | null; thumbnail_path: string | null };
}
```

### `forward-message.ts`
```ts
import { getOrCreateDm } from "@/database/chat/get-or-create-dm";
import { sendMessage } from "@/database/chat/send-message";

export async function forwardMessage(friendId: string, content: string): Promise<void> {
  const conversationId = await getOrCreateDm(friendId);
  await sendMessage(conversationId, content);
}
```

### `fetch-link-preview.ts`
```ts
import { createClient } from "@/utils/supabase/client";

export async function fetchLinkPreview(url: string, messageId?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("fetch-link-preview", {
    body: { url, ...(messageId ? { message_id: messageId } : {}) },
  });
  if (error) throw error;
  return data as { url: string; title: string | null; description: string | null; image: string | null; site_name: string | null };
}
```

### `get-other-last-read.ts`
```ts
export async function getOtherLastRead(conversationId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_other_participant_last_read", {
    p_conversation_id: conversationId,
  });
  if (error) {
    handleError(error, { message: "Error fetching other last read", route: "database/chat/get-other-last-read", method: "GET" });
    throw error;
  }
  return data as string | null;
}
```

---

## React Query Hooks

### `useConversations.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/database/chat/get-conversations";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    staleTime: 0,
  });
}
```

### `useMessages.ts`

Infinite query with cursor-based pagination (same pattern as mobile).

```ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages } from "@/database/chat/get-messages";

const PAGE_SIZE = 50;

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => getMessages(conversationId, PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
  });
}
```

### `useSendMessage.ts`

Optimistic update: prepend temp message to cache, rollback on error, invalidate on settle.

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/database/chat/send-message";
import { ChatMessage } from "@/types/chat";
import { createClient } from "@/utils/supabase/client";
import { fetchLinkPreview } from "@/database/chat/fetch-link-preview";

// URL detection regex (same as mobile)
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/;

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, replyToMessageId }: { content: string; replyToMessageId?: string }) => {
      return sendMessage(conversationId, content, replyToMessageId);
    },
    onMutate: async ({ content, replyToMessageId }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user?.id ?? "",
        content,
        message_type: "text",
        created_at: new Date().toISOString(),
        sender_display_name: "",
        sender_profile_picture: null,
        media_storage_path: null,
        media_thumbnail_path: null,
        media_duration_ms: null,
        link_preview: null,
        deleted_at: null,
        reply_to_message_id: replyToMessageId ?? null,
        reply_to_content: null,
        reply_to_sender_name: null,
        reply_to_message_type: null,
        reply_to_deleted_at: null,
        reactions: [],
      };

      queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
        return {
          ...data,
          pages: [[tempMessage, ...data.pages[0]], ...data.pages.slice(1)],
        };
      });

      return { previous };
    },
    onSuccess: async (messageId, { content }) => {
      // Fetch link preview if URL detected
      const match = content.match(URL_REGEX);
      if (match) {
        try {
          await fetchLinkPreview(match[0], messageId);
        } catch {
          // Non-blocking — preview is optional
        }
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", conversationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
```

### `useMarkRead.ts`
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markConversationRead } from "@/database/chat/mark-conversation-read";

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
```

### `useTotalUnreadCount.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { getTotalUnreadCount } from "@/database/chat/get-total-unread-count";

export function useTotalUnreadCount() {
  return useQuery({
    queryKey: ["total-unread-count"],
    queryFn: getTotalUnreadCount,
    staleTime: 0,
    refetchInterval: 60000, // Fallback poll every 60s
  });
}
```

### `useChatRealtime.ts`

Subscribe to postgres_changes for a conversation. Handles INSERT (new messages) and UPDATE (deletions, link preview updates).

```ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { ChatMessage } from "@/types/chat";

export function useChatRealtime(conversationId: string, currentUserId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Skip own messages (already optimistically added)
          if (newMsg.sender_id === currentUserId) return;

          queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
            if (!old) return old;
            const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
            // Check for duplicates
            const exists = data.pages[0]?.some((m) => m.id === newMsg.id);
            if (exists) return data;
            return {
              ...data,
              pages: [[newMsg, ...data.pages[0]], ...data.pages.slice(1)],
            };
          });

          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["other-last-read", conversationId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
            if (!old) return old;
            const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
            return {
              ...data,
              pages: data.pages.map((page) =>
                page.map((msg) => (msg.id === updated.id ? { ...msg, ...updated } : msg))
              ),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, queryClient]);
}
```

### `useTypingIndicator.ts`

Uses Supabase Broadcast (ephemeral, no DB storage).

```ts
import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export function useTypingIndicator(conversationId: string) {
  const queryClient = useQueryClient();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat-typing:${conversationId}`)
      .on("broadcast", { event: "typing" }, () => {
        setIsOtherTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
      })
      .on("broadcast", { event: "stop_typing" }, () => {
        setIsOtherTyping(false);
        clearTimeout(typingTimeoutRef.current);
      })
      .on("broadcast", { event: "read" }, () => {
        queryClient.invalidateQueries({ queryKey: ["other-last-read", conversationId] });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, queryClient]);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < 2000) return; // Throttle to every 2s
    lastSentRef.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: {} });
  }, []);

  const stopTyping = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "stop_typing", payload: {} });
  }, []);

  const broadcastRead = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "read", payload: {} });
  }, []);

  return { isOtherTyping, sendTyping, stopTyping, broadcastRead };
}
```

### `useDeleteMessage.ts`
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMessage } from "@/database/chat/delete-message";
import { ChatMessage } from "@/types/chat";

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);

      queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
        return {
          ...data,
          pages: data.pages.map((page) =>
            page.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: null, deleted_at: new Date().toISOString(), media_storage_path: null, media_thumbnail_path: null }
                : msg
            )
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", conversationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
```

### `useToggleReaction.ts`
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleReaction } from "@/database/chat/toggle-reaction";
import { ChatMessage, ReactionSummary } from "@/types/chat";

export function useToggleReaction(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      toggleReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);

      queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
        return {
          ...data,
          pages: data.pages.map((page) =>
            page.map((msg) => {
              if (msg.id !== messageId) return msg;
              const existing = msg.reactions.find((r: ReactionSummary) => r.emoji === emoji);
              let reactions: ReactionSummary[];
              if (existing?.user_reacted) {
                reactions = existing.count === 1
                  ? msg.reactions.filter((r: ReactionSummary) => r.emoji !== emoji)
                  : msg.reactions.map((r: ReactionSummary) =>
                      r.emoji === emoji ? { ...r, count: r.count - 1, user_reacted: false } : r
                    );
              } else if (existing) {
                reactions = msg.reactions.map((r: ReactionSummary) =>
                  r.emoji === emoji ? { ...r, count: r.count + 1, user_reacted: true } : r
                );
              } else {
                reactions = [...msg.reactions, { emoji, count: 1, user_reacted: true }];
              }
              return { ...msg, reactions };
            })
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", conversationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}
```

### `useForwardMessage.ts`
```ts
import { useMutation } from "@tanstack/react-query";
import { forwardMessage } from "@/database/chat/forward-message";

export function useForwardMessage() {
  return useMutation({
    mutationFn: ({ friendId, content }: { friendId: string; content: string }) =>
      forwardMessage(friendId, content),
  });
}
```

### `useOtherLastRead.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { getOtherLastRead } from "@/database/chat/get-other-last-read";

export function useOtherLastRead(conversationId: string) {
  return useQuery({
    queryKey: ["other-last-read", conversationId],
    queryFn: () => getOtherLastRead(conversationId),
    enabled: !!conversationId,
  });
}
```

---

## Components

### `ChatLayout.tsx` — Desktop split view container

The core layout component. On desktop (`lg:` and above), renders side-by-side panels. On mobile, renders only children (single page at a time via routing).

```
Desktop (lg:):
+-------------------+-----------------------------------+
| Conversation List | Active Chat                       |
| (320px, fixed)    | (flex-1)                          |
|                   |                                   |
| [search/new chat] | [header: name + avatar]           |
| [conversation 1]  | [messages...]                     |
| [conversation 2]  | [typing indicator]                |
| [conversation 3]  | [input + send]                    |
+-------------------+-----------------------------------+

Mobile (< lg:):
/chat → ConversationList (full page)
/chat/[id] → ChatView (full page)
```

```tsx
// Responsive detection
const isDesktop = useMedia("(min-width: 1024px)", false);
```

On desktop:
- Wraps both panels in a `flex` container with `h-[calc(100dvh-72px)]` (full height minus navbar)
- Left panel: `w-80 border-r border-slate-700 overflow-y-auto`
- Right panel: `flex-1 flex flex-col`

### `ConversationList.tsx` — List of conversations

- Fetches with `useConversations()`
- Each row is `ConversationItem`
- Top: title "Messages" + "New Chat" button (opens `FriendPickerModal`)
- Loading state: skeleton cards
- Empty state: `EmptyState` component with `MessageCircle` icon
- Active conversation highlighted on desktop (compare with URL param or state)

### `ConversationItem.tsx` — Single conversation row

Displays:
- Avatar (40x40, rounded, `next/image`)
- Display name
- Last message preview (truncated, type-aware: "Photo", "Voice message", etc.)
- Relative timestamp (Today HH:mm, Yesterday, or date)
- Unread badge (capped at 9+)

```
+--------------------------------------------------+
| [avatar]  FriendName                    12:34    |
|           Last message preview...    (2) badge   |
+--------------------------------------------------+
```

Styling:
- `bg-slate-900 hover:bg-slate-800 cursor-pointer p-3 rounded-md`
- Active (desktop): `bg-slate-800 border-l-2 border-blue-500`
- Unread badge: `bg-blue-500 text-white rounded-full text-xs min-w-5 h-5 flex items-center justify-center`

On click: navigate to `/chat/[conversationId]` (mobile) or set active conversation (desktop).

### `ChatView.tsx` — Message list + input

The main chat screen component. Used both as a standalone page (mobile) and as the right panel (desktop).

Props:
```ts
type ChatViewProps = {
  conversationId: string;
  otherUser: {
    id: string;
    display_name: string;
    profile_picture: string | null;
  };
  isActive: boolean;
};
```

Behavior:
- Fetches messages with `useMessages(conversationId)`
- Sets up `useChatRealtime(conversationId, currentUserId)` for live updates
- Sets up `useTypingIndicator(conversationId)` for typing/read broadcasts
- Calls `useMarkRead().mutate(conversationId)` on mount and when new messages arrive
- Calls `broadcastRead()` on mount

Layout:
```
+------------------------------------------+
|  Header: [back arrow] Avatar + Name      |  (mobile only: back arrow)
|------------------------------------------|
|  [scrollable message area]               |
|  - Older messages loaded on scroll up    |
|  - Date separators between days          |
|  - Messages: ChatBubble components       |
|  - Typing indicator at bottom            |
|------------------------------------------|
|  [ReplyPreview bar — if replying]        |
|  [LinkPreview — if URL detected in input]|
|  [Input field] [Send button]             |
+------------------------------------------+
```

Message list:
- Use `flex flex-col-reverse overflow-y-auto` for newest-at-bottom with auto-scroll behavior
- On scroll to top, trigger `fetchNextPage` (IntersectionObserver on a sentinel div, same pattern as `useFeed`)
- Group messages by date for `DateSeparator`

### `ChatBubble.tsx` — Single message

Props: `message: ChatMessage`, `isOwn: boolean`, `showReadReceipt: boolean`, `onReply`, `onDelete`, `onReact`, `onForward`

Layout:
- Own messages: right-aligned, `bg-blue-600/20 border border-blue-500/30`
- Other messages: left-aligned, `bg-slate-800 border border-slate-700`
- Deleted messages: italic "This message was deleted" in `text-gray-500`
- Reply preview: `ReplyPreview` component above message text (clickable to scroll)
- Link preview: `LinkPreviewCard` below message text
- Reactions: `ReactionPills` below bubble
- Timestamp: `text-xs text-gray-500` below bubble
- Read receipt (own messages only): single check (sent) or double check (read, `text-blue-400`)

Context menu: right-click (desktop) or long-press (mobile) opens `MessageContextMenu` with:
- Quick reactions: 6 emoji buttons (same as mobile: thumbs up, heart, laugh, surprised, sad, fire)
- Reply (all messages)
- Copy (text messages only)
- Forward (all non-deleted messages)
- Delete (own messages only)

### `ChatInput.tsx` — Text input + send

- `textarea` with auto-growing height (1 row to max 5 rows)
- Send button: `Send` icon, disabled when empty or `!isActive`
- Enter to send (Shift+Enter for new line)
- On input change: call `sendTyping()` from typing indicator hook
- On send: call `stopTyping()`, clear input
- URL detection: 500ms debounce, show `LinkPreviewCard` preview above input (dismissible)
- Reply mode: show `ReplyPreview` bar above input with close button
- Inactive state: show disabled input with "You are no longer friends" message

### `DateSeparator.tsx`

Pill-shaped date divider between message groups.

```tsx
// "Today", "Yesterday", or formatted date
<div className="flex justify-center my-3">
  <span className="text-xs text-gray-400 bg-slate-800 px-3 py-1 rounded-full">
    {label}
  </span>
</div>
```

### `ReplyPreview.tsx`

Compact quoted reply inside a bubble.

```
| [cyan left bar] SenderName
|                 Message preview text...
```

Clickable: scrolls to original message and highlights it briefly.

### `ReactionPills.tsx`

Horizontal row of emoji + count pills below a bubble.

```tsx
<div className="flex gap-1 mt-1">
  {reactions.map((r) => (
    <button
      key={r.emoji}
      onClick={() => onToggle(r.emoji)}
      className={`text-xs px-2 py-0.5 rounded-full border ${
        r.user_reacted
          ? "bg-cyan-500/20 border-cyan-500/50"
          : "bg-slate-800 border-slate-600"
      }`}
    >
      {r.emoji} {r.count}
    </button>
  ))}
</div>
```

### `MessageContextMenu.tsx`

Positioned context menu (not a modal — absolute/fixed positioned near the message).

On desktop: triggered by right-click (native context menu override).
On mobile web: triggered by long-press.

Uses `createPortal` to render above everything. Closes on click outside.

Content: quick reaction row + action buttons (Reply, Copy, Forward, Delete).

### `TypingIndicator.tsx`

Animated 3-dot indicator shown below messages when the other user is typing.

```tsx
<div className="flex items-center gap-1 px-4 py-2">
  <div className="flex gap-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 150}ms` }}
      />
    ))}
  </div>
  <span className="text-xs text-gray-400 ml-1">{t("chat.typing")}</span>
</div>
```

### `FriendPickerModal.tsx`

Modal (using existing `Modal` component) to select a friend for:
1. Starting a new conversation
2. Forwarding a message

Content:
- Title: "Select a friend" / "Forward to"
- List of friends (from `useFriends()` hook — already exists at `features/menu/friends/hooks/useFriends.ts`)
- Each row: avatar + name, clickable
- On select: callback with friend's user ID

### `LinkPreviewCard.tsx`

URL metadata preview card, used in both bubbles and input area.

```
+---------------------------------------------+
| [image]  Title                               |
|          Description...                      |
|          site.com                            |
+---------------------------------------------+
```

Clickable: opens URL in new tab (`target="_blank" rel="noopener noreferrer"`).

### `ChatEmptyState.tsx`

Shown in the right panel on desktop when no conversation is selected.

```
+---------------------------------------------+
|                                              |
|          [MessageCircle icon]                |
|          Select a conversation               |
|          or start a new chat                 |
|                                              |
+---------------------------------------------+
```

---

## Pages

### `app/(app)/chat/page.tsx` — Main chat page

```tsx
"use client";

// Desktop: ChatLayout with ConversationList + ChatView side by side
// Mobile: ConversationList only (conversations navigate to /chat/[id])

export default function ChatPage() {
  const isDesktop = useMedia("(min-width: 1024px)", false);

  if (isDesktop) {
    return <ChatLayout />;
  }

  return (
    <div className="page-padding">
      <ConversationList />
    </div>
  );
}
```

On desktop, `ChatLayout` manages which conversation is active via URL search params or local state. Clicking a conversation in the list updates the active conversation without a full page navigation.

### `app/(app)/chat/[conversationId]/page.tsx` — Mobile chat screen

```tsx
"use client";

// Full-page chat view for mobile
// Redirects to /chat on desktop (handled by ChatLayout)

export default function ChatConversationPage({ params }: { params: { conversationId: string } }) {
  const isDesktop = useMedia("(min-width: 1024px)", false);
  const router = useRouter();

  // On desktop, redirect to /chat with the conversation selected
  useEffect(() => {
    if (isDesktop) {
      router.replace(`/chat?id=${params.conversationId}`);
    }
  }, [isDesktop]);

  if (isDesktop) return null;

  return <ChatView conversationId={params.conversationId} />;
}
```

---

## Navbar Integration: Unread Badge

Update `components/navbar/navbar.tsx` to show an unread count badge on the chat icon.

```tsx
// Inside Navbar component
const { data: unreadCount } = useTotalUnreadCount();

<Link href="/chat" className="relative border-[1.5px] p-2 border-blue-500 rounded-full bg-gray-800">
  <MessageCircle size={20} />
  {unreadCount != null && unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )}
</Link>
```

Also set up a global realtime subscription in the navbar (or a wrapper) that invalidates `["total-unread-count"]` and `["conversations"]` when any message arrives in any of the user's conversations. This ensures the badge updates without having a specific conversation open.

---

## Translations

### `app/lib/i18n/locales/en/chat.json`
```json
{
  "chat": {
    "title": "Messages",
    "newChat": "New Chat",
    "noConversations": "No messages yet",
    "startChat": "Start a chat with a friend!",
    "typeMessage": "Type a message...",
    "send": "Send",
    "today": "Today",
    "yesterday": "Yesterday",
    "you": "You",
    "selectFriend": "Select a friend",
    "forwardTo": "Forward to",
    "noFriends": "Add friends to start chatting",
    "inactive": "You are no longer friends. You can read old messages but cannot send new ones.",
    "messageSendError": "Failed to send message",
    "messageDeleted": "This message was deleted",
    "messageCopied": "Message copied",
    "messageForwarded": "Message forwarded",
    "deleteConfirmTitle": "Delete message?",
    "deleteConfirmMessage": "This message will be deleted for everyone.",
    "reply": "Reply",
    "copy": "Copy",
    "forward": "Forward",
    "delete": "Delete",
    "typing": "typing...",
    "selectConversation": "Select a conversation",
    "orStartNew": "or start a new chat",
    "photo": "Photo",
    "video": "Video",
    "voiceMessage": "Voice message",
    "sessionShare": "Shared a session",
    "location": "Shared location"
  }
}
```

### `app/lib/i18n/locales/fi/chat.json`
```json
{
  "chat": {
    "title": "Viestit",
    "newChat": "Uusi viesti",
    "noConversations": "Ei vielä viestejä",
    "startChat": "Aloita keskustelu kaverin kanssa!",
    "typeMessage": "Kirjoita viesti...",
    "send": "Lähetä",
    "today": "Tänään",
    "yesterday": "Eilen",
    "you": "Sinä",
    "selectFriend": "Valitse kaveri",
    "forwardTo": "Välitä",
    "noFriends": "Lisää kavereita aloittaaksesi keskustelun",
    "inactive": "Ette ole enää kavereita. Voit lukea vanhoja viestejä, mutta et voi lähettää uusia.",
    "messageSendError": "Viestin lähetys epäonnistui",
    "messageDeleted": "Tämä viesti on poistettu",
    "messageCopied": "Viesti kopioitu",
    "messageForwarded": "Viesti välitetty",
    "deleteConfirmTitle": "Poista viesti?",
    "deleteConfirmMessage": "Tämä viesti poistetaan kaikilta.",
    "reply": "Vastaa",
    "copy": "Kopioi",
    "forward": "Välitä",
    "delete": "Poista",
    "typing": "kirjoittaa...",
    "selectConversation": "Valitse keskustelu",
    "orStartNew": "tai aloita uusi keskustelu",
    "photo": "Kuva",
    "video": "Video",
    "voiceMessage": "Ääniviesti",
    "sessionShare": "Jakoi treenin",
    "location": "Jakoi sijainnin"
  }
}
```

Register the namespace in both `app/lib/i18n/locales/en/index.ts` and `fi/index.ts`:
```ts
export { default as chat } from "./chat.json";
```

---

## Implementation Order

### Step 1: Types & database functions
- Create `types/chat.ts`
- Create all `database/chat/*.ts` files
- Add translation files + register namespace

### Step 2: Core hooks
- `useConversations`, `useMessages`, `useSendMessage`, `useMarkRead`
- `useTotalUnreadCount`, `useOtherLastRead`

### Step 3: Conversation list
- `ConversationList`, `ConversationItem` components
- `FriendPickerModal` for new chat
- `ChatEmptyState` for desktop right panel
- Wire up `app/(app)/chat/page.tsx` (mobile: list only)

### Step 4: Chat view
- `ChatView`, `ChatBubble`, `ChatInput`, `DateSeparator` components
- `app/(app)/chat/[conversationId]/page.tsx` (mobile full page)
- Desktop `ChatLayout` with split view
- Mark as read on mount

### Step 5: Realtime
- `useChatRealtime` hook
- `useTypingIndicator` hook
- `TypingIndicator` component
- Global unread subscription in navbar

### Step 6: Message actions
- `MessageContextMenu` component
- `useDeleteMessage`, `useToggleReaction`, `useForwardMessage` hooks
- `ReactionPills`, `ReplyPreview` components
- Reply flow in `ChatInput`

### Step 7: Link previews
- `LinkPreviewCard` component
- URL detection + debounced preview fetch in input
- Display in bubbles

### Step 8: Navbar unread badge
- `useTotalUnreadCount` in navbar
- Badge rendering

### Step 9: Polish
- Loading skeletons
- Error states with toast
- Keyboard shortcuts (Enter to send, Escape to close menus)
- Auto-scroll on new messages
- Scroll-to-message for replies
- Conversation highlight animation on reply click
- Responsive edge cases

---

## Edge Cases

Same as mobile spec, plus web-specific:

- **Tab visibility**: Use `document.visibilityState` — mark conversation read when tab becomes visible again (if a conversation is open)
- **Multiple tabs**: Each tab has its own realtime subscription — this is fine, Supabase handles deduplication on the server
- **Desktop resize**: When resizing from mobile to desktop width, the `ChatLayout` takes over from stacked routing. Use `useMedia` to handle the transition
- **Browser back/forward**: `/chat/[conversationId]` pages should work with browser navigation on mobile
- **Copy to clipboard**: Use `navigator.clipboard.writeText()` with fallback for older browsers
- **Long messages**: Same 2000 char limit enforced by RPC. Show character count near limit in input
- **Link preview in input**: Dismiss by clicking X on the preview card. Only one preview at a time (first URL detected)
