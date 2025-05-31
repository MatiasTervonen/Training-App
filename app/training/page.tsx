"use client";

import { russoOne } from "@/app/ui/fonts";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/ui/save-button";
import Timer from "@/app/components/timer";
import DeleteSessionBtn from "@/app/ui/deleteSessionBtn";
import ModalPageWrapper from "@/app/components/modalPageWrapper";
import TitleInput from "./components/TitleInput";
import NotesInput from "./components/NotesInput";
import ExerciseCard from "./components/ExerciseCard";
import { groupExercises } from "./utils/groupExercises";
import { ChevronDown } from "lucide-react";
import FullScreenLoader from "@/app/components/FullScreenLoader";
import { ClearLocalStorage } from "./utils/ClearLocalStorage";
import ExerciseDropdown from "./components/ExerciseDropdown";
import Modal from "@/app/components/modal";
import { Plus } from "lucide-react";

type ExerciseSet = { weight: string; reps: string; rpe: string };
type ExerciseEntry = {
  exercise_id: string;
  name: string;
  equipment?: string; // Optional, can be used to display equipment type
  sets: ExerciseSet[];
  notes?: string;
  superset_id?: string; // For super-sets
};

const emptyExerciseEntry: ExerciseEntry = {
  exercise_id: "",
  name: "",
  equipment: "",
  sets: [],
  notes: "",
  superset_id: "",
};

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
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseEntry | null>(null);
  const [dropdownResetKey, setDropdownResetKey] = useState(0);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

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
        path: "/training",
      })
    );
  };

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  const startExercise = () => {
    if (exerciseType === "Super-Set") {
      const validExercises = supersetExercise.filter(
        (ex) => ex && typeof ex.name === "string" && ex.name.trim() !== ""
      );
      if (validExercises.length === 0) return;

      if (exercises.length === 0) {
        startSession(); // Start the timer/session if not already started
      }

      const newSupersetId = generateUUID();

      const newExercise = validExercises.map((ex) => ({
        exercise_id: ex.exercise_id || "",
        name: ex.name,
        equipment: ex.equipment,
        sets: [],
        superset_id: newSupersetId,
        notes: "",
      }));

      setExercises((prev) => {
        const newExercises = [...prev, ...newExercise];
        setExerciseInputs((inputs) => [
          ...inputs,
          ...newExercise.map(() => ({ weight: "", reps: "", rpe: "Medium" })),
        ]);
        return newExercises;
      });
      setSupersetExercise([]);
      setExerciseType("Normal");
    } else {
      if (!selectedExercise || !selectedExercise.name.trim()) return;

      if (exercises.length === 0) {
        startSession(); // Start the timer/session if not already started
      }

      const newSupersetId = generateUUID();

      setExercises((prev) => [
        ...prev,
        {
          ...selectedExercise,
          superset_id: newSupersetId,
        },
      ]);
      setExerciseInputs((prev) => [
        ...prev,
        { weight: "", reps: "", rpe: "Medium" },
      ]);
      setSelectedExercise(null);
      setDropdownResetKey((prev) => prev + 1); // Reset the dropdown
    }
  };

  const logSetForExercise = (index: number) => {
    const { weight, reps, rpe } = exerciseInputs[index];
    const safeWeight = weight.trim() === "" ? "0" : weight;
    const safeReps = reps.trim() === "" ? "0" : reps;

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
    ClearLocalStorage();
    setSupersetExercise([]);
    setExerciseType("Normal");
    setExercises([]);
    setNotes("");
    setSessionTitle("");

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

    const response = await fetch("/api/gym/save-session", {
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

    if (response.ok) {
      resetSession();
      router.push("/training/training-finished"); // Redirect to the finished page
    } else {
      alert("Session not saved. You might be in demo mode.");
      resetSession();
      router.push("/");
    }
  };

  useEffect(() => {
    if (
      exercises.length === 0 &&
      notes.trim() === "" &&
      sessionTitle.trim() === ""
    )
      return;

    const sessionDraft = {
      title: sessionTitle,
      exercises,
      notes,
    };
    localStorage.setItem("gym_session_draft", JSON.stringify(sessionDraft));
  }, [exercises, notes, sessionTitle]);

  useEffect(() => {
    const draft = localStorage.getItem("gym_session_draft");
    if (draft) {
      const {
        title: savedSessionTitle,
        exercises: savedExercises,
        notes: savedNotes,
      } = JSON.parse(draft);
      if (savedExercises) {
        setExercises(savedExercises);
        setExerciseInputs(
          savedExercises.map(() => ({ weight: "", reps: "", lvl: "Medium" }))
        );
      }
      if (savedNotes) setNotes(savedNotes);
      if (savedSessionTitle) setSessionTitle(savedSessionTitle);
    }
  }, []);

  const groupedExercises = groupExercises(exercises);

  return (
    <>
      <nav className="flex items-center justify-between bg-gray-700 p-2 fixed px-4 w-full z-40 xl:max-w-3xl mx-auto">
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
        <div className="flex justify-center relative min-h-[calc(100dvh-72px)] bg-slate-950 ">
          <div className="flex flex-col justify-between w-full max-w-[800px] py-5">
            <div className="flex flex-col items-center justify-center  gap-5">
              <p
                className={`${russoOne.className} text-gray-100 font-bold text-lg
        `}
              >
                Track your training progress
              </p>
              <TitleInput
                title={sessionTitle}
                setTitle={setSessionTitle}
                placeholder="Session Title"
              />
              <NotesInput
                notes={notes}
                setNotes={setNotes}
                rows={2}
                cols={35}
                placeholder="Add your notes here..."
                label="Session notes..."
              />
            </div>

            <>
              {Object.entries(groupedExercises).map(([superset_id, group]) => (
                <div
                  key={superset_id}
                  className="flex flex-col items-center  justify-center mt-10 mx-4  max-w-screen bg-slate-800 rounded-md px-4 py-2  shadow-lg"
                >
                  {group.length > 1 && (
                    <h2 className="text-gray-100 text-xl font-bold mb-2">
                      Super-Set
                    </h2>
                  )}

                  {group.map(({ exercise, index }) => {
                    return (
                      <div key={index} className="mb-4 w-full">
                        <ExerciseCard
                          exercise={exercise}
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
                onClose={() => setIsExerciseModalOpen(false)}
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
                            setSupersetExercise([
                              emptyExerciseEntry,
                              emptyExerciseEntry,
                            ]);
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
                      Add Exercise
                    </button>
                  </div>
                }
              >
                {exerciseType === "Super-Set" ? (
                  <div className="flex flex-col gap-4">
                    {supersetExercise.map((entry, index) => (
                      <ExerciseDropdown
                        key={index}
                        onSelect={(exercise) => {
                          const updated = [...supersetExercise];
                          updated[index] = {
                            exercise_id: String(exercise.id),
                            name: exercise.name,
                            equipment: exercise.equipment,
                            sets: [],
                            notes: "",
                            superset_id: generateUUID(),
                          };
                          setSupersetExercise(updated);
                        }}
                        label={index + 1}
                      />
                    ))}
                    <button
                      onClick={() =>
                        setSupersetExercise((prev) => [
                          ...prev,
                          emptyExerciseEntry,
                        ])
                      }
                      className={`${russoOne.className} mx-10 mb-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                    >
                      + Add Another Exercise
                    </button>
                  </div>
                ) : (
                  <ExerciseDropdown
                    onSelect={(exercise) => {
                      const newExercise: ExerciseEntry = {
                        exercise_id: String(exercise.id),
                        name: exercise.name,
                        equipment: exercise.equipment,
                        sets: [],
                        notes: "",
                        superset_id: generateUUID(),
                      };
                      setSelectedExercise(newExercise);
                    }}
                    label={exercises.length + 1}
                    resetTrigger={dropdownResetKey}
                  />
                )}
              </Modal>

              <div className="flex items-center gap-5 w-fit mx-auto mt-10">
                <button
                  onClick={() => setIsExerciseModalOpen(true)}
                  className={`${russoOne.className} w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                >
                  Add Exercise
                  <Plus className=" inline ml-2" size={20} />
                </button>
              </div>
            </>
            <div className="flex flex-col justify-center mt-14 gap-5 mx-8 mb-10">
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
