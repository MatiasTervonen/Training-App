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
  getEffectiveStepsConfig,
} from "@/features/widgets/widget-storage";
import { getTodaySteps } from "@/native/android/NativeStepCounter";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function StepsConfigPage() {
  const { t } = useTranslation(["widgets", "habits"]);
  const router = useRouter();
  const [showGoal, setShowGoal] = useState(DEFAULT_STEPS_CONFIG.showGoal);
  const [dailyGoal, setDailyGoal] = useState(
    String(DEFAULT_STEPS_CONFIG.dailyGoal),
  );
  const [loaded, setLoaded] = useState(false);
  const [stepHabitTarget, setStepHabitTarget] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getGlobalStepsConfig(),
      AsyncStorage.getItem("step_habit_targets"),
    ]).then(([config, raw]) => {
      setShowGoal(config.showGoal);
      setDailyGoal(String(config.dailyGoal));
      if (raw) {
        const targets: number[] = JSON.parse(raw);
        if (targets.length > 0) {
          setStepHabitTarget(Math.max(...targets));
        }
      }
      setLoaded(true);
    });
  }, []);

  const parsedGoal = parseInt(dailyGoal, 10);
  const isGoalValid = !isNaN(parsedGoal) && parsedGoal > 0;

  const handleSave = async () => {
    if (showGoal && !stepHabitTarget && !isGoalValid) {
      Toast.show({
        type: "error",
        text1: t("widgets:widgets.steps.invalidGoal"),
      });
      return;
    }

    const config = {
      showGoal,
      dailyGoal: isGoalValid ? parsedGoal : DEFAULT_STEPS_CONFIG.dailyGoal,
    };
    await saveGlobalStepsConfig(config);
    const effectiveConfig = await getEffectiveStepsConfig();
    const steps = await getTodaySteps();
    requestWidgetUpdate({
      widgetName: "Steps",
      renderWidget: () => <StepsWidget config={effectiveConfig} steps={steps} />,
    }).catch(() => {});
    Toast.show({ type: "success", text1: t("widgets:widgets.steps.saved") });
    router.back();
  };

  if (!loaded) return null;

  return (
    <Pressable className="flex-1" onPress={Keyboard.dismiss}>
      <PageContainer>
        <AppText className="text-2xl text-center mb-8">
          {t("widgets:widgets.steps.configTitle")}
        </AppText>

        <View className="flex-1 justify-between">
          <View className="gap-5">
            <View className="flex-row justify-between items-center py-3 px-4 bg-slate-800 rounded-lg">
              <AppText className="text-lg">
                {t("widgets:widgets.steps.showGoal")}
              </AppText>
              <Toggle isOn={showGoal} onToggle={() => setShowGoal((v) => !v)} />
            </View>

            {showGoal && (
              <View className="px-4">
                {stepHabitTarget ? (
                  <View className="gap-2">
                    <AppText className="text-gray-400">
                      {t("widgets:widgets.steps.dailyGoal")}
                    </AppText>
                    <AppText className="text-lg text-gray-100">
                      {stepHabitTarget.toLocaleString()} {t("widgets:widgets.steps.stepsUnit")}
                    </AppText>
                    <AppText className="text-sm text-gray-500">
                      {t("widgets:widgets.steps.goalFromHabit")}
                    </AppText>
                  </View>
                ) : (
                  <AppInput
                    label={t("widgets:widgets.steps.dailyGoal")}
                    value={dailyGoal}
                    setValue={setDailyGoal}
                    keyboardType="numeric"
                  />
                )}
              </View>
            )}
          </View>

          <AnimatedButton
            label={t("widgets:widgets.steps.save")}
            onPress={handleSave}
            className="btn-base"
          />
        </View>
      </PageContainer>
    </Pressable>
  );
}
