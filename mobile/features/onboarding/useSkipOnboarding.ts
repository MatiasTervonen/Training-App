import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stores/useUserStore";
import { saveOnboardingStatus } from "@/database/settings/save-onboarding-status";

export function useSkipOnboarding() {
  const [isSkipping, setIsSkipping] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("onboarding");

  const skipOnboarding = () => {
    Alert.alert(t("skipModal.title"), t("skipModal.body"), [
      { text: t("skipModal.cancel"), style: "cancel" },
      {
        text: t("skipModal.confirm"),
        onPress: async () => {
          setIsSkipping(true);
          useUserStore.getState().setUserSettings({
            has_completed_onboarding: true,
          });
          try {
            await saveOnboardingStatus(true);
          } catch {
            // Saved locally, will sync later
          }
          router.replace("/dashboard");
        },
      },
    ]);
  };

  return { skipOnboarding, isSkipping };
}
