"use client";

import { useMedia } from "react-use";
import ChatLayout from "@/features/chat/components/ChatLayout";
import ConversationList from "@/features/chat/components/ConversationList";
import { useCurrentUserId } from "@/features/chat/hooks/useCurrentUserId";

export default function ChatPage() {
  const isDesktop = useMedia("(min-width: 1024px)", false);
  const currentUserId = useCurrentUserId();

  if (isDesktop) {
    return <ChatLayout />;
  }

  return (
    <div className="page-padding">
      <ConversationList currentUserId={currentUserId} />
    </div>
  );
}
