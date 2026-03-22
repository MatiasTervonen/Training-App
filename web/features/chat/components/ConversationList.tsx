"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MessageCircle, Plus } from "lucide-react";
import { useConversations } from "@/features/chat/hooks/useConversations";
import ConversationItem from "@/features/chat/components/ConversationItem";
import FriendPickerModal from "@/features/chat/components/FriendPickerModal";
import EmptyState from "@/components/EmptyState";
import { getOrCreateDm } from "@/database/chat/get-or-create-dm";

type ConversationListProps = {
  activeConversationId?: string;
  onSelectConversation?: (
    conversationId: string,
    otherUserId: string,
    otherUserName: string,
    otherUserPicture: string | null
  ) => void;
  currentUserId: string;
};

export default function ConversationList({
  activeConversationId,
  onSelectConversation,
  currentUserId,
}: ConversationListProps) {
  const { t } = useTranslation("chat");
  const router = useRouter();
  const { data: conversations, isLoading } = useConversations();
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  const handleSelectConversation = (conv: {
    conversation_id: string;
    other_user_id: string | null;
    other_user_display_name: string | null;
    other_user_profile_picture: string | null;
  }) => {
    if (onSelectConversation) {
      onSelectConversation(
        conv.conversation_id,
        conv.other_user_id ?? "",
        conv.other_user_display_name ?? "",
        conv.other_user_profile_picture
      );
    } else {
      router.push(`/chat/${conv.conversation_id}`);
    }
  };

  const handleNewChat = async (friendId: string) => {
    setShowFriendPicker(false);
    const conversationId = await getOrCreateDm(friendId);
    if (onSelectConversation) {
      const existing = conversations?.find(
        (c) => c.other_user_id === friendId
      );
      onSelectConversation(
        conversationId,
        friendId,
        existing?.other_user_display_name ?? "",
        existing?.other_user_profile_picture ?? null
      );
    } else {
      router.push(`/chat/${conversationId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 bg-slate-700 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-700 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl">{t("chat.title")}</h1>
        <button
          onClick={() => setShowFriendPicker(true)}
          className="btn-base flex items-center gap-1.5 text-sm px-3 py-1.5"
        >
          <Plus size={16} />
          {t("chat.newChat")}
        </button>
      </div>

      {!conversations || conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={t("chat.noConversations")}
          description={t("chat.startChat")}
        />
      ) : (
        <div className="flex flex-col gap-1 px-2">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.conversation_id}
              conversation={conv}
              isActive={conv.conversation_id === activeConversationId}
              onClick={() => handleSelectConversation(conv)}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      <FriendPickerModal
        isOpen={showFriendPicker}
        onClose={() => setShowFriendPicker(false)}
        onSelect={handleNewChat}
        title={t("chat.selectFriend")}
      />
    </>
  );
}
