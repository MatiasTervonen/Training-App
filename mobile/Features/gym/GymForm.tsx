import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  ExerciseEntry,
  ExerciseInput,
  emptyExerciseEntry,
} from "@/types/session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import { useTimerStore } from "@/lib/stores/timerStore";
import { confirmAction } from "@/lib/confirmAction";
import GroupGymExercises from "@/Features/gym/lib/GroupGymExercises";
import ExerciseCard from "@/Features/gym/ExerciseCard";
import FullScreenModal from "@/components/FullScreenModal";
import ExerciseSelectorList from "@/Features/gym/ExerciseSelectorList";
import { ChevronDown, Plus } from "lucide-react-native";
import SelectInput from "@/components/Selectinput";
import ExerciseHistoryModal from "@/Features/gym/ExerciseHistoryModal";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import { LinearGradient } from "expo-linear-gradient";
import Timer from "@/components/timer";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import SubNotesInput from "@/components/SubNotesInput";
import { full_gym_session } from "@/types/models";
import useSaveGymDraft from "@/Features/gym/hooks/useSaveGymDraft";
import useStartExercise from "@/Features/gym/hooks/useStartExercise";
import useLogSetForExercise from "@/Features/gym/hooks/useLogSetForExercise";
import useSaveSession from "@/Features/gym/hooks/useSaveSession";
import { formatDate } from "@/lib/formatDate";

