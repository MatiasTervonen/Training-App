import {
  ScrollView,
  TouchableWithoutFeedback,
  View,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import AppText from "@/components/AppText";
import { useRouter, useLocalSearchParams } from "expo-router";
import AppInput from "@/components/AppInput";
import { useState, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react-native";
import FullScreenModal from "@/components/FullScreenModal";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import {
  ExerciseEntry,
  emptyExerciseEntry,
  ExerciseInput,
  TemplatePhaseData,
  PhaseType,
} from "@/types/session";
import { activities_with_category } from "@/types/models";
import ExerciseHistoryModal from "@/features/gym/components/ExerciseHistoryModal";
import FullScreenLoader from "@/components/FullScreenLoader";
import GroupGymExercises from "@/features/gym/lib/GroupGymExercises";
import ExerciseCard from "@/features/gym/components/ExerciseCard";
import ExerciseSelectorList from "@/features/gym/components/ExerciseSelectorList";
import { useQuery } from "@tanstack/react-query";
import { getFullTemplate } from "@/database/gym/get-full-template";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import SelectInput from "@/components/Selectinput";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useConfirmAction } from "@/lib/confirmAction";
import PageContainer from "@/components/PageContainer";
import useAddExercise from "@/features/gym/hooks/template/useAddExercise";
import useSaveTemplate from "@/features/gym/hooks/template/useSaveTemplate";
import useLogSetForExercise from "@/features/gym/hooks/template/useLogSetForExercise";
import { useTranslation } from "react-i18next";

import AnimatedButton from "@/components/buttons/animatedButton";
import DraggableList from "@/components/DraggableList";
import PhaseCard from "@/features/gym/components/PhaseCard";
import PhaseActivityPicker from "@/features/gym/components/PhaseActivityPicker";

export default function TemplateForm() {
  const confirmAction = useConfirmAction();
  const { t } = useTranslation("gym");
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null,
  );
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [templateRestTimerSeconds, setTemplateRestTimerSeconds] = useState<
    number | null
  >(null);

  // Phase state for templates
  const [warmup, setWarmup] = useState<TemplatePhaseData | null>(null);
  const [cooldown, setCooldown] = useState<TemplatePhaseData | null>(null);
  const [phasePickerOpen, setPhasePickerOpen] = useState(false);
  const [phasePickerType, setPhasePickerType] = useState<PhaseType>("warmup");

  const { id } = useLocalSearchParams<{ id?: string }>();
  const templateId = id;
  const storageKey = templateId
    ? `gym_template_draft_${templateId}` // editing
    : "gym_template_draft_new"; // creating

  const groupedExercises = GroupGymExercises(exercises);

  const router = useRouter();

  const resetSession = () => {
    setNormalExercises([]);
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setWorkoutName("");
    setNormalExercises([]);
    setWarmup(null);
    setCooldown(null);
    AsyncStorage.removeItem(storageKey);
  };

  // Remove draft when leaving the edit page without saving

  useEffect(() => {
    return () => {
      if (templateId) {
        AsyncStorage.removeItem(storageKey);
      }
    };
  }, [templateId, storageKey]);

  useEffect(() => {
    if (exercises.length === 0 && workoutName.trim() === "") {
      AsyncStorage.removeItem(storageKey);
      return;
    }

    const sessionDraft = {
      title: workoutName,
      exercises,
      warmup,
      cooldown,
      templateRestTimerSeconds,
    };
    AsyncStorage.setItem(storageKey, JSON.stringify(sessionDraft));
  }, [exercises, workoutName, storageKey, warmup, cooldown, templateRestTimerSeconds]);

  // Load existing template when editing

  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ["full_gym_template", templateId],
    queryFn: async () => {
      if (!templateId) throw new Error("No template ID");

      return await getFullTemplate(templateId);
    },
  });

  useEffect(() => {
    if (existingTemplate) {
      setWorkoutName(existingTemplate.name);
      setTemplateRestTimerSeconds(
        (existingTemplate as typeof existingTemplate & { rest_timer_seconds?: number | null }).rest_timer_seconds ?? null,
      );

      const mappedExercises = existingTemplate.gym_template_exercises.map(
        (ex) => ({
          exercise_id: ex.exercise_id,
          name: ex.gym_exercises.name,
          equipment: ex.gym_exercises.equipment,
          main_group: ex.gym_exercises.main_group,
          muscle_group: ex.gym_exercises.muscle_group,
          sets: Array.from({ length: ex.position ?? 0 }).map(() => ({
            reps: undefined,
            weight: undefined,
            rpe: undefined,
          })),
          superset_id: ex.superset_id,
          rest_timer_seconds: (ex as typeof ex & { rest_timer_seconds?: number | null }).rest_timer_seconds ?? null,
        }),
      );

      setExercises(mappedExercises);

      setExerciseInputs(
        mappedExercises.map(() => ({
          weight: "",
          reps: "",
          rpe: "Medium",
        })),
      );

      // Load template phases
      const templatePhases = (existingTemplate as typeof existingTemplate & {
        gym_template_phases?: {
          phase_type: string;
          activity_id: string;
          activities: { name: string; slug: string | null; base_met: number } | null;
        }[];
      }).gym_template_phases;

      if (templatePhases) {
        const wp = templatePhases.find((p) => p.phase_type === "warmup");
        if (wp?.activities) {
          setWarmup({
            phase_type: "warmup",
            activity_id: wp.activity_id,
            activity_name: wp.activities.name,
            activity_slug: wp.activities.slug,
            activity_met: wp.activities.base_met,
          });
        }
        const cd = templatePhases.find((p) => p.phase_type === "cooldown");
        if (cd?.activities) {
          setCooldown({
            phase_type: "cooldown",
            activity_id: cd.activity_id,
            activity_name: cd.activities.name,
            activity_slug: cd.activities.slug,
            activity_met: cd.activities.base_met,
          });
        }
      }
    }
  }, [existingTemplate]);

  const {
    data: history,
    error: historyError,
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ["exercise_history", exerciseHistoryId],
    queryFn: async () => {
      if (!exerciseHistoryId) return [];
      return await getLastExerciseHistory({ exerciseId: exerciseHistoryId });
    },
  });

  const openHistory = (exerciseId: string) => {
    setExerciseHistoryId(exerciseId);
    setIsHistoryOpen(true);
  };

  // useAddExercise hook to add an exercise

  const { handleAddExercise } = useAddExercise({
    exerciseType,
    supersetExercise,
    normalExercises,
    setExercises,
    setSupersetExercise,
    setNormalExercises,
    setExerciseInputs,
  });

  // useSaveTemplate hook to save the template

  const { handleSaveTemplate } = useSaveTemplate({
    workoutName,
    exercises,
    setIsSaving,
    resetSession,
    templateId: templateId || "",
    warmup,
    cooldown,
    templateRestTimerSeconds,
  });

  // useLogSetForExercise hook to log the set for the exercise. not used in this component.

  const { logSetForExercise } = useLogSetForExercise({
    exercises,
    exerciseInputs,
    setExerciseInputs,
    setExercises,
  });

  const handlePhaseSelect = (phaseType: PhaseType) => {
    setPhasePickerType(phaseType);
    setPhasePickerOpen(true);
    setIsExerciseModalOpen(false);
  };

  const handleTemplatePhaseSelected = (activity: activities_with_category) => {
    const phase: TemplatePhaseData = {
      phase_type: phasePickerType,
      activity_id: activity.id,
      activity_name: activity.name,
      activity_slug: activity.slug ?? null,
      activity_met: activity.base_met,
    };

    if (phasePickerType === "warmup") {
      setWarmup(phase);
    } else {
      setCooldown(phase);
    }
  };

  if (templateId && (isLoading || !existingTemplate)) {
    return (
      <View className="flex-1 items-center justify-center">
        <AppText className="mb-4 text-lg">
          {t("gym.templateForm.loadingTemplate")}
        </AppText>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView
          scrollEnabled={isScrollEnabled}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <PageContainer className="justify-between">
            <View>
              <AppText className="text-2xl text-center mb-5">
                {templateId
                  ? t("gym.templateForm.titleEdit")
                  : t("gym.templateForm.titleCreate")}
              </AppText>
              <View className="mb-5">
                <AppInput
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder={t("gym.templateForm.workoutNamePlaceholder")}
                  label={t("gym.templateForm.workoutNameLabel")}
                />
              </View>
              <View className="mb-10">
                <AppInput
                  value={
                    templateRestTimerSeconds != null
                      ? String(templateRestTimerSeconds)
                      : ""
                  }
                  onChangeText={(val) => {
                    if (val === "") {
                      setTemplateRestTimerSeconds(null);
                    } else if (/^\d+$/.test(val)) {
                      setTemplateRestTimerSeconds(Number(val));
                    }
                  }}
                  placeholder={t("gym.templateForm.restTimerPlaceholder")}
                  label={t("gym.templateForm.restTimerLabel")}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
            {/* Warm-up Phase Card (template mode) */}
            {warmup && (
              <View className="mt-5">
                <PhaseCard
                  mode="template"
                  phase={warmup}
                  onRemove={() => setWarmup(null)}
                  onChangeActivity={() => {
                    setPhasePickerType("warmup");
                    setPhasePickerOpen(true);
                  }}
                />
              </View>
            )}

            <DraggableList
              items={Object.entries(groupedExercises)}
              keyExtractor={([, group], index) =>
                `${group.map((g) => g.exercise.exercise_id).join("-")}-${index}`
              }
              onDragStart={() => setIsScrollEnabled(false)}
              onDragEnd={() => setIsScrollEnabled(true)}
              onReorder={(reordered) => {
                const flatExercises = reordered.flatMap(([, group]) =>
                  group.map((g) => g.exercise),
                );
                const flatInputs = reordered.flatMap(([, group]) =>
                  group.map((g) => exerciseInputs[g.index]),
                );
                setExercises(flatExercises);
                setExerciseInputs(flatInputs);
              }}
              renderItem={([superset_id, group]) => (
                <LinearGradient
                  colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className={`mt-5 rounded-md overflow-hidden ${
                    group.length > 1
                      ? "border-[1.5px] border-blue-700"
                      : "border-[1.5px] border-gray-600"
                  }`}
                >
                  {group.length > 1 && (
                    <AppText className="text-lg my-2 text-center">
                      {t("gym.templateForm.superSetLabel")}
                    </AppText>
                  )}
                  {group.map(({ exercise, index }) => (
                    <View key={exercise.exercise_id}>
                      <ExerciseCard
                        exercise={exercise}
                        lastExerciseHistory={(index) => {
                          const ex = exercises[index];
                          if (ex.exercise_id) {
                            openHistory(ex.exercise_id);
                          }
                        }}
                        onChangeExercise={(index) => {
                          setExerciseToChangeIndex(index);
                          setSupersetExercise([emptyExerciseEntry]);
                          setNormalExercises([emptyExerciseEntry]);
                          setIsExerciseModalOpen(true);
                        }}
                        index={index}
                        input={exerciseInputs[index]}
                        onInputChange={(index, field, value) => {
                          const updatedInputs = [...exerciseInputs];
                          updatedInputs[index] = {
                            ...updatedInputs[index],
                            [field]: value,
                          };
                          setExerciseInputs(updatedInputs);
                        }}
                        onAddSet={(index) => logSetForExercise(index)}
                        onDeleteSet={(index, setIndex) => {
                          const updated = [...exercises];
                          updated[index].sets.splice(setIndex, 1);
                          setExercises(updated);
                        }}
                        onUpdateExercise={(index, updatedExercise) => {
                          const updated = [...exercises];
                          updated[index] = updatedExercise;
                          setExercises(updated);
                        }}
                        onDeleteExercise={async (index) => {
                          const confirmDelete = await confirmAction({
                            title: t("gym.templateForm.deleteExerciseConfirm.title"),
                            message: t("gym.templateForm.deleteExerciseConfirm.message"),
                          });
                          if (!confirmDelete) return;

                          const updated = exercises.filter(
                            (_, i) => i !== index,
                          );
                          setExercises(updated);

                          const sessionDraft = {
                            title: workoutName,
                            exercises: updated,
                          };
                          AsyncStorage.setItem(
                            storageKey,
                            JSON.stringify(sessionDraft),
                          );
                        }}
                      />
                    </View>
                  ))}
                </LinearGradient>
              )}
            />

            {/* Cool-down Phase Card (template mode) */}
            {cooldown && (
              <View className="mt-5">
                <PhaseCard
                  mode="template"
                  phase={cooldown}
                  onRemove={() => setCooldown(null)}
                  onChangeActivity={() => {
                    setPhasePickerType("cooldown");
                    setPhasePickerOpen(true);
                  }}
                />
              </View>
            )}

            <FullScreenModal
              isOpen={isExerciseModalOpen}
              onClose={() => {
                setIsExerciseModalOpen(false);
              }}
              scrollable={false}
            >
              <ExerciseSelectorList
                draftExercises={
                  exerciseType === "Super-Set"
                    ? supersetExercise
                    : normalExercises
                }
                setDraftExercises={
                  exerciseType === "Super-Set"
                    ? setSupersetExercise
                    : setNormalExercises
                }
                exerciseToChangeIndex={exerciseToChangeIndex}
                setExerciseToChangeIndex={setExerciseToChangeIndex}
                exercises={exercises}
                setExercises={setExercises}
                setIsExerciseModalOpen={setIsExerciseModalOpen}
                hasWarmup={!!warmup}
                hasCooldown={!!cooldown}
                onSelectPhase={handlePhaseSelect}
              />
              <View className="flex-row gap-3 px-2 mt-5 mb-10 right-0 z-50">
                <View className="relative flex-1">
                  <SelectInput
                    value={exerciseType}
                    onChange={(value) => {
                      const type = value;
                      setExerciseType(type);
                      if (type === "Normal") {
                        setSupersetExercise([]);
                      } else if (type === "Super-Set") {
                        setSupersetExercise([emptyExerciseEntry]);
                      }
                    }}
                    options={[
                      {
                        label: t("gym.templateForm.exerciseType.normal"),
                        value: "Normal",
                      },
                      {
                        label: t("gym.templateForm.exerciseType.superSet"),
                        value: "Super-Set",
                      },
                    ]}
                  />
                  <View className="absolute top-1/2 bottom-1/2 right-4 flex-row  items-center">
                    <ChevronDown className="text-gray-100" color="#f3f4f6" />
                  </View>
                </View>
                <AnimatedButton
                  onPress={() => {
                    handleAddExercise();
                    setIsExerciseModalOpen(false);
                  }}
                  className="justify-center items-center w-1/2 btn-add"
                >
                  <AppText>
                    {exerciseType === "Super-Set"
                      ? t("gym.templateForm.addSuperSet")
                      : t("gym.templateForm.addExercise")}
                  </AppText>
                </AnimatedButton>
              </View>
            </FullScreenModal>

            <ExerciseHistoryModal
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              isLoading={isHistoryLoading}
              history={Array.isArray(history) ? history : []}
              error={historyError ? historyError.message : null}
            />

            <View className="flex-row items-center justify-center gap-5 mt-10">
              <AnimatedButton
                onPress={() => {
                  setExerciseType("Normal");
                  setSupersetExercise([emptyExerciseEntry]);
                  setNormalExercises([emptyExerciseEntry]);
                  setIsExerciseModalOpen(true);
                }}
                label={t("gym.templateForm.addExercise")}
                className="btn-add flex-row justify-center items-center"
                textClassName="px-4"
              >
                <Plus size={20} color="#f3f4f6" />
              </AnimatedButton>
            </View>
            <View className="flex-row gap-4 mt-14">
              <View className="flex-1">
                {templateId ? (
                  <DeleteButton
                    confirm={false}
                    label={t("common:common.cancel")}
                    onPress={() => router.push("/gym/templates")}
                  />
                ) : (
                  <DeleteButton onPress={resetSession} />
                )}
              </View>
              <View className="flex-1">
                <SaveButton
                  disabled={exercises.length === 0}
                  onPress={handleSaveTemplate}
                />
              </View>
            </View>
          </PageContainer>
        </ScrollView>
      </TouchableWithoutFeedback>
      <PhaseActivityPicker
        isOpen={phasePickerOpen}
        onClose={() => setPhasePickerOpen(false)}
        phaseType={phasePickerType}
        isTemplate
        onSelect={() => {}}
        onSelectTemplate={handleTemplatePhaseSelected}
      />
      <FullScreenLoader
        visible={isSaving}
        message={t("gym.templateForm.savingTemplate")}
      />
    </>
  );
}
