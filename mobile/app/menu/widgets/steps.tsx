import { useState, useEffect, useCallback, useMemo } from "react";
import { Keyboard, Pressable, View } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import Toggle from "@/components/toggle";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { useAutoSave } from "@/hooks/useAutoSave";
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

  const autoSaveData = useMemo(
    () => (loaded ? { showGoal, dailyGoal } : undefined),
    [loaded, showGoal, dailyGoal],
  );

  const handleAutoSave = useCallback(async () => {
    if (showGoal && !stepHabitTarget && !isGoalValid) {
      throw new Error("Invalid goal");
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
  }, [showGoal, stepHabitTarget, isGoalValid, parsedGoal]);

  const { status } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: loaded,
  });

  if (!loaded) return null;

  return (
    <Pressable className="flex-1" onPress={Keyboard.dismiss}>
      <PageContainer>
        <AutoSaveIndicator status={status} />

        <AppText className="text-2xl text-center mb-8">
          {t("widgets:widgets.steps.configTitle")}
        </AppText>

        <View className="gap-5">
          <View className="flex-row justify-between items-center py-3 px-4 bg-slate-500/10 border border-slate-500/20 rounded-lg">
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
                  <AppText className="text-lg">
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
      </PageContainer>
    </Pressable>
  );
}
