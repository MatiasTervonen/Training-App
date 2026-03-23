"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConversationList from "@/features/chat/components/ConversationList";
import ChatView from "@/features/chat/components/ChatView";
import ChatEmptyState from "@/features/chat/components/ChatEmptyState";
import { useCurrentUserId } from "@/features/chat/hooks/useCurrentUserId";
import { useConversations } from "@/features/chat/hooks/useConversations";

type ActiveChat = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPicture: string | null;
};

export default function ChatLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = useCurrentUserId();
  const { data: conversations } = useConversations();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);

  // Restore active chat from URL query param (e.g. notification deep-link)
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (!idFromUrl || !conversations || activeChat) return;

    const conv = conversations.find((c) => c.conversation_id === idFromUrl);
    if (conv) {
      setActiveChat({
        conversationId: conv.conversation_id,
        otherUserId: conv.other_user_id ?? "",
        otherUserName: conv.other_user_display_name ?? "",
        otherUserPicture: conv.other_user_profile_picture ?? null,
      });
    }
  }, [searchParams, conversations, activeChat]);

  const handleSelectConversation = useCallback((conversationId: string, otherUserId: string, otherUserName: string, otherUserPicture: string | null) => {
    setActiveChat({ conversationId, otherUserId, otherUserName, otherUserPicture });
    router.replace(`/chat?id=${conversationId}`, { scroll: false });
  }, [router]);

  return (
    <div className="flex h-[calc(100dvh-72px)]">
      {/* Left panel */}
      <div className="w-80 border-r border-slate-700 overflow-y-auto shrink-0">
        <ConversationList
          activeConversationId={activeChat?.conversationId}
          onSelectConversation={handleSelectConversation}
          currentUserId={currentUserId}
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChat ? (
          <ChatView
            conversationId={activeChat.conversationId}
            otherUser={{
              id: activeChat.otherUserId,
              display_name: activeChat.otherUserName,
              profile_picture: activeChat.otherUserPicture,
            }}
            isActive={true}
          />
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  );
}
