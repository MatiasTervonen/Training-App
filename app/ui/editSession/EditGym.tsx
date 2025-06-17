"use client";

import { useState } from "react";
import NotesInput from "@/app/training/components/NotesInput";
import TitleInput from "@/app/training/components/TitleInput";
import SaveButton from "@/app/ui/save-button";
import FullScreenLoader from "@/app/components/FullScreenLoader";
import { russoOne } from "@/app/ui/fonts";
import { GymSessionFull, GymExercise } from "@/types/session";
import { groupGymExercises } from "@/lib/groupGymexercises";
import { mutate } from "swr";
import toast from "react-hot-toast";
import SetInput from "@/app/training/components/SetInput";
import ExerciseTypeSelect from "@/app/training/components/ExerciseTypeSelect";

type EditGymSessionProps = {
  gym_session: GymSessionFull;
  onClose: () => void;
  onSave?: () => void;
};

type FeedItem = {
  table: "gym_sessions";
  item: GymSessionFull;
  pinned: boolean;
};

const isCardioExercise = (exercise: GymExercise) =>
  exercise.gym_exercises.main_group?.toLowerCase() === "cardio";

export default function EditGym({
  gym_session,
  onClose,
  onSave,
}: EditGymSessionProps) {
  const [title, setTitle] = useState(gym_session.title);
  const [notes, setNotes] = useState(gym_session.notes);
  const [exercises, setExercises] = useState(gym_session.gym_session_exercises);
  const [isSaving, setIsSaving] = useState(false);

  const formattedExercises = exercises.map((exercise) => ({
    exercise_id: exercise.gym_exercises.id,
    superset_id: exercise.superset_id || null,
    notes: exercise.notes || "",
    sets: exercise.gym_sets.map((set) => ({
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
    })),
  }));

  const handleSubmit = async () => {
    setIsSaving(true);

    mutate(
      "/api/feed",
      (currentFeed: FeedItem[] = []) => {
        return currentFeed.map((item) => {
          if (
            item.table === "gym_sessions" &&
            item.item.id === gym_session.id
          ) {
            return {
              ...item,
              item: {
                ...item.item,
                title,
                notes,
              },
            };
          }
          return item;
        });
      },
      false
    ); // Optimistically update the feed

    try {
      const res = await fetch("/api/gym/edit-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: gym_session.id,
          title,
          notes,
          exercises: formattedExercises,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save gym session");
      }

      await res.json();

      onSave?.();
      onClose();

      mutate("/api/feed");
    } catch (error) {
      console.error("Error saving gym session:", error);
      toast.error("Failed to edit gym session");
      mutate("/api/feed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof (typeof exercises)[0]["gym_sets"][0],
    value: string
  ) => {
    const updated = [...exercises];

    updated[exIndex].gym_sets[setIndex] = {
      ...updated[exIndex].gym_sets[setIndex],
      [field]: value,
    };
    setExercises(updated);
  };

  const handleUpdateExerciseNotes = (exIndex: number, newNotes: string) => {
    const updated = [...exercises];
    updated[exIndex].notes = newNotes;
    setExercises(updated);
  };

  const groupedExercises = groupGymExercises(
    gym_session.gym_session_exercises || []
  );

  return (
    <>
      <div
        className={`${russoOne.className} flex flex-col w-full h-full mb-10 max-w-md mx-auto`}
      >
        <div className="flex flex-col gap-10 mx-10 mt-10">
          <h2 className={` text-gray-100  text-lg text-center `}>
            Edit Your Gym Session
          </h2>
          <div>
            <TitleInput
              title={title}
              setTitle={setTitle}
              placeholder="Session title..."
              label="Session Title..."
            />
          </div>
          <div>
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              rows={2}
              cols={35}
              label="Session Notes..."
            />
          </div>
        </div>
        {Object.entries(groupedExercises).map(([superset_id, group]) => (
          <div
            key={superset_id}
            className={`mt-10 bg-gradient-to-tr from-gray-900 via-slate-800 to-blue-900 rounded-md mx-2 ${
              group.length > 1
                ? "border-2 border-blue-700"
                : "border-2 border-gray-700"
            }`}
          >
            {group.length > 1 && (
              <h3 className="text-lg text-gray-100 text-center my-2">
                Super-Set
              </h3>
            )}

            {group.map(({ exercise, index }) => (
              <div key={index} className="w-full py-2 px-4 mb-4">
                <div className="flex justify-between flex-col mb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg text-gray-100 ">
                      {index + 1}. {exercise.gym_exercises.name}
                    </h3>
                    <h3 className="text-sm text-gray-300">
                      {exercise.gym_exercises.muscle_group}
                    </h3>
                  </div>
                  <h2 className="text-sm text-gray-400">
                    {exercise.gym_exercises.equipment}
                  </h2>
                </div>
                <div className="my-5 max-w-full">
                  <NotesInput
                    notes={exercise.notes || ""}
                    setNotes={(newNotes) =>
                      handleUpdateExerciseNotes(index, newNotes)
                    }
                    rows={2}
                    cols={35}
                    placeholder="Add your notes here..."
                    label={`Notes for ${exercise.gym_exercises.name}...`}
                  />
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-100 border-b">
                      <th className="p-2 font-normal">Set</th>
                      {isCardioExercise(exercise) ? (
                        <>
                          <th className="p-2 font-normal">Time (min)</th>
                          <th className="p-2 font-normal">Rpe</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 font-normal">Weight</th>
                          <th className="p-2 font-normal">Reps</th>
                          <th className="p-2 font-normal">Rpe</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.gym_sets.map((set, setIndex) => (
                      <tr
                        key={setIndex}
                        className={`${
                          set.rpe === "Failure"
                            ? "bg-red-500 text-white"
                            : "text-gray-100"
                        } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                      >
                        <td className="p-2 border-b">{setIndex + 1}</td>
                        {isCardioExercise(exercise) ? (
                          <>
                            <td className="p-2 border-b w-2/4">
                              <SetInput
                                type="number"
                                placeholder="Time (min)"
                                value={set.weight}
                                onChange={(val) =>
                                  handleUpdateSet(
                                    index,
                                    setIndex,
                                    "weight",
                                    val
                                  )
                                }
                              />
                            </td>
                            <td className="p-2 border-b w-2/4 relative">
                              <ExerciseTypeSelect
                                value={set.rpe}
                                onChange={(val) =>
                                  handleUpdateSet(index, setIndex, "rpe", val)
                                }
                                options={[
                                  { value: "Warm-up", label: "Warm-up" },
                                  { value: "Easy", label: "Easy" },
                                  { value: "Medium", label: "Medium" },
                                  { value: "Hard", label: "Hard" },
                                  { value: "Failure", label: "Failure" },
                                ]}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 border-b w-1/3">
                              <SetInput
                                placeholder="Weight..."
                                type="number"
                                value={set.weight}
                                onChange={(val) =>
                                  handleUpdateSet(
                                    index,
                                    setIndex,
                                    "weight",
                                    val
                                  )
                                }
                              />
                            </td>
                            <td className="p-2 border-b w-1/3">
                              <SetInput
                                type="number"
                                placeholder="Reps..."
                                value={set.reps}
                                onChange={(val) =>
                                  handleUpdateSet(index, setIndex, "reps", val)
                                }
                              />
                            </td>
                            <td className="p-2 border-b w-2/3 relative">
                              <ExerciseTypeSelect
                                value={set.rpe}
                                onChange={(val) =>
                                  handleUpdateSet(index, setIndex, "rpe", val)
                                }
                                options={[
                                  { value: "Warm-up", label: "Warm-up" },
                                  { value: "Easy", label: "Easy" },
                                  { value: "Medium", label: "Medium" },
                                  { value: "Hard", label: "Hard" },
                                  { value: "Failure", label: "Failure" },
                                ]}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))}
        <div className="my-10 mx-10">
          <SaveButton isSaving={isSaving} onClick={handleSubmit} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving..." />}
    </>
  );
}
