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
import { groupTemplateExercises } from "../utils/groupTemplateExercises";
import ExerciseCard from "../components/ExerciseCard";
import { updateFeed } from "@/app/(app)/lib/revalidateFeed";
import ExerciseSelectorList from "../components/ExerciseSelectorList";
import useSWR from "swr";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { handleError } from "../../utils/handleError";

export default function TrainingSessionPage() {
  const [sessionTitle, setSessionTitle] = useState("");
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
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!hasLoadedDraft) return;

    if (
      exercises.length === 0 &&
      notes.trim() === "" &&
      sessionTitle.trim() === ""
    ) {
      localStorage.removeItem("gym_session_draft");
      return;
    }

    const sessionDraft = {
      title: sessionTitle,
      exercises,
      notes,
    };
    localStorage.setItem("gym_session_draft", JSON.stringify(sessionDraft));
  }, [exercises, notes, sessionTitle, hasLoadedDraft]);

  useEffect(() => {
    const draft = localStorage.getItem("gym_session_draft");
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
            }))
          : []
      );
    }

    setHasLoadedDraft(true);
  }, [setSessionTitle, setExercises, setNotes, setExerciseInputs]);

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

  const isCardioExercise = (exercise: ExerciseEntry) => {
    return (exercise.main_group || "").toLowerCase() === "cardio";
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
        ...updated.map((ex) => ({
          weight: "",
          reps: "",
          rpe: isCardioExercise(ex) ? "Warm-up" : "Medium",
        })),
      ]);
      setNormalExercises([]);
    }
    setDropdownResetKey((prev) => prev + 1); // Reset the dropdown
  };

  const logSetForExercise = (index: number) => {
    const { weight, reps, rpe } = exerciseInputs[index];

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

  const resetSession = () => {
    stopTimer();
    localStorage.removeItem("gym_session_draft");
    localStorage.removeItem("startedFromTemplate");
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setNotes("");
    setSessionTitle("");
    setNormalExercises([]);
    setExerciseInputs([]);
  };

  const saveSession = async () => {
    if (elapsedTime === 0 || sessionTitle.trim() === "") return;

    const confirmSave = confirm(
      "Are you sure you want to finish this session?"
    );

    if (!confirmSave) return;
    if (exercises.length === 0 && notes.trim() === "") return;

    setIsSaving(true); // Start saving

    const duration = elapsedTime;

    try {
      const res = await fetch("/api/gym/save-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: sessionTitle,
          exercises,
          notes,
          duration,
        }),
      });

      if (!res.ok) {
        setIsSaving(false);
        throw new Error("Failed to save session gym session");
      }

      await res.json();
      updateFeed();
      router.push("/training/training-finished"); // Redirect to the finished page
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

  const groupedExercises = groupTemplateExercises(exercises);

  if (!hasLoadedDraft) return null;

  return (
    <>
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

      <div className="flex justify-center relative h-[calc(100%-40px)] max-w-md mx-auto pt-5">
        <div className="flex flex-col justify-between w-full">
          <div className="flex flex-col items-center justify-center gap-5">
            <p className="text-gray-100 text-xl text-center">
              Track your training progress
            </p>
            <div className="w-full px-6">
              <CustomInput
                value={sessionTitle}
                setValue={setSessionTitle}
                placeholder="Session Title..."
                label="Session Title..."
              />
            </div>
            <div className="w-full px-6 ">
              <NotesInput
                notes={notes}
                setNotes={setNotes}
                placeholder="Add your notes here..."
                label="Session notes..."
              />
            </div>
          </div>
          <>
            {Object.entries(groupedExercises).map(([superset_id, group]) => (
              <div
                key={superset_id}
                className={`mt-10 bg-gradient-to-tr from-gray-900 via-slate-800 to-blue-900 rounded-md mx-2 ${
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
                            "gym_session_draft",
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
          </>
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
