import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { sendMessage } from "@/database/chat/send-message";
import { ChatMessage } from "@/types/chat";
import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import Toast from "react-native-toast-message";

export default function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),

    onMutate: async (content) => {
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

    onError: (err, _content, context) => {
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
