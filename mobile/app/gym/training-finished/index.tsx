import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigation, useRouter } from "expo-router";
import { View, ScrollView, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import { Image } from "expo-image";
import AnimatedButton from "@/components/buttons/animatedButton";
import ShareCard from "@/features/gym/components/ShareCard";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import useShareCard from "@/lib/hooks/useShareCard";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import { getTheme, SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";
import { useSessionSummaryStore } from "@/lib/stores/sessionSummaryStore";
import { Download, Share2, MessageCircle, ChevronDown, ChevronUp, ChevronLeft, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import * as Haptics from "expo-haptics";
import Toggle from "@/components/toggle";
import { updateFeedItemVisibility } from "@/database/social-feed/update-visibility";
import { useQueryClient } from "@tanstack/react-query";
import BodyTextNC from "@/components/BodyTextNC";
import ShareTypePicker from "@/lib/components/share/ShareTypePicker";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { sendShareCardToChat } from "@/database/chat/send-share-card";
import { sendSessionShareToChat } from "@/database/chat/send-session-share";
import { SessionShareContent } from "@/types/chat";
import { Image as ExpoImage } from "expo-image";
import { FlatList, ActivityIndicator } from "react-native";
import { Friends } from "@/types/models";

export default function TrainingFinishedScreen() {
  const { t } = useTranslation("gym");
  const summary = useSessionSummaryStore((state) => state.summary);
  const clearSummary = useSessionSummaryStore((state) => state.clearSummary);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard();
  const { theme: themeId, size, setTheme, setSize } = useShareCardPreferences();
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [sharedWithFriends, setSharedWithFriends] = useState(false);
  const [showShareTypePicker, setShowShareTypePicker] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [shareMode, setShareMode] = useState<"image" | "session">("image");
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const { data: friends } = useFriends();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tChat } = useTranslation("chat");

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const dims = SHARE_CARD_DIMENSIONS[size];

  const previewAreaHeight = useMemo(
    () => containerHeight * 0.4,
    [containerHeight],
  );

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const cardScale = useMemo(() => {
    if (containerWidth === 0 || previewAreaHeight === 0) return 0.3;
    const scaleX = (containerWidth - 40) / dims.width;
    const scaleY = previewAreaHeight / dims.height;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, previewAreaHeight, dims.width, dims.height]);

  const cardContainerStyle = useMemo(
    () => ({
      width: dims.width * cardScale,
      height: dims.height * cardScale,
      overflow: "hidden" as const,
    }),
    [dims.width, dims.height, cardScale],
  );

  const cardTransformStyle = useMemo(
    () => ({
      transform: [{ scale: cardScale }],
      transformOrigin: "top left" as const,
    }),
    [cardScale],
  );

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      clearSummary();
    });
    return unsubscribe;
  }, [navigation, clearSummary]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard(size);
    if (!success) {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("gym.share.shareError"),
      });
    }
  }, [shareCard, size, t]);

  const handleSave = useCallback(async () => {
    const success = await saveCardToGallery(size);
    Toast.show({
      type: success ? "success" : "error",
      text1: success
        ? t("gym.share.saveSuccess")
        : t("common:common.error"),
      text2: success ? undefined : t("gym.share.saveError"),
    });
  }, [saveCardToGallery, size, t]);

  const handleToggleShareWithFriends = useCallback(async () => {
    if (!summary?.sessionId) return;
    const newValue = !sharedWithFriends;
    setSharedWithFriends(newValue);
    try {
      await updateFeedItemVisibility(
        summary.sessionId,
        "gym_sessions",
        newValue ? "friends" : "private",
      );
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    } catch {
      setSharedWithFriends(!newValue);
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
      });
    }
  }, [summary?.sessionId, sharedWithFriends, queryClient, t]);

  const sessionData = useMemo<SessionShareContent | null>(() => {
    if (!summary) return null;
    const totalSets = summary.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalVolume = summary.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
      0,
    );
    return {
      session_type: "gym_sessions",
      source_id: summary.sessionId ?? "",
      title: summary.title,
      stats: {
        duration: summary.duration,
        exercises_count: summary.exercises.length,
        sets_count: totalSets,
        total_volume: totalVolume,
      },
    };
  }, [summary]);

  const handleSendToChat = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowShareTypePicker(true);
  }, []);

  const handleSelectShareType = useCallback((mode: "image" | "session") => {
    setShareMode(mode);
    setShowShareTypePicker(false);
    setShowFriendPicker(true);
  }, []);

  const handleSelectFriend = useCallback(async (friendId: string) => {
    setIsSendingToChat(true);
    try {
      if (shareMode === "session" && sessionData) {
        await sendSessionShareToChat(friendId, sessionData);
        Toast.show({ type: "success", text1: tChat("chat.sessionShared") });
      } else {
        const uri = await saveCardToGallery(size);
        if (!uri) throw new Error("Failed to capture");
        await sendShareCardToChat(String(uri), friendId);
        Toast.show({ type: "success", text1: tChat("chat.shareCardSent") });
      }
      setShowFriendPicker(false);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } catch {
      Toast.show({ type: "error", text1: tChat("chat.messageSendError") });
    } finally {
      setIsSendingToChat(false);
    }
  }, [shareMode, sessionData, saveCardToGallery, size, tChat, queryClient]);

  if (showShareTypePicker) {
    return (
      <View className="flex-1 px-5 pt-16">
        <ShareTypePicker
          onSelectImage={() => handleSelectShareType("image")}
          onSelectSession={() => handleSelectShareType("session")}
          onBack={() => setShowShareTypePicker(false)}
        />
      </View>
    );
  }

  if (showFriendPicker) {
    return (
      <View className="flex-1 px-5 pt-16">
        <View className="flex-row items-center mb-4">
          <AnimatedButton
            onPress={() => { setShowFriendPicker(false); setShowShareTypePicker(true); }}
            className="p-1"
            disabled={isSendingToChat}
          >
            <ChevronLeft color="#f3f4f6" size={24} />
          </AnimatedButton>
          <AppText className="text-lg flex-1 text-center mr-8">
            {tChat("chat.selectFriend")}
          </AppText>
        </View>
        {isSendingToChat ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22d3ee" />
            <BodyTextNC className="text-slate-400 mt-3">{tChat("chat.sendingToChat")}</BodyTextNC>
          </View>
        ) : (
          <FlatList
            data={friends ?? []}
            keyExtractor={(item: Friends) => item.id}
            renderItem={({ item }: { item: Friends }) => (
              <AnimatedButton
                onPress={() => handleSelectFriend(item.user.id)}
                className="flex-row items-center gap-3 px-4 py-3"
                disabled={isSendingToChat}
              >
                <ExpoImage
                  source={item.user.profile_picture ? { uri: item.user.profile_picture } : require("@/assets/images/default-avatar.png")}
                  className="w-10 h-10 rounded-full"
                />
                <AppText className="text-base flex-1">{item.user.display_name}</AppText>
              </AnimatedButton>
            )}
            ListEmptyComponent={
              <View className="items-center py-10">
                <BodyTextNC className="text-slate-400">{tChat("chat.noFriends")}</BodyTextNC>
              </View>
            }
          />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1" onLayout={onContainerLayout}>
    <ScrollView
      className="flex-1 px-5"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="items-center mt-10 gap-2">
        <View className="flex-row gap-5 items-center">
          <AppText className="text-2xl">{t("gym.share.workoutFinished")}</AppText>
          <Image
            source={require("@/assets/images/confetti.png")}
            className="w-10 h-10"
          />
        </View>
        <BodyTextNC className="text-sm text-gray-400">
          {t("gym.share.subtitle")}
        </BodyTextNC>
      </View>

      {/* Share Card Preview - fixed height */}
      <View
        className="items-center justify-center mt-5"
        style={{ height: previewAreaHeight }}
      >
        {summary && (
          <View style={cardContainerStyle}>
            <View style={cardTransformStyle}>
              <ShareCard
                ref={cardRef}
                title={summary.title}
                date={summary.date}
                duration={summary.duration}
                exercises={summary.exercises}
                weightUnit={summary.weightUnit}
                theme={theme}
                size={size}
              />
            </View>
          </View>
        )}
      </View>

      {/* Share / Save buttons */}
      {summary && (
        <View className="mt-6 gap-4">
          <View className="flex-row gap-4">
            <AnimatedButton
              onPress={handleSave}
              className="flex-1 btn-neutral flex-row items-center justify-center gap-2"
              disabled={isSaving || isSharing}
            >
              <Download color="#f3f4f6" size={20} />
              <AppText className="text-base text-center">
                {isSaving
                  ? t("gym.share.saving")
                  : t("gym.share.save")}
              </AppText>
            </AnimatedButton>
            <AnimatedButton
              onPress={handleShare}
              className="flex-1 btn-base flex-row items-center justify-center gap-2"
              disabled={isSharing || isSaving}
            >
              <Share2 color="#f3f4f6" size={20} />
              <AppText className="text-base text-center">
                {isSharing
                  ? t("gym.share.sharing")
                  : t("gym.share.shareWorkout")}
              </AppText>
            </AnimatedButton>
          </View>
          <AnimatedButton
            onPress={handleSendToChat}
            className="btn-neutral flex-row items-center justify-center gap-2"
            disabled={isSaving || isSharing}
          >
            <MessageCircle color="#f3f4f6" size={20} />
            <AppText className="text-base text-center">
              {tChat("chat.sendToChat")}
            </AppText>
          </AnimatedButton>
        </View>
      )}

      {/* Share with friends */}
      {summary?.sessionId && (
        <View className="mt-6 flex-row items-center justify-between py-3 border-b border-gray-700">
          <View className="flex-row items-center gap-3">
            <Users size={20} color="#67e8f9" />
            <AppText>
              {t("social:social.shareWithFriends")}
            </AppText>
          </View>
          <Toggle
            isOn={sharedWithFriends}
            onToggle={handleToggleShareWithFriends}
          />
        </View>
      )}

      {/* Collapsible Customize Card section */}
      {summary && (
        <View className="mt-6">
          <AnimatedButton
            onPress={() => setSettingsExpanded((prev) => !prev)}
            className="flex-row items-center justify-between py-3 border-b border-gray-700"
          >
            <AppText className="text-base text-gray-300">
              {t("gym.share.customizeCard")}
            </AppText>
            {settingsExpanded ? (
              <ChevronUp color="#9ca3af" size={20} />
            ) : (
              <ChevronDown color="#9ca3af" size={20} />
            )}
          </AnimatedButton>

          {settingsExpanded && (
            <View className="mt-4 pb-6">
              <ShareCardPicker
                selectedSize={size}
                onSizeChange={setSize}
                selectedTheme={themeId}
                onThemeChange={setTheme}
              />
            </View>
          )}
        </View>
      )}

    </ScrollView>
      {/* Done button */}
      <View className="px-5 pb-5 pt-3 border-t border-gray-700">
        <AnimatedButton
          className="btn-start py-3"
          onPress={() => router.replace("/dashboard")}
        >
          <AppText className="text-center">{t("gym.share.done")}</AppText>
        </AnimatedButton>
      </View>
    </View>
  );
}
