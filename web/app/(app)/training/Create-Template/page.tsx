"use client";

import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import { useRouter } from "next/navigation";
import TitleInput from "../components/TitleInput";
import { useState, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Modal from "@/app/(app)/components/modal";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import {
  HistoryResult,
  ExerciseEntry,
  emptyExerciseEntry,
  OptimisticTemplate,
  ExerciseInput,
} from "@/app/(app)/types/session";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";
import { generateUUID } from "@/app/(app)/lib/generateUUID";
import { toast } from "react-hot-toast";
import { mutate } from "swr";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { groupTemplateExercises } from "../utils/groupTemplateExercises";
import ExerciseCard from "../components/ExerciseCard";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { full_gym_template } from "@/app/(app)/types/models";
import ExerciseSelectorList from "../components/ExerciseSelectorList";
import Spinner from "../../components/spinner";

export default function CreateTemplatePage() {
  const params = useParams<{ id: string }>();
  const templateId = params?.id;
  const storageKey = templateId
    ? `gym_template_draft_${templateId}` // editing
    : "gym_template_draft_new"; // creating

  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(storageKey) || "null")
      : null;

  const [workoutName, setWorkoutName] = useState(draft?.title || "");
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    draft?.exercises || []
  );
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [dropdownResetKey, setDropdownResetKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>(
    draft?.exercises
      ? draft.exercises.map(() => ({ weight: "", reps: "", rpe: "Medium" }))
      : []
  );
  const [lastHistory, setLastHistory] = useState<HistoryResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);

  const groupedExercises = groupTemplateExercises(exercises);

  const router = useRouter();

  // Remove draft when leaving the edit page without saving

  useEffect(() => {
    return () => {
      if (templateId) {
        localStorage.removeItem(storageKey);
      }
    };
  }, [templateId, storageKey]);

  // Load existing template when editing

  const { data: existingTemplate, isLoading } = useSWR<full_gym_template>(
    templateId ? `/api/gym/get-full-template?id=${templateId}` : null,
    fetcher
  );

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

  const lastExerciseHistory = async (index: number) => {
    const exercise = exercises[index];
    if (!exercise || !exercise.exercise_id) return;

    setIsHistoryOpen(true);
    setIsHistoryLoading(true);

    try {
      const response = await fetch(
        `/api/gym/last-exercise-history/${exercise.exercise_id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.warn("Unexpected data format:", data);
        setLastHistory([]);
      } else {
        setLastHistory(data);
      }
    } catch (error) {
      console.error("Error fetching last exercise history:", error);
      setLastHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const isCardioExercise = (exercise: ExerciseEntry) =>
    (exercise.main_group || "").toLowerCase() === "cardio";

  useEffect(() => {
    if (exercises.length === 0 && workoutName.trim() === "") {
      localStorage.removeItem(storageKey);
      return;
    }

    const sessionDraft = {
      title: workoutName,
      exercises,
    };
    localStorage.setItem(storageKey, JSON.stringify(sessionDraft));
  }, [exercises, workoutName, storageKey]);

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

    setDropdownResetKey((prev) => prev + 1); // Reset dropdown
  };

  const handleSaveTemplate = async () => {
    if (workoutName.trim() === "" || exercises.length === 0) return;

    setIsSaving(true);

    const simplified = exercises.map((ex) => ({
      exercise_id: ex.exercise_id,
      sets: ex.sets?.[0]?.sets,
      reps: ex.sets?.[0]?.reps,
      superset_id: ex.superset_id,
    }));

    let tempId: string | null = null;

    if (!templateId) {
      tempId = generateUUID();

      mutate(
        "/api/gym/get-templates",
        (currentTemplates: OptimisticTemplate[] = []) => [
          {
            id: tempId as string,
            name: workoutName,
            created_at: new Date().toISOString(),
          },
          ...currentTemplates,
        ],
        false
      );
    }
    try {
      const url = templateId
        ? "/api/gym/edit-template"
        : "/api/gym/save-template";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: templateId,
          exercises: simplified,
          name: workoutName,
        }),
      });

      if (!res.ok) {
        setIsSaving(false);
        throw new Error("Failed to save template");
      }

      const saved = await res.json();

      if (templateId) {
        mutate(
          "/api/gym/get-templates",
          (current: OptimisticTemplate[] = []) =>
            current.map((t) =>
              t.id === templateId ? { ...t, name: workoutName } : t
            ),
          false
        );
        mutate(`/api/gym/get-full-template?id=${templateId}`);
      }

      if (!templateId) {
        mutate(
          "/api/gym/get-templates",
          (currentTemplates: OptimisticTemplate[] = []) =>
            currentTemplates.map((t) =>
              t.id === tempId ? { ...t, id: saved.templateId } : t
            ),
          false
        );
      }

      resetSession();
      router.push("/training/templates");
    } catch (error) {
      toast.error("Failed to save template. Try again later.");
      console.error("Error saving template:", error);
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
    localStorage.removeItem(storageKey);
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

  if (templateId && (isLoading || !existingTemplate)) {
    return (
      <ModalPageWrapper>
        <div className="h-full flex flex-col items-center justify-center bg-slate-800 text-gray-100">
          <p className="mb-4 text-xl">Loading template details...</p>
          <Spinner />
        </div>
      </ModalPageWrapper>
    );
  }

  return (
    <ModalPageWrapper>
      <div className="h-full bg-slate-800 text-gray-100 px-4 pt-5">
        <div className="max-w-md mx-auto flex flex-col justify-between h-full">
          <div className="flex flex-col items-center  gap-5 ">
            <h2 className="text-gray-100 text-lg">
              {templateId ? "Edit your template" : "Create your template"}
            </h2>
            <TitleInput
              title={workoutName}
              setTitle={setWorkoutName}
              placeholder="Workout Name..."
              label="Workout Name..."
            />
          </div>
          <div>
            {Object.entries(groupedExercises).map(([superset_id, group]) => (
              <div
                key={superset_id}
                className={`mt-5 bg-gradient-to-tr from-gray-900 via-slate-800 to-blue-900  rounded-md mx-2 ${
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
                      <ExerciseCard
                        exercise={exercise}
                        lastExerciseHistory={lastExerciseHistory}
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
                            title: workoutName,
                            exercises: updated,
                          };
                          localStorage.setItem(
                            storageKey,
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
                {exerciseType === "Super-Set"
                  ? "Add Super-Set"
                  : "Add Exercise"}
              </button>
            </div>
          </Modal>

          <ExerciseHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            isLoading={isHistoryLoading}
            history={lastHistory}
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
      </div>
      {isSaving && <FullScreenLoader message="Saving template..." />}
    </ModalPageWrapper>
  );
}
