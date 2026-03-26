import PageContainer from "@/components/PageContainer";
import PushNotificationManager from "@/features/push-notifications/pushNotificationManager";
import GpsToggleManager from "@/features/activities/gpsToggle/gpsToggleManager";
import { View } from "react-native";
import SelectInput from "@/components/Selectinput";
import BodyText from "@/components/BodyText";
import { useTranslation } from "react-i18next";
import { saveLanguage } from "@/database/settings/save-language";
import { saveDayResetHour } from "@/database/settings/save-day-reset-hour";
import { setDayResetHour } from "@/native/android/NativeStepCounter";
import { useUserStore } from "@/lib/stores/useUserStore";

const DAY_RESET_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  label: `${String(i).padStart(2, "0")}:00`,
  value: String(i),
}));

export default function SettingsPage() {
  const language = useUserStore((state) => state.settings?.language ?? "en");
  const dayResetHour = useUserStore(
    (state) => state.settings?.day_reset_hour ?? 5,
  );
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

  const handleDayResetChange = async (value: string) => {
    const hour = Number(value);
    // Update local store immediately
    setUserSettings({ day_reset_hour: hour });
    // Sync to native step counter
    setDayResetHour(hour);
    // Persist to database
    try {
      await saveDayResetHour(hour);
    } catch (error) {
      console.error("Failed to save day reset hour:", error);
    }
  };

  return (
    <PageContainer>
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
      <View className="my-5">
        <SelectInput
          topLabel={t("settings.dayReset.title")}
          label={t("settings.dayReset.title")}
          value={String(dayResetHour)}
          onChange={handleDayResetChange}
          options={DAY_RESET_OPTIONS}
        />
        <BodyText className="text-xs mt-2">
          {t("settings.dayReset.description")}
        </BodyText>
      </View>
    </PageContainer>
  );
}
