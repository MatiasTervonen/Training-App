"use client";

import { russoOne } from "@/app/ui/fonts";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/ui/save-button";
import Timer from "@/app/components/timer";
import DeleteSessionBtn from "@/app/ui/deleteSessionBtn";
import DropdownMenu from "@/app/components/dropdownMenu";
import { Ellipsis } from "lucide-react";

type ExerciseSet = { weight: string; reps: string; difficulty?: string };
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
  const [editDifficulty, setEditDifficulty] = useState("");
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTitle, setSessionTitle] = useState(() => {
    return "Gym -";
  });
  const [difficulty, setDifficulty] = useState("Medium");
  const [resetTrigger, setResetTrigger] = useState(0);

  const isStarted = exercises.length > 0;

  const startExercise = () => {
    if (!activeExerciseName.trim()) return;
    if (exercises.length === 0) {
      const now = Date.now();

      localStorage.setItem("startTime", new Date().toISOString());

      localStorage.setItem(
        `timer:gym`,
        JSON.stringify({
          startTime: now,
          elapsedBeforePause: 0,
          isRunning: true,
        })
      );

      localStorage.setItem(
        "activeSession",
        JSON.stringify({
          type: "gym",
          label: `${sessionTitle}`,
          startedAt: new Date().toISOString(),
          path: "/training/session",
        })
      );
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
      last.sets = [...last.sets, { weight, reps, difficulty }];
      updated[updated.length - 1] = last;
      return updated;
    });
  };

  const resetSession = () => {
    setExercises([]);
    setNotes("");
    setActiveExerciseName("");
    setWeight("");
    setReps("");
    setEditingSet(null);
    setEditWeight("");
    setEditReps("");
    setSessionTitle("Gym -");
    setDifficulty("Medium");

    setResetTrigger((prev) => prev + 1);
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
      console.log("Session saved successfully!");
      localStorage.removeItem("gym_session_draft");
      localStorage.removeItem("timer:gym");
      localStorage.removeItem("activeSession");
      localStorage.removeItem("startTime");
      resetSession();
      router.push("/training-finished"); // Redirect to the finished page
    } else {
      console.error("Failed to save session.");
    }
    setIsSaving(false); // End saving (in case something goes wrong)
  };

  useEffect(() => {
    if (
      exercises.length === 0 &&
      notes.trim() === "" &&
      sessionTitle.trim() === "Gym -"
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
      if (savedExercises) setExercises(savedExercises);
      if (savedNotes) setNotes(savedNotes);
      if (savedSessionTitle) setSessionTitle(savedSessionTitle);
    }
  }, []);

  return (
    <div className="bg-slate-950 p-5 min-h-[100dvh] relative flex justify-center">
      <div className="flex flex-col flex-grow w-full max-w-[800px] ">
        <div className="text-gray-100 gap-2  border-2 rounded-xl border-gray-100 w-fit  px-4 py-2 bg-gray-900 ">
          <Timer sessionId="gym" resetTrigger={resetTrigger} />
        </div>
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
              placeholder="Title..."
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
            />
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
          <div className="flex flex-col items-center justify-center gap-10 mt-10">
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
              className={`${russoOne.className} px-6 py-2 bg-blue-900 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
            >
              Start Exercise
            </button>
          </div>
        ) : (
          <>
            {/* Render all exercises and sets */}
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center mt-10 mx-auto w-full max-w-[350px]"
              >
                <div className="relative flex items-center justify-between w-full gap-5 mb-5  border-b border-gray-100 ">
                  <h2 className="text-xl font-bold text-white">
                    {exercise.name}
                  </h2>

                  <DropdownMenu button={<Ellipsis className="text-gray-100" />}>
                    <button
                      onClick={() => {
                        const updatedExercises = exercises.filter(
                          (_, i) => i !== index
                        );

                        setExercises(updatedExercises);

                        const sessionDraft = {
                          title: sessionTitle,
                          exercises: updatedExercises,
                          notes,
                        };
                        localStorage.setItem(
                          "gym_session_draft",
                          JSON.stringify(sessionDraft)
                        );
                      }}
                    >
                      Delete
                    </button>
                  </DropdownMenu>
                </div>

                {/* Locked sets display */}
                <table className="w-full text-left border-collapse text-white mb-4">
                  <thead>
                    <tr className="text-gray-300 border-b">
                      <th className="p-2">Set</th>
                      <th className="p-2">Weight</th>
                      <th className="p-2">Reps</th>
                      <th className="p-2">Difficulty</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set, i) => (
                      <tr
                        key={i}
                        className={`border-b ${
                          set.difficulty === "Failure" ? "bg-red-800" : ""
                        }`}
                      >
                        {editingSet?.exerciseIndex === index &&
                        editingSet?.setIndex === i ? (
                          <>
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2">
                              <input
                                className="text-lg p-1 w-[60px] rounded bg-gray-900 border border-gray-100 text-gray-100"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="text-lg p-1 w-[60px] rounded bg-gray-900 border border-gray-100 text-gray-100"
                                value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <select
                                className="text-lg p-1 rounded bg-gray-900 border border-gray-100 text-gray-100"
                                value={editDifficulty}
                                onChange={(e) =>
                                  setEditDifficulty(e.target.value)
                                }
                              >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Failure">Failure</option>
                              </select>
                            </td>
                            <td className="p-2 flex gap-2">
                              <button
                                className="bg-green-600 px-2 py-1 rounded text-white"
                                onClick={() => {
                                  const updated = [...exercises];
                                  updated[index].sets[i] = {
                                    weight: editWeight,
                                    reps: editReps,
                                    difficulty: editDifficulty,
                                  };
                                  setExercises(updated);
                                  setEditingSet(null);
                                }}
                              >
                                Save
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2">{set.weight}</td>
                            <td className="p-2">{set.reps}</td>
                            <td className="p-2">{set.difficulty}</td>
                            <td className="p-2 flex gap-2">
                              <button
                                className="bg-yellow-600 px-2 py-1 rounded text-white"
                                onClick={() => {
                                  setEditingSet({
                                    exerciseIndex: index,
                                    setIndex: i,
                                  });
                                  setEditWeight(set.weight);
                                  setEditReps(set.reps);
                                  setEditDifficulty(set.difficulty || "Medium");
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="bg-red-600 px-2 py-1 rounded text-white"
                                onClick={() => {
                                  const updated = [...exercises];
                                  updated[index].sets.splice(i, 1);
                                  setExercises(updated);
                                }}
                              >
                                x
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {!isAddingExercise && (
              <>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <div className="flex items-center gap-5">
                    <input
                      className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[80px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                      placeholder="Weight..."
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <input
                      className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[80px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                      placeholder="Reps..."
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                    />
                  </div>
                  <select
                    className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[100px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Failure">Failure</option>
                  </select>
                </div>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={logSet}
                    className={`${russoOne.className} px-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                  >
                    Save
                  </button>
                </div>
              </>
            )}

            {isAddingExercise && (
              <div className="flex flex-col items-center justify-center gap-5 mt-10">
                <div className="flex items-center gap-5">
                  <h2 className="text-gray-100 text-xl">
                    {exercises.length + 1}.
                  </h2>
                  <input
                    className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                    type="text"
                    placeholder="Exercise..."
                    value={activeExerciseName}
                    onChange={(e) => setActiveExerciseName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col items-center gap-5 w-[px]">
                  <button
                    onClick={startExercise}
                    className={`${russoOne.className} w-full px-10 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                  >
                    Start Exercise
                  </button>
                  <button
                    onClick={() => setIsAddingExercise(false)}
                    className={`${russoOne.className} w-full px-10 bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!isAddingExercise && (
              <div className="flex flex-col items-center justify-center mt-6">
                <button
                  onClick={addNewExercise}
                  className={`${russoOne.className}  px-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                >
                  Add new Exercise
                </button>
              </div>
            )}
          </>
        )}
        <div className="flex flex-col  items-center justify-center mt-14 gap-5 mx-8 mb-20">
          <SaveButton isSaving={isSaving} onClick={saveSession} />
          <DeleteSessionBtn
            storageKey={[
              "gym_session_draft",
              "timer:gym",
              "activeSession",
              "startTime",
            ]}
            onDelete={resetSession}
          />
        </div>
      </div>
    </div>
  );
}
