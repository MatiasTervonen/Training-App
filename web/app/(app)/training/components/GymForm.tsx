"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import Timer from "@/app/(app)/components/timer";
import DeleteSessionBtn from "@/app/(app)/components/buttons/deleteSessionBtn";
import CustomInput from "@/app/(app)/ui/CustomInput";
import { ChevronDown, Plus } from "lucide-react";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import Modal from "@/app/(app)/components/modal";
import ExerciseHistoryModal from "./ExerciseHistoryModal";
import {
  ExerciseEntry,
  emptyExerciseEntry,
  ExerciseInput,
} from "@/app/(app)/types/session";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import { GroupGymExercises } from "@/app/(app)/utils/GroupGymExercises";
import ExerciseCard from "./ExerciseCard";
import ExerciseSelectorList from "./ExerciseSelectorList";
import { full_gym_session } from "../../types/models";
import TitleInput from "../../ui/TitleInput";
import SubNotesInput from "../../ui/SubNotesInput";
import { useQuery } from "@tanstack/react-query";
import { getLastExerciseHistory } from "../../database/gym";
import useSaveSession from "../hooks/useSaveSession";
import useDraft from "../hooks/useDraftGym";
import useStartExercise from "../hooks/useStartExercise";
import useLogSetForExercise from "../hooks/useLogSetForExercise";

export default function GymForm({
  initialData,
}: {
  initialData: full_gym_session;
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

  // useDraft hook to save the draft
  useDraft({
    exercises,
    notes,
    sessionTitle,
    isEditing,
    hasLoadedDraft,
    setSessionTitle,
    setExercises,
    setNotes,
    setExerciseInputs,
    setHasLoadedDraft,
  });

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
  } = useQuery({
    queryKey: ["exerciseHistory", exerciseHistoryId],
    queryFn: () => getLastExerciseHistory(exerciseHistoryId!),
    enabled: !!exerciseHistoryId,
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

  // useStartExercise hook to start the exercise

  const { startExercise } = useStartExercise({
    exercises,
    setExercises,
    setExerciseInputs,
    setSupersetExercise,
    setNormalExercises,
    setDropdownResetKey,
    startSession,
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

  // useSaveSession hook to save the session

  const { saveSession } = useSaveSession({
    sessionTitle,
    exercises,
    notes,
    durationEdit,
    isEditing,
    elapsedTime,
    setIsSaving,
    resetSession,
    session,
  });

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

  return (
    <>
      {isEditing ? (
        ""
      ) : (
        <nav className="flex items-center bg-gray-700 p-2 px-4 w-full z-40 max-w-3xl mx-auto sticky top-0">
          <Timer
            className="text-xl"
            manualSession={{
              label: sessionTitle,
              path: "/training/gym",
              type: "gym",
            }}
          />
        </nav>
      )}

      <div className="flex flex-col justify-between relative min-h-[calc(100%-40px)] max-w-md mx-auto page-padding">
        <div className="flex flex-col items-center justify-center gap-5">
          <p className="text-xl text-center">
            {isEditing
              ? "Edit your gym session"
              : "Track your training progress"}
          </p>
          <div className="w-full">
            <TitleInput
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
                setValue={(value) => setDurationEdit(Number(value))}
                placeholder="Duration in seconds..."
                label="Duration (seconds)..."
                type="number"
              />
            </div>
          )}
          <div className="w-full">
            <SubNotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Add your notes here..."
              label="Session notes..."
            />
          </div>

          {Object.entries(groupedExercises).map(([superset_id, group]) => (
            <div
              key={superset_id}
              className={`mt-10 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md mx-2 ${
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

                        const updated = exercises.filter((_, i) => i !== index);
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
              className="w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
            >
              Add Exercise
              <Plus className=" inline ml-2" size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center mt-14 gap-5">
          <SaveButton onClick={saveSession} />
          {isEditing ? (
            <DeleteSessionBtn
              label="Cancel"
              confirm={false}
              onDelete={() => router.push("/dashboard")}
            />
          ) : (
            <DeleteSessionBtn onDelete={resetSession} />
          )}
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving session..." />}
    </>
  );
}
