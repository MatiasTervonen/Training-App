import { useEffect, useMemo } from "react";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { setStepGoals } from "@/native/android/NativeStepCounter";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useStepGoalSync() {
  const { t } = useTranslation("habits");
  const { data: habits = [] } = useHabits();

  const stepGoals = useMemo(
    () =>
      habits
        .filter((h) => h.type === "steps" && h.target_value)
        .map((h) => ({ id: h.id, target: h.target_value! })),
    [habits],
  );

  useEffect(() => {
    setStepGoals(
      stepGoals,
      t("stepGoalReached"),
      t("stepGoalBody", { steps: "{{steps}}" }),
    );

    // Also store in AsyncStorage for widget to read
    AsyncStorage.setItem(
      "step_habit_targets",
      JSON.stringify(stepGoals.map((g) => g.target)),
    );
  }, [stepGoals, t]);
}
