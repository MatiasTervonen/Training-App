"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConversationList from "@/features/chat/components/ConversationList";
import ChatView from "@/features/chat/components/ChatView";
import ChatEmptyState from "@/features/chat/components/ChatEmptyState";
import { useCurrentUserId } from "@/features/chat/hooks/useCurrentUserId";

type ActiveChat = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPicture: string | null;
};

export default function ChatLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUserId = useCurrentUserId();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);

  // Sync from URL params on mount
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && !activeChat) {
      // Will be resolved when ConversationList loads and we can find the conversation
      setActiveChat((prev) => prev?.conversationId === id ? prev : null);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
