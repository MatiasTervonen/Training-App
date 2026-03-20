import { useEffect, useCallback, useRef, useState } from "react";
import { View, FlatList, ActivityIndicator, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react-native";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import AppText from "@/components/AppText";
import ChatBubble from "@/features/chat/components/ChatBubble";
import ChatInput from "@/features/chat/components/ChatInput";
import DateSeparator from "@/features/chat/components/DateSeparator";
import FriendPickerSheet from "@/features/chat/components/FriendPickerSheet";
import useMessages from "@/features/chat/hooks/useMessages";
import useSendMessage from "@/features/chat/hooks/useSendMessage";
import useSendMediaMessage from "@/features/chat/hooks/useSendMediaMessage";
import useMarkRead from "@/features/chat/hooks/useMarkRead";
import useChatRealtime from "@/features/chat/hooks/useChatRealtime";
import useConversations from "@/features/chat/hooks/useConversations";
import useDeleteMessage from "@/features/chat/hooks/useDeleteMessage";
import useToggleReaction from "@/features/chat/hooks/useToggleReaction";
import useForwardMessage from "@/features/chat/hooks/useForwardMessage";
import useOtherLastRead from "@/features/chat/hooks/useOtherLastRead";
import useTypingIndicator from "@/features/chat/hooks/useTypingIndicator";
import TypingIndicator from "@/features/chat/components/TypingIndicator";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTimerStore } from "@/lib/stores/timerStore";
import { ChatMessage, LinkPreview } from "@/types/chat";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

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

  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const messageToForward = useRef<ChatMessage | null>(null);

  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId!);
  const sendMessage = useSendMessage(conversationId!);
  const sendMediaMessage = useSendMediaMessage(conversationId!);
  const markRead = useMarkRead(conversationId!);
  const deleteMessageMutation = useDeleteMessage(conversationId!);
  const toggleReaction = useToggleReaction(conversationId!);
  const forwardMessage = useForwardMessage();
  const { data: conversations } = useConversations();

  const conversation = conversations?.find(
    (c) => c.conversation_id === conversationId,
  );

  useChatRealtime(conversationId!, currentUserId);
  const { data: otherLastRead } = useOtherLastRead(conversationId!);
  const { isOtherTyping, sendTyping } = useTypingIndicator(
    conversationId!,
    currentUserId,
  );

  useEffect(() => {
    if (conversationId) {
      markRead.mutate();
    }
  }, [conversationId, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(
    (content: string, preview?: LinkPreview | null) => {
      sendMessage.mutate({
        content,
        preview,
        replyToMessageId: replyTo?.id,
        replyToMessage: replyTo,
      });
      setReplyTo(null);
    },
    [sendMessage, replyTo],
  );

  const handleSendMedia = useCallback(
    (payload: {
      messageType: "image" | "video" | "voice";
      uri: string;
      thumbnailUri?: string;
      durationMs?: number;
    }) => {
      sendMediaMessage.mutate({
        ...payload,
        replyToMessageId: replyTo?.id,
        replyToMessage: replyTo,
      });
      setReplyTo(null);
    },
    [sendMediaMessage, replyTo],
  );

  const handleLongPress = useCallback((message: ChatMessage) => {
    setSelectedMessage(message);
  }, []);

  const handleDismissToolbar = useCallback(() => {
    setSelectedMessage(null);
  }, []);

  const handleReply = useCallback(() => {
    if (selectedMessage) {
      setReplyTo(selectedMessage);
      setSelectedMessage(null);
    }
  }, [selectedMessage]);

  const handleCopy = useCallback(() => {
    if (selectedMessage?.content) {
      Clipboard.setStringAsync(selectedMessage.content);
      Toast.show({ type: "success", text1: t("chat.messageCopied") });
    }
    setSelectedMessage(null);
  }, [selectedMessage, t]);

  const handleForward = useCallback(() => {
    if (selectedMessage) {
      messageToForward.current = selectedMessage;
      setSelectedMessage(null);
      setShowForwardPicker(true);
    }
  }, [selectedMessage]);

  const handleForwardToFriend = useCallback(
    (friendId: string) => {
      if (messageToForward.current) {
        forwardMessage.mutate({
          message: messageToForward.current,
          friendId,
        });
        messageToForward.current = null;
      }
      setShowForwardPicker(false);
    },
    [forwardMessage],
  );

  const handleDelete = useCallback(() => {
    if (!selectedMessage) return;
    const messageId = selectedMessage.id;
    setSelectedMessage(null);
    Alert.alert(t("chat.deleteConfirmTitle"), t("chat.deleteConfirmMessage"), [
      { text: t("chat.cancel"), style: "cancel" },
      {
        text: t("chat.delete"),
        style: "destructive",
        onPress: () => deleteMessageMutation.mutate(messageId),
      },
    ]);
  }, [selectedMessage, deleteMessageMutation, t]);

  const handleReaction = useCallback(
    (emoji: string) => {
      if (selectedMessage) {
        toggleReaction.mutate({
          messageId: selectedMessage.id,
          emoji,
        });
        setSelectedMessage(null);
      }
    },
    [selectedMessage, toggleReaction],
  );

  const handleToggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      toggleReaction.mutate({ messageId, emoji });
    },
    [toggleReaction],
  );

  const handleReplyPress = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setHighlightedMessageId(messageId);
        setTimeout(() => setHighlightedMessageId(null), 1500);
      }
    },
    [messages],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isOwn = item.sender_id === currentUserId;
      const olderMessage = messages[index + 1];
      const showTimestamp = shouldShowTimestamp(item, olderMessage);
      const showDateSeparator = shouldShowDateSeparator(item, olderMessage);
      const isThisSelected = selectedMessage?.id === item.id;
      const isRead =
        isOwn && otherLastRead
          ? new Date(item.created_at) <= new Date(otherLastRead)
          : false;

      return (
        <View>
          {showDateSeparator && <DateSeparator dateString={item.created_at} />}
          <ChatBubble
            message={item}
            isOwn={isOwn}
            showTimestamp={showTimestamp}
            isSelected={isThisSelected}
            onLongPress={handleLongPress}
            onDismiss={selectedMessage ? handleDismissToolbar : undefined}
            onReplyPress={handleReplyPress}
            onToggleReaction={handleToggleReaction}
            onReply={isThisSelected ? handleReply : undefined}
            onCopy={isThisSelected ? handleCopy : undefined}
            onForward={isThisSelected ? handleForward : undefined}
            onDelete={isThisSelected ? handleDelete : undefined}
            onToolbarReaction={isThisSelected ? handleReaction : undefined}
            isHighlighted={item.id === highlightedMessageId}
            isRead={isRead}
          />
        </View>
      );
    },
    [
      currentUserId,
      messages,
      selectedMessage,
      otherLastRead,
      handleLongPress,
      handleDismissToolbar,
      handleReplyPress,
      handleToggleReaction,
      handleReply,
      handleCopy,
      handleForward,
      handleDelete,
      handleReaction,
      highlightedMessageId,
    ],
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
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-slate-700">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft color="#f3f4f6" size={24} />
        </Pressable>
        <Image
          source={imageSource}
          className="w-9 h-9 rounded-full"
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
            onScrollBeginDrag={handleDismissToolbar}
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

        {/* Typing indicator */}
        <TypingIndicator visible={isOtherTyping} />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onSendMedia={handleSendMedia}
          disabled={!isActive}
          disabledMessage={!isActive ? t("chat.inactive") : undefined}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTyping={sendTyping}
        />
      </KeyboardAvoidingView>


      {/* Forward friend picker */}
      <FriendPickerSheet
        visible={showForwardPicker}
        onClose={() => setShowForwardPicker(false)}
        onSelectFriend={handleForwardToFriend}
      />
    </LinearGradient>
  );
}
