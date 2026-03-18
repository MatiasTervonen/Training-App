import { useEffect, useCallback, useRef } from "react";
import { View, FlatList, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react-native";
import { Image } from "expo-image";
import AppText from "@/components/AppText";
import ChatBubble from "@/features/chat/components/ChatBubble";
import ChatInput from "@/features/chat/components/ChatInput";
import DateSeparator from "@/features/chat/components/DateSeparator";
import useMessages from "@/features/chat/hooks/useMessages";
import useSendMessage from "@/features/chat/hooks/useSendMessage";
import useMarkRead from "@/features/chat/hooks/useMarkRead";
import useChatRealtime from "@/features/chat/hooks/useChatRealtime";
import useConversations from "@/features/chat/hooks/useConversations";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTimerStore } from "@/lib/stores/timerStore";
import { ChatMessage } from "@/types/chat";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

function shouldShowTimestamp(
  current: ChatMessage,
  previous: ChatMessage | undefined,
): boolean {
  if (!previous) return true;
  if (current.sender_id !== previous.sender_id) return true;
  const diff = Math.abs(
    new Date(current.created_at).getTime() -
      new Date(previous.created_at).getTime(),
  );
  return diff > 5 * 60 * 1000;
}

function shouldShowDateSeparator(
  current: ChatMessage,
  previous: ChatMessage | undefined,
): boolean {
  if (!previous) return true;
  const currentDate = new Date(current.created_at).toLocaleDateString("en-CA");
  const previousDate = new Date(previous.created_at).toLocaleDateString(
    "en-CA",
  );
  return currentDate !== previousDate;
}

export default function ChatScreen() {
  const { conversationId, name, avatar } = useLocalSearchParams<{
    conversationId: string;
    name?: string;
    avatar?: string;
  }>();
  const { t } = useTranslation("chat");
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = useUserStore((state) => state.profile?.id ?? null);
  const hasActiveSession = !!useTimerStore((state) => state.activeSession);

  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId!);
  const sendMessage = useSendMessage(conversationId!);
  const markRead = useMarkRead(conversationId!);
  const { data: conversations } = useConversations();

  const conversation = conversations?.find(
    (c) => c.conversation_id === conversationId,
  );

  useChatRealtime(conversationId!, currentUserId);

  useEffect(() => {
    if (conversationId) {
      markRead.mutate();
    }
  }, [conversationId, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(
    (content: string) => {
      sendMessage.mutate(content);
    },
    [sendMessage],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isOwn = item.sender_id === currentUserId;
      const olderMessage = messages[index + 1];
      const showTimestamp = shouldShowTimestamp(item, olderMessage);
      const showDateSeparator = shouldShowDateSeparator(item, olderMessage);

      return (
        <View>
          {showDateSeparator && <DateSeparator dateString={item.created_at} />}
          <ChatBubble
            message={item}
            isOwn={isOwn}
            showTimestamp={showTimestamp}
          />
        </View>
      );
    },
    [currentUserId, messages],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const imageSource = conversation?.other_user_profile_picture
    ? { uri: conversation.other_user_profile_picture }
    : avatar
      ? { uri: avatar }
      : require("@/assets/images/default-avatar.png");

  const displayName = conversation?.other_user_display_name ?? name ?? "";

  const isActive = conversation?.is_active ?? true;

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-900">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft color="#f3f4f6" size={24} />
        </Pressable>
        <Image
          source={imageSource}
          className="w-9 h-9 rounded-full border-2 border-blue-500"
        />
        <AppText className="text-lg flex-1" numberOfLines={1}>
          {displayName}
        </AppText>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={hasActiveSession ? 171 : 110}
      >
        {/* Messages */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            inverted
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4">
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={!isActive}
          disabledMessage={!isActive ? t("chat.inactive") : undefined}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
