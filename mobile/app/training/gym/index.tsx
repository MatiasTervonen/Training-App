import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import NotesInput from "@/components/NotesInput";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  ExerciseEntry,
  ExerciseInput,
  emptyExerciseEntry,
} from "@/types/session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError } from "@/utils/handleError";
import { useDebouncedCallback } from "use-debounce";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLastExerciseHistory } from "@/api/gym/last-exercise-history";
import { useTimerStore } from "@/lib/stores/timerStore";
import * as Crypto from "expo-crypto";
import { confirmAction } from "@/lib/confirmAction";
import { saveSession } from "@/api/gym/save-session";
import Toast from "react-native-toast-message";
import GroupGymExercises from "@/components/gym/lib/GroupGymExercises";
import ExerciseCard from "@/components/gym/ExerciseCard";
import FullScreenModal from "@/components/FullScreenModal";
import ExerciseSelectorList from "@/components/gym/ExerciseSelectorList";
import { ChevronDown, Plus } from "lucide-react-native";
import SelectInput from "@/components/Selectinput";
import ExerciseHistoryModal from "@/components/gym/ExerciseHistoryModal";
import SaveButton from "@/components/SaveButton";
import DeleteButton from "@/components/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import { LinearGradient } from "expo-linear-gradient";
import Timer from "@/components/timer";

