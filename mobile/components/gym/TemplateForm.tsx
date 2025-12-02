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
import ExerciseHistoryModal from "@/components/gym/ExerciseHistoryModal";
import * as crypto from "expo-crypto";
import FullScreenLoader from "@/components/FullScreenLoader";
import GroupGymExercises from "@/components/gym/lib/GroupGymExercises";
import ExerciseCard from "@/components/gym/ExerciseCard";
import ExerciseSelectorList from "@/components/gym/ExerciseSelectorList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import GetFullTemplate from "@/database/gym/get-full-template";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import SelectInput from "@/components/Selectinput";
import { saveTemplate } from "@/database/gym/save-template";
import { editTemplate } from "@/database/gym/edit-template";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { confirmAction } from "@/lib/confirmAction";
import AppButton from "@/components/buttons/AppButton";
import PageContainer from "../PageContainer";

export default function TemplateForm() {
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [dropdownResetKey, setDropdownResetKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null
  );

  const { id } = useLocalSearchParams<{ id?: string }>();
  const templateId = id;
  const storageKey = templateId
    ? `gym_template_draft_${templateId}` // editing
    : "gym_template_draft_new"; // creating

  const groupedExercises = GroupGymExercises(exercises);

  const router = useRouter();

  const queryClient = useQueryClient();

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

      return await GetFullTemplate(templateId);
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (existingTemplate) {
      setWorkoutName(existingTemplate.name);

      const mappedExercises = existingTemplate.gym_template_exercises.map(
        (ex: any) => ({
          exercise_id: ex.exercise_id,
          name: ex.gym_exercises.name,
          equipment: ex.gym_exercises.equipment,
          main_group: ex.gym_exercises.main_group,
          muscle_group: ex.gym_exercises.muscle_group,
          sets: Array.from({ length: ex.sets ?? 0 }).map(() => ({
            reps: ex.reps ?? undefined,
            weight: undefined,
            rpe: undefined,
          })),
          superset_id: ex.superset_id,
        })
      );

      setExercises(mappedExercises);

      setExerciseInputs(
        mappedExercises.map(() => ({
          weight: "",
          reps: "",
          rpe: "Medium",
        }))
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
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const openHistory = (exerciseId: string) => {
    setExerciseHistoryId(exerciseId);
    setIsHistoryOpen(true);
  };

  const isCardioExercise = (exercise: ExerciseEntry) =>
    (exercise.main_group || "").toLowerCase() === "cardio";

  const handleAddExercise = () => {
    const newSupersetId = crypto.randomUUID();

    if (exerciseType === "Super-Set") {
      const validExercises = supersetExercise.filter(
        (ex) => ex && typeof ex.name === "string" && ex.name.trim() !== ""
      );
      if (validExercises.length === 0) return;

      const newGroup = validExercises.map((ex) => ({
        ...ex,
        superset_id: newSupersetId,
      }));

      setExercises((prev) => [...prev, ...newGroup]);
      setExerciseInputs((prev) => [
        ...prev,
        ...newGroup.map((ex) => ({
          weight: "",
          reps: "",
          rpe: isCardioExercise(ex) ? "Warm-up" : "Medium",
        })),
      ]);
      setSupersetExercise([]);
    } else {
      const validNormal = normalExercises.filter(
        (ex) => ex.name && ex.name.trim() !== ""
      );
      if (validNormal.length === 0) return;

      const updated = validNormal.map((ex) => ({
        ...ex,
        superset_id: crypto.randomUUID(),
      }));

      setExercises((prev) => [...prev, ...updated]);
      setExerciseInputs((prev) => [
        ...prev,
        ...updated.map((ex) => ({
          weight: "",
          reps: "",
          rpe: isCardioExercise(ex) ? "Warm-up" : "Medium",
        })),
      ]);
      setNormalExercises([]);
    }

    setDropdownResetKey((prev) => prev + 1); // Reset dropdown
  };

  const handleSaveTemplate = async () => {
    if (workoutName.trim() === "" || exercises.length === 0) return;

    setIsSaving(true);

    const simplified = exercises.map((ex) => ({
      template_id: templateId || "",
      exercise_id: ex.exercise_id,
      position: 0,
      superset_id: ex.superset_id,
    }));

    const updated = new Date().toISOString();

    try {
      if (templateId) {
        await editTemplate({
          id: templateId,
          exercises: simplified,
          name: workoutName,
          updated_at: updated,
        });
      } else {
        await saveTemplate({
          exercises: simplified,
          name: workoutName,
        });
      }

      if (templateId) {
        await queryClient.refetchQueries({
          queryKey: ["full_gym_template", templateId],
          exact: true,
        });
      } else {
        await queryClient.refetchQueries({
          queryKey: ["get-templates"],
          exact: true,
        });
      }

      router.push("/training/templates");
      resetSession();
      Toast.show({
        type: "success",
        text1: "Template saved",
        text2: "Template has been saved successfully.",
      });
    } catch {
      setIsSaving(false);
      Toast.show({
        type: "error",
        text1: "Error saving template",
        text2: "Please try again later.",
      });
    }
  };

  const resetSession = () => {
    setNormalExercises([]);
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setWorkoutName("");
    setNormalExercises([]);
    AsyncStorage.removeItem(storageKey);
  };

  const logSetForExercise = (index: number) => {
    const { weight, reps, rpe } = exerciseInputs![index];

    const safeWeight = weight === "" ? 0 : Number(weight);
    const safeReps = reps === "" ? 0 : Number(reps);

    const updated = [...exercises];
    updated[index].sets.push({
      weight: safeWeight,
      reps: safeReps,
      rpe: rpe,
    });
    setExercises(updated);

    const updatedInputs = [...exerciseInputs];
    updatedInputs[index] = { weight: "", reps: "", rpe: "Medium" };
    setExerciseInputs(updatedInputs);
  };

  if (templateId && (isLoading || !existingTemplate)) {
    return (
      <View className="flex-1 items-center justify-center">
        <AppText className="mb-4 text-lg">Loading template details...</AppText>
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
                {templateId ? "Edit your template" : "Create your template"}
              </AppText>
              <View className="mb-10">
                <AppInput
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder="Workout Name..."
                  label="Workout Name..."
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
                      Super-Set
                    </AppText>
                  )}
                  {group.map(({ exercise, index }) => {
                    return (
                      <View key={index}>
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
                              (_, i) => i !== index
                            );
                            setExercises(updated);

                            const sessionDraft = {
                              title: workoutName,
                              exercises: updated,
                            };
                            AsyncStorage.setItem(
                              storageKey,
                              JSON.stringify(sessionDraft)
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
                resetTrigger={dropdownResetKey}
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
                      { label: "Normal", value: "Normal" },
                      { label: "Super-Set", value: "Super-Set" },
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
                      ? "Add Super-Set"
                      : "Add Exercise"}
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
              <AppButton
                onPress={() => {
                  setExerciseType("Normal");
                  setSupersetExercise([emptyExerciseEntry]);
                  setNormalExercises([emptyExerciseEntry]);
                  setIsExerciseModalOpen(true);
                }}
                label="Add Exercise"
              >
                <Plus size={20} color="#f3f4f6" />
              </AppButton>
            </View>
            <View className="justify-center mt-14 gap-5">
              <SaveButton
                disabled={exercises.length === 0}
                onPress={handleSaveTemplate}
              />
              {templateId ? "" : <DeleteButton onPress={resetSession} />}
              {templateId ? (
                <DeleteButton
                  confirm={false}
                  label="Cancel"
                  onPress={() => router.push("/training/templates")}
                />
              ) : (
                ""
              )}
            </View>
          </PageContainer>
        </ScrollView>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving template..." />
    </>
  );
}
