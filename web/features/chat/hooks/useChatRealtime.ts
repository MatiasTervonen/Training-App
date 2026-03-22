"use client";

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
          if (newMsg.sender_id === currentUserId) return;

          // Optimistically insert the raw message for instant display
          queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
            if (!old) return old;
            const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
            const exists = data.pages[0]?.some((m) => m.id === newMsg.id);
            if (exists) return data;
            return {
              ...data,
              pages: [[{ ...newMsg, reactions: newMsg.reactions ?? [] }, ...data.pages[0]], ...data.pages.slice(1)],
            };
          });

          // Refetch to get full computed fields (reply_to_*, reactions, etc.)
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
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
