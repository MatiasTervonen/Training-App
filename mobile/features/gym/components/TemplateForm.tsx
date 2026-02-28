import {
  Pressable,
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
} from "@/types/session";
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
    };
    AsyncStorage.setItem(storageKey, JSON.stringify(sessionDraft));
  }, [exercises, workoutName, storageKey]);

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

  const isCardioExercise = (exercise: ExerciseEntry) =>
    (exercise.main_group || "").toLowerCase() === "cardio";

  // useAddExercise hook to add an exercise

  const { handleAddExercise } = useAddExercise({
    exerciseType,
    supersetExercise,
    normalExercises,
    setExercises,
    setSupersetExercise,
    setNormalExercises,
    setExerciseInputs,
    isCardioExercise,
  });

  // useSaveTemplate hook to save the template

  const { handleSaveTemplate } = useSaveTemplate({
    workoutName,
    exercises,
    setIsSaving,
    resetSession,
    templateId: templateId || "",
  });

  // useLogSetForExercise hook to log the set for the exercise. not used in this component.

  const { logSetForExercise } = useLogSetForExercise({
    exercises,
    exerciseInputs,
    setExerciseInputs,
    setExercises,
  });

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
              <View className="mb-10">
                <AppInput
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder={t("gym.templateForm.workoutNamePlaceholder")}
                  label={t("gym.templateForm.workoutNameLabel")}
                />
              </View>
            </View>
            <View>
              {Object.entries(groupedExercises).map(([superset_id, group]) => (
                <LinearGradient
                  key={superset_id}
                  colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                  start={{ x: 1, y: 0 }} // bottom-left
                  end={{ x: 0, y: 1 }} // top-right
                  className={`mt-5 rounded-md overflow-hidden  ${
                    group.length > 1
                      ? "border-2 border-blue-700"
                      : "border-2 border-gray-600"
                  }`}
                >
                  {group.length > 1 && (
                    <AppText className="text-lg text-gray-100 my-2 text-center">
                      {t("gym.templateForm.superSetLabel")}
                    </AppText>
                  )}
                  {group.map(({ exercise, index }) => {
                    return (
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
                              title: "Delete Exercise",
                              message:
                                "Are you sure you want to delete this exercise from the template?",
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
                    );
                  })}
                </LinearGradient>
              ))}
            </View>
            <FullScreenModal
              isOpen={isExerciseModalOpen}
              onClose={() => {
                setIsExerciseModalOpen(false);
              }}
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
                <Pressable
                  onPress={() => {
                    handleAddExercise();
                    setIsExerciseModalOpen(false);
                  }}
                  className="justify-center items-center w-1/2 px-2 bg-blue-800 rounded-md shadow-md border-2 border-blue-500 text-gray-100 text-lg"
                >
                  <AppText>
                    {exerciseType === "Super-Set"
                      ? t("gym.templateForm.addSuperSet")
                      : t("gym.templateForm.addExercise")}
                  </AppText>
                </Pressable>
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
                className="btn-base flex-row justify-center items-center gap-3 px-10"
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
      <FullScreenLoader
        visible={isSaving}
        message={t("gym.templateForm.savingTemplate")}
      />
    </>
  );
}
