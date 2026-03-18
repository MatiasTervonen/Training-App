import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/database/chat/get-conversations";
import { Conversation } from "@/types/chat";

export default function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: getConversations,
    staleTime: 0,
  });
}
