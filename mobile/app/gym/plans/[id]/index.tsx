import { View, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import DropDownModal from "@/components/DropDownModal";
import ErrorMessage from "@/components/ErrorMessage";
import PlanDayCard from "@/features/gym/plans/components/PlanDayCard";
import PlanProgressBar from "@/features/gym/plans/components/PlanProgressBar";
import WeekSelector from "@/features/gym/plans/components/WeekSelector";
import MuscleGroupDistribution from "@/features/gym/plans/components/MuscleGroupDistribution";
import useFullPlan from "@/features/gym/plans/hooks/useFullPlan";
import { activatePlan } from "@/database/gym/plans/activate-plan";
import { deactivatePlan } from "@/database/gym/plans/deactivate-plan";
import { deletePlan } from "@/database/gym/plans/delete-plan";
import { useConfirmAction } from "@/lib/confirmAction";
import Toast from "react-native-toast-message";
import { useState } from "react";

export default function PlanDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(["gym", "common"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmAction = useConfirmAction();

  const { data: plan, isLoading, error } = useFullPlan(id);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const handleActivate = async () => {
    if (!plan) return;
    try {
      await activatePlan(plan.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["training-plans"], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["full-training-plan", id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["active-training-plan"], exact: true }),
      ]);
      Toast.show({ type: "success", text1: t("gym:gym.plans.activePlan") });
    } catch {
      Toast.show({ type: "error", text1: t("common:common.error") });
    }
  };

  const handleDeactivate = async () => {
    if (!plan) return;
    const confirmed = await confirmAction({
      title: t("gym:gym.plans.deactivate"),
      message: t("gym:gym.plans.deactivateConfirm"),
    });
    if (!confirmed) return;
    try {
      await deactivatePlan(plan.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["training-plans"], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["full-training-plan", id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["active-training-plan"], exact: true }),
      ]);
    } catch {
      Toast.show({ type: "error", text1: t("common:common.error") });
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    const confirmed = await confirmAction({
      title: t("gym:gym.plans.deletePlan"),
      message: t("gym:gym.plans.deletePlanConfirm"),
    });
    if (!confirmed) return;

    try {
      await deletePlan(plan.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["training-plans"], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["active-training-plan"], exact: true }),
      ]);
      Toast.show({ type: "success", text1: t("gym:gym.plans.deleteSuccess") });
      router.back();
    } catch {
      Toast.show({ type: "error", text1: t("gym:gym.plans.deleteError") });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !plan) {
    return (
      <PageContainer>
        <ErrorMessage message={t("gym:gym.plans.loadError")} />
      </PageContainer>
    );
  }

  const effectiveWeeks = plan.total_weeks || 1;
  const allExercises = plan.days.flatMap((d) => d.exercises);

  return (
    <View className="flex-1">
    <ScrollView showsVerticalScrollIndicator={false}>
      <PageContainer>
        {/* Header */}
        <View className="flex-row items-center justify-center mb-2">
          <AppText className="text-2xl flex-1 text-center">{plan.name}</AppText>
          <DropDownModal
            label={plan.name}
            options={[
              { value: "edit", label: t("gym:gym.plans.edit") },
              { value: "delete", label: t("gym:gym.plans.deletePlan") },
            ]}
            onChange={(value) => {
              if (value === "edit") router.push(`/gym/plans/${id}/edit`);
              if (value === "delete") handleDelete();
            }}
          />
        </View>

        {plan.is_active && (
          <View className="self-center bg-cyan-900/50 px-3 py-1 rounded mb-3">
            <AppTextNC className="text-sm text-cyan-300">
              {t("gym:gym.plans.activePlan")}
            </AppTextNC>
          </View>
        )}

        {/* Progress */}
        {plan.is_active && (
          <View className="mb-5">
            <PlanProgressBar
              currentWeek={plan.current_week}
              totalWeeks={plan.total_weeks}
              currentPosition={plan.current_position}
              dayCount={plan.days.length}
            />
          </View>
        )}

        {/* Plan info */}
        <View className="mb-5 gap-1">
          <BodyText className="text-sm">
            {plan.total_weeks
              ? t("gym:gym.plans.weeksCount", { count: plan.total_weeks })
              : t("gym:gym.plans.infinite")}
            {" · "}
            {t("gym:gym.plans.daysCount", { count: plan.days.length })}
            {" · "}
            {t("gym:gym.plans.exercisesCount", { count: allExercises.length })}
          </BodyText>
        </View>

        {/* Muscle group distribution */}
        {allExercises.length > 0 && (
          <View className="mb-5">
            <MuscleGroupDistribution exercises={allExercises} />
          </View>
        )}

        {/* Days */}
        <AppText className="text-lg mb-3">{t("gym:gym.plans.daysSection")}</AppText>
        <View className="gap-3 mb-5">
          {plan.days.map((day) => (
            <PlanDayCard
              key={day.id}
              dayNumber={day.position + 1}
              label={day.label}
              exerciseCount={day.exercises.length}
              isCurrent={plan.is_active && day.position === plan.current_position}
            />
          ))}
        </View>

        {/* Targets by week */}
        {plan.days.some((d) => d.targets.length > 0) && (
          <View className="mb-5">
            <AppText className="text-lg mb-3">{t("gym:gym.plans.targets")}</AppText>

            {effectiveWeeks > 1 && (
              <View className="mb-3">
                <WeekSelector
                  totalWeeks={effectiveWeeks}
                  selectedWeek={selectedWeek}
                  onSelectWeek={setSelectedWeek}
                />
              </View>
            )}

            {plan.days.map((day) => {
              const weekTargets = day.targets.filter(
                (t) => t.week_number === selectedWeek,
              );
              if (weekTargets.length === 0) return null;

              // Group by exercise
              const exerciseGroups = new Map<string, typeof weekTargets>();
              weekTargets.forEach((tgt) => {
                const key = tgt.exercise_id;
                if (!exerciseGroups.has(key)) exerciseGroups.set(key, []);
                exerciseGroups.get(key)!.push(tgt);
              });

              return (
                <View key={day.id} className="border border-slate-700 rounded-lg p-3 gap-2 mb-3">
                  <AppTextNC className="text-sm text-slate-400">
                    {t("gym:gym.plans.day", { number: day.position + 1 })} — {day.label || t("gym:gym.plans.day", { number: day.position + 1 })}
                  </AppTextNC>

                  {Array.from(exerciseGroups.entries()).map(([exerciseId, sets]) => {
                    const exercise = day.exercises.find((e) => e.exercise_id === exerciseId);
                    return (
                      <View key={exerciseId} className="gap-1">
                        <AppTextNC className="text-cyan-400 text-sm">
                          {exercise?.name ?? exerciseId.slice(0, 8)}
                        </AppTextNC>
                        {sets
                          .sort((a, b) => a.set_number - b.set_number)
                          .map((set) => (
                            <View key={set.set_number} className="flex-row gap-3 pl-2">
                              <BodyTextNC className="text-slate-500 text-xs">
                                {t("gym:gym.plans.set")} {set.set_number}
                              </BodyTextNC>
                              {set.target_weight && (
                                <BodyTextNC className="text-slate-300 text-xs">
                                  {set.target_weight}kg
                                </BodyTextNC>
                              )}
                              {set.target_reps && (
                                <BodyTextNC className="text-slate-300 text-xs">
                                  ×{set.target_reps}
                                </BodyTextNC>
                              )}
                              {set.target_rpe && (
                                <BodyTextNC className="text-slate-300 text-xs">
                                  RPE {set.target_rpe}
                                </BodyTextNC>
                              )}
                            </View>
                          ))}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

      </PageContainer>
    </ScrollView>

    <View className="px-5 py-3 border-t border-slate-700">
      {plan.is_active ? (
        <AnimatedButton onPress={handleDeactivate} className="btn-neutral">
          <AppText className="text-center" numberOfLines={1}>
            {t("gym:gym.plans.deactivate")}
          </AppText>
        </AnimatedButton>
      ) : (
        <AnimatedButton onPress={handleActivate} className="btn-start">
          <AppText className="text-center" numberOfLines={1}>
            {t("gym:gym.plans.activate")}
          </AppText>
        </AnimatedButton>
      )}
    </View>
    </View>
  );
}
