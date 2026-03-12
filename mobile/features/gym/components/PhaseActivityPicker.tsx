import { View } from "react-native";
import { useState } from "react";
import FullScreenModal from "@/components/FullScreenModal";
import ActivityDropdown from "@/features/activities/components/activityDropdown";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import { activities_with_category } from "@/types/models";
import { PhaseInputMode, PhaseType } from "@/types/session";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  phaseType: PhaseType;
  isTemplate?: boolean;
  onSelect: (
    activity: activities_with_category,
    inputMode: PhaseInputMode,
  ) => void;
  onSelectTemplate?: (activity: activities_with_category) => void;
};

export default function PhaseActivityPicker({
  isOpen,
  onClose,
  phaseType,
  isTemplate = false,
  onSelect,
  onSelectTemplate,
}: Props) {
  const { t } = useTranslation("gym");
  const { t: tActivities } = useTranslation("activities");
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category | null>(null);
  const [step, setStep] = useState<"activity" | "mode">("activity");

  const getActivityName = useCallback(
    (activity: activities_with_category) => {
      if (activity.slug) {
        const translated = tActivities(
          `activities.activityNames.${activity.slug}`,
          { defaultValue: "" },
        );
        if (
          translated &&
          translated !== `activities.activityNames.${activity.slug}`
        ) {
          return translated;
        }
      }
      return activity.name;
    },
    [tActivities],
  );

  const handleClose = () => {
    setSelectedActivity(null);
    setStep("activity");
    onClose();
  };

  const handleActivitySelect = (activity: activities_with_category) => {
    if (isTemplate) {
      onSelectTemplate?.(activity);
      handleClose();
      return;
    }
    setSelectedActivity(activity);
    setStep("mode");
  };

  const handleModeSelect = (mode: PhaseInputMode) => {
    if (selectedActivity) {
      onSelect(selectedActivity, mode);
      handleClose();
    }
  };

  const phaseLabel =
    phaseType === "warmup"
      ? t("gym.phase.warmup")
      : t("gym.phase.cooldown");

  return (
    <FullScreenModal isOpen={isOpen} onClose={handleClose}>
      {step === "activity" ? (
        <View className="flex-1">
          <AppText className="text-xl text-center mt-6 mb-2">
            {t("gym.phase.selectActivity")}
          </AppText>
          <ActivityDropdown onSelect={handleActivitySelect} />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center gap-6 px-6">
          <AppText className="text-xl text-center w-full">
            {`${phaseLabel} – ${selectedActivity ? getActivityName(selectedActivity) : ""}`}
          </AppText>
          <AnimatedButton
            onPress={() => handleModeSelect("live")}
            className="btn-base w-full py-4"
          >
            <AppText className="text-lg text-center">
              {t("gym.phase.trackLive")}
            </AppText>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => handleModeSelect("manual")}
            className="btn-neutral w-full py-4"
          >
            <AppText className="text-lg text-center">
              {t("gym.phase.enterManually")}
            </AppText>
          </AnimatedButton>
        </View>
      )}
    </FullScreenModal>
  );
}
