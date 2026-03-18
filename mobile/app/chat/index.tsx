import { useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import PageContainer from "@/components/PageContainer";
import ConversationItem from "@/features/chat/components/ConversationItem";
import FriendPickerSheet from "@/features/chat/components/FriendPickerSheet";
import useConversations from "@/features/chat/hooks/useConversations";
import { getOrCreateDm } from "@/database/chat/get-or-create-dm";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { Conversation } from "@/types/chat";
import { MessageSquarePlus } from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function ChatListScreen() {
  const { t } = useTranslation("chat");
  const router = useRouter();
  const { data: conversations, isLoading, refetch } = useConversations();
  const { data: friends } = useFriends();
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleConversationPress = useCallback(
    (conversationId: string, name?: string, avatar?: string | null) => {
      router.push({
        pathname: `/chat/${conversationId}` as never,
        params: { name: name ?? "", avatar: avatar ?? "" },
      });
    },
    [router],
  );

  const handleSelectFriend = useCallback(
    async (friendUserId: string) => {
      setShowFriendPicker(false);
      setIsCreating(true);
      try {
        const conversationId = await getOrCreateDm(friendUserId);
        const friend = friends?.find((f) => f.user.id === friendUserId);
        router.push({
          pathname: `/chat/${conversationId}` as never,
          params: {
            name: friend?.user.display_name ?? "",
            avatar: friend?.user.profile_picture ?? "",
          },
        });
      } catch {
        Toast.show({ type: "error", text1: t("chat.messageSendError") });
      } finally {
        setIsCreating(false);
      }
    },
    [router, t, friends],
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationItem
        conversation={item}
        onPress={handleConversationPress}
      />
    ),
    [handleConversationPress],
  );

  if (isLoading) {
    return (
      <PageContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </PageContainer>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <View className="px-4 pt-5 pb-3">
        <AppText className="text-2xl">{t("chat.title")}</AppText>
      </View>

      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.conversation_id}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={
          !conversations?.length ? { flex: 1 } : undefined
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-4">
            <AppText className="text-lg text-slate-400 mb-2">
              {t("chat.noConversations")}
            </AppText>
            <BodyText className="text-slate-500 text-center">
              {t("chat.startChat")}
            </BodyText>
          </View>
        }
      />

      {/* Floating new chat button */}
      <View className="absolute bottom-8 right-6 z-50">
        <View className="absolute -inset-1 rounded-full bg-cyan-400/30" />
        <View className="absolute -inset-3 rounded-full bg-cyan-400/15" />
        <AnimatedButton
          onPress={() => setShowFriendPicker(true)}
          className="w-14 h-14 rounded-full items-center justify-center shadow-xl bg-slate-800 border-2 border-cyan-300 shadow-cyan-400/60"
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size={20} color="#67e8f9" />
          ) : (
            <MessageSquarePlus size={26} color="#67e8f9" />
          )}
        </AnimatedButton>
      </View>

      <FriendPickerSheet
        visible={showFriendPicker}
        onClose={() => setShowFriendPicker(false)}
        onSelectFriend={handleSelectFriend}
      />
    </View>
  );
}
