"use client";

import { useState, useEffect, useRef } from "react";
import { gym_exercises } from "@/app/(app)/types/models";
import Spinner from "@/app/(app)/components/spinner";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { getExercises } from "@/app/(app)/database/gym/get-exercises";
import { getRecentExercises } from "@/app/(app)/database/gym/recent-exercises";

type Props = {
  onSelect: (exercise: gym_exercises) => void;
};

export default function ExerciseDropdown({ onSelect }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    error: exercisesError,
    isLoading: isExercisesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["exercises", searchQuery],
    queryFn: ({ pageParam = 0 }) =>
      getExercises({ pageParam, limit: 50, search: searchQuery }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const {
    data: recentExercises,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recentExercises"],
    queryFn: async () => await getRecentExercises(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const isLoading = isExercisesLoading || isRecentLoading;
  const isError = exercisesError || recentError;

  const allExercises = data?.pages.flatMap((p) => p.data) || [];

  const recentExercisesList = recentExercises || [];

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearchChange = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 400);

  const handleSelectExercise = (exercise: gym_exercises) => {
    setSearchQuery(exercise.name + " " + "(" + exercise.equipment + ")");
    onSelect(exercise);
  };

  return (
    <>
      <div className="flex flex-col px-2 w-full h-[calc(100dvh-74px)] z-50">
        <div className="flex flex-col mt-8 px-20">
          <input
            className="p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
            type="text"
            value={inputValue}
            placeholder="Search exercises..."
            autoComplete="off"
            onChange={(e) => {
              setInputValue(e.target.value);
              handleSearchChange(e.target.value);
            }}
            spellCheck={false}
            name="exercise"
          />
        </div>

        <>
          <div
            className="w-full overflow-y-auto border rounded-md shadow-md 
                    bg-slate-900 border-gray-100 touch-pan-y mt-10 h-full"
          >
            {isLoading || isError ? (
              <div className="h-[calc(100dvh-74px)] flex flex-col gap-6 items-center justify-center z-50 text-center">
                {isLoading && (
                  <>
                    <p className="text-lg">Loading exercises...</p>
                    <Spinner size="h-8 w-8" />
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
                  <h2 className="text-center bg-slate-600">Recent Exercises</h2>
                  {recentExercisesList.map((exercise) => (
                    <button
                      key={exercise.id}
                      className="w-full text-left px-4 py-2 cursor-pointer z-40 hover:bg-slate-800  border-b"
                      onClick={() => handleSelectExercise(exercise as gym_exercises)}
                    >
                      <div className="flex justify-between flex-col">
                        <div className="flex justify-between items-center">
                          <span className="truncate mr-5">{exercise.name}</span>
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

            <h2 className="text-center bg-slate-600">All Exercises</h2>

            {!isLoading &&
              searchQuery.length > 0 &&
              allExercises.length === 0 && (
                <p className="text-center py-4 text-gray-400 mt-20 text-lg">
                  No exercises found.
                </p>
              )}

            {allExercises.map((exercise, index) => {
              return (
                <button
                  key={index}
                  onClick={() => handleSelectExercise(exercise)}
                  className="w-full text-left px-4 py-2 cursor-pointer z-40  hover:bg-slate-800  border-b"
                >
                  <div className="flex flex-col ">
                    <div className="flex justify-between items-center">
                      <p className="truncate mr-5">{exercise.name}</p>
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
            })}
            {isFetchingNextPage && !isExercisesLoading && (
              <div className="flex flex-col gap-2 justify-center items-center pt-5">
                <p>Loading more</p>
                <Spinner />
              </div>
            )}
            <div ref={loadMoreRef} className="h-10"></div>
          </div>
        </>
      </div>
    </>
  );
}
