import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stores/useUserStore";
import { saveOnboardingStatus } from "@/database/settings/save-onboarding-status";

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation("onboarding");

  const handleSkip = async () => {
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

  return (
    <View className="flex-1 px-6 justify-center">
      <View className="items-center mb-12">
        <AppText className="text-4xl mb-2">MyTrack</AppText>
      </View>

      <OnboardingProgressBar currentStep={0} />

      <View className="mt-8">
        <AppText className="text-3xl text-center mb-4">
          {t("welcome.title")}
        </AppText>
        <BodyText className="text-center text-base mb-10">
          {t("welcome.body")}
        </BodyText>
      </View>

      <AnimatedButton
        onPress={() => router.push("/onboarding/language")}
        className="btn-base py-3"
        label={t("welcome.letsGo")}
        textClassName="text-lg"
      />

      <View className="items-center mt-6">
        <AnimatedButton onPress={handleSkip} className="py-2 px-4">
          <AppText className="text-slate-400 text-sm underline">
            {t("welcome.skip")}
          </AppText>
        </AnimatedButton>
      </View>
    </View>
  );
}
