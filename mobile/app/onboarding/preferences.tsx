import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingLayout from "@/features/onboarding/OnboardingLayout";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function PreferencesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const currentDistanceUnit = useUserStore(
    (state) =>
      state.profile?.distance_unit ?? (i18n.language === "fi" ? "km" : "mi"),
  );

  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">(
    currentDistanceUnit === "mi" ? "mi" : "km",
  );

  const handleContinue = () => {
    useUserStore.getState().setUserProfile({ distance_unit: distanceUnit });
    router.push("/onboarding/complete");
  };

  return (
    <OnboardingLayout
      currentStep={5}
      footer={
        <>
          <AnimatedButton
            onPress={handleContinue}
            className="btn-base py-3"
            label={t("preferences.continue")}
            textClassName="text-lg"
          />
          <SkipOnboardingButton onSkip={skipOnboarding} />
        </>
      }
    >
      <View>
        <AppText className="text-2xl text-center mb-2">
          {t("preferences.title")}
        </AppText>
        <BodyText className="text-center mb-8">
          {t("preferences.description")}
        </BodyText>

        <AppText className="text-lg text-center mb-3">
          {t("preferences.distanceUnit")}
        </AppText>
        <View className="flex-row justify-center gap-3">
          <AnimatedButton
            onPress={() => setDistanceUnit("km")}
            className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
              distanceUnit === "km"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={
                distanceUnit === "km" ? "text-blue-400" : "text-slate-400"
              }
            >
              km
            </AppText>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => setDistanceUnit("mi")}
            className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
              distanceUnit === "mi"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={
                distanceUnit === "mi" ? "text-blue-400" : "text-slate-400"
              }
            >
              mi
            </AppText>
          </AnimatedButton>
        </View>
      </View>
    </OnboardingLayout>
  );
}
