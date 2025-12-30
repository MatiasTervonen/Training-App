"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Modal from "@/app/(app)/components/modal";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import DeleteSessionBtn from "@/app/(app)/components/buttons/deleteSessionBtn";
import { ExerciseEntry, emptyExerciseEntry } from "@/app/(app)/types/session";
import ExerciseHistoryModal from "@/app/(app)/gym/components/ExerciseHistoryModal";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { full_gym_template } from "@/app/(app)/types/models";
import ExerciseSelectorList from "@/app/(app)/gym/components/ExerciseSelectorList";
import TemplateCard from "@/app/(app)/gym/components/template/TemplateCard";
import { GroupGymExercises } from "@/app/(app)/utils/GroupGymExercises";
import TitleInput from "@/app/(app)/ui/TitleInput";
import { useQuery } from "@tanstack/react-query";
import { getLastExerciseHistory } from "@/app/(app)/database/gym/last-exercise-history";
import useDraftTemplate from "@/app/(app)/gym/hooks/template/useDraftTemplate";
import useAddExercise from "@/app/(app)/gym/hooks/template/useAddExercise";
import useSaveTemplate from "@/app/(app)/gym/hooks/template/useSaveTemplate";

export default function TemplateForm({
  initialData,
  errorMessage,
}: {
  initialData: full_gym_template;
  errorMessage: string;
}) {
  const session = initialData;

  const [workoutName, setWorkoutName] = useState(session.name || "");
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    (session.gym_template_exercises || []).map((ex) => ({
      exercise_id: ex.exercise_id,
      template_id: session.id,
      position: ex.position,
      name: ex.gym_exercises?.name,
      main_group: ex.gym_exercises.main_group,
      muscle_group: ex.gym_exercises?.main_group,
      equipment: ex.gym_exercises?.equipment,
      superset_id: ex.superset_id,
      sets: [],
    }))
  );
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);
  const [exerciseHistoryId, setExerciseHistoryId] = useState("");

  const groupedExercises = GroupGymExercises(exercises);

  const isEditing = Boolean(session?.id);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(isEditing);

  // useDraftTemplate hook to save the draft
  useDraftTemplate({
    exercises,
    workoutName,
    hasLoadedDraft,
    isEditing,
    setWorkoutName,
    setExercises,
    setHasLoadedDraft,
  });

  const {
    data: history,
    error: historyError,
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ["exerciseHistory", exerciseHistoryId],
    queryFn: async () =>
      getLastExerciseHistory({ exerciseId: exerciseHistoryId! }),
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

  const resetSession = () => {
    setNormalExercises([]);
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setWorkoutName("");
    setNormalExercises([]);
    localStorage.removeItem("template_draft");
  };

  // useAddExercise hook to add an exercise

  const { handleAddExercise } = useAddExercise({
    exerciseType,
    supersetExercise,
    normalExercises,
    setExercises,
    setSupersetExercise,
    setNormalExercises,
  });

  // useSaveTemplate hook to save the template

  const { handleSaveTemplate } = useSaveTemplate({
    workoutName,
    exercises,
    isEditing,
    setIsSaving,
    resetSession,
    template: session,
  });

  if (!hasLoadedDraft) return null;

  const hasError = Boolean(errorMessage);
  const hasNoData = !session && !hasError;

  return (
    <div className="max-w-md mx-auto flex flex-col h-full justify-between page-padding">
      <div className="flex flex-col items-center gap-5 ">
        <h2 className="text-lg">
          {isEditing ? "Edit your template" : "Create your template"}
        </h2>
        <TitleInput
          value={workoutName}
          setValue={setWorkoutName}
          placeholder="Workout Name..."
          label="Workout Name..."
          maxLength={100}
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

      <div>
        {Object.entries(groupedExercises).map(([superset_id, group]) => (
          <div
            key={superset_id}
            className={`mt-5 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900  rounded-md mx-2 ${
              group.length > 1
                ? "border-2 border-blue-700"
                : "border-2 border-gray-600"
            }`}
          >
            {group.length > 1 && (
              <h2 className="text-lg text-gray-100 my-2 text-center">
                Super-Set
              </h2>
            )}
            {group.map(({ exercise, index }) => {
              return (
                <div key={index}>
                  <TemplateCard
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
                        title: workoutName,
                        exercises: updated,
                      };
                      localStorage.setItem(
                        "template_draft",
                        JSON.stringify(sessionDraft)
                      );
                    }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Modal
        isOpen={isExerciseModalOpen}
        onClose={() => {
          setIsExerciseModalOpen(false);
        }}
      >
        <ExerciseSelectorList
          draftExercises={
            exerciseType === "Super-Set" ? supersetExercise : normalExercises
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
                  setNormalExercises([emptyExerciseEntry]);
                } else if (type === "Super-Set") {
                  setNormalExercises([]);
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
              handleAddExercise();
              setIsExerciseModalOpen(false);
            }}
            className="w-full px-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700"
          >
            {exerciseType === "Super-Set" ? "Add Super-Set" : "Add Exercise"}
          </button>
        </div>
      </Modal>

      <ExerciseHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isLoading={isHistoryLoading}
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
          className="px-10 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
        >
          Add Exercise
          <Plus className=" inline ml-2" size={20} />
        </button>
      </div>
      <div className="flex flex-col justify-center items-center mt-14 gap-5">
        <SaveButton onClick={handleSaveTemplate} />
        <DeleteSessionBtn onDelete={resetSession} />
      </div>
      {isSaving && <FullScreenLoader message="Saving template..." />}
    </div>
  );
}
