"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/database/chat/send-message";
import { ChatMessage } from "@/types/chat";
import { createClient } from "@/utils/supabase/client";
import { fetchLinkPreview } from "@/database/chat/fetch-link-preview";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/;

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, replyToMessageId }: { content: string; replyToMessageId?: string }) => {
      return sendMessage({ conversationId, content, messageType: "text", replyToMessageId });
    },
    onMutate: async ({ content, replyToMessageId }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);

      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const sub = data?.claims?.sub;

      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: typeof sub === "string" ? sub : "",
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
        edited_at: null,
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
