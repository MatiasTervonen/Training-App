"use client";

import { useState, useMemo } from "react";
import Spinner from "@/app/(app)/components/spinner";
import { useQuery } from "@tanstack/react-query";
import {
  getExercises,
  ExerciseWithTranslation,
} from "@/app/(app)/database/gym/get-exercises";
import { getRecentExercises } from "@/app/(app)/database/gym/recent-exercises";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";

type Props = {
  onSelect: (exercise: ExerciseWithTranslation) => void;
};

export default function ExerciseDropdown({ onSelect }: Props) {
  const { t } = useTranslation("gym");
  const [searchQuery, setSearchQuery] = useState("");
  const language = useUserStore((state) => state.preferences?.language ?? "en");

  const {
    data: allExercisesData,
    error: exercisesError,
    isLoading: isExercisesLoading,
  } = useQuery({
    queryKey: ["exercises", language],
    queryFn: getExercises,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const {
    data: recentExercises,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recentExercises", language],
    queryFn: getRecentExercises,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const isLoading = isExercisesLoading || isRecentLoading;
  const isError = exercisesError || recentError;

  // Filter exercises with translated values
  const allExercises = useMemo(() => {
    if (!allExercisesData) return [];
    if (!searchQuery.trim()) return allExercisesData;

    const query = searchQuery.toLowerCase();
    return allExercisesData.filter((exercise) => {
      const name = exercise.name?.toLowerCase() ?? "";
      const equipment =
        t(`gym.equipment.${exercise.equipment}`)?.toLowerCase() ?? "";
      const muscleGroup =
        t(`gym.muscleGroups.${exercise.muscle_group}`)?.toLowerCase() ?? "";
      const mainGroup =
        t(`gym.mainGroups.${exercise.main_group}`)?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        equipment.includes(query) ||
        muscleGroup.includes(query) ||
        mainGroup.includes(query)
      );
    });
  }, [allExercisesData, searchQuery, t]);

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-120px)] flex flex-col gap-6 items-center justify-center z-50 text-center">
        <p className="text-lg">{t("gym.exerciseDropdown.loadingExercises")}</p>
        <Spinner size="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[calc(100dvh-120px)] flex flex-col gap-6 items-center justify-center z-50 text-center px-10">
        <p className="text-red-500">{t("gym.exerciseDropdown.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-2 w-full h-full z-50">
      <div className="flex flex-col mt-8 px-20">
        <input
          className="p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
          type="text"
          value={searchQuery}
          placeholder={t("gym.exerciseDropdown.searchPlaceholder")}
          autoComplete="off"
          onChange={(e) => setSearchQuery(e.target.value)}
          spellCheck={false}
          name="exercise"
        />
      </div>

      <div
        className="w-full overflow-y-auto border rounded-md shadow-md
                bg-slate-900 border-gray-100 touch-pan-y mt-10 h-full"
      >
        {searchQuery.length === 0 &&
          recentExercises &&
          recentExercises.length > 0 && (
            <div className="bg-slate-900">
              <h2 className="text-center bg-blue-600">
                {t("gym.exerciseDropdown.recentExercises")}
              </h2>
              {recentExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  className="w-full text-left px-4 py-2 cursor-pointer z-40 hover:bg-slate-800 border-b"
                  onClick={() => onSelect(exercise)}
                >
                  <div className="flex justify-between flex-col">
                    <div className="flex justify-between items-center">
                      <span className="truncate mr-5">{exercise.name}</span> 
                      <span className="text-sm text-gray-300">
                        {t(`gym.muscleGroups.${exercise.muscle_group}`)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {t(`gym.equipment.${exercise.equipment}`)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

        <h2 className="text-center bg-blue-600">
          {t("gym.exerciseDropdown.allExercises")}
        </h2>

        {searchQuery.length > 0 && allExercises.length === 0 && (
          <p className="text-center py-4 text-gray-400 mt-20 text-lg">
            {t("gym.exerciseDropdown.noExercisesFound")}
          </p>
        )}

        {allExercises.map((exercise, index) => (
          <button
            key={index}
            onClick={() => onSelect(exercise)}
            className="w-full text-left px-4 py-2 cursor-pointer z-40 hover:bg-slate-800 border-b"
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-center">
                <p className="truncate mr-5">{exercise.name}</p>
                <p className="text-sm text-gray-300">
                  {t(`gym.muscleGroups.${exercise.muscle_group}`)}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                {t(`gym.equipment.${exercise.equipment}`)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
