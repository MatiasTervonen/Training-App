import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import LanguageCard from "@/features/onboarding/LanguageCard";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stores/useUserStore";
import { saveLanguage } from "@/database/settings/save-language";

export default function LanguageScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const currentLanguage = useUserStore(
    (state) => state.settings?.language ?? i18n.language,
  );

  const handleSelectLanguage = async (lang: "en" | "fi") => {
    i18n.changeLanguage(lang);
    useUserStore.getState().setUserSettings({ language: lang });
    try {
      await saveLanguage(lang);
    } catch {
      // Will sync later
    }
  };

  return (
    <View className="flex-1 px-6 justify-center">
      <OnboardingProgressBar currentStep={1} />

      <View className="mt-8 mb-8">
        <AppText className="text-3xl text-center mb-8">
          {t("language.title")}
        </AppText>

        <LanguageCard
          label="English"
          flag="🇬🇧"
          isSelected={currentLanguage === "en"}
          onSelect={() => handleSelectLanguage("en")}
        />
        <LanguageCard
          label="Suomi"
          flag="🇫🇮"
          isSelected={currentLanguage === "fi"}
          onSelect={() => handleSelectLanguage("fi")}
        />
      </View>

      <AnimatedButton
        onPress={() => router.push("/onboarding/permissions")}
        className="btn-base py-3"
        label={t("language.continue")}
        textClassName="text-lg"
      />

      <SkipOnboardingButton onSkip={skipOnboarding} />
    </View>
  );
}
