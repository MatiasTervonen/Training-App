import { memo } from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { Conversation } from "@/types/chat";
import { useTranslation } from "react-i18next";

type ConversationItemProps = {
  conversation: Conversation;
  onPress: (conversationId: string, name?: string, avatar?: string | null) => void;
};

function formatTime(dateString: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const localDate = date.toLocaleDateString("en-CA");
  const todayStr = now.toLocaleDateString("en-CA");

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  if (localDate === todayStr) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (localDate === yesterdayStr) {
    return "yesterday";
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const { t } = useTranslation("chat");

  const imageSource = conversation.other_user_profile_picture
    ? { uri: conversation.other_user_profile_picture }
    : require("@/assets/images/default-avatar.png");

  const displayName =
    conversation.other_user_display_name ?? conversation.conversation_name ?? "";

  const lastMessagePreview = conversation.last_message_content
    ? conversation.last_message_sender_id === conversation.other_user_id
      ? conversation.last_message_content
      : `${t("chat.you")}: ${conversation.last_message_content}`
    : "";

  const timeStr = formatTime(conversation.last_message_at);
  const displayTime =
    timeStr === "yesterday" ? t("chat.yesterday") : timeStr;

  return (
    <Pressable
      onPress={() => onPress(conversation.conversation_id, displayName, conversation.other_user_profile_picture)}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-slate-800"
    >
      <Image
        source={imageSource}
        className="w-12 h-12 rounded-full border-2 border-blue-500"
      />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between">
          <AppText className="text-base" numberOfLines={1}>
            {displayName}
          </AppText>
          <BodyText className="text-xs text-slate-400 ml-2">
            {displayTime}
          </BodyText>
        </View>
        <View className="flex-row items-center justify-between mt-0.5">
          <BodyText
            className={`text-sm flex-1 mr-2 ${
              conversation.unread_count > 0
                ? "text-slate-200"
                : "text-slate-400"
            }`}
            numberOfLines={1}
          >
            {lastMessagePreview}
          </BodyText>
          {conversation.unread_count > 0 && (
            <View className="w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
              <AppText className="text-gray-100 text-[10px] font-bold leading-none">
                {conversation.unread_count > 9
                  ? "9+"
                  : conversation.unread_count}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default memo(ConversationItem);
