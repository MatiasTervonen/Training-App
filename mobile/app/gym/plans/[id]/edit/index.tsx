import { useState, useEffect } from "react";
import { View, Keyboard, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import PageContainer from "@/components/PageContainer";
import FullScreenLoader from "@/components/FullScreenLoader";
import ErrorMessage from "@/components/ErrorMessage";
import ExerciseHistoryModal from "@/features/gym/components/ExerciseHistoryModal";
import PlanDaysEditor from "@/features/gym/plans/components/PlanDaysEditor";
import PlanTargetsEditor from "@/features/gym/plans/components/PlanTargetsEditor";
import usePlanForm from "@/features/gym/plans/hooks/usePlanForm";
import useSavePlan from "@/features/gym/plans/hooks/useSavePlan";
import useFullPlan from "@/features/gym/plans/hooks/useFullPlan";
import type { TargetEntry } from "@/features/gym/plans/types";

export default function EditPlanPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(["gym", "common"]);

  const { data: plan, isLoading: planLoading, error: planError } = useFullPlan(id);

  // Form state
  const [name, setName] = useState("");
  const [totalWeeks, setTotalWeeks] = useState<number | null>(4);
  const [noEndDate, setNoEndDate] = useState(false);
  const [weeksInput, setWeeksInput] = useState("4");
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const form = usePlanForm({ noEndDate, totalWeeks });

  // Initialize form from loaded plan
  useEffect(() => {
    if (plan && !initialized) {
      setName(plan.name);
      setTotalWeeks(plan.total_weeks);
      setNoEndDate(plan.total_weeks === null);
      setWeeksInput(plan.total_weeks?.toString() || "");

      form.setDays(
        plan.days.map((d) => ({
          position: d.position,
          label: d.label || "",
          rest_timer_seconds: d.rest_timer_seconds ?? null,
          exercises: d.exercises.map((ex) => ({
            exercise_id: ex.exercise_id,
            name: ex.name,
            equipment: ex.equipment,
            muscle_group: ex.muscle_group,
            main_group: ex.main_group,
            position: ex.position,
            superset_id: ex.superset_id,
            rest_timer_seconds: ex.rest_timer_seconds,
          })),
        })),
      );

      // Group targets by day+week+exercise
      const targetEntries: TargetEntry[] = [];
      plan.days.forEach((day) => {
        const grouped = new Map<string, TargetEntry>();

        day.targets.forEach((tgt) => {
          const key = `${day.position}-${tgt.week_number}-${tgt.exercise_id}`;
          if (!grouped.has(key)) {
            const exercise = day.exercises.find((ex) => ex.exercise_id === tgt.exercise_id);
            grouped.set(key, {
              day_position: day.position,
              week_number: tgt.week_number,
              exercise_id: tgt.exercise_id,
              exercise_name: exercise?.name ?? tgt.exercise_id.slice(0, 8),
              exercise_position: tgt.exercise_position,
              sets: [],
            });
          }
          form.setIdCounter.current += 1;
          grouped.get(key)!.sets.push({
            id: form.setIdCounter.current,
            target_weight: tgt.target_weight?.toString() || "",
            target_reps: tgt.target_reps?.toString() || "",
            target_rpe: tgt.target_rpe || "",
          });
        });

        targetEntries.push(...grouped.values());
      });

      // Also create empty target entries for exercises without targets
      plan.days.forEach((day) => {
        const weekCount = plan.total_weeks || 1;
        day.exercises.forEach((ex) => {
          for (let week = 1; week <= weekCount; week++) {
            const exists = targetEntries.some(
              (te) => te.day_position === day.position && te.week_number === week && te.exercise_id === ex.exercise_id,
            );
            if (!exists) {
              targetEntries.push({
                day_position: day.position,
                week_number: week,
                exercise_id: ex.exercise_id,
                exercise_name: ex.name,
                exercise_position: ex.position,
                sets: [],
              });
            }
          }
        });
      });

      form.setTargets(targetEntries);
      form.setCollapsedDays(new Set(plan.days.map((d) => d.position)));
      setInitialized(true);
    }
  }, [plan, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const { handleSavePlan } = useSavePlan({
    name,
    totalWeeks: noEndDate ? null : totalWeeks,
    days: form.buildDaysForSave(),
    targets: form.buildFlatTargets(),
    planId: id,
    setIsSaving,
  });

  const handleSave = async () => {
    if (name.trim() === "" || form.days.length === 0) return;
    await handleSavePlan();
  };

  if (planLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (planError || !plan) {
    return (
      <PageContainer>
        <ErrorMessage message={t("gym:gym.plans.loadError")} />
      </PageContainer>
    );
  }

  if (isSaving) {
    return <FullScreenLoader visible message={t("gym:gym.plans.saving")} />;
  }

  return (
    <View className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={Keyboard.dismiss}>
        <PageContainer>
          <AppText className="text-center mb-5 text-2xl">
            {t("gym:gym.plans.edit")}
          </AppText>

          {/* Plan setup */}
          <View className="gap-5 mb-5">
            <AppInput
              value={name}
              setValue={setName}
              label={t("gym:gym.plans.planName")}
              placeholder={t("gym:gym.plans.planNamePlaceholder")}
            />

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <AppText>{t("gym:gym.plans.noEndDate")}</AppText>
                <Toggle isOn={noEndDate} onToggle={() => {
                  const newValue = !noEndDate;
                  setNoEndDate(newValue);
                  if (newValue) {
                    setTotalWeeks(null);
                  } else {
                    const w = parseInt(weeksInput, 10);
                    setTotalWeeks(isNaN(w) ? 4 : w);
                  }
                }} />
              </View>
              {!noEndDate && (
                <AppInput
                  value={weeksInput}
                  setValue={(value) => {
                    setWeeksInput(value);
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      setTotalWeeks(parsed);
                    }
                  }}
                  label={t("gym:gym.plans.totalWeeks")}
                  keyboardType="numeric"
                  placeholder="4"
                />
              )}
            </View>
          </View>

          {/* Days with exercises */}
          <AppText className="text-lg mb-3">{t("gym:gym.plans.addDays")}</AppText>
          <View className="mb-5">
            <PlanDaysEditor form={form} />
          </View>

          {/* Targets */}
          <AppText className="text-lg mb-3">{t("gym:gym.plans.targets")}</AppText>
          <PlanTargetsEditor form={form} noEndDate={noEndDate} />

        </PageContainer>
        </Pressable>
      </ScrollView>

    <View className="px-5 py-3 border-t border-slate-700">
      <AnimatedButton onPress={handleSave} className="btn-save">
        <AppText className="text-center" numberOfLines={1}>
          {t("gym:gym.plans.save")}
        </AppText>
      </AnimatedButton>
    </View>

    <ExerciseHistoryModal
      isOpen={!!form.historyExerciseId}
      onClose={() => form.setHistoryExerciseId(null)}
      isLoading={form.historyLoading}
      history={form.historyData}
      error={form.historyError ? String(form.historyError) : null}
    />
    </View>
  );
}
