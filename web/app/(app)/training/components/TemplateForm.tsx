"use client";

import { useRouter } from "next/navigation";
import CustomInput from "../../ui/CustomInput";
import { useState, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Modal from "@/app/(app)/components/modal";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import {
  HistoryResult,
  ExerciseEntry,
  emptyExerciseEntry,
} from "@/app/(app)/types/session";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";
import { generateUUID } from "@/app/(app)/lib/generateUUID";
import { toast } from "react-hot-toast";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import useSWR from "swr";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { full_gym_template } from "@/app/(app)/types/models";
import ExerciseSelectorList from "../components/ExerciseSelectorList";
import { handleError } from "../../utils/handleError";
import { saveTemplateToDB, editTemplate } from "../../database/template";
import TemplateCard from "./TemplateCard";
import { GroupGymExercises } from "../../utils/GroupGymExercises";
import { mutate } from "swr";

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
  const [dropdownResetKey, setDropdownResetKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);
  const [exerciseHistoryId, setExerciseHistoryId] = useState<string | null>(
    null
  );

  const groupedExercises = GroupGymExercises(exercises);

  const router = useRouter();

  const isEditing = Boolean(session?.id);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(isEditing);

  useEffect(() => {
    if (!hasLoadedDraft || isEditing) return;

    if (exercises.length === 0 && workoutName.trim() === "") {
      localStorage.removeItem("template_draft");
      return;
    }

    const sessionDraft = {
      title: workoutName,
      exercises,
    };
    localStorage.setItem("template_draft", JSON.stringify(sessionDraft));
  }, [exercises, workoutName, hasLoadedDraft, isEditing]);

  useEffect(() => {
    if (isEditing) return;

    const draft = localStorage.getItem("template_draft");
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setWorkoutName(parsedDraft.title || "");
      setExercises(parsedDraft.exercises || []);
    }

    setHasLoadedDraft(true);
  }, [setWorkoutName, setExercises, isEditing]);

  const {
    data: history,
    error: historyError,
    isLoading: isHistoryLoading,
  } = useSWR<HistoryResult[]>(
    isHistoryOpen && exerciseHistoryId
      ? `/api/gym/last-exercise-history/${exerciseHistoryId}`
      : null
  );

  const openHistory = (exerciseId: string) => {
    setExerciseHistoryId(exerciseId);
    setIsHistoryOpen(true);
  };

  const handleAddExercise = () => {
    const newSupersetId = generateUUID();

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
      setSupersetExercise([]);
    } else {
      const validNormal = normalExercises.filter(
        (ex) => ex.name && ex.name.trim() !== ""
      );
      if (validNormal.length === 0) return;

      const updated = validNormal.map((ex) => ({
        ...ex,
        superset_id: generateUUID(),
      }));

      setExercises((prev) => [...prev, ...updated]);
      setNormalExercises([]);
    }

    setDropdownResetKey((prev) => prev + 1); // Reset dropdown
  };

  const handleSaveTemplate = async () => {
    if (workoutName.trim() === "" || exercises.length === 0) return;

    setIsSaving(true);

    try {
      if (isEditing) {
        await editTemplate({
          id: session.id,
          exercises,
          name: workoutName,
        });
      } else {
        await saveTemplateToDB({
          exercises,
          name: workoutName,
        });
      }

      if (isEditing) {
        await mutate(
          `/api/gym/get-full-template?id=${session.id}`,
          async () => fetcher(`/api/gym/get-full-template?id=${session.id}`),
          false
        );
      } else {
        await mutate(
          "/api/gym/get-templates",
          async () => fetcher("/api/gym/get-templates"),
          false
        );
      }
      resetSession();
      router.push("/training/templates");
    } catch (error) {
      handleError(error, {
        message: "Error saving/editing template",
        route: "TemplatePage",
        method: "Template",
      });
      toast.error("Failed to save template. Try again later.");
      setIsSaving(false);
    }
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

  if (!hasLoadedDraft) return null;

  const hasError = Boolean(errorMessage);
  const hasNoData = !session && !hasError;

  return (
    <div className="h-full bg-slate-800 text-gray-100 px-4 pt-5">
      <div className="max-w-md mx-auto flex flex-col justify-between h-full">
        <div className="flex flex-col items-center  gap-5 ">
          <h2 className="text-gray-100 text-lg">
            {isEditing ? "Edit your template" : "Create your template"}
          </h2>
          <div className="w-full px-6">
            <CustomInput
              value={workoutName}
              setValue={setWorkoutName}
              placeholder="Workout Name..."
              label="Workout Name..."
            />
          </div>
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
              className={`mt-5 bg-linear-to-tr from-gray-900 via-slate-800 to-blue-900  rounded-md mx-2 ${
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
            className="w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
          >
            Add Exercise
            <Plus className=" inline ml-2" size={20} />
          </button>
        </div>
        <div className="flex flex-col justify-center items-center mt-14 gap-5 pb-5">
          <SaveButton onClick={handleSaveTemplate} />
          <DeleteSessionBtn onDelete={resetSession} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving template..." />}
    </div>
  );
}
