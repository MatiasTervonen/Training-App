"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import Timer from "@/app/(app)/components/timer";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import CustomInput from "@/app/(app)/ui/CustomInput";
import NotesInput from "../../ui/NotesInput";
import { ChevronDown, Plus } from "lucide-react";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import Modal from "@/app/(app)/components/modal";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";
import {
  HistoryResult,
  ExerciseEntry,
  emptyExerciseEntry,
  ExerciseInput,
} from "@/app/(app)/types/session";
import { generateUUID } from "@/app/(app)/lib/generateUUID";
import { toast } from "react-hot-toast";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import { GroupGymExercises } from "@/app/(app)/utils/GroupGymExercises";
import ExerciseCard from "../components/ExerciseCard";
import { updateFeed } from "@/app/(app)/lib/revalidateFeed";
import ExerciseSelectorList from "../components/ExerciseSelectorList";
import useSWR from "swr";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { handleError } from "../../utils/handleError";
import { saveGymToDB, editGymSession } from "../../database/gym";
import { full_gym_session } from "../../types/models";

export default function GymForm({
  initialData,
  errorMessage,
}: {
  initialData: full_gym_session;
  errorMessage?: string;
}) {
  const session = initialData;

  const [sessionTitle, setSessionTitle] = useState(session.title || "");
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    (session.gym_session_exercises || []).map((ex) => ({
      exercise_id: ex.exercise_id,
      name: ex.gym_exercises?.name,
      muscle_group: ex.gym_exercises?.main_group,
      equipment: ex.gym_exercises?.equipment,
      superset_id: ex.superset_id,
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
  const [notes, setNotes] = useState(session.notes || "");
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>(
    (session.gym_session_exercises || []).map(() => ({
      weight: "",
      reps: "",
      rpe: "Medium",
      time_min: "",
      distance_meters: "",
    }))
  );
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
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null
  );
  const [durationEdit, setDurationEdit] = useState(session.duration);

  const isEditing = Boolean(session?.id);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(isEditing);

  useEffect(() => {
    if (!hasLoadedDraft || isEditing) return;

    if (
      exercises.length === 0 &&
      notes.trim() === "" &&
      sessionTitle.trim() === ""
    ) {
      localStorage.removeItem("gym_draft");
      return;
    }

    const sessionDraft = {
      title: sessionTitle,
      exercises,
      notes,
    };
    localStorage.setItem("gym_draft", JSON.stringify(sessionDraft));
  }, [exercises, notes, sessionTitle, hasLoadedDraft, isEditing]);

  useEffect(() => {
    if (isEditing) return;

    const draft = localStorage.getItem("gym_draft");
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setSessionTitle(parsedDraft.title || "");
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

    setHasLoadedDraft(true);
  }, [setSessionTitle, setExercises, setNotes, setExerciseInputs, isEditing]);

  const {
    activeSession,
    setActiveSession,
    startTimer,
    stopTimer,
    elapsedTime,
  } = useTimerStore();

  const {
    data: history,
    error: historyError,
    isLoading,
  } = useSWR<HistoryResult[]>(
    isHistoryOpen && exerciseHistoryId
      ? `/api/gym/last-exercise-history/${exerciseHistoryId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  const openHistory = (exerciseId: string) => {
    setExerciseHistoryId(exerciseId);
    setIsHistoryOpen(true);
  };

  const startSession = useCallback(() => {
    const currentElapsed = useTimerStore.getState().elapsedTime;
    if (currentElapsed > 0) return;

    setActiveSession({
      type: "gym",
      label: sessionTitle,
      path: "/training/gym",
    });

    startTimer(0);
  }, [sessionTitle, setActiveSession, startTimer]);

  useEffect(() => {
    const flag = localStorage.getItem("startedFromTemplate");
    if (flag === "true") {
      startSession();
      localStorage.removeItem("startedFromTemplate");
    }
  }, [startSession]);

  const startExercise = () => {
    const newSupersetId = generateUUID();

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
        superset_id: generateUUID(),
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
        time_min: safeTime,
        distance_meters: safeDistance,
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
    localStorage.removeItem("gym_draft");
    localStorage.removeItem("startedFromTemplate");
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setNotes("");
    setSessionTitle("");
    setNormalExercises([]);
    setExerciseInputs([]);
    setDurationEdit(0);
  };

  const saveSession = async () => {
    if (sessionTitle.trim() === "") {
      toast.error("Please enter a session title before saving.");
      return;
    }

    const confirmSave = confirm(
      "Are you sure you want to finish this session?"
    );

    if (!confirmSave) return;
    if (exercises.length === 0 && notes.trim() === "") return;

    setIsSaving(true);

    const duration = elapsedTime;

    try {
      if (isEditing) {
        await editGymSession({
          title: sessionTitle,
          notes,
          durationEdit,
          exercises,
          id: session.id,
        });
      } else {
        await saveGymToDB({
          title: sessionTitle,
          notes,
          duration,
          exercises,
        });
      }

      await updateFeed();
      if (isEditing) {
        router.push("/dashboard");
      } else {
        router.push("/training/training-finished"); // Redirect to the finished page
      }
      resetSession(); // Clear the session data
    } catch (error) {
      handleError(error, {
        message: "Error saving gym session",
        route: "/api/gym/save-session",
        method: "POST",
      });
      toast.error("Failed to save gym session. Please try again.");
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (
      activeSession &&
      activeSession.type === "gym" &&
      activeSession.label !== sessionTitle
    ) {
      setActiveSession({
        ...activeSession,
        label: sessionTitle,
      });
    }
  }, [sessionTitle, activeSession, setActiveSession]);

  const groupedExercises = GroupGymExercises(exercises);

  if (!hasLoadedDraft) return null;

  const hasError = Boolean(errorMessage);
  const hasNoData = !session && !hasError;

  return (
    <>
      {isEditing ? (
        ""
      ) : (
        <nav className="flex items-center bg-gray-700 p-2 px-4 w-full z-40 max-w-3xl mx-auto sticky top-0">
          <Timer
            buttonsAlwaysVisible
            manualSession={{
              label: sessionTitle,
              path: "/training/gym",
              type: "gym",
            }}
          />
        </nav>
      )}

      <div className="flex justify-center relative h-[calc(100%-40px)] max-w-md mx-auto pt-5">
        <div className="flex flex-col justify-between w-full">
          <div className="flex flex-col items-center justify-center gap-5 px-6">
            <p className="text-gray-100 text-xl text-center">
              {isEditing
                ? "Edit your gym session"
                : "Track your training progress"}
            </p>
            <div className="w-full">
              <CustomInput
                value={sessionTitle}
                setValue={setSessionTitle}
                placeholder="Session Title..."
                label="Session Title..."
              />
            </div>
            {isEditing && (
              <div className="w-full">
                <CustomInput
                  value={durationEdit || ""}
                  setValue={(val) => setDurationEdit(Number(val))}
                  placeholder="Duration in seconds..."
                  label="Duration (seconds)..."
                  type="number"
                />
              </div>
            )}
            <div className="w-full">
              <NotesInput
                notes={notes}
                setNotes={setNotes}
                placeholder="Add your notes here..."
                label="Session notes..."
              />
            </div>

            {hasError && (
              <div className="border border-red-500 text-red-300 rounded-md mt-5 p-3 text-center">
                {errorMessage}
              </div>
            )}

            {hasNoData && (
              <div className="border border-gray-600 text-gray-300 rounded-md mt-5 p-3 text-center">
                No session data found.
              </div>
            )}

            {Object.entries(groupedExercises).map(([superset_id, group]) => (
              <div
                key={superset_id}
                className={`mt-10 bg-linear-to-tr from-gray-900 via-slate-800 to-blue-900 rounded-md mx-2 ${
                  group.length > 1
                    ? "border-2 border-blue-700"
                    : "border-2 border-gray-600"
                }`}
              >
                {group.length > 1 && (
                  <h2 className="text-gray-100 text-lg text-center my-2">
                    Super-Set
                  </h2>
                )}
                {group.map(({ exercise, index }) => {
                  return (
                    <div key={index}>
                      <ExerciseCard
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
                        onDeleteExercise={(index) => {
                          const confirmDelete = confirm(
                            "Are you sure you want to delete this exercise?"
                          );
                          if (!confirmDelete) return;

                          const updated = exercises.filter(
                            (_, i) => i !== index
                          );
                          setExercises(updated);

                          const sessionDraft = {
                            title: sessionTitle,
                            exercises: updated,
                            notes,
                          };
                          localStorage.setItem(
                            "gym_draft",
                            JSON.stringify(sessionDraft)
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            <Modal
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

              <div className="sticky bottom-5 flex gap-3 w-full px-2">
                <div className="relative w-full">
                  <select
                    className="appearance-none w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700"
                    value={exerciseType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setExerciseType(type);
                      if (type === "Normal") {
                        setSupersetExercise([]);
                      } else if (type === "Super-Set") {
                        setSupersetExercise([emptyExerciseEntry]);
                      }
                    }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Super-Set">Super-Set</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronDown className="text-gray-100" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    startExercise();
                    setIsExerciseModalOpen(false);
                  }}
                  className="w-full px-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700"
                >
                  {exerciseType === "Super-Set"
                    ? "Add Super-Set"
                    : "Add Exercise"}
                </button>
              </div>
            </Modal>

            <ExerciseHistoryModal
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              isLoading={isLoading}
              history={Array.isArray(history) ? history : []}
              error={historyError ? historyError.message : null}
            />

            <div className="flex items-center gap-5 w-fit mx-auto mt-10">
              <button
                onClick={() => {
                  setExerciseType("Normal");
                  setSupersetExercise([emptyExerciseEntry]);
                  setNormalExercises([emptyExerciseEntry]);
                  setIsExerciseModalOpen(true);
                }}
                className="w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
              >
                Add Exercise
                <Plus className=" inline ml-2" size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center mt-14 gap-5 pb-10 px-4">
            <SaveButton onClick={saveSession} />
            <DeleteSessionBtn onDelete={resetSession} />
          </div>
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving session..." />}
    </>
  );
}
