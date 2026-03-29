"use client";

import { useState, useCallback } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Modal from "@/components/modal";
import SaveButton from "@/components/buttons/save-button";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import { ExerciseEntry, emptyExerciseEntry } from "@/types/session";
import ExerciseHistoryModal from "@/features/gym/components/ExerciseHistory/ExerciseHistoryModal";
import FullScreenLoader from "@/components/FullScreenLoader";
import ExerciseSelectorList from "@/features/gym/components/ExerciseSelectorList";
import TemplateCard from "@/features/gym/components/template/TemplateCard";
import { GroupGymExercises } from "@/utils/GroupGymExercises";
import TitleInput from "@/ui/TitleInput";
import { useQuery } from "@tanstack/react-query";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import useDraftTemplate from "@/features/gym/hooks/template/useDraftTemplate";
import useAddExercise from "@/features/gym/hooks/template/useAddExercise";
import useSaveTemplate from "@/features/gym/hooks/template/useSaveTemplate";
import { useTranslation } from "react-i18next";
import { FullGymTemplate } from "@/database/gym/templates/full-gym-template";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useSortable, isSortable, isSortableOperation } from "@dnd-kit/react/sortable";

export default function TemplateForm({
  initialData,
  errorMessage,
}: {
  initialData: FullGymTemplate;
  errorMessage: string;
}) {
  const { t, i18n } = useTranslation("gym");
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
    })),
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
      getLastExerciseHistory({ exerciseId: exerciseHistoryId!, language: i18n.language }),
    enabled: !!exerciseHistoryId,
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

  const groupEntries = Object.entries(groupedExercises);

  const handleDragEnd = useCallback(
    (event: { canceled: boolean; operation: Parameters<typeof isSortableOperation>[0] }) => {
      if (event.canceled) return;
      if (!isSortableOperation(event.operation)) return;

      const { source } = event.operation;
      if (!source) return;
      const fromIndex = source.initialIndex;
      const toIndex = source.index;
      if (fromIndex === toIndex) return;

      setExercises((prev) => {
        const currentEntries = Object.entries(GroupGymExercises(prev));
        const reordered = [...currentEntries];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        return reordered.flatMap(([, group]) => group.map((g) => g.exercise));
      });
    },
    [],
  );

  if (!hasLoadedDraft) return null;

  const hasError = Boolean(errorMessage);
  const hasNoData = !session && !hasError;

  return (
    <div className="max-w-md mx-auto flex flex-col min-h-full justify-between page-padding">
      <div className="flex flex-col items-center gap-5 ">
        <h2 className="text-lg">
          {isEditing
            ? t("gym.templateForm.titleEdit")
            : t("gym.templateForm.titleCreate")}
        </h2>
        <TitleInput
          value={workoutName}
          setValue={setWorkoutName}
          placeholder={t("gym.templateForm.workoutNamePlaceholder")}
          label={t("gym.templateForm.workoutNameLabel")}
          maxLength={100}
        />
      </div>

      {hasError && (
        <div className="border border-red-500 text-red-300 rounded-md mt-20 p-3 text-center">
          {errorMessage}
        </div>
      )}

      {hasNoData && (
        <div className="border border-gray-600 text-gray-300 rounded-md p-3 text-center mt-20">
          No session data found.
        </div>
      )}

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div>
          {groupEntries.map(([superset_id, group], groupIndex) => (
            <SortableExerciseGroup
              key={superset_id}
              id={superset_id}
              index={groupIndex}
              group={group}
              exercises={exercises}
              setExercises={setExercises}
              workoutName={workoutName}
              openHistory={openHistory}
              setExerciseToChangeIndex={setExerciseToChangeIndex}
              setSupersetExercise={setSupersetExercise}
              setNormalExercises={setNormalExercises}
              setIsExerciseModalOpen={setIsExerciseModalOpen}
              t={t}
            />
          ))}
        </div>
        <DragOverlay>
          {(source) => {
            if (!isSortable(source)) return null;
            const group = groupEntries[source.index];
            if (!group) return null;
            const [, items] = group;
            return (
              <div className="mt-5 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md mx-2 border-[1.5px] border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02] opacity-90">
                {items.map(({ exercise, index }) => (
                  <div key={index} className="py-2 px-4">
                    <span className="text-gray-100 text-lg">
                      {index + 1}. {exercise.name}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        </DragOverlay>
      </DragDropProvider>
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
        <div className="flex gap-3 w-full px-2 my-5">
          <div className="relative w-full">
            <select
              className="appearance-none w-full px-10 btn-add text-lg [&>option]:bg-slate-900 [&>option]:text-gray-100"
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
              <option value="Normal">
                {t("gym.templateForm.exerciseType.normal")}
              </option>
              <option value="Super-Set">
                {t("gym.templateForm.exerciseType.superSet")}
              </option>
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
            className="w-full btn-add text-lg"
          >
            {exerciseType === "Super-Set"
              ? t("gym.templateForm.addSuperSet")
              : t("gym.templateForm.addExercise")}
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
          className="btn-add text-lg"
          style={{ paddingLeft: 64, paddingRight: 64 }}
        >
          {t("gym.templateForm.addExercise")}
          <Plus className=" inline ml-2" size={20} />
        </button>
      </div>
      <div className="flex flex-row gap-5 mt-14">
        <DeleteSessionBtn onDelete={resetSession} />
        <SaveButton onClick={handleSaveTemplate} />
      </div>
      {isSaving && (
        <FullScreenLoader message={t("gym.templateForm.savingTemplate")} />
      )}
    </div>
  );
}

function SortableExerciseGroup({
  id,
  index,
  group,
  exercises,
  setExercises,
  workoutName,
  openHistory,
  setExerciseToChangeIndex,
  setSupersetExercise,
  setNormalExercises,
  setIsExerciseModalOpen,
  t,
}: {
  id: string;
  index: number;
  group: { exercise: ExerciseEntry; index: number }[];
  exercises: ExerciseEntry[];
  setExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  workoutName: string;
  openHistory: (exerciseId: string) => void;
  setExerciseToChangeIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setSupersetExercise: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  setNormalExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  setIsExerciseModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: (key: string) => string;
}) {
  const { ref, isDragSource } = useSortable({ id, index });

  return (
    <div
      ref={ref}
      className={`mt-5 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md mx-2 cursor-grab active:cursor-grabbing transition-opacity duration-200 ${
        group.length > 1
          ? "border-[1.5px] border-blue-700"
          : "border-[1.5px] border-gray-600"
      } ${isDragSource ? "opacity-40" : ""}`}
    >
      {group.length > 1 && (
        <h2 className="text-lg text-gray-100 my-2 text-center">
          {t("gym.templateForm.superSetLabel")}
        </h2>
      )}
      {group.map(({ exercise, index: exIndex }) => (
        <div key={exIndex}>
          <TemplateCard
            exercise={exercise}
            lastExerciseHistory={(i) => {
              const ex = exercises[i];
              if (ex.exercise_id) {
                openHistory(ex.exercise_id);
              }
            }}
            onChangeExercise={(i) => {
              setExerciseToChangeIndex(i);
              setSupersetExercise([emptyExerciseEntry]);
              setNormalExercises([emptyExerciseEntry]);
              setIsExerciseModalOpen(true);
            }}
            index={exIndex}
            onUpdateExercise={(i, updatedExercise) => {
              const updated = [...exercises];
              updated[i] = updatedExercise;
              setExercises(updated);
            }}
            onDeleteExercise={(i) => {
              const confirmDelete = confirm(
                t("gym.templateForm.deleteExerciseConfirm.message"),
              );
              if (!confirmDelete) return;

              const updated = exercises.filter((_, idx) => idx !== i);
              setExercises(updated);

              const sessionDraft = {
                title: workoutName,
                exercises: updated,
              };
              localStorage.setItem(
                "template_draft",
                JSON.stringify(sessionDraft),
              );
            }}
          />
        </div>
      ))}
    </div>
  );
}
