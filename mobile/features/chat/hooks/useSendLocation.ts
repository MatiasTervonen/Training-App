import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { sendMessage } from "@/database/chat/send-message";
import { ChatMessage, LocationShareContent } from "@/types/chat";
import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

type SendLocationInput = {
  locationData: LocationShareContent;
  replyToMessageId?: string | null;
  replyToMessage?: ChatMessage | null;
};

export default function useSendLocation(conversationId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation("chat");

  return useMutation({
    mutationFn: ({ locationData, replyToMessageId }: SendLocationInput) =>
      sendMessage({
        conversationId,
        content: JSON.stringify(locationData),
        messageType: "location",
        replyToMessageId,
      }),

    onMutate: async ({ locationData, replyToMessageId, replyToMessage }: SendLocationInput) => {
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
        content: JSON.stringify(locationData),
        message_type: "location",
        media_storage_path: null,
        media_thumbnail_path: null,
        media_duration_ms: null,
        link_preview: null,
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

    onError: (_err, _input, context) => {
      Toast.show({ type: "error", text1: t("chat.locationSendError") });
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
