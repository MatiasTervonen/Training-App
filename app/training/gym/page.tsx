"use client";

import { russoOne } from "@/app/ui/fonts";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/ui/save-button";
import Timer from "@/app/components/timer";
import DeleteSessionBtn from "@/app/ui/deleteSessionBtn";
import ModalPageWrapper from "@/app/components/modalPageWrapper";
import TitleInput from "../components/TitleInput";
import NotesInput from "../components/NotesInput";
import ExerciseCard from "../components/ExerciseCard";
import { groupExercises } from "../utils/groupExercises";
import { ChevronDown, Plus, CircleX } from "lucide-react";
import FullScreenLoader from "@/app/components/FullScreenLoader";
import ExerciseDropdown from "../components/ExerciseDropdown";
import Modal from "@/app/components/modal";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";
import {
  HistoryResult,
  ExerciseEntry,
  emptyExerciseEntry,
  OptimisticGymSession,
} from "@/types/session";
import { generateUUID } from "@/lib/generateUUID";
import { toast } from "react-hot-toast";
import { mutate } from "swr";

export default function TrainingSessionPage() {
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [notes, setNotes] = useState("");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [resetTrigger, setResetTrigger] = useState(0);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<ExerciseEntry[]>([]);
  const [exerciseInputs, setExerciseInputs] = useState<
    { weight: string; reps: string; rpe: string }[]
  >([]);
  const [dropdownResetKey, setDropdownResetKey] = useState(0);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [normalExercises, setNormalExercises] = useState<ExerciseEntry[]>([]);
  const [lastHistory, setLastHistory] = useState<HistoryResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasLoadedDraft, sethasLaoding] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const didNavigate = useRef(false);

  type FeedItem = {
    table: "gym_sessions";
    item: OptimisticGymSession;
    pinned: boolean;
  };

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

  const isCardioExercise = (exercise: ExerciseEntry) => {
    return (exercise.main_group || "").toLowerCase() === "cardio";
  };

  const startSession = () => {
    const key = "timer:gym";
    const existing = localStorage.getItem(key);
    const parsed = existing ? JSON.parse(existing) : null;

    const now = Date.now();

    if (!parsed?.isRunning || !parsed?.startTime) {
      localStorage.setItem(
        key,
        JSON.stringify({
          startTime: now,
          elapsedBeforePause: 0,
          isRunning: true,
        })
      );
      localStorage.setItem("startTime", new Date().toISOString());
    }

    localStorage.setItem(
      "activeSession",
      JSON.stringify({
        type: "gym",
        label: sessionTitle,
        startedAt: new Date().toISOString(),
        path: "/training/gym",
      })
    );
  };

  const startExercise = () => {
    const newSupersetId = generateUUID();

    if (exercises.length === 0) {
      startSession(); // Start the timer/session if not already started
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
    localStorage.removeItem("gym_session_draft");
    localStorage.removeItem("timer:gym");
    localStorage.removeItem("activeSession");
    localStorage.removeItem("startTime");
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setNotes("");
    setSessionTitle("");
    setNormalExercises([]);
    setExerciseInputs([]);
    setLastHistory([]);
    setResetTrigger((prev) => prev + 1);
  };

  const saveSession = async () => {
    if (exercises.length === 0) return;

    const confirmSave = confirm(
      "Are you sure you want to finish this session?"
    );

    if (!confirmSave) return;
    if (exercises.length === 0 && notes.trim() === "") return;

    setIsSaving(true); // Start saving

    const TimerDataRaw = localStorage.getItem("timer:gym");
    let duration = 0;

    if (TimerDataRaw) {
      const { startTime, elapsedBeforePause, isRunning } =
        JSON.parse(TimerDataRaw);

      if (isRunning && startTime) {
        duration =
          Math.floor((Date.now() - startTime) / 1000) +
          (elapsedBeforePause || 0);
      } else {
        duration = elapsedBeforePause || 0;
      }
    }

    const optimisticGymSession: FeedItem = {
      table: "gym_sessions",
      pinned: false,
      item: {
        id: generateUUID(),
        title: sessionTitle,
        notes,
        duration,
        created_at: new Date().toISOString(),
      },
    };

    mutate(
      "/api/feed",
      (prev: FeedItem[] = []) => [optimisticGymSession, ...prev],
      false
    );

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
        throw new Error("Failed to save session gym session");
      }

      await res.json();
      didNavigate.current = true;
      router.push("/training/training-finished"); // Redirect to the finished page
      resetSession(); // Clear the session data
      mutate("/api/feed");
    } catch (error) {
      console.error("Error saving gym session:", error);
      toast.error("Failed to save gym session. Please try again.");
      mutate(
        "/api/feed",
        (prev: FeedItem[] = []) => {
          return prev.filter(
            (item) => item.item.id !== optimisticGymSession.item.id
          );
        },
        false
      );

      mutate("/api/feed");
    } finally {
      if (!didNavigate.current) {
        setIsSaving(false); // Stop saving
      }
    }
  };

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
      try {
        const {
          title: savedSessionTitle,
          exercises: savedExercises,
          notes: savedNotes,
        } = JSON.parse(draft);
        if (savedExercises) {
          setExercises(savedExercises);
          setExerciseInputs(
            savedExercises.map(() => ({ weight: "", reps: "", rpe: "Medium" }))
          );
        }
        if (savedNotes) setNotes(savedNotes);
        if (savedSessionTitle) setSessionTitle(savedSessionTitle);
      } catch (error) {
        console.error("Failed to parse gym session draft:", error);
      }
    }

    sethasLaoding(true);
  }, []);

  const groupedExercises = groupExercises(exercises);

  return (
    <>
      <nav className="flex items-center justify-between bg-gray-700 p-2 fixed px-4 w-full z-40 md:max-w-3xl">
        <div className="flex items-center justify-center gap-2  text-gray-100">
          <Timer
            sessionId="gym"
            resetTrigger={resetTrigger}
            onManualStart={startSession}
          />
        </div>
      </nav>

      <ModalPageWrapper
        onSwipeRight={() => router.back()}
        leftLabel="back"
        onSwipeLeft={() => router.push("/")}
        rightLabel="home"
      >
        <div
          className={` ${russoOne.className} flex justify-center relative min-h-[calc(100dvh-72px)] max-w-md mx-auto py-5`}
        >
          <div className="flex flex-col justify-between w-full">
            <div className="flex flex-col items-center justify-center gap-5">
              <p
                className={`${russoOne.className} text-gray-100 text-xl text-center
        `}
              >
                Track your training progress
              </p>
              <TitleInput
                title={sessionTitle}
                setTitle={setSessionTitle}
                placeholder="Session Title..."
                label="Session Title..."
              />
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
                          exercise={exercise}
                          lastExerciseHistory={lastExerciseHistory}
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
                footerButton={
                  <div className="flex flex-row gap-2 w-full">
                    <div className="relative w-full">
                      <select
                        className={`${russoOne.className} appearance-none w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
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
                      className={`${russoOne.className} w-full px-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
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
                                  main_group: selected.main_group || "",
                                  sets: [],
                                  notes: "",
                                  superset_id: "",
                                  muscle_group: selected.muscle_group || "",
                                };
                                setSupersetExercise((prev) => {
                                  const updated = [...prev];
                                  updated[updated.length - 1] = newExercise;
                                  return [...updated, emptyExerciseEntry]; // Add one more for next
                                });
                              }}
                              label={index + 1}
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
                                  superset_id: "",
                                  muscle_group: selected.muscle_group,
                                };
                                setNormalExercises((prev) => {
                                  const updated = [...prev];
                                  updated[updated.length - 1] = newExercise;
                                  return [...updated, emptyExerciseEntry]; // Add new empty for next
                                });
                              }}
                              label={index + 1}
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
              />

              <div className="flex items-center gap-5 w-fit mx-auto mt-10">
                <button
                  onClick={() => {
                    setExerciseType("Normal");
                    setSupersetExercise([emptyExerciseEntry]);
                    setNormalExercises([emptyExerciseEntry]);
                    setIsExerciseModalOpen(true);
                  }}
                  className={`${russoOne.className} w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                >
                  Add Exercise
                  <Plus className=" inline ml-2" size={20} />
                </button>
              </div>
            </>
            <div className="flex flex-col justify-center items-center mt-14 gap-5 mb-10 px-4">
              <SaveButton isSaving={isSaving} onClick={saveSession} />
              <DeleteSessionBtn onDelete={resetSession} />
            </div>
          </div>
        </div>
      </ModalPageWrapper>
      {isSaving && <FullScreenLoader message="Saving session..." />}
    </>
  );
}
