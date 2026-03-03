import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigation } from "expo-router";
import { View, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import { Image } from "expo-image";
import LinkButton from "@/components/buttons/LinkButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import ShareCard from "@/features/gym/components/ShareCard";
import useShareCard from "@/features/gym/hooks/useShareCard";
import { useSessionSummaryStore } from "@/lib/stores/sessionSummaryStore";
import { Share2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Toast } from "react-native-toast-message/lib/src/Toast";

export default function TrainingFinishedScreen() {
  const { t } = useTranslation("gym");
  const summary = useSessionSummaryStore((state) => state.summary);
  const clearSummary = useSessionSummaryStore((state) => state.clearSummary);
  const { cardRef, isSharing, shareCard } = useShareCard();
  const [cardScale, setCardScale] = useState(0.3);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width;
    const scale = (containerWidth - 40) / 1080;
    setCardScale(Math.min(scale, 0.4));
  }, []);

  const cardContainerStyle = useMemo(
    () => ({
      width: 1080 * cardScale,
      height: 1080 * cardScale,
      overflow: "hidden" as const,
    }),
    [cardScale],
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
    <View className="flex-1 px-5" onLayout={onContainerLayout}>
      {/* Header */}
      <View className="flex-row gap-5 items-center justify-center mt-10">
        <AppText className="text-2xl">{t("gym.share.workoutFinished")}</AppText>
        <Image
          source={require("@/assets/images/confetti.png")}
          className="w-10 h-10"
        />
      </View>

      {/* Share Card Preview - centered */}
      <View className="flex-1 items-center justify-center">
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
              />
            </View>
          </View>
        )}
      </View>

      {/* Bottom buttons */}
      <View className="w-full gap-4 pb-10">
        {summary && (
          <AnimatedButton
            onPress={async () => {
              console.log("Share button pressed");
              const success = await shareCard();
              console.log("Share result:", success);
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
