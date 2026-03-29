import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChartNoAxesCombined, History } from "lucide-react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import FullScreenModal from "@/components/FullScreenModal";
import WeekSelector from "@/features/gym/plans/components/WeekSelector";
import TargetSetRow from "@/features/gym/plans/components/TargetSetRow";
import type usePlanForm from "@/features/gym/plans/hooks/usePlanForm";

type PlanForm = ReturnType<typeof usePlanForm>;

type Props = {
  form: PlanForm;
  noEndDate: boolean;
};

export default function PlanTargetsEditor({ form, noEndDate }: Props) {
  const { t } = useTranslation(["gym", "common"]);
  const currentWeek = noEndDate ? 1 : form.selectedWeek;

  return (
    <View className="gap-4">
      {!noEndDate && form.effectiveWeeks > 1 && (
        <View className="gap-2">
          <WeekSelector
            totalWeeks={form.effectiveWeeks}
            selectedWeek={form.selectedWeek}
            onSelectWeek={form.setSelectedWeek}
          />
          {form.selectedWeek > 1 && (
            <AnimatedButton
              onPress={() => form.duplicateWeek(form.selectedWeek - 1, form.selectedWeek)}
              className="btn-neutral self-start"
            >
              <AppText className="text-sm" numberOfLines={1}>
                {t("gym:gym.plans.duplicateWeek")} {form.selectedWeek - 1} → {form.selectedWeek}
              </AppText>
            </AnimatedButton>
          )}
        </View>
      )}

      {form.days.map((day) => {
        const dayTargets = form.getTargetsForDayWeek(day.position, currentWeek);

        return (
          <View key={`targets-day-${day.position}`} className="border border-slate-700 rounded-lg p-3 gap-3">
            <AppText className="text-base">
              {t("gym:gym.plans.day", { number: day.position + 1 })} — {day.label || t("gym:gym.plans.day", { number: day.position + 1 })}
            </AppText>

            {dayTargets.map((target) => (
              <View key={`${target.exercise_id}-${target.week_number}`} className="gap-1">
                <View className="flex-row items-center justify-between">
                  <AppTextNC className="text-cyan-400 text-sm flex-1" numberOfLines={1}>
                    {target.exercise_name}
                  </AppTextNC>
                  <View className="flex-row items-center gap-2">
                    <AnimatedButton
                      onPress={() => form.setHistoryExerciseId(target.exercise_id)}
                      className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5"
                    >
                      <History size={14} color="#94a3b8" />
                    </AnimatedButton>
                    {!noEndDate && form.effectiveWeeks > 1 && form.selectedWeek === 1 && (
                      <AnimatedButton
                        onPress={() => {
                          form.setProgressionExercise({
                            dayPos: day.position,
                            exId: target.exercise_id,
                            exName: target.exercise_name,
                          });
                          form.setProgressionWeightInc("2.5");
                          form.setProgressionRepsInc("0");
                          form.setShowProgressionModal(true);
                        }}
                        className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5"
                      >
                        <ChartNoAxesCombined size={14} color="#94a3b8" />
                      </AnimatedButton>
                    )}
                  </View>
                </View>

                {/* Header row */}
                <View className="flex-row items-center mb-2">
                  <View className="flex-1 items-center">
                    <AppTextNC className="text-slate-500 text-xs" numberOfLines={1}>
                      {t("gym:gym.plans.set")}
                    </AppTextNC>
                  </View>
                  <View className="flex-1 items-center">
                    <AppTextNC className="text-slate-500 text-xs" numberOfLines={1}>
                      {t("gym:gym.plans.weight")}
                    </AppTextNC>
                  </View>
                  <View className="flex-1 items-center">
                    <AppTextNC className="text-slate-500 text-xs" numberOfLines={1}>
                      {t("gym:gym.plans.reps")}
                    </AppTextNC>
                  </View>
                  <View className="flex-1 items-center">
                    <AppTextNC className="text-slate-500 text-xs" numberOfLines={1}>
                      {t("gym:gym.plans.rpe")}
                    </AppTextNC>
                  </View>
                  <View className="w-8" />
                </View>

                {target.sets.map((set, setIdx) => (
                  <TargetSetRow
                    key={set.id}
                    setNumber={setIdx + 1}
                    value={set}
                    onChange={(field, value) =>
                      form.updateTargetSet(day.position, currentWeek, target.exercise_id, setIdx, field, value)
                    }
                    onDelete={() =>
                      form.deleteTargetSet(day.position, currentWeek, target.exercise_id, setIdx)
                    }
                  />
                ))}

                <AnimatedButton
                  onPress={() => form.addTargetSet(day.position, currentWeek, target.exercise_id)}
                  className="self-start mt-1"
                >
                  <AppTextNC className="text-cyan-500 text-xs">
                    + {t("gym:gym.plans.addSet")}
                  </AppTextNC>
                </AnimatedButton>
              </View>
            ))}

            {dayTargets.length === 0 && (
              <BodyText className="text-sm">
                {t("gym:gym.plans.noTargets")}
              </BodyText>
            )}
          </View>
        );
      })}

      {/* Progression modal */}
      {form.showProgressionModal && form.progressionExercise && (
        <FullScreenModal
          isOpen={true}
          onClose={() => form.setShowProgressionModal(false)}
          scrollable={true}
        >
          <View className="px-5 pt-5 gap-5">
            <AppText className="text-xl text-center">
              {t("gym:gym.plans.progressionTitle")}
            </AppText>
            <BodyText className="text-center text-sm">
              {form.progressionExercise.exName}
            </BodyText>

            <AppInput
              value={form.progressionWeightInc}
              setValue={form.setProgressionWeightInc}
              label={t("gym:gym.plans.weightIncrement")}
              keyboardType="numeric"
              placeholder="2.5"
            />

            <AppInput
              value={form.progressionRepsInc}
              setValue={form.setProgressionRepsInc}
              label={t("gym:gym.plans.repsIncrement")}
              keyboardType="numeric"
              placeholder="0"
            />

            <BodyText className="text-xs text-center">
              {t("gym:gym.plans.progressionDesc")}
            </BodyText>

            <AnimatedButton onPress={form.applyProgression} className="btn-save">
              <AppText className="text-center" numberOfLines={1}>
                {t("gym:gym.plans.applyProgression")}
              </AppText>
            </AnimatedButton>
          </View>
        </FullScreenModal>
      )}
    </View>
  );
}
