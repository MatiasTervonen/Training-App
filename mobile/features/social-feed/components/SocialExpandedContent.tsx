import { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { View, ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, FlatList, Image, ActivityIndicator } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFullScreenModalScroll } from "@/components/FullScreenModal";
import FullScreenModal from "@/components/FullScreenModal";
import { supabase } from "@/lib/supabase";
import { FeedComment, SocialFeedItem } from "@/types/social-feed";
import { SessionShareContent } from "@/types/chat";
import InlineCommentSection from "@/features/social-feed/components/InlineCommentSection";
import CommentInputBar from "@/features/social-feed/components/CommentInputBar";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import { Forward } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { sendSessionShareToChat } from "@/database/chat/send-session-share";
import { useQueryClient } from "@tanstack/react-query";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { Friends } from "@/types/models";

type ReplyState = {
  parentId: string;
  authorName: string;
} | null;

type SocialExpandedContentProps = {
  feedItemId: string;
  item: SocialFeedItem;
  scrollToComments: boolean;
  isLoadingSession: boolean;
  children: ReactNode;
};

export default function SocialExpandedContent({
  feedItemId,
  item,
  scrollToComments,
  isLoadingSession,
  children,
}: SocialExpandedContentProps) {
  const modalScroll = useFullScreenModalScroll();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyState>(null);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const commentsSectionY = useRef(0);
  const hasScrolledRef = useRef(false);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("social");
  const { t: tChat } = useTranslation("chat");
  const { data: friends } = useFriends();
  const queryClient = useQueryClient();

  const keyboardSpacerStyle = useAnimatedStyle(() => ({
    height: Math.max(0, Math.abs(keyboardHeight.value) - insets.bottom),
  }));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const handleCommentsSectionLayout = useCallback(
    (e: LayoutChangeEvent) => {
      commentsSectionY.current = e.nativeEvent.layout.y;
      // Scroll after layout is measured, only once
      if (scrollToComments && !hasScrolledRef.current && !isLoadingSession) {
        hasScrolledRef.current = true;
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    },
    [scrollToComments, isLoadingSession],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (modalScroll) {
        modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
      }
    },
    [modalScroll],
  );

  const handleReply = useCallback((comment: FeedComment) => {
    setReplyingTo({
      parentId: comment.id,
      authorName: comment.author_display_name,
    });
  }, []);

  const handleClearReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleCommentAdded = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, []);

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, []);

  const handleSelectFriend = useCallback(
    async (friendId: string) => {
      setIsSendingToChat(true);
      try {
        const extraFields = item.extra_fields as Record<string, unknown>;
        const sessionData: SessionShareContent = {
          session_type: item.type as "gym_sessions" | "activity_sessions",
          source_id: item.source_id,
          title: item.title,
          ...(item.type === "activity_sessions" && extraFields.activity_name
            ? { activity_name: extraFields.activity_name as string }
            : {}),
          stats: {
            duration: (extraFields.duration as number) ?? 0,
            ...(item.type === "gym_sessions"
              ? {
                  exercises_count: (extraFields.exercises_count as number) ?? 0,
                  sets_count: (extraFields.sets_count as number) ?? 0,
                }
              : {
                  distance_meters: (extraFields.distance as number) ?? 0,
                }),
          },
        };

        await sendSessionShareToChat(friendId, sessionData);
        Toast.show({
          type: "success",
          text1: tChat("chat.sessionShared"),
          topOffset: 60,
        });
        setShowFriendPicker(false);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      } catch {
        Toast.show({
          type: "error",
          text1: tChat("chat.messageSendError"),
          topOffset: 60,
        });
      } finally {
        setIsSendingToChat(false);
      }
    },
    [item, tChat, queryClient],
  );

  const renderFriendItem = useCallback(
    ({ item: friendItem }: { item: Friends }) => {
      const imageSource = friendItem.user.profile_picture
        ? { uri: friendItem.user.profile_picture }
        : require("@/assets/images/default-avatar.png");

      return (
        <AnimatedButton
          onPress={() => handleSelectFriend(friendItem.user.id)}
          className="flex-row items-center gap-3 px-4 py-3"
          disabled={isSendingToChat}
        >
          <Image
            source={imageSource}
            className="w-10 h-10 rounded-full"
          />
          <AppText className="text-base flex-1" numberOfLines={1}>
            {friendItem.user.display_name}
          </AppText>
        </AnimatedButton>
      );
    },
    [handleSelectFriend, isSendingToChat],
  );

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
        {!isLoadingSession && (
          <>
            <View className="border-t border-slate-700/50 px-4 py-3">
              <AnimatedButton
                onPress={() => setShowFriendPicker(true)}
                className="flex-row items-center gap-2"
              >
                <Forward size={18} color="#64748b" />
                <BodyTextNC className="text-slate-500 text-sm">
                  {t("social.shareToChat")}
                </BodyTextNC>
              </AnimatedButton>
            </View>
            <View onLayout={handleCommentsSectionLayout}>
              <InlineCommentSection
                feedItemId={feedItemId}
                currentUserId={currentUserId}
                onReply={handleReply}
              />
            </View>
          </>
        )}
        <Animated.View style={keyboardSpacerStyle} />
      </ScrollView>
      <CommentInputBar
        feedItemId={feedItemId}
        replyingTo={replyingTo}
        onClearReply={handleClearReply}
        onCommentAdded={handleCommentAdded}
        onInputFocus={handleInputFocus}
      />

      <FullScreenModal
        isOpen={showFriendPicker}
        onClose={() => setShowFriendPicker(false)}
        scrollable={false}
      >
        <View className="flex-1 px-3 pt-5">
          <AppText className="text-lg text-center mb-4">
            {tChat("chat.selectFriend")}
          </AppText>
          {isSendingToChat ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#22d3ee" />
              <BodyTextNC className="text-slate-400 mt-3">
                {tChat("chat.sendingToChat")}
              </BodyTextNC>
            </View>
          ) : (
            <FlatList
              data={friends ?? []}
              keyExtractor={(friendItem: Friends) => friendItem.id}
              showsVerticalScrollIndicator={false}
              renderItem={renderFriendItem}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <BodyTextNC className="text-slate-400">
                    {tChat("chat.noFriends")}
                  </BodyTextNC>
                </View>
              }
            />
          )}
        </View>
      </FullScreenModal>
    </View>
  );
}
