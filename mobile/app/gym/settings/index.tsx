import { useState } from "react";
import { View, Keyboard, Pressable } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import Toggle from "@/components/toggle";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import PageContainer from "@/components/PageContainer";
import { useGymSettingsStore } from "@/lib/stores/gymSettingsStore";
import { useTranslation } from "react-i18next";

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

  return (
    <ModalPageWrapper>
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <PageContainer>
          <AppText className="text-2xl text-center my-5">
            {t("gym.settings.title")}
          </AppText>

          <View className="gap-6 mt-4">
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <AppText className="text-lg">
                    {t("gym.settings.restTimerEnabled")}
                  </AppText>
                  <AppText className="text-sm text-gray-400">
                    {t("gym.settings.restTimerDescription")}
                  </AppText>
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
          </View>
        </PageContainer>
      </Pressable>
    </ModalPageWrapper>
  );
}
