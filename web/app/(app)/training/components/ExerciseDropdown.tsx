"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import { gym_exercises } from "../../types/models";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import Spinner from "../../components/spinner";

type Props = {
  onSelect: (exercise: gym_exercises) => void;
  resetTrigger?: number;
  noTopPadding?: boolean;
};

export default function ExerciseDropdown({ onSelect, resetTrigger }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExercises, setFilteredExercises] = useState<gym_exercises[]>(
    []
  );
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showDropdown, setShowDropdown] = useState(true);

  const {
    data: exercises,
    error: exercisesError,
    isLoading: isExercisesLoading,
  } = useSWR<gym_exercises[]>("/api/gym/exercises", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const {
    data: recentExercises,
    error: recentError,
    isLoading: isRecentLoading,
  } = useSWR<gym_exercises[]>("/api/gym/recent-exercises", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const isLoading = isExercisesLoading || isRecentLoading;
  const isError = exercisesError || recentError;

  const allExercises = exercises || [];

  const recentExercisesList = recentExercises || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    if (value.length > 0) {
      const filteredExercises = allExercises.filter((exercise) => {
        const combinedText =
          `${exercise.name} ${exercise.equipment} ${exercise.muscle_group} ${exercise.main_group}`.toLowerCase();
        return value
          .toLowerCase()
          .split(" ")
          .every((word) => combinedText.includes(word));
      });
      setFilteredExercises(filteredExercises);
      setSelectedIndex(-1);
    } else {
    }
  };

  const handleSelectExercise = (exercise: gym_exercises) => {
    setSearchQuery(exercise.name + " " + "(" + exercise.equipment + ")");
    onSelect(exercise);
    setShowDropdown(false);
  };

  //  Handles arrow key navigation in the dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredExercises.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredExercises.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex !== -1) {
        handleSelectExercise(filteredExercises[selectedIndex]); // Select highlighted city
      }
    }
  };

  useEffect(() => {
    setSearchQuery("");
  }, [resetTrigger]);

  useEffect(() => {
    setShowDropdown(true);
  }, [resetTrigger]);

  return (
    <>
      <div className="flex flex-col px-2 w-full h-[calc(100dvh-74px)] z-50">
        <div className="flex flex-col mt-8 px-20">
          <input
            className="p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
            type="text"
            value={searchQuery}
            placeholder="Search exercises..."
            autoComplete="off"
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            name="exercise"
          />
        </div>

        {showDropdown && (
          <>
            <div
              ref={dropdownRef}
              className="w-full overflow-y-auto border rounded-md shadow-md 
                    bg-slate-900 border-gray-100 touch-pan-y mt-10"
            >
              {isLoading || isError ? (
                <div className="h-[calc(100dvh-74px)] flex flex-col gap-6 items-center justify-center z-50 text-center">
                  {isLoading && (
                    <>
                      <p className="text-gray-100 text-xl">
                        Loading exercises...
                      </p>
                      <Spinner size="h-10 w-10" />
                    </>
                  )}
                  {isError && (
                    <p className="text-red-500">
                      Failed to load exercises. Try again!
                    </p>
                  )}
                </div>
              ) : (
                searchQuery.length === 0 &&
                recentExercisesList.length > 0 && (
                  <div className="bg-slate-900">
                    <h2 className="text-gray-100 text-center bg-slate-600">
                      Recent Exercises
                    </h2>
                    {recentExercisesList.map((exercise) => (
                      <button
                        key={exercise.id}
                        className="w-full text-left px-4 py-2 cursor-pointer z-40 text-gray-100 hover:bg-slate-600 hover:text-gray-100 border-b"
                        onClick={() => handleSelectExercise(exercise)}
                      >
                        <div className="flex justify-between flex-col">
                          <div className="flex justify-between items-center">
                            <span>{exercise.name} </span>
                            <span className="text-sm text-gray-300">
                              {exercise.muscle_group}
                            </span>
                          </div>
                          <span className="text-sm text-gray-400">
                            {exercise.equipment}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}

              <h2 className="text-gray-100 text-center bg-slate-600">
                All Exercises
              </h2>
              {(searchQuery.length > 0 ? filteredExercises : allExercises).map(
                (exercise, index) => {
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectExercise(exercise)}
                      className={`w-full text-left px-4 py-2 cursor-pointer z-40 text-gray-100 hover:bg-slate-600 hover:text-gray-100 border-b ${
                        selectedIndex === index
                          ? "bg-slate-600 hover:bg-slate-500"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col ">
                        <div className="flex justify-between items-center">
                          <p>{exercise.name} </p>
                          <p className="text-sm text-gray-300">
                            {exercise.muscle_group}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">
                          {exercise.equipment}
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
