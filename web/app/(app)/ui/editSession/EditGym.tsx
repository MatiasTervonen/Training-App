"use client";

import { useState } from "react";
import NotesInput from "@/app/(app)/ui/NotesInput";
import CustomInput from "@/app/(app)/ui/CustomInput";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import SetInput from "@/app/(app)/training/components/SetInput";
import ExerciseTypeSelect from "@/app/(app)/training/components/ExerciseTypeSelect";
import { full_gym_exercises, full_gym_session } from "../../types/models";
import { GroupExercises } from "@/app/(app)/utils/GroupExercises";
import { handleError } from "../../utils/handleError";

type EditGymSessionProps = {
  gym_session: full_gym_session;
  onClose: () => void;
  onSave?: () => void;
};

const isCardioExercise = (exercise: full_gym_exercises) =>
  exercise.gym_exercises.main_group?.toLowerCase() === "cardio";

export default function EditGym({
  gym_session,
  onClose,
  onSave,
}: EditGymSessionProps) {
  const [title, setValue] = useState(gym_session.title);
  const [notes, setNotes] = useState(gym_session.notes);
  const [duration, setDuration] = useState(gym_session.duration);
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
      time_min: set.time_min,
      distance_meters: set.distance_meters,
    })),
  }));

  const handleSubmit = async () => {
    setIsSaving(true);

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
          duration,
          exercises: formattedExercises,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save gym session");
      }

      await res.json();

      await onSave?.();
      onClose();
    } catch (error) {
      handleError(error, {
        message: "Error editing gym session",
        route: "/api/gym/edit-session",
        method: "POST",
      });
      toast.error("Failed to edit gym session");
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

  const groupedExercises = GroupExercises(gym_session.gym_session_exercises);

  return (
    <>
      <div className="flex flex-col w-full h-full mb-10 max-w-md mx-auto">
        <div className="flex flex-col gap-10 mx-10 mt-10">
          <h2 className={` text-gray-100  text-lg text-center `}>
            Edit Your Gym Session
          </h2>
          <div>
            <CustomInput
              value={title || ""}
              setValue={setValue}
              placeholder="Session title..."
              label="Session Title..."
            />
          </div>
          <div>
            <CustomInput
              value={duration.toString()}
              setValue={(val) => setDuration(Number(val))}
              placeholder="Duration in seconds..."
              label="Duration (seconds)..."
              type="number"
            />
          </div>
          <div>
            <NotesInput
              notes={notes || ""}
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
                          <th className="p-2 font-normal">Distance (m)</th>
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
                                value={set.time_min}
                                onChange={(val) =>
                                  handleUpdateSet(
                                    index,
                                    setIndex,
                                    "time_min",
                                    val
                                  )
                                }
                              />
                            </td>
                            <td className="p-2 border-b w-2/4 relative">
                              <SetInput
                                type="number"
                                placeholder="distance (meters)..."
                                value={set.distance_meters}
                                onChange={(val) =>
                                  handleUpdateSet(
                                    index,
                                    setIndex,
                                    "distance_meters",
                                    val
                                  )
                                }
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
        <div className="py-10 mx-10">
          <SaveButton onClick={handleSubmit} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving..." />}
    </>
  );
}
