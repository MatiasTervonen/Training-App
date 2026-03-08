import { useCallback, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ShareCard from "@/features/gym/components/ShareCard";
import useShareCard from "@/lib/hooks/useShareCard";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import { ExerciseEntry } from "@/types/session";
import { Download, Share2 } from "lucide-react-native";
import ToastMessage from "react-native-toast-message";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { toastConfig } from "@/lib/config/toast";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
  gymSession: FullGymSession;
  weightUnit: string;
};

export default function ShareModal({
  visible,
  onClose,
  gymSession,
  weightUnit,
}: ShareModalProps) {
  const { t } = useTranslation("gym");
  const [shareCardScale, setShareCardScale] = useState(0.3);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("gym-");

  const shareExercises = useMemo<ExerciseEntry[]>(() => {
    return (gymSession.gym_session_exercises || []).map((ex) => ({
      exercise_id: ex.gym_exercises?.id ?? "",
      name: ex.gym_exercises?.name ?? "",
      equipment: ex.gym_exercises?.equipment ?? "",
      main_group: ex.gym_exercises?.main_group,
      muscle_group: ex.gym_exercises?.muscle_group,
      superset_id: ex.superset_id,
      notes: ex.notes,
      sets: (ex.gym_sets ?? []).map((s) => ({
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        time_min: s.time_min,
        distance_meters: s.distance_meters,
      })),
    }));
  }, [gymSession.gym_session_exercises]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width;
    const scale = (containerWidth - 40) / 1080;
    setShareCardScale(Math.min(scale, 0.4));
  }, []);

  const containerStyle = useMemo(
    () => ({
      width: 1080 * shareCardScale,
      height: 1080 * shareCardScale,
      overflow: "hidden" as const,
    }),
    [shareCardScale],
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
    const success = await shareCard();
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("gym.share.shareError"),
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
        className="flex-1 bg-black/80 justify-center items-center px-5"
        onLayout={onLayout}
      >
        <View className="w-full items-center">
          <View style={containerStyle}>
            <View style={transformStyle}>
              <ShareCard
                ref={cardRef}
                title={gymSession.title}
                date={gymSession.created_at}
                duration={gymSession.duration}
                exercises={shareExercises}
                weightUnit={weightUnit}
              />
            </View>
          </View>

          <View className="mt-6 w-full gap-3">
            <View className="flex-row gap-3">
              <AnimatedButton
                onPress={async () => {
                  const success = await saveCardToGallery();
                  Toast.show({
                    type: success ? "success" : "error",
                    text1: success
                      ? t("gym.share.saveSuccess")
                      : t("common:common.error"),
                    text2: success
                      ? undefined
                      : t("gym.share.saveError"),
                    topOffset: 60,
                  });
                }}
                className="flex-1 btn-neutral flex-row items-center justify-center gap-2"
                disabled={isSaving || isSharing}
              >
                <Download color="#f3f4f6" size={18} />
                <AppText className="text-base text-center" numberOfLines={1}>
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
                <Share2 color="#f3f4f6" size={18} />
                <AppText className="text-base text-center" numberOfLines={1}>
                  {isSharing ? t("gym.share.sharing") : t("gym.share.share")}
                </AppText>
              </AnimatedButton>
            </View>
            <AnimatedButton
              onPress={onClose}
              className="btn-neutral items-center justify-center"
            >
              <AppText className="text-base text-center">
                {t("gym.share.close")}
              </AppText>
            </AnimatedButton>
          </View>
        </View>
      </View>
      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
