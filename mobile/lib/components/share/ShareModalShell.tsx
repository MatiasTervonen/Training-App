import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { View, LayoutChangeEvent, FlatList, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import FullScreenModal from "@/components/FullScreenModal";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import ShareTypePicker from "@/lib/components/share/ShareTypePicker";
import useShareCard from "@/lib/hooks/useShareCard";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import { getTheme, SHARE_CARD_DIMENSIONS, ShareCardTheme, ShareCardSize, ShareCardThemeId } from "@/lib/share/themes";
import { Download, Share2, MessageCircle, ChevronLeft } from "lucide-react-native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import * as Haptics from "expo-haptics";
import { RefObject } from "react";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { sendShareCardToChat } from "@/database/chat/send-share-card";
import { sendSessionShareToChat } from "@/database/chat/send-session-share";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Friends } from "@/types/models";
import { SessionShareContent } from "@/types/chat";

export type ShareModalShellRenderCardProps = {
  cardRef: RefObject<View | null>;
  theme: ShareCardTheme;
  size: ShareCardSize;
  themeId: ShareCardThemeId;
};

type ShareModalShellProps = {
  visible: boolean;
  onClose: () => void;
  prefix: string;
  renderCard: (props: ShareModalShellRenderCardProps) => ReactNode;
  middleContent?: (props: { themeId: ShareCardThemeId; size: ShareCardSize }) => ReactNode;
  scrollable?: boolean;
  extraDisabled?: boolean;
  shareCardPickerProps?: {
    showGradient?: boolean;
    onShowGradientChange?: (value: boolean) => void;
  };
  labels: {
    save: string;
    saving: string;
    share: string;
    sharing: string;
    close: string;
    saveSuccess: string;
    saveError: string;
    shareError: string;
    error: string;
  };
  outsideContent?: ReactNode;
  sessionData?: SessionShareContent | null;
};

type ShareMode = "image" | "session";

