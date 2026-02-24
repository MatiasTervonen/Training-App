import { useState, useEffect } from "react";
import { Keyboard, Pressable, View } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { requestWidgetUpdate } from "react-native-android-widget";
import { StepsWidget } from "@/features/widgets/StepsWidget";
import { DEFAULT_STEPS_CONFIG } from "@/features/widgets/widget-constants";
import {
  getGlobalStepsConfig,
  saveGlobalStepsConfig,
} from "@/features/widgets/widget-storage";
import { getTodaySteps } from "@/native/android/NativeStepCounter";

export default function StepsConfigPage() {
  const { t } = useTranslation("widgets");
  const router = useRouter();
  const [showGoal, setShowGoal] = useState(DEFAULT_STEPS_CONFIG.showGoal);
  const [dailyGoal, setDailyGoal] = useState(
    String(DEFAULT_STEPS_CONFIG.dailyGoal),
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getGlobalStepsConfig().then((config) => {
      setShowGoal(config.showGoal);
      setDailyGoal(String(config.dailyGoal));
      setLoaded(true);
    });
  }, []);

  const parsedGoal = parseInt(dailyGoal, 10);
  const isGoalValid = !isNaN(parsedGoal) && parsedGoal > 0;

  const handleSave = async () => {
    if (showGoal && !isGoalValid) {
      Toast.show({
        type: "error",
        text1: t("widgets.steps.invalidGoal"),
      });
      return;
    }

    const config = {
      showGoal,
      dailyGoal: isGoalValid ? parsedGoal : DEFAULT_STEPS_CONFIG.dailyGoal,
    };
    await saveGlobalStepsConfig(config);
    const steps = await getTodaySteps();
    requestWidgetUpdate({
      widgetName: "Steps",
      renderWidget: () => <StepsWidget config={config} steps={steps} />,
    }).catch(() => {});
    Toast.show({ type: "success", text1: t("widgets.steps.saved") });
    router.back();
  };

  if (!loaded) return null;

  return (
    <Pressable className="flex-1" onPress={Keyboard.dismiss}>
      <PageContainer>
        <AppText className="text-2xl text-center mb-8">
          {t("widgets.steps.configTitle")}
        </AppText>

        <View className="flex-1 justify-between">
          <View className="gap-5">
            <View className="flex-row justify-between items-center py-3 px-4 bg-slate-800 rounded-lg">
              <AppText className="text-lg">
                {t("widgets.steps.showGoal")}
              </AppText>
              <Toggle isOn={showGoal} onToggle={() => setShowGoal((v) => !v)} />
            </View>

            {showGoal && (
              <View className="px-4">
                <AppInput
                  label={t("widgets.steps.dailyGoal")}
                  value={dailyGoal}
                  setValue={setDailyGoal}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          <AnimatedButton
            label={t("widgets.steps.save")}
            onPress={handleSave}
            className="btn-base"
          />
        </View>
      </PageContainer>
    </Pressable>
  );
}
