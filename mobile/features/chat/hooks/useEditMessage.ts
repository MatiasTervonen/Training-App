import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { editMessage } from "@/database/chat/edit-message";
import { ChatMessage } from "@/types/chat";

type EditMessageVars = {
  messageId: string;
  content: string;
};

export default function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: EditMessageVars) =>
      editMessage(messageId, content),

    onMutate: async ({ messageId, content }: EditMessageVars) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previousMessages =
        queryClient.getQueryData<InfiniteData<ChatMessage[]>>([
          "messages",
          conversationId,
        ]);

      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      content,
                      edited_at: new Date().toISOString(),
                    }
                  : msg,
              ),
            ),
          };
        },
      );

      return { previousMessages };
    },

    onError: (_err, _vars, context) => {
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
    },
  });
}