export default function ShareModalShell({
  visible,
  onClose,
  prefix,
  renderCard,
  middleContent,
  scrollable = false,
  extraDisabled = false,
  shareCardPickerProps,
  labels,
  outsideContent,
  sessionData = null,
}: ShareModalShellProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery, captureCard } =
    useShareCard(prefix);
  const queryClient = useQueryClient();
  const { t } = useTranslation("chat");

  const [showShareTypePicker, setShowShareTypePicker] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("image");
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const { data: friends } = useFriends();

  const {
    theme: themeId,
    size,
    setTheme,
    setSize,
  } = useShareCardPreferences();

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const dims = useMemo(() => SHARE_CARD_DIMENSIONS[size], [size]);

  useEffect(() => {
    if (visible) {
      setShowShareTypePicker(false);
      setShowFriendPicker(false);
      setCapturedUri(null);
      setShareMode("image");
    }
  }, [visible]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const previewAreaHeight = useMemo(
    () => containerHeight * 0.4,
    [containerHeight],
  );

  const shareCardScale = useMemo(() => {
    if (containerWidth === 0 || previewAreaHeight === 0) return 0.3;
    const scaleX = (containerWidth - 40) / dims.width;
    const scaleY = previewAreaHeight / dims.height;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, previewAreaHeight, dims]);

  const cardContainerStyle = useMemo(
    () => ({
      width: dims.width * shareCardScale,
      height: dims.height * shareCardScale,
      overflow: "hidden" as const,
    }),
    [dims, shareCardScale],
  );

  const transformStyle = useMemo(
    () => ({
      transform: [{ scale: shareCardScale }],
      transformOrigin: "top left" as const,
    }),
    [shareCardScale],
  );

  const disabled = isSaving || isSharing || isSendingToChat || extraDisabled;

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard(size);
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: labels.error,
        text2: labels.shareError,
      });
    }
  }, [shareCard, size, onClose, labels]);

  const handleSave = useCallback(async () => {
    const success = await saveCardToGallery(size);
    Toast.show({
      type: success ? "success" : "error",
      text1: success ? labels.saveSuccess : labels.error,
      text2: success ? undefined : labels.saveError,
      topOffset: 60,
    });
  }, [saveCardToGallery, size, labels]);

  const handleSendToChat = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sessionData) {
      const uri = await captureCard(size);
      if (!uri) {
        Toast.show({ type: "error", text1: labels.error, topOffset: 60 });
        return;
      }
      setCapturedUri(uri);
      setShowShareTypePicker(true);
    } else {
      const uri = await captureCard(size);
      if (!uri) {
        Toast.show({ type: "error", text1: labels.error, topOffset: 60 });
        return;
      }
      setCapturedUri(uri);
      setShareMode("image");
      setShowFriendPicker(true);
    }
  }, [captureCard, size, labels, sessionData]);

  const handleSelectShareType = useCallback((mode: ShareMode) => {
    setShareMode(mode);
    setShowShareTypePicker(false);
    setShowFriendPicker(true);
  }, []);

  const handleSelectFriend = useCallback(
    async (friendId: string) => {
      setIsSendingToChat(true);
      try {
        if (shareMode === "session" && sessionData) {
          await sendSessionShareToChat(friendId, sessionData);
          Toast.show({
            type: "success",
            text1: t("chat.sessionShared"),
            topOffset: 60,
          });
        } else {
          if (!capturedUri) return;
          await sendShareCardToChat(capturedUri, friendId);
          Toast.show({
            type: "success",
            text1: t("chat.shareCardSent"),
            topOffset: 60,
          });
        }
        setShowFriendPicker(false);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      } catch (err) {
        console.error("[ShareModalShell] sendToChat failed:", err);
        Toast.show({
          type: "error",
          text1: t("chat.messageSendError"),
          topOffset: 60,
        });
      } finally {
        setIsSendingToChat(false);
      }
    },
    [shareMode, sessionData, capturedUri, t, queryClient],
  );

  const renderFriendItem = useCallback(
    ({ item }: { item: Friends }) => {
      const imageSource = item.user.profile_picture
        ? { uri: item.user.profile_picture }
        : require("@/assets/images/default-avatar.png");

      return (
        <AnimatedButton
          onPress={() => handleSelectFriend(item.user.id)}
          className="flex-row items-center gap-3 px-4 py-3"
          disabled={isSendingToChat}
        >
          <Image
            source={imageSource}
            className="w-10 h-10 rounded-full"
          />
          <AppText className="text-base flex-1">{item.user.display_name}</AppText>
        </AnimatedButton>
      );
    },
    [handleSelectFriend, isSendingToChat],
  );

  const buttons = (
    <View className="w-full gap-3 mt-8">
      <View className="flex-row gap-3">
        <AnimatedButton
          onPress={handleSave}
          className="flex-1 btn-save flex-row items-center justify-center gap-2"
          disabled={disabled}
        >
          <Download color="#f3f4f6" size={18} />
          <AppText className="text-base text-center" numberOfLines={1}>
            {isSaving ? labels.saving : labels.save}
          </AppText>
        </AnimatedButton>
        <AnimatedButton
          onPress={handleShare}
          className="flex-1 btn-add flex-row items-center justify-center gap-2"
          disabled={disabled}
        >
          <Share2 color="#f3f4f6" size={18} />
          <AppText className="text-base text-center" numberOfLines={1}>
            {isSharing ? labels.sharing : labels.share}
          </AppText>
        </AnimatedButton>
      </View>
      <AnimatedButton
        onPress={handleSendToChat}
        className="btn-base flex-row items-center justify-center gap-2"
        disabled={disabled}
      >
        <MessageCircle color="#f3f4f6" size={18} />
        <AppText className="text-base text-center" numberOfLines={1}>
          {t("chat.sendToChat")}
        </AppText>
      </AnimatedButton>
      <AnimatedButton
        onPress={onClose}
        className="btn-neutral items-center justify-center"
      >
        <AppText className="text-base text-center">
          {labels.close}
        </AppText>
      </AnimatedButton>
    </View>
  );

  const currentStep = showFriendPicker
    ? "friends"
    : showShareTypePicker
      ? "shareType"
      : "main";

  return (
    <>
    <FullScreenModal isOpen={visible} onClose={onClose} scrollable={currentStep === "main"} bgClassName="bg-slate-950">
      <View className="flex-1 px-3 pt-1 pb-4" onLayout={onLayout}>
        {containerHeight === 0 ? null : currentStep === "friends" ? (
          <View className="flex-1">
            <View className="flex-row items-center mb-4">
              <AnimatedButton
                onPress={() => {
                  setShowFriendPicker(false);
                  if (sessionData) setShowShareTypePicker(true);
                }}
                className="p-1"
                disabled={isSendingToChat}
              >
                <ChevronLeft color="#f3f4f6" size={24} />
              </AnimatedButton>
              <AppText className="text-lg flex-1 text-center mr-8">
                {t("chat.selectFriend")}
              </AppText>
            </View>

            {isSendingToChat ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#22d3ee" />
                <BodyTextNC className="text-slate-400 mt-3">
                  {t("chat.sendingToChat")}
                </BodyTextNC>
              </View>
            ) : (
              <FlatList
                data={friends ?? []}
                keyExtractor={(item: Friends) => item.id}
                renderItem={renderFriendItem}
                ListEmptyComponent={
                  <View className="items-center py-10">
                    <BodyTextNC className="text-slate-400">
                      {t("chat.noFriends")}
                    </BodyTextNC>
                  </View>
                }
              />
            )}
          </View>
        ) : currentStep === "shareType" ? (
          <ShareTypePicker
            onSelectImage={() => handleSelectShareType("image")}
            onSelectSession={() => handleSelectShareType("session")}
          />
        ) : (
          <View>
            <View
              className="items-center justify-center"
              style={{ height: previewAreaHeight }}
            >
              <View style={cardContainerStyle}>
                <View style={transformStyle}>
                  {renderCard({ cardRef, theme, size, themeId })}
                </View>
              </View>
            </View>

            {middleContent?.({ themeId, size })}
            <View className="mt-4">
              <ShareCardPicker
                selectedSize={size}
                onSizeChange={setSize}
                selectedTheme={themeId}
                onThemeChange={setTheme}
                {...shareCardPickerProps}
              />
            </View>
            {buttons}
          </View>
        )}
      </View>

    </FullScreenModal>

    {visible && outsideContent}
    </>
  );
}
