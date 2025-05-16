import React from "react";
import { Exercise } from "@/types/session";

type editExercisesProps = {
  exercises: Exercise[];
  onChange: (updated: Exercise[]) => void;
};

export default function EditExercises({
  exercises,
  onChange,
}: editExercisesProps) {
  const handleNameChange = (index: number, newName: string) => {
    const updated = [...exercises];
    updated[index].name = newName;
    onChange(updated);
  };

  const handleNotesChange = (index: number, newNotes: string) => {
    const updated = [...exercises];
    updated[index].notes = newNotes;
    onChange(updated);
  };

  const handleSetChange = (
    exIndex: number,
    setindex: number,
    field: "reps" | "weight" | "lvl",
    value: string
  ) => {
    const updated = [...exercises];
    updated[exIndex].sets[setindex][field] = value;
    onChange(updated);
  };

  const handleDeleteExercise = (index: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this exercise?"
    );
    if (!confirmDelete) return;

    const updated = exercises.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleDeleteSet = (exIndex: number, setIndex: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this set?"
    );
    if (!confirmDelete) return;

    const updated = [...exercises];
    updated[exIndex].sets = updated[exIndex].sets.filter(
      (_, i) => i !== setIndex
    );
    onChange(updated);
  };

  return (
    <div>
      {Array.isArray(exercises) &&
        exercises.map((exercise, exIndex) => (
          <div
            key={exIndex}
            className="flex flex-col gap-2 mb-4 border p-4 rounded-md bg-slate-800"
          >
            <div className="flex justify-between items-center mb-5">
              <label>Exercise {exIndex + 1}</label>
              <button
                onClick={() => handleDeleteExercise(exIndex)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => handleNameChange(exIndex, e.target.value)}
              placeholder="exercise name"
              className=" p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500 text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
            />
            <label className="mt-3">Notes for {exercise.name} </label>
            <textarea
              className="w-full p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
              value={exercise.notes}
              onChange={(e) => handleNotesChange(exIndex, e.target.value)}
            />
            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="flex items-center gap-4 mt-2">
                <span className="w-4">{setIndex + 1}</span>
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) =>
                    handleSetChange(exIndex, setIndex, "weight", e.target.value)
                  }
                  placeholder="Weight..."
                  className="p-2 rounded-md border-2 border-gray-100 z-10 w-[60px]  placeholder-gray-500  text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                />
                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) =>
                    handleSetChange(exIndex, setIndex, "reps", e.target.value)
                  }
                  placeholder="Reps..."
                  className="p-2 rounded-md border-2 border-gray-100 z-10 w-[60px]  placeholder-gray-500  text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                />
                <select
                  value={set.lvl}
                  onChange={(e) =>
                    handleSetChange(exIndex, setIndex, "lvl", e.target.value)
                  }
                  className="p-2 rounded-md border-2 border-gray-100 z-10 w-[60px]  placeholder-gray-500  text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                >
                  <option value="Warm-up">Warm-up</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Failure">Failure</option>
                </select>
                <button
                  onClick={() => handleDeleteSet(exIndex, setIndex)}
                  className="text-red-500 ml-auto"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
