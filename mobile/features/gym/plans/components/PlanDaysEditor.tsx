import { View, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { Plus, Download, Trash2, ArrowLeftRight, Timer, ChevronDown, ChevronUp } from "lucide-react-native";
import DraggableList from "@/components/DraggableList";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import FullScreenModal from "@/components/FullScreenModal";
import ExerciseDropdown from "@/features/gym/components/ExerciseDropdown";
import MuscleGroupDistribution from "@/features/gym/plans/components/MuscleGroupDistribution";
import type usePlanForm from "@/features/gym/plans/hooks/usePlanForm";

type PlanForm = ReturnType<typeof usePlanForm>;

type Props = {
  form: PlanForm;
};

export default function PlanDaysEditor({ form }: Props) {
  const { t } = useTranslation(["gym", "common"]);

  return (
    <View className="gap-5">
      <DraggableList
        items={form.days}
        keyExtractor={(day) => `day-${day.position}`}
        onReorder={form.reorderDays}
        renderItem={(day) => {
          const isCollapsed = form.collapsedDays.has(day.position);
          return (
            <View className="border border-slate-700 rounded-lg p-3 gap-3 mb-3">
              {/* Day header */}
              <View className="flex-row items-center justify-between gap-3">
                <AnimatedButton
                  onPress={() => form.toggleDayCollapse(day.position)}
                  className="flex-row items-center gap-1 flex-1"
                >
                  {isCollapsed ? (
                    <ChevronDown size={18} color="#94a3b8" />
                  ) : (
                    <ChevronUp size={18} color="#94a3b8" />
                  )}
                  <AppText className="text-base">
                    {t("gym:gym.plans.day", { number: day.position + 1 })}
                  </AppText>
                  {isCollapsed && day.label ? (
                    <AppTextNC className="text-slate-500 text-sm ml-1 flex-1" numberOfLines={1}>
                      — {day.label}
                    </AppTextNC>
                  ) : null}
                  {isCollapsed && (
                    <AppTextNC className="text-slate-600 text-xs ml-1">
                      {day.exercises.length}
                    </AppTextNC>
                  )}
                </AnimatedButton>
                <AnimatedButton onPress={() => form.removeDay(day.position)} hitSlop={10}>
                  <Trash2 size={18} color="#ef4444" />
                </AnimatedButton>
              </View>

              {!isCollapsed && (
                <>
                  <AppInput
                    value={day.label}
                    setValue={(v) => form.updateDayLabel(day.position, v)}
                    placeholder={t("gym:gym.plans.dayLabelPlaceholder")}
                  />

                  {/* Day-level default rest timer */}
                  <View className="flex-row items-center gap-2">
                    <Timer size={14} color="#64748b" />
                    <TextInput
                      value={day.rest_timer_seconds != null ? String(day.rest_timer_seconds) : ""}
                      onChangeText={(val) => form.updateDayRestTimer(day.position, val)}
                      placeholder={t("gym:gym.plans.dayRestTimerPlaceholder")}
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      className="flex-1 bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-gray-100 text-sm font-lexend"
                    />
                  </View>

                  {/* Exercise list — draggable */}
                  <DraggableList
                    items={day.exercises}
                    keyExtractor={(ex) => `${day.position}-${ex.exercise_id}-${ex.position}`}
                    onReorder={(reordered) => form.reorderExercisesInDay(day.position, reordered)}
                    renderItem={(ex) => (
                      <View className="bg-slate-800/50 rounded-md px-3 py-2 mb-2">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 mr-2">
                            <BodyText className="text-sm" numberOfLines={1}>{ex.name}</BodyText>
                            <AppTextNC className="text-xs text-slate-500" numberOfLines={1}>
                              {ex.muscle_group ? t(`gym:gym.muscleGroups.${ex.muscle_group}`) : ""}{ex.equipment ? ` · ${t(`gym:gym.equipment.${ex.equipment}`)}` : ""}
                            </AppTextNC>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <AnimatedButton onPress={() => {
                              form.setSwapExercise({ dayPos: day.position, exPos: ex.position });
                              form.setShowExercisePicker(true);
                            }} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5">
                              <ArrowLeftRight size={14} color="#60a5fa" />
                            </AnimatedButton>
                            <AnimatedButton onPress={() => form.removeExerciseFromDay(day.position, ex.position)} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5">
                              <Trash2 size={14} color="#ef4444" />
                            </AnimatedButton>
                          </View>
                        </View>
                        {/* Rest timer */}
                        <View className="flex-row items-center gap-2 mt-1">
                          <Timer size={12} color="#64748b" />
                          <TextInput
                            value={ex.rest_timer_seconds != null ? String(ex.rest_timer_seconds) : ""}
                            onChangeText={(val) => {
                              if (val === "") {
                                form.updateExerciseRestTimer(day.position, ex.position, null);
                              } else if (/^\d+$/.test(val)) {
                                form.updateExerciseRestTimer(day.position, ex.position, Number(val));
                              }
                            }}
                            placeholder={t("gym:gym.plans.restTimerPlaceholder")}
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            className="flex-1 bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-gray-100 text-sm font-lexend"
                          />
                        </View>
                      </View>
                    )}
                  />

                  {/* Add exercise + Import from template */}
                  <View className="flex-row gap-2">
                    <AnimatedButton
                      onPress={() => {
                        form.setActiveDayPosition(day.position);
                        form.setShowExercisePicker(true);
                      }}
                      className="flex-1"
                    >
                      <View className="flex-row items-center justify-center gap-1">
                        <Plus size={14} color="#22d3ee" />
                        <AppTextNC className="text-cyan-500 text-xs">
                          {t("gym:gym.plans.addExercise")}
                        </AppTextNC>
                      </View>
                    </AnimatedButton>
                    <AnimatedButton
                      onPress={() => {
                        form.setActiveDayPosition(day.position);
                        form.setShowTemplatePicker(true);
                      }}
                      className="flex-1"
                    >
                      <View className="flex-row items-center justify-center gap-1">
                        <Download size={14} color="#22d3ee" />
                        <AppTextNC className="text-cyan-500 text-xs">
                          {t("gym:gym.plans.importTemplate")}
                        </AppTextNC>
                      </View>
                    </AnimatedButton>
                  </View>
                </>
              )}
            </View>
          );
        }}
      />

      {/* Add day button */}
      <AnimatedButton onPress={form.addDay} className="btn-add">
        <View className="flex-row items-center justify-center gap-2">
          <Plus size={18} color="#f3f4f6" />
          <AppText className="text-base text-center" numberOfLines={1}>
            {t("gym:gym.plans.addDay")}
          </AppText>
        </View>
      </AnimatedButton>

      {/* Muscle group distribution */}
      {form.allExercises.length > 0 && (
        <MuscleGroupDistribution exercises={form.allExercises} />
      )}

      {/* Exercise picker modal */}
      {form.showExercisePicker && (
        <FullScreenModal
          isOpen={true}
          onClose={() => { form.setShowExercisePicker(false); form.setSwapExercise(null); }}
          scrollable={false}
        >
          <ExerciseDropdown onSelect={form.handleExerciseSelect} />
        </FullScreenModal>
      )}

      {/* Template picker modal */}
      {form.showTemplatePicker && (
        <FullScreenModal
          isOpen={true}
          onClose={() => form.setShowTemplatePicker(false)}
          scrollable={true}
        >
          <View className="px-5 pt-5 gap-3">
            <AppText className="text-xl text-center mb-3">
              {t("gym:gym.plans.selectTemplate")}
            </AppText>
            {form.templates.map((template) => (
              <AnimatedButton
                key={template.id}
                onPress={() => form.importFromTemplate(template.id)}
                className="border border-slate-700 rounded-md px-4 py-3 bg-slate-800/50"
              >
                <AppText numberOfLines={1}>{template.name}</AppText>
              </AnimatedButton>
            ))}
            {form.templates.length === 0 && (
              <BodyText className="text-center mt-5">
                {t("gym:gym.TemplatesScreen.noTemplates")}
              </BodyText>
            )}
          </View>
        </FullScreenModal>
      )}
    </View>
  );
}
