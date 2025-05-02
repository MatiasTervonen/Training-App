"use client";

import { russoOne } from "@/app/ui/fonts";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/ui/save-button";
import Timer from "@/app/components/timer";
import Image from "next/image";

type ExerciseSet = { weight: string; reps: string };
type ExerciseEntry = {
  name: string;
  sets: ExerciseSet[];
};

export default function TrainingSessionPage() {
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [activeExerciseName, setActiveExerciseName] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const [editingSet, setEditingSet] = useState<{
    exerciseIndex: number;
    setIndex: number;
  } | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [sessionTitle, setSessionTitle] = useState(() => {
    const today = new Date();
    return `Training - ${today.toLocaleDateString()}`;
  });

  const isStarted = exercises.length > 0;

  const startExercise = () => {
    if (!activeExerciseName.trim()) return;
    if (exercises.length === 0) {
      setIsTimerRunning(true); // Start timer when first exercise is created
    }
    setExercises((prev) => [...prev, { name: activeExerciseName, sets: [] }]);
    setActiveExerciseName("");
    setWeight("");
    setReps("");
    setIsAddingExercise(false);
  };

  const logSet = () => {
    if (!weight || !reps) return;
    setExercises((prev) => {
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      last.sets = [...last.sets, { weight, reps }];
      updated[updated.length - 1] = last;
      return updated;
    });
  };

  const addNewExercise = () => {
    setIsAddingExercise(true);
    setActiveExerciseName("");
    setWeight("");
    setReps("");
  };

  const saveSession = async () => {
    if (exercises.length === 0 && notes.trim() === "") return;
    setIsSaving(true); // Start saving
    const response = await fetch("/api/save-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: sessionTitle,
        exercises,
        notes,
        duration: secondsElapsed,
        type: "training",
      }),
    });
    if (response.ok) {
      console.log("Session saved successfully!");
      resetSession();
      router.push("/training-finished"); // Redirect to the finished page
    } else {
      console.error("Failed to save session.");
    }
    setIsSaving(false); // End saving (in case something goes wrong)
  };

  const resetSession = () => {
    localStorage.removeItem("training_session_draft");
    setExercises([]);
    setNotes("");
    setActiveExerciseName("");
    setWeight("");
    setReps("");
    setEditingSet(null);
    setEditWeight("");
    setEditReps("");
    setIsTimerRunning(false);
  };

  const deleteSession = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete the session?"
    );
    if (!confirmed) return;

    localStorage.removeItem("training_session_draft");
    setExercises([]);
    setNotes("");
    setActiveExerciseName("");
    setWeight("");
    setReps("");
    setEditingSet(null);
    setEditWeight("");
    setEditReps("");
    setIsTimerRunning(false);
    setSecondsElapsed(0); // Reset timer
  };

  useEffect(() => {
    if (exercises.length === 0 && notes.trim() === "") return;

    const interval = setInterval(() => {
      const sessionDraft = {
        title: sessionTitle,
        exercises,
        notes,
        duration: secondsElapsed,
      };
      localStorage.setItem(
        "training_session_draft",
        JSON.stringify(sessionDraft)
      );
    }, 1000); // Save every second

    return () => clearInterval(interval);
  }, [secondsElapsed, exercises, notes]);

  useEffect(() => {
    const draft = localStorage.getItem("training_session_draft");
    if (draft) {
      const {
        title: savedSessionTitle,
        exercises: savedExercises,
        notes: savedNotes,
        duration: savedDuration,
      } = JSON.parse(draft);
      if (savedExercises) setExercises(savedExercises);
      if (savedNotes) setNotes(savedNotes);
      if (savedDuration) setSecondsElapsed(savedDuration);
      if (savedSessionTitle) setSessionTitle(savedSessionTitle);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950">
      <div className="flex flex-col flex-grow">
        <div className="flex flex-col items-center justify-center mt-10 gap-5">
          <p
            className={`${russoOne.className} text-gray-100 font-bold text-lg
        `}
          >
            Track your training progress
          </p>
          <div>
            <p className="text-gray-100 pb-1">Title...</p>
            <input
              className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-5 border-2 rounded-xl border-gray-100 w-fit mx-auto px-4 py-1 bg-gray-900">
          <Timer
            isRunning={isTimerRunning}
            seconds={secondsElapsed}
            setSeconds={setSecondsElapsed}
          />
          <div className="flex">
            {isTimerRunning ? (
              <button onClick={() => setIsTimerRunning(false)}>
                <Image
                  src="/PauseButton.png"
                  alt="pause"
                  width={20}
                  height={20}
                />
              </button>
            ) : (
              <button onClick={() => setIsTimerRunning(true)}>
                <Image src="/Play.png" alt="Play" width={20} height={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center mt-10 ">
          <div>
            <div className="flex items-center pb-1">
              <p className="text-gray-100">Add notes...</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="size-6 mb-2"
              >
                <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
              </svg>
            </div>
            <textarea
              className="text-sm w-[280px]  text-black p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none"
              spellCheck={false}
              placeholder="Add Notes here..."
              name="Notes"
              autoComplete="off"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {!isStarted ? (
          <div className="flex flex-col items-center justify-center gap-5 mt-10">
            <div className="flex items-center gap-5">
              <h2 className="text-gray-100 text-xl">1.</h2>
              <input
                className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                type="text"
                spellCheck={false}
                placeholder="Excercise..."
                name="Exercise"
                autoComplete="off"
                value={activeExerciseName}
                onChange={(e) => setActiveExerciseName(e.target.value)}
              />
            </div>
            <button
              onClick={startExercise}
              className={`${russoOne.className} text-gray-100 font-bold border-b-3 border-l-3 border-blue-950 py-2 px-10 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
            >
              Start
            </button>
          </div>
        ) : (
          <>
            {/* Render all exercises and sets */}
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center mt-10"
              >
                <h2 className="text-xl font-bold text-white mb-5">
                  {exercise.name}
                </h2>

                {/* Locked sets display */}
                {exercise.sets.map((set, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-10 justify-between text-white mt-2"
                  >
                    <span className="text-gray-100 font-semibold">
                      {i + 1}:
                    </span>
                    {editingSet?.exerciseIndex === index &&
                    editingSet?.setIndex === i ? (
                      <>
                        {/*  if we are editing the set */}
                        <div className="flex items-center gap-2">
                          <input
                            className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[60px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                            value={editWeight}
                            placeholder="Weight..."
                            onChange={(e) => setEditWeight(e.target.value)}
                          />
                          <span>X</span>
                          <input
                            className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[60px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                            value={editReps}
                            placeholder="Reps..."
                            onChange={(e) => setEditReps(e.target.value)}
                          />
                        </div>

                        <button
                          className="bg-green-600 px-2 py-1 rounded text-white"
                          onClick={() => {
                            const updated = [...exercises]; // copy exercises
                            updated[index].sets[i] = {
                              weight: editWeight,
                              reps: editReps,
                            }; // update set
                            setExercises(updated); // save it
                            setEditingSet(null); // exit edit mode
                          }}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Normal view of the set */}
                        <div className="flex items-center gap-14 border-b-2 border-gray-700">
                          <div className="flex items-center gap-2">
                            <span>{set.weight} kg</span>
                            <span>x</span>
                            <span>{set.reps}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="bg-yellow-600 px-2 py-1 rounded text-white"
                              onClick={() => {
                                setEditingSet({
                                  exerciseIndex: index,
                                  setIndex: i,
                                }); // enable edit mode
                                setEditWeight(set.weight);
                                setEditReps(set.reps);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-600 px-2 py-1 rounded text-white w-[40px]"
                              onClick={() => {
                                const updated = [...exercises];
                                updated[index].sets.splice(i, 1); // delete the set
                                setExercises(updated);
                              }}
                            >
                              x
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-5">
                <input
                  className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[100px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                  placeholder="Weight..."
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <input
                  className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[100px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                  placeholder="Reps..."
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </div>
              <button
                onClick={logSet}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                ✓
              </button>
            </div>

            {isAddingExercise && (
              <div className="flex flex-col items-center justify-center gap-5 mt-10">
                <div className="flex items-center gap-5">
                  <input
                    className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                    type="text"
                    placeholder="Exercise..."
                    value={activeExerciseName}
                    onChange={(e) => setActiveExerciseName(e.target.value)}
                  />
                </div>
                <button
                  onClick={startExercise}
                  className={`${russoOne.className} text-gray-100 font-bold border-b-3 border-l-3 border-blue-950 py-2 px-10 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
                >
                  Start
                </button>
                <button
                  onClick={() => setIsAddingExercise(false)}
                  className={`${russoOne.className} text-gray-100 font-bold border-b-3 border-l-3 border-blue-950 py-2 px-10 rounded-md bg-red-900 hover:bg-blue-800 hover:scale-95`}
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex flex-col items-center justify-center mt-6">
              <button
                onClick={addNewExercise}
                className={`${russoOne.className} text-gray-100 font-bold border-b-3 border-l-3 border-blue-950 py-2 px-10 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
              >
                Add new Exercise
              </button>
            </div>
          </>
        )}
        <div className="flex flex-col  items-center justify-center mt-10 gap-5 mx-4 mb-20">
          <SaveButton isSaving={isSaving} onClick={saveSession} />
          <button
            className={`${russoOne.className} w-full  text-gray-100 font-bold border-b-3 border-l-3 border-blue-950 py-2 px-10 rounded-md bg-red-900 hover:bg-blue-800 hover:scale-95`}
            onClick={deleteSession}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
