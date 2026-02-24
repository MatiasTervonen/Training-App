import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import PushNotificationManager from "@/features/push-notifications/pushNotificationManager";
import GpsToggleManager from "@/features/activities/gpsToggle/gpsToggleManager";
import { View } from "react-native";
import SelectInput from "@/components/Selectinput";
import { useTranslation } from "react-i18next";
import { saveLanguage } from "@/database/settings/save-language";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function SettingsPage() {
  const language = useUserStore((state) => state.settings?.language ?? "en");
  const setUserSettings = useUserStore((state) => state.setUserSettings);

  const { t, i18n } = useTranslation("menu");

  const handleLanguageChange = async (lang: "en" | "fi") => {
    // Update i18n immediately for instant UI change
    i18n.changeLanguage(lang);
    // Update local store
    setUserSettings({ language: lang });
    // Persist to database
    try {
      await saveLanguage(lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">
        {t("settings.title")}
      </AppText>
      <PushNotificationManager />
      <View className="my-5">
        <GpsToggleManager />
      </View>
      <View className="my-5">
        <SelectInput
          topLabel={t("settings.language")}
          label={t("settings.language")}
          value={language}
          onChange={(lang) => handleLanguageChange(lang as "en" | "fi")}
          options={[
            { label: `🇬🇧  ${t("settings.languages.en")}`, value: "en" },
            { label: `🇫🇮  ${t("settings.languages.fi")}`, value: "fi" },
          ]}
        />
      </View>
    </PageContainer>
  );
}
