import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigation } from "expo-router";
import { View, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import { Image } from "expo-image";
import LinkButton from "@/components/buttons/LinkButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import ShareCard from "@/features/gym/components/ShareCard";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import useShareCard from "@/lib/hooks/useShareCard";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import { getTheme, SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";
import { useSessionSummaryStore } from "@/lib/stores/sessionSummaryStore";
import { Share2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Toast } from "react-native-toast-message/lib/src/Toast";

export default function TrainingFinishedScreen() {
  const { t } = useTranslation("gym");
  const summary = useSessionSummaryStore((state) => state.summary);
  const clearSummary = useSessionSummaryStore((state) => state.clearSummary);
  const { cardRef, isSharing, shareCard } = useShareCard();
  const { theme: themeId, size, setTheme, setSize } = useShareCardPreferences();
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

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

  return (
    <View className="flex-1 px-5 justify-between" onLayout={onContainerLayout}>
      {/* Top section: header + preview + picker */}
      <View>
        {/* Header */}
        <View className="flex-row gap-5 items-center justify-center mt-10">
          <AppText className="text-2xl">{t("gym.share.workoutFinished")}</AppText>
          <Image
            source={require("@/assets/images/confetti.png")}
            className="w-10 h-10"
          />
        </View>

        {/* Share Card Preview - fixed height */}
        <View
          className="items-center justify-center mt-4"
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

        {/* Theme/Size Picker */}
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
      <View className="w-full gap-4 pb-10">
        {summary && (
          <AnimatedButton
            onPress={async () => {
              const success = await shareCard(size);
              if (!success) {
                Toast.show({
                  type: "error",
                  text1: t("common:common.error"),
                  text2: t("gym.share.shareError"),
                });
              }
            }}
            className="btn-base flex-row items-center justify-center gap-2"
            disabled={isSharing}
          >
            <Share2 color="#f3f4f6" size={20} />
            <AppText className="text-base text-center">
              {isSharing ? t("gym.share.sharing") : t("gym.share.shareWorkout")}
            </AppText>
          </AnimatedButton>
        )}
        <LinkButton href="/dashboard">
          <AppText className="text-center">{t("gym.share.done")}</AppText>
        </LinkButton>
      </View>
    </View>
  );
}
