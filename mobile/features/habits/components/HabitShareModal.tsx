import { useCallback, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import HabitShareCard from "@/features/habits/components/HabitShareCard";
import useShareCard from "@/lib/hooks/useShareCard";
import { HabitStats } from "@/types/habit";
import { Download, Share2 } from "lucide-react-native";
import ToastMessage from "react-native-toast-message";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { toastConfig } from "@/lib/config/toast";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import { getTheme, SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";

type HabitShareModalProps = {
  visible: boolean;
  onClose: () => void;
  habitName: string;
  stats: HabitStats;
};

export default function HabitShareModal({
  visible,
  onClose,
  habitName,
  stats,
}: HabitShareModalProps) {
  const { t } = useTranslation("habits");
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("habit-");
  const { theme: themeId, size, setTheme, setSize } =
    useShareCardPreferences();
  const insets = useSafeAreaInsets();

  const theme = useMemo(() => getTheme(themeId), [themeId]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const dims = SHARE_CARD_DIMENSIONS[size];

  const previewAreaHeight = useMemo(
    () => containerHeight * 0.4,
    [containerHeight],
  );

  const shareCardScale = useMemo(() => {
    if (containerWidth === 0 || previewAreaHeight === 0) return 0.3;
    const scaleX = (containerWidth - 40) / dims.width;
    const scaleY = previewAreaHeight / dims.height;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, previewAreaHeight, dims.width, dims.height]);

  const containerStyle = useMemo(
    () => ({
      width: dims.width * shareCardScale,
      height: dims.height * shareCardScale,
      overflow: "hidden" as const,
    }),
    [dims.width, dims.height, shareCardScale],
  );

  const transformStyle = useMemo(
    () => ({
      transform: [{ scale: shareCardScale }],
      transformOrigin: "top left" as const,
    }),
    [shareCardScale],
  );

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard(size);
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("share.shareError"),
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-black/95 px-5 justify-between"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        onLayout={onLayout}
      >
        {containerHeight === 0 ? null : (
          <>
            {/* Top section: preview + picker */}
            <View>
              <View
                className="items-center justify-center"
                style={{ height: previewAreaHeight }}
              >
                <View style={containerStyle}>
                  <View style={transformStyle}>
                    <HabitShareCard
                      ref={cardRef}
                      habitName={habitName}
                      stats={stats}
                      theme={theme}
                      size={size}
                    />
                  </View>
                </View>
              </View>

              <View className="mt-4">
                <ShareCardPicker
                  selectedSize={size}
                  onSizeChange={setSize}
                  selectedTheme={themeId}
                  onThemeChange={setTheme}
                />
              </View>
            </View>

            {/* Bottom buttons */}
            <View className="w-full gap-3">
              <View className="flex-row gap-3">
                <AnimatedButton
                  onPress={async () => {
                    const success = await saveCardToGallery(size);
                    Toast.show({
                      type: success ? "success" : "error",
                      text1: success
                        ? t("share.saveSuccess")
                        : t("common:common.error"),
                      text2: success ? undefined : t("share.saveError"),
                      topOffset: 60,
                    });
                  }}
                  className="flex-1 btn-neutral flex-row items-center justify-center gap-2"
                  disabled={isSaving || isSharing}
                >
                  <Download color="#f3f4f6" size={18} />
                  <AppText
                    className="text-base text-center"
                    numberOfLines={1}
                  >
                    {isSaving ? t("share.saving") : t("share.save")}
                  </AppText>
                </AnimatedButton>
                <AnimatedButton
                  onPress={handleShare}
                  className="flex-1 btn-base flex-row items-center justify-center gap-2"
                  disabled={isSharing || isSaving}
                >
                  <Share2 color="#f3f4f6" size={18} />
                  <AppText
                    className="text-base text-center"
                    numberOfLines={1}
                  >
                    {isSharing ? t("share.sharing") : t("share.share")}
                  </AppText>
                </AnimatedButton>
              </View>
              <AnimatedButton
                onPress={onClose}
                className="btn-neutral items-center justify-center"
              >
                <AppText className="text-base text-center">
                  {t("share.close")}
                </AppText>
              </AnimatedButton>
            </View>
          </>
        )}
      </View>
      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
