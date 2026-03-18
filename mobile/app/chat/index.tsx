import { useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import FloatingActionButton from "@/components/buttons/FloatingActionButton";
import PageContainer from "@/components/PageContainer";
import ConversationItem from "@/features/chat/components/ConversationItem";
import FriendPickerSheet from "@/features/chat/components/FriendPickerSheet";
import useConversations from "@/features/chat/hooks/useConversations";
import { getOrCreateDm } from "@/database/chat/get-or-create-dm";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { Conversation } from "@/types/chat";
import { MessageSquarePlus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
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
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
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
      <FloatingActionButton onPress={() => setShowFriendPicker(true)} disabled={isCreating}>
        {isCreating ? (
          <ActivityIndicator size={20} color="#06b6d4" />
        ) : (
          <MessageSquarePlus size={26} color="#06b6d4" />
        )}
      </FloatingActionButton>

      <FriendPickerSheet
        visible={showFriendPicker}
        onClose={() => setShowFriendPicker(false)}
        onSelectFriend={handleSelectFriend}
      />
    </LinearGradient>
  );
}
