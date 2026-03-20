import { useEffect, useMemo } from "react";
import { useHabits } from "@/features/habits/hooks/useHabits";
import {
  setStepGoals,
  setStepNotificationText,
} from "@/native/android/NativeStepCounter";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useStepGoalSync() {
  const { t } = useTranslation("habits");
  const { t: tActivities } = useTranslation("activities");
  const { data: habits, isSuccess } = useHabits();

  const stepGoals = useMemo(
    () =>
      (habits ?? [])
        .filter((h) => h.type === "steps" && h.target_value)
        .map((h) => ({ id: h.id, target: h.target_value! })),
    [habits],
  );

  useEffect(() => {
    // Don't sync until habits have loaded — writing an empty array while
    // the query is still in flight would reset the widget goal to 10 000.
    if (!isSuccess) return;

    setStepGoals(
      stepGoals,
      t("stepGoalReached"),
      t("stepGoalBody", { steps: "{{steps}}" }),
    );

    // Sync translated notification text for the persistent step tracking notification
    setStepNotificationText(
      tActivities("activities.stepNotificationText", { steps: "{{steps}}" }),
    );

    // Also store in AsyncStorage for widget to read
    AsyncStorage.setItem(
      "step_habit_targets",
      JSON.stringify(stepGoals.map((g) => g.target)),
    );
  }, [stepGoals, isSuccess, t, tActivities]);
}
