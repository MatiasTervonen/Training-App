import { View, Platform } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingLayout from "@/features/onboarding/OnboardingLayout";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stores/useUserStore";
import { saveOnboardingStatus } from "@/database/settings/save-onboarding-status";
import { saveUserProfile } from "@/database/settings/save-user-profile";
import { useState, useEffect } from "react";
import { hasStepPermission } from "@/native/android/NativeStepCounter";
import { canUseExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import { isIgnoringBatteryOptimizations } from "@/native/android/NativeBatteryOptimization";

export default function CompleteScreen() {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const [isLoading, setIsLoading] = useState(false);

  const language = useUserStore((state) => state.settings?.language);
  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);
  const gpsEnabled = useUserStore(
    (state) => state.settings?.gps_tracking_enabled,
  );
  const displayName = useUserStore((state) => state.profile?.display_name);
  const weightUnit = useUserStore((state) => state.profile?.weight_unit);
  const distanceUnit = useUserStore((state) => state.profile?.distance_unit);
  const heightCm = useUserStore((state) => state.profile?.height_cm);

  const [stepsEnabled, setStepsEnabled] = useState(false);
  const [exactAlarmEnabled, setExactAlarmEnabled] = useState(false);
  const [batteryOptDisabled, setBatteryOptDisabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      Promise.all([
        hasStepPermission(),
        canUseExactAlarm(),
        isIgnoringBatteryOptimizations(),
      ]).then(([steps, alarm, battery]) => {
        setStepsEnabled(steps);
        setExactAlarmEnabled(alarm);
        setBatteryOptDisabled(battery);
      });
    }
  }, []);

  const handleFinish = async () => {
    setIsLoading(true);
    useUserStore.getState().setUserSettings({
      has_completed_onboarding: true,
    });
    try {
      const profile = useUserStore.getState().profile;
      await Promise.all([
        saveOnboardingStatus(true),
        saveUserProfile({
          display_name: profile?.display_name || "",
          weight_unit: profile?.weight_unit || "kg",
          distance_unit: profile?.distance_unit || "km",
          profile_picture: profile?.profile_picture || null,
          height_cm: profile?.height_cm || null,
        }),
      ]);
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

  if (displayName) {
    summaryItems.push({
      label: t("complete.summary.userName"),
      value: displayName,
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

  if (stepsEnabled) {
    summaryItems.push({
      label: t("complete.summary.stepCounter"),
      value: "✓",
    });
  }

  if (exactAlarmEnabled) {
    summaryItems.push({
      label: t("complete.summary.exactAlarms"),
      value: "✓",
    });
  }

  if (batteryOptDisabled) {
    summaryItems.push({
      label: t("complete.summary.batteryOptimization"),
      value: "✓",
    });
  }

  if (weightUnit) {
    summaryItems.push({
      label: t("complete.summary.weight"),
      value: weightUnit,
    });
  }

  if (heightCm) {
    summaryItems.push({
      label: t("complete.summary.height"),
      value: `${heightCm} cm`,
    });
  }

  if (distanceUnit) {
    summaryItems.push({
      label: t("complete.summary.distanceUnit"),
      value: distanceUnit,
    });
  }

  return (
    <OnboardingLayout
      currentStep={6}
      footer={
        <AnimatedButton
          onPress={handleFinish}
          className="btn-start py-3"
          label={t("complete.start")}
          textClassName="text-lg"
          disabled={isLoading}
        />
      }
    >
      <View>
        <AppText className="text-3xl text-center mb-4">
          {t("complete.title")}
        </AppText>
        <BodyText className="text-center mb-8">
          {t("complete.body")}
        </BodyText>

        {summaryItems.length > 0 && (
          <View className="bg-slate-800 rounded-lg p-4 border border-slate-700">
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
      </View>
    </OnboardingLayout>
  );
}
