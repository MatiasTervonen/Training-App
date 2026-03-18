import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages, PAGE_SIZE } from "@/database/chat/get-messages";
import { ChatMessage } from "@/types/chat";

export default function useMessages(conversationId: string) {
  const query = useInfiniteQuery<ChatMessage[]>({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) =>
      getMessages(conversationId, PAGE_SIZE, pageParam as string | undefined),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
  });

  const messages = query.data?.pages.flat() ?? [];

  return {
    ...query,
    messages,
  };
}
