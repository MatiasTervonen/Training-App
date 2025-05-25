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
import ExerciseInput from "./components/ExerciseInput";
import SuperSetInput from "./components/SupersetInput";
import { groupExercises } from "./utils/groupExercises";
import { ChevronDown } from "lucide-react";
import FullScreenLoader from "@/app/components/FullScreenLoader";
import { ClearLocalStorage } from "./utils/ClearLocalStorage";

type ExerciseSet = { weight: string; reps: string; lvl: string };
type ExerciseEntry = {
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  groupId?: string;
};

export default function TrainingSessionPage() {
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [activeExerciseName, setActiveExerciseName] = useState("");
  const [notes, setNotes] = useState("");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [resetTrigger, setResetTrigger] = useState(0);
  const [exerciseType, setExerciseType] = useState("Normal");
  const [supersetExercise, setSupersetExercise] = useState<string[]>([""]);
  const [exerciseInputs, setExerciseInputs] = useState<
    { weight: string; reps: string; lvl: string }[]
  >([]);

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

  const startExercise = () => {
    if (exerciseType === "Super-Set") {
      const validNames = supersetExercise
        .map((name) => name.trim())
        .filter(Boolean);
      if (validNames.length === 0) return;

      if (exercises.length === 0) {
        startSession(); // Start the timer/session if not already started
      }

      const newGroupId = Date.now().toString();

      const newExercise = validNames.map((name) => ({
        name,
        sets: [],
        groupId: newGroupId,
      }));

      setExercises((prev) => {
        const newExercises = [...prev, ...newExercise];
        setExerciseInputs((inputs) => [
          ...inputs,
          ...newExercise.map(() => ({ weight: "", reps: "", lvl: "Medium" })),
        ]);
        return newExercises;
      });
      setSupersetExercise([""]);
      setExerciseType("Normal");
    } else {
      if (!activeExerciseName.trim()) return;

      if (exercises.length === 0) {
        startSession(); // Start the timer/session if not already started
      }

      setExercises((prev) => {
        const newExercises = [
          ...prev,
          {
            name: activeExerciseName,
            sets: [],
            groupId: Date.now().toString(),
          },
        ];
        setExerciseInputs((inputs) => [
          ...inputs,
          { weight: "", reps: "", lvl: "Medium" },
        ]);
        return newExercises;
      });
      setActiveExerciseName("");
    }
  };

  const logSetForExercise = (index: number) => {
    const { weight, reps, lvl } = exerciseInputs[index];
    const safeWeight = weight.trim() === "" ? "0" : weight;
    const safeReps = reps.trim() === "" ? "0" : reps;

    const updated = [...exercises];
    updated[index].sets.push({
      weight: safeWeight,
      reps: safeReps,
      lvl: lvl,
    });
    setExercises(updated);

    const updatedInputs = [...exerciseInputs];
    updatedInputs[index] = { weight: "", reps: "", lvl: "Medium" };
    setExerciseInputs(updatedInputs);
  };

  const resetSession = () => {
    ClearLocalStorage();
    setSupersetExercise([""]);
    setExerciseType("Normal");
    setExercises([]);
    setNotes("");
    setActiveExerciseName("");
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

    const response = await fetch("/api/save-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: sessionTitle,
        exercises,
        notes,
        duration,
        type: "gym",
      }),
    });

    if (response.ok) {
      resetSession();
      router.push("/training/training-finished"); // Redirect to the finished page
    } else {
      console.error("Failed to save session.");
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
      <nav className="flex items-center justify-between bg-gray-700 p-2 fixed px-4 w-full z-40">
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
        <div className="flex justify-center relative min-h-[calc(100dvh-72px)] bg-slate-950">
          <div className="flex flex-col w-full max-w-[800px] py-5">
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
              {Object.entries(groupedExercises).map(([groupId, group]) => (
                <div
                  key={groupId}
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

              <div className="flex flex-col items-center justify-center gap-5 mt-10">
                {exerciseType === "Super-Set" ? (
                  <>
                    {supersetExercise.map((name, index) => (
                      <div key={index}>
                        <SuperSetInput
                          index={index}
                          value={name}
                          onChange={(index, value) => {
                            const updated = [...supersetExercise];
                            updated[index] = value;
                            setSupersetExercise(updated);
                          }}
                          placeholder="Exercise..."
                          label={index + 1}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const updated = [...supersetExercise];
                        updated.push("");
                        setSupersetExercise(updated);
                      }}
                      className={`${russoOne.className} px-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                    >
                      + Exercise
                    </button>
                  </>
                ) : (
                  <ExerciseInput
                    label={exercises.length + 1}
                    setExerciseName={setActiveExerciseName}
                    placeholder="Exercise..."
                    exerciseName={activeExerciseName}
                  />
                )}

                <div className=" flex flex-col items-center gap-5">
                  <div className="relative w-full">
                    <select
                      className={`${russoOne.className} appearance-none w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                      value={exerciseType}
                      onChange={(e) => {
                        const type = e.target.value;
                        setExerciseType(type);
                        if (type === "Normal") {
                          setSupersetExercise([""]); // Clear inputs immediately
                        } else if (type === "Super-Set") {
                          setSupersetExercise(["", ""]);
                        }
                      }}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Super-Set">Super-Set</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <ChevronDown className="text-gray-100 " />
                    </div>
                  </div>
                  <button
                    onClick={startExercise}
                    className={`${russoOne.className} w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                  >
                    Start Exercise
                  </button>
                </div>
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