export default function GymForm({
  initialData,
}: {
  initialData: full_gym_session;
}) {
  const session = initialData;
  const now = formatDate(new Date());
  const [title, setTitle] = useState(session.title || `Gym - ${now}`);
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    (session.gym_session_exercises || []).map((ex) => ({
      exercise_id: ex.exercise_id,
      name: ex.gym_exercises?.name,
      muscle_group: ex.gym_exercises?.main_group,
      equipment: ex.gym_exercises?.equipment,
      superset_id: ex.superset_id ?? "",
      sets:
        ex.gym_sets?.map((s) => ({
          weight: s.weight ?? 0,
          reps: s.reps ?? 0,
          rpe: s.rpe ?? "Medium",
          time_min: s.time_min ?? 0,
          distance_meters: s.distance_meters ?? 0,
        })) || [],
    }))
  );
  const [notes, setNotes] = useState("");
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>(
    (session.gym_session_exercises || []).map(() => ({
      weight: "",
      reps: "",
      rpe: "Medium",
      time_min: "",
      distance_meters: "",
    }))
  );
  const [durationEdit, setDurationEdit] = useState(session.duration);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null
  );
  const [isScrolling, setIsScrolling] = useState(false);

  const isEditing = Boolean(session?.id);

  const queryClient = useQueryClient();

  // useSaveGymDraft hook to save the draft

  useSaveGymDraft({
    exercises,
    notes,
    title,
    isEditing,
    setTitle,
    setExercises,
    setNotes,
    setExerciseInputs,
  });

  const { activeSession, setActiveSession, startSession, clearEverything } =
    useTimerStore();

  const {
    data: history = [],
    error: historyError,
    isLoading,
  } = useQuery({
    queryKey: ["last-exercise-history", exerciseHistoryId],
    queryFn: () => getLastExerciseHistory({ exerciseId: exerciseHistoryId! }),
    enabled: isHistoryOpen && !!exerciseHistoryId,
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

  const handleStartSession = useCallback(() => {
    setActiveSession({
      type: "gym",
      label: title,
      path: "/gym/gym",
    });

    startSession(title);
  }, [title, setActiveSession, startSession]);

  useEffect(() => {
    const checkTemplateFlag = async () => {
      const flag = await AsyncStorage.getItem("startedFromTemplate");
      if (flag === "true") {
        handleStartSession();
        AsyncStorage.removeItem("startedFromTemplate");
      }
    };
    checkTemplateFlag();
  }, [handleStartSession]);

  // useStartExercise hook to start the exercise

  const { startExercise } = useStartExercise({
    exercises,
    setExercises,
    setExerciseInputs,
    setSupersetExercise,
    setNormalExercises,
    handleStartSession,
    exerciseType,
    supersetExercise,
    normalExercises,
  });

  // useLogSetForExercise hook to log the set for the exercise

  const { logSetForExercise } = useLogSetForExercise({
    exercises,
    exerciseInputs,
    setExerciseInputs,
    setExercises,
  });

  const resetSession = () => {
    clearEverything();
    AsyncStorage.removeItem("gym_session_draft");
    AsyncStorage.removeItem("startedFromTemplate");
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setNotes("");
    setTitle("");
    setNormalExercises([]);
    setExerciseInputs([]);
  };

  // useSaveSession hook to save the session

  const { handleSaveSession } = useSaveSession({
    title,
    exercises,
    notes,
    durationEdit,
    isEditing,
    setIsSaving,
    resetSession,
    session,
  });

  useEffect(() => {
    if (
      activeSession &&
      activeSession.type === "gym" &&
      activeSession.label !== title
    ) {
      setActiveSession({
        ...activeSession,
        label: title,
      });
    }
  }, [title, activeSession, setActiveSession]);

  const groupedExercises = GroupGymExercises(exercises);

  return (
    <>
      {isEditing ? (
        ""
      ) : (
        <View className="flex items-center bg-gray-600 p-2 px-4 w-full z-40 ticky top-0">
          <Timer
            textClassName="text-xl"
            manualSession={{
              label: title,
              path: "/gym/gym",
              type: "gym",
            }}
          />
        </View>
      )}

      <ScrollView
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setTimeout(() => setIsScrolling(false), 150)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <PageContainer className="justify-between flex-1">
          <View>
            {isEditing ? (
              <AppText className="text-2xl mb-5 text-center">
                Edit your gym session
              </AppText>
            ) : (
              <AppText className="text-2xl mb-5 text-center">
                Track your training progress
              </AppText>
            )}
            <View className="gap-5">
              <AppInput
                value={title}
                setValue={setTitle}
                placeholder="Session Title..."
                label="Session Title..."
              />
              {isEditing && (
                <AppInput
                  value={String(durationEdit)}
                  setValue={() => String(setDurationEdit)}
                  placeholder="Duration in seconds..."
                  label="Duration (seconds)..."
                />
              )}
              <SubNotesInput
                value={notes}
                setValue={setNotes}
                className="min-h-[60px]"
                placeholder="Session Notes..."
                label="Session Notes..."
              />
            </View>
          </View>

          <>
            {Object.entries(groupedExercises).map(([superset_id, group]) => (
              <LinearGradient
                key={superset_id}
                colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                start={{ x: 1, y: 0 }} // bottom-left
                end={{ x: 0, y: 1 }} // top-right
                className={`mt-10  rounded-md overflow-hidden ${
                  group.length > 1
                    ? "border-2 border-blue-700"
                    : "border-2 border-gray-600"
                }`}
              >
                {group.length > 1 && (
                  <AppText className="text-gray-100 text-lg text-center my-2">
                    Super-Set
                  </AppText>
                )}

                {group.map(({ exercise, index }) => {
                  return (
                    <View key={index}>
                      <ExerciseCard
                        disabled={isScrolling}
                        mode="session"
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
                            title: "Confirm Delete Exercise",
                            message:
                              "Are you sure you want to delete this exercise?",
                          });
                          if (!confirmDelete) return;

                          const updated = exercises.filter(
                            (_, i) => i !== index
                          );
                          setExercises(updated);

                          const sessionDraft = {
                            title: title,
                            exercises: updated,
                            notes,
                          };
                          AsyncStorage.setItem(
                            "gym_session_draft",
                            JSON.stringify(sessionDraft)
                          );
                        }}
                      />
                    </View>
                  );
                })}
              </LinearGradient>
            ))}

            <FullScreenModal
              isOpen={isExerciseModalOpen}
              onClose={() => {
                setIsExerciseModalOpen(false);
                setExerciseType("Normal");
                queryClient.invalidateQueries({ queryKey: ["exercises"] });
              }}
            >
              <View className="flex-1">
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
              </View>
              <View className="flex-row gap-3 px-2 mt-5 mb-10 z-50">
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
                <View className="flex-1">
                  <AnimatedButton
                    onPress={() => {
                      startExercise();
                      setIsExerciseModalOpen(false);
                    }}
                    className="justify-center items-center py-2 bg-blue-800 rounded-md shadow-md border-2 border-blue-500"
                  >
                    <AppText className="text-lg">
                      {exerciseType === "Super-Set"
                        ? "Add Super-Set"
                        : "Add Exercise"}
                    </AppText>
                  </AnimatedButton>
                </View>
              </View>
            </FullScreenModal>

            <ExerciseHistoryModal
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              isLoading={isLoading}
              history={Array.isArray(history) ? history : []}
              error={historyError ? historyError.message : null}
            />

            <AnimatedButton
              onPress={() => {
                setExerciseType("Normal");
                setSupersetExercise([emptyExerciseEntry]);
                setNormalExercises([emptyExerciseEntry]);
                setIsExerciseModalOpen(true);
              }}
              className="mt-10 flex-row gap-3 w-2/4 mx-auto items-center justify-center bg-blue-800 py-2 rounded-md border-2 border-blue-500"
            >
              <AppText className="text-lg">Add Exercise</AppText>
              <Plus size={20} color="#f3f4f6" />
            </AnimatedButton>

            <View className="gap-5 mt-20">
              <SaveButton onPress={handleSaveSession} />
              {isEditing ? (
                <DeleteButton
                  confirm={false}
                  label="Cancel"
                  onPress={() => router.push("/dashboard")}
                />
              ) : (
                <DeleteButton onPress={resetSession} />
              )}
            </View>
          </>
        </PageContainer>
      </ScrollView>

      <FullScreenLoader visible={isSaving} message="Saving session..." />
    </>
  );
}
