import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { sendMessage } from "@/database/chat/send-message";
import { fetchLinkPreview } from "@/database/chat/fetch-link-preview";
import { ChatMessage, LinkPreview } from "@/types/chat";
import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import { extractFirstUrl } from "@/lib/chat/linkUtils";
import Toast from "react-native-toast-message";

type SendMessageInput = {
  content: string;
  preview?: LinkPreview | null;
  replyToMessageId?: string | null;
  replyToMessage?: ChatMessage | null;
};

export default function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, replyToMessageId }: SendMessageInput) =>
      sendMessage({
        conversationId,
        content,
        messageType: "text",
        replyToMessageId,
      }),

    onMutate: async ({ content, preview, replyToMessageId, replyToMessage }: SendMessageInput) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previousMessages =
        queryClient.getQueryData<InfiniteData<ChatMessage[]>>([
          "messages",
          conversationId,
        ]);

      const profile = useUserStore.getState().profile;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: session?.user?.id ?? "",
        content,
        message_type: "text",
        media_storage_path: null,
        media_thumbnail_path: null,
        media_duration_ms: null,
        link_preview: preview ?? null,
        deleted_at: null,
        reply_to_message_id: replyToMessageId ?? null,
        reply_to_content: replyToMessage?.content ?? null,
        reply_to_sender_name: replyToMessage?.sender_display_name ?? null,
        reply_to_message_type: replyToMessage?.message_type ?? null,
        reply_to_deleted_at: replyToMessage?.deleted_at ?? null,
        reactions: [],
        created_at: new Date().toISOString(),
        sender_display_name: profile?.display_name ?? "",
        sender_profile_picture: profile?.profile_picture ?? null,
      };

      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) {
            return {
              pages: [[optimisticMessage]],
              pageParams: [undefined],
            };
          }
          const newPages = [...old.pages];
          newPages[0] = [optimisticMessage, ...(newPages[0] ?? [])];
          return { ...old, pages: newPages };
        },
      );

      return { previousMessages };
    },

    onSuccess: async (messageId, { content }) => {
      const url = extractFirstUrl(content);
      if (!url) return;

      // Always call with messageId to save preview to DB (triggers realtime for receiver)
      const preview = await fetchLinkPreview(messageId, url);
      if (!preview) return;

      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((msg) =>
                msg.id === messageId || (msg.id.startsWith("temp-") && msg.content === content)
                  ? { ...msg, link_preview: preview }
                  : msg,
              ),
            ),
          };
        },
      );
    },

    onError: (err, _input, context) => {
      console.error("Send message error:", err);
      Toast.show({ type: "error", text1: "Failed to send message", text2: String(err) });
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previousMessages,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
