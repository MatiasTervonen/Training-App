import { useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ChatMessage, LinkPreview } from "@/types/chat";

export default function useChatRealtime(
  conversationId: string,
  currentUserId: string | null,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

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
          const newMessage = payload.new as ChatMessage & {
            sender_id: string;
          };

          // Skip if from self (already handled by optimistic update)
          if (newMessage.sender_id === currentUserId) return;

          // Append to message cache
          queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
            ["messages", conversationId],
            (old) => {
              if (!old) return old;

              // Check if message already exists (dedup)
              const allMessages = old.pages.flat();
              if (allMessages.some((m) => m.id === newMessage.id)) return old;

              const newPages = [...old.pages];
              newPages[0] = [newMessage, ...(newPages[0] ?? [])];
              return { ...old, pages: newPages };
            },
          );

          // Refresh conversations list
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({
            queryKey: ["total-unread-count"],
          });
        },
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
          const updated = payload.new as {
            id: string;
            sender_id: string;
            link_preview: LinkPreview | null;
            deleted_at: string | null;
            content: string | null;
          };

          // Handle deletion updates from other users
          if (updated.deleted_at && updated.sender_id !== currentUserId) {
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
              ["messages", conversationId],
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) =>
                    page.map((msg) =>
                      msg.id === updated.id
                        ? {
                            ...msg,
                            content: null,
                            media_storage_path: null,
                            media_thumbnail_path: null,
                            media_duration_ms: null,
                            link_preview: null,
                            deleted_at: updated.deleted_at,
                          }
                        : msg,
                    ),
                  ),
                };
              },
            );
            return;
          }

          // Only handle link_preview updates from other users
          if (updated.sender_id === currentUserId) return;
          if (!updated.link_preview) return;

          queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
            ["messages", conversationId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) =>
                  page.map((msg) =>
                    msg.id === updated.id
                      ? { ...msg, link_preview: updated.link_preview }
                      : msg,
                  ),
                ),
              };
            },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as {
            user_id: string;
            last_read_at: string | null;
          };
          // When the other user reads messages, refresh read receipts
          if (updated.user_id !== currentUserId) {
            queryClient.invalidateQueries({
              queryKey: ["other-last-read", conversationId],
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, queryClient]);
}
