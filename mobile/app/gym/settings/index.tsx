import { useState } from "react";
import { View, Keyboard, Pressable } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AppInput from "@/components/AppInput";
import Toggle from "@/components/toggle";
import PageContainer from "@/components/PageContainer";
import { useGymSettingsStore } from "@/lib/stores/gymSettingsStore";
import { useUserStore } from "@/lib/stores/useUserStore";
import { saveSoundSettings } from "@/database/settings/save-sound-settings";
import { useTranslation } from "react-i18next";
import BodyTextNC from "@/components/BodyTextNC";

export default function GymSettingsScreen() {
  const { t } = useTranslation("gym");

  const restTimerEnabled = useGymSettingsStore(
    (state) => state.restTimerEnabled,
  );
  const restTimerDurationSeconds = useGymSettingsStore(
    (state) => state.restTimerDurationSeconds,
  );
  const setRestTimerEnabled = useGymSettingsStore(
    (state) => state.setRestTimerEnabled,
  );
  const setRestTimerDuration = useGymSettingsStore(
    (state) => state.setRestTimerDuration,
  );

  const pbSoundEnabled = useUserStore(
    (state) => state.settings?.pb_sound_enabled ?? false,
  );
  const restTimerSoundEnabled = useUserStore(
    (state) => state.settings?.rest_timer_sound_enabled ?? true,
  );
  const setUserSettings = useUserStore((state) => state.setUserSettings);

  const [durationText, setDurationText] = useState(
    String(restTimerDurationSeconds),
  );

  const handleDurationBlur = () => {
    const num = parseInt(durationText, 10);
    if (!isNaN(num) && num > 0) {
      setRestTimerDuration(num);
      setDurationText(String(num));
    } else {
      setDurationText(String(restTimerDurationSeconds));
    }
  };

  const togglePbSound = () => {
    const newValue = !pbSoundEnabled;
    setUserSettings({ pb_sound_enabled: newValue });
    saveSoundSettings({ pb_sound_enabled: newValue });
  };

  const toggleRestTimerSound = () => {
    const newValue = !restTimerSoundEnabled;
    setUserSettings({ rest_timer_sound_enabled: newValue });
    saveSoundSettings({ rest_timer_sound_enabled: newValue });
  };

  return (
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <PageContainer>
          <AppText className="text-2xl text-center my-5">
            {t("gym.settings.title")}
          </AppText>

          <View className="gap-6 mt-4">
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <BodyText className="text-lg">
                    {t("gym.settings.restTimerEnabled")}
                  </BodyText>
                  <BodyTextNC className="text-sm text-gray-400">
                    {t("gym.settings.restTimerDescription")}
                  </BodyTextNC>
                </View>
                <Toggle
                  isOn={restTimerEnabled}
                  onToggle={() => setRestTimerEnabled(!restTimerEnabled)}
                />
              </View>
            </View>

            {restTimerEnabled && (
              <AppInput
                value={durationText}
                setValue={setDurationText}
                placeholder="90"
                label={t("gym.settings.restTimerDuration")}
                keyboardType="numeric"
                onBlur={handleDurationBlur}
              />
            )}

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <BodyText className="text-lg">
                    {t("gym.settings.pbSoundEnabled")}
                  </BodyText>
                  <BodyTextNC className="text-sm text-gray-400">
                    {t("gym.settings.pbSoundDescription")}
                  </BodyTextNC>
                </View>
                <Toggle
                  isOn={pbSoundEnabled}
                  onToggle={togglePbSound}
                />
              </View>
            </View>

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <BodyText className="text-lg">
                    {t("gym.settings.restTimerSoundEnabled")}
                  </BodyText>
                  <BodyTextNC className="text-sm text-gray-400">
                    {t("gym.settings.restTimerSoundDescription")}
                  </BodyTextNC>
                </View>
                <Toggle
                  isOn={restTimerSoundEnabled}
                  onToggle={toggleRestTimerSound}
                />
              </View>
            </View>
          </View>
        </PageContainer>
      </Pressable>
  );
}
