"use client";

import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import { useRouter } from "next/navigation";
import TitleInput from "../components/TitleInput";
import { useState, useEffect, useRef } from "react";
import ExerciseDropdown from "../components/ExerciseDropdown";
import { ChevronDown, CircleX, Plus } from "lucide-react";
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

export default function CreateTemplatePage() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("gym_template_draft") || "null")
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
  const didNavigate = useRef(false);
  const [exerciseToChangeIndex, setExerciseToChangeIndex] = useState<
    number | null
  >(null);

  const groupedExercises = groupTemplateExercises(exercises);

  const router = useRouter();

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
      localStorage.removeItem("gym_template_draft");
      return;
    }

    const sessionDraft = {
      title: workoutName,
      exercises,
    };
    localStorage.setItem("gym_template_draft", JSON.stringify(sessionDraft));
  }, [exercises, workoutName]);

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

    mutate(
      "/api/gym/get-templates",
      (currentTemplates: OptimisticTemplate[] = []) => [
        {
          id: generateUUID(),
          name: workoutName,
        },
        ...currentTemplates,
      ],
      false
    );

    try {
      const res = await fetch("/api/gym/save-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exercises: simplified,
          name: workoutName,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save template");
      }

      await res.json();
      didNavigate.current = true;

      mutate("/api/gym/get-templates");

      router.push("/training/templates");
    } catch (error) {
      toast.error("Failed to save template. Try again later.");
      console.error("Error saving template:", error);
    } finally {
      if (!didNavigate.current) {
        setIsSaving(false); // Stop saving
      }
      resetSession(); // Reset session after saving
    }
  };

  const resetSession = () => {
    setNormalExercises([]);
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setWorkoutName("");
    setNormalExercises([]);
    localStorage.removeItem("gym_template_draft");
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

  return (
    <ModalPageWrapper noTopPadding>
      <div className="h-full bg-slate-800 text-gray-100 px-4 pt-5">
        <div className="max-w-md mx-auto flex flex-col justify-between h-full">
          <div className="flex flex-col items-center  gap-5 ">
            <h2 className="text-gray-100 text-lg">Create your template</h2>
            <TitleInput
              title={workoutName}
              setTitle={setWorkoutName}
              placeholder="Workout Name..."
              label="Workout Name..."
            />
          </div>
          {Object.entries(groupedExercises).map(([superset_id, group]) => (
            <div
              key={superset_id}
              className={`mt-10 bg-gradient-to-tr from-gray-900 via-slate-800 to-blue-900  rounded-md mx-2 ${
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

                        const updated = exercises.filter((_, i) => i !== index);
                        setExercises(updated);

                        const sessionDraft = {
                          title: workoutName,
                          exercises: updated,
                        };
                        localStorage.setItem(
                          "gym_template_draft",
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
            noTopPadding
            isOpen={isExerciseModalOpen}
            onClose={() => {
              setIsExerciseModalOpen(false);
            }}
            footerButton={
              <div className="flex flex-row gap-2 w-full">
                <div className="relative w-full">
                  <select
                    className="appearance-none w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
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
                  className="w-full px-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
                >
                  {exerciseType === "Super-Set"
                    ? "Add Super-Set"
                    : "Add Exercise"}
                </button>
              </div>
            }
          >
            {exerciseType === "Super-Set" ? (
              <>
                {supersetExercise.map((exercise, index) => {
                  const isLast = index === supersetExercise.length - 1;
                  const isEmpty = !exercise.name?.trim();

                  if (isLast && isEmpty) {
                    // Show dropdown only for the last, empty item
                    return (
                      <div key={index} className="h-full">
                        <ExerciseDropdown
                          onSelect={(selected) => {
                            const newExercise: ExerciseEntry = {
                              exercise_id: String(selected.id),
                              name: selected.name,
                              equipment: selected.equipment,
                              main_group: selected.main_group,
                              sets: [],
                              notes: "",
                              superset_id:
                                exerciseToChangeIndex !== null
                                  ? exercises[exerciseToChangeIndex]
                                      ?.superset_id || generateUUID()
                                  : "",
                              muscle_group: selected.muscle_group,
                            };
                            if (exerciseToChangeIndex !== null) {
                              // Update single exercise in session
                              const updated = [...exercises];
                              updated[exerciseToChangeIndex] = newExercise;
                              setExercises(updated);
                              setIsExerciseModalOpen(false);
                              setExerciseToChangeIndex(null);
                            } else {
                              // Add new exercise to superset draft
                              setSupersetExercise((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = newExercise;
                                return [...updated, emptyExerciseEntry]; // allow adding another
                              });
                            }
                          }}
                          resetTrigger={dropdownResetKey}
                        />
                      </div>
                    );
                  }

                  // All others: just show a summary
                  return (
                    <div
                      key={index}
                      className="bg-slate-700 text-gray-100 p-2 my-2 px-4 shadow flex justify-between mr-20 ml-0"
                    >
                      <div className="flex flex-col ">
                        <p className="">{exercise.name}</p>
                        <p className="text-sm text-gray-400">
                          {exercise.equipment} / {exercise.muscle_group}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = supersetExercise.filter(
                            (_, i) => i !== index
                          );
                          setSupersetExercise(updated);
                        }}
                      >
                        <CircleX />
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {normalExercises.map((exercise, index) => {
                  const isLast = index === normalExercises.length - 1;
                  const isEmpty = !exercise.name?.trim();

                  if (isLast && isEmpty) {
                    return (
                      <div key={index} className="h-full">
                        <ExerciseDropdown
                          onSelect={(selected) => {
                            const newExercise: ExerciseEntry = {
                              exercise_id: String(selected.id),
                              name: selected.name,
                              equipment: selected.equipment,
                              main_group: selected.main_group,
                              sets: [],
                              notes: "",
                              superset_id:
                                exerciseToChangeIndex !== null
                                  ? exercises[exerciseToChangeIndex]
                                      ?.superset_id || generateUUID()
                                  : "",
                              muscle_group: selected.muscle_group,
                            };

                            if (exerciseToChangeIndex !== null) {
                              // Update exercise in exercises array
                              const updated = [...exercises];
                              updated[exerciseToChangeIndex] = newExercise;
                              setExercises(updated);
                              setIsExerciseModalOpen(false);
                              setExerciseToChangeIndex(null);
                            } else {
                              // Add to draft normal exercises
                              setNormalExercises((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = newExercise;
                                return [...updated, emptyExerciseEntry]; // allow adding another
                              });
                            }
                          }}
                          resetTrigger={dropdownResetKey}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="bg-slate-700 text-gray-100 p-2 my-2 px-4 shadow flex justify-between mr-20 ml-0"
                    >
                      <div className="flex flex-col ">
                        <p className="">{exercise.name}</p>
                        <p className="text-sm text-gray-400">
                          {exercise.equipment} / {exercise.muscle_group}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = normalExercises.filter(
                            (_, i) => i !== index
                          );
                          setNormalExercises(updated);
                        }}
                      >
                        <CircleX />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </Modal>

          <ExerciseHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            isLoading={isHistoryLoading}
            history={lastHistory}
            noTopPadding={true}
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
            <SaveButton isSaving={isSaving} onClick={handleSaveTemplate} />
            <DeleteSessionBtn onDelete={resetSession} />
          </div>
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving template..." />}
    </ModalPageWrapper>
  );
}
