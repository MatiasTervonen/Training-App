import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stores/useUserStore";
import { saveOnboardingStatus } from "@/database/settings/save-onboarding-status";
import { useState } from "react";

export default function CompleteScreen() {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const [isLoading, setIsLoading] = useState(false);

  const language = useUserStore((state) => state.settings?.language);
  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);
  const gpsEnabled = useUserStore(
    (state) => state.settings?.gps_tracking_enabled,
  );
  const weightUnit = useUserStore((state) => state.profile?.weight_unit);

  const handleFinish = async () => {
    setIsLoading(true);
    useUserStore.getState().setUserSettings({
      has_completed_onboarding: true,
    });
    try {
      await saveOnboardingStatus(true);
    } catch {
      // Saved locally, will sync later
    }
    router.replace("/dashboard");
  };

  const summaryItems: { label: string; value: string }[] = [];

  if (language) {
    summaryItems.push({
      label: t("complete.summary.language"),
      value: language === "fi" ? "Suomi" : "English",
    });
  }

  if (pushEnabled) {
    summaryItems.push({
      label: t("complete.summary.notifications"),
      value: "✓",
    });
  }

  if (gpsEnabled) {
    summaryItems.push({
      label: t("complete.summary.location"),
      value: "✓",
    });
  }

  if (weightUnit) {
    summaryItems.push({
      label: t("complete.summary.weight"),
      value: weightUnit,
    });
  }

  return (
    <View className="flex-1 px-6 justify-center">
      <OnboardingProgressBar currentStep={4} />

      <View className="mt-8">
        <AppText className="text-3xl text-center mb-4">
          {t("complete.title")}
        </AppText>
        <BodyText className="text-center text-base mb-8">
          {t("complete.body")}
        </BodyText>
      </View>

      {summaryItems.length > 0 && (
        <View className="bg-slate-800 rounded-lg p-4 mb-8 border border-slate-700">
          {summaryItems.map((item, index) => (
            <View
              key={item.label}
              className={`flex-row justify-between py-2 ${
                index < summaryItems.length - 1
                  ? "border-b border-slate-700"
                  : ""
              }`}
            >
              <AppText className="text-slate-400">{item.label}</AppText>
              <AppText className="text-green-400">{item.value}</AppText>
            </View>
          ))}
        </View>
      )}

      <AnimatedButton
        onPress={handleFinish}
        className="btn-base py-3"
        label={t("complete.start")}
        textClassName="text-lg"
        disabled={isLoading}
      />
    </View>
  );
}
