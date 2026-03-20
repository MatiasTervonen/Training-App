import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingLayout from "@/features/onboarding/OnboardingLayout";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  return (
    <OnboardingLayout
      currentStep={0}
      showBackButton={false}
      footer={
        <>
          <AnimatedButton
            onPress={() => router.push("/onboarding/language")}
            className="btn-add py-3"
            label={t("welcome.letsGo")}
            textClassName="text-lg"
          />
          <SkipOnboardingButton onSkip={skipOnboarding} />
        </>
      }
    >
      <View>
        <AppText className="text-3xl text-center mb-4">
          {t("welcome.title", { appName: APP_NAME })}
        </AppText>
        <BodyText className="text-center">
          {t("welcome.body")}
        </BodyText>
      </View>
    </OnboardingLayout>
  );
}
