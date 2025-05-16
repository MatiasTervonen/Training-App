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

  const handleSetChange = (
    exIndex: number,
    setindex: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const updated = [...exercises];
    updated[exIndex].sets[setindex][field] = value;
    onChange(updated);
  };

  return (
    <div>
      {Array.isArray(exercises) &&
        exercises.map((exercise, exIndex) => (
          <div key={exIndex} className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => handleNameChange(exIndex, e.target.value)}
              placeholder="exercise name"
              className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
            />

            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="flex gap-2">
                <input
                  type="text"
                  value={set.weight}
                  onChange={(e) =>
                    handleSetChange(exIndex, setIndex, "weight", e.target.value)
                  }
                  placeholder="Weight..."
                  className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[60px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                />
                <input
                  type="text"
                  value={set.reps}
                  onChange={(e) =>
                    handleSetChange(exIndex, setIndex, "reps", e.target.value)
                  }
                  placeholder="Reps..."
                  className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[60px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
                />
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
