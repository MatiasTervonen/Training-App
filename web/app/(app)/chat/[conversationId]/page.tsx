"use client";

import { useEffect } from "react";
import { useMedia } from "react-use";
import { useRouter, useParams } from "next/navigation";
import ChatView from "@/features/chat/components/ChatView";
import { useConversations } from "@/features/chat/hooks/useConversations";

export default function ChatConversationPage() {
  const isDesktop = useMedia("(min-width: 1024px)", false);
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { data: conversations } = useConversations();

  // On desktop, redirect to /chat with the conversation selected
  useEffect(() => {
    if (isDesktop) {
      router.replace(`/chat?id=${conversationId}`);
    }
  }, [isDesktop, conversationId, router]);

  if (isDesktop) return null;

  // Find conversation details
  const conversation = conversations?.find(c => c.conversation_id === conversationId);

  return (
    <div className="h-[calc(100dvh-72px)]">
      <ChatView
        conversationId={conversationId}
        otherUser={{
          id: conversation?.other_user_id ?? "",
          display_name: conversation?.other_user_display_name ?? "",
          profile_picture: conversation?.other_user_profile_picture ?? null,
        }}
        isActive={conversation?.is_active ?? true}
        onBack={() => router.push("/chat")}
      />
    </div>
  );
}