export default function GymScreen() {
  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>([]);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [dropdownResetKey, setDropdownResetKey] = useState(0);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);
  const [isLoadedDraft, setIsLoadedDraft] = useState(false);
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null
  );
  const [isScrolling, setIsScrolling] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem("gym_session_draft");
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          setTitle(parsedDraft.title || "");
          setExercises(parsedDraft.exercises || []);
          setNotes(parsedDraft.notes || "");
          setExerciseInputs(
            parsedDraft.exercises
              ? parsedDraft.exercises.map(() => ({
                  weight: "",
                  reps: "",
                  rpe: "Medium",
                  time_min: "",
                  distance_meters: "",
                }))
              : []
          );
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading notes draft",
          route: "notes/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoadedDraft(true);
      }
    };
    loadDraft();
  }, []);

  const saveGymDraft = useDebouncedCallback(async () => {
    if (exercises.length === 0 && notes.trim() === "" && title.trim() === "") {
      AsyncStorage.removeItem("gym_session_draft");
      return;
    } else {
      const sessionDraft = {
        title,
        exercises,
        notes,
      };

      await AsyncStorage.setItem(
        "gym_session_draft",
        JSON.stringify(sessionDraft)
      );
    }
  }, 1000);

  useEffect(() => {
    if (!isLoadedDraft) return;
    saveGymDraft();
  }, [notes, title, saveGymDraft, exercises, isLoadedDraft]);

  const {
    activeSession,
    setActiveSession,
    startTimer,
    stopTimer,
    elapsedTime,
  } = useTimerStore();

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
  });

  const openHistory = (exerciseId: string) => {
    setExerciseHistoryId(exerciseId);
    setIsHistoryOpen(true);
  };

  const startSession = useCallback(() => {
    const currentElapsed = useTimerStore.getState().elapsedTime;
    if (currentElapsed > 0) return;

    setActiveSession({
      type: "gym",
      label: title,
      path: "/training/gym",
    });

    startTimer(0);
  }, [title, setActiveSession, startTimer]);

  useEffect(() => {
    const checkTemplateFlag = async () => {
      const flag = await AsyncStorage.getItem("startedFromTemplate");
      if (flag === "true") {
        startSession();
        AsyncStorage.removeItem("startedFromTemplate");
      }
    };
    checkTemplateFlag();
  }, [startSession]);

  const startExercise = () => {
    const newSupersetId = Crypto.randomUUID();

    if (exercises.length === 0) {
      startSession();
    }

    if (exerciseType === "Super-Set") {
      const validExercises = supersetExercise.filter(
        (ex) => ex && typeof ex.name === "string" && ex.name.trim() !== ""
      );
      if (validExercises.length === 0) return;

      const newGroup = validExercises.map((ex) => ({
        ...ex,
        superset_id: newSupersetId,
      }));

      setExercises((prev) => {
        const updated = [...prev, ...newGroup];
        setExerciseInputs((inputs) => [
          ...inputs,
          ...newGroup.map(() => ({ weight: "", reps: "", rpe: "Medium" })),
        ]);
        return updated;
      });
      setSupersetExercise([]);
    } else {
      const validNormal = normalExercises.filter(
        (ex) => ex.name && ex.name.trim() !== ""
      );
      if (validNormal.length === 0) return;

      // Assign new superset_id to each normal exercise (so they're grouped individually)
      const updated = validNormal.map((ex) => ({
        ...ex,
        superset_id: Crypto.randomUUID(),
      }));

      setExercises((prev) => [...prev, ...updated]);
      setExerciseInputs((prev) => [
        ...prev,
        ...updated.map(() => ({
          weight: "",
          reps: "",
          rpe: "Medium",
          time_min: "",
          distance_meters: "",
        })),
      ]);
      setNormalExercises([]);
    }
    setDropdownResetKey((prev) => prev + 1); // Reset the dropdown
  };

  const logSetForExercise = (index: number) => {
    const input = exerciseInputs[index];
    const exercise = exercises[index];
    const updated = [...exercises];

    const isCardio = (exercise.main_group || "").toLowerCase() === "cardio";

    if (isCardio) {
      const safeTime = input.time_min === "" ? 0 : Number(input.time_min);
      const safeDistance =
        input.distance_meters === "" ? 0 : Number(input.distance_meters);

      updated[index].sets.push({
        time_min: safeDistance,
        distance_meters: safeTime,
      });

      const updatedInputs = [...exerciseInputs];
      updatedInputs[index] = { ...input, time_min: "", distance_meters: "" };
      setExerciseInputs(updatedInputs);
    } else {
      const safeWeight = input.weight === "" ? 0 : Number(input.weight);
      const safeReps = input.reps === "" ? 0 : Number(input.reps);

      updated[index].sets.push({
        weight: safeWeight,
        reps: safeReps,
        rpe: input.rpe,
      });

      const updatedInputs = [...exerciseInputs];
      updatedInputs[index] = { weight: "", reps: "", rpe: "Medium" };
      setExerciseInputs(updatedInputs);
    }

    setExercises(updated);
  };

  const resetSession = () => {
    stopTimer();
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

  const handleSaveSession = async () => {
    if (elapsedTime === 0) return;

    if (title.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Title is required.",
      });
      return;
    }

    const confirmSave = await confirmAction({
      title: "Confirm Finish Session",
      message: "Are you sure you want to finish this session?",
    });

    if (!confirmSave) return;
    if (exercises.length === 0 && notes.trim() === "") return;

    setIsSaving(true); // Start saving

    const duration = elapsedTime;

    try {
      const res = await saveSession({ title, notes, duration, exercises });

      if (res.error) {
        setIsSaving(false);
        throw new Error("Failed to save session gym session");
      }

      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      router.push("/training/training-finished"); // Redirect to the finished page
      resetSession(); // Clear the session data
    } catch (error) {
      console.log("Error saving session:", error);
      handleError(error, {
        message: "Error saving gym session",
        route: "/api/gym/save-session",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save session. Please try again.",
      });
      setIsSaving(false);
    }
  };

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
      <View className="flex items-center bg-gray-600 p-2 px-4 w-full z-40 max-w-3xl mx-auto sticky top-0">
        <Timer
          buttonsAlwaysVisible
          manualSession={{
            label: title,
            path: "/training/gym",
            type: "gym",
          }}
        />
      </View>

      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => setTimeout(() => setIsScrolling(false), 150)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="px-5 max-w-md mx-auto w-full justify-between flex-1 mb-10">
            <View>
              <AppText className="text-2xl my-5 text-center">
                Track your training progress
              </AppText>
              <View className="gap-5">
                <AppInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Session Title..."
                  label="Session Title..."
                />
                <View className="min-h-[80px]">
                  <NotesInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Session Notes..."
                    label="Session Notes..."
                  />
                </View>
              </View>
            </View>

            <>
              {Object.entries(groupedExercises).map(([superset_id, group]) => (
                <LinearGradient
                  key={superset_id}
                  colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                  start={{ x: 1, y: 0 }} // bottom-left
                  end={{ x: 0, y: 1 }} // top-right
                  className={`mt-10  rounded-md  ${
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

                <View className="flex-row gap-3 px-2 absolute bottom-5 left-0 right-0 z-50">
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
                      startExercise();
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
                isLoading={isLoading}
                history={Array.isArray(history) ? history : []}
                error={historyError ? historyError.message : null}
              />

              <Pressable
                onPress={() => {
                  setExerciseType("Normal");
                  setSupersetExercise([emptyExerciseEntry]);
                  setNormalExercises([emptyExerciseEntry]);
                  setIsExerciseModalOpen(true);
                }}
                className="mt-10 flex-row gap-3 w-2/4 mx-auto items-center justify-center bg-blue-800 py-2 rounded-md border-2 border-blue-500 text-gray-100 text-lg"
              >
                <AppText>Add Exercise</AppText>
                <Plus className="inline ml-2" size={20} color="#f3f4f6" />
              </Pressable>

              <View className="gap-5 mt-20">
                <SaveButton onPress={handleSaveSession} />
                <DeleteButton onPress={resetSession} />
              </View>
            </>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving session..." />
    </>
  );
}
