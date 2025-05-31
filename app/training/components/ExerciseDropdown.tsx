"use client";

import { useState, useEffect } from "react";
import { russoOne } from "@/app/ui/fonts";
import { useRef } from "react";
import { Exercises } from "@/types/session";

type Props = {
  onSelect: (exercise: Exercises) => void;
  label?: string | number;
  resetTrigger?: number;
};

export default function ExerciseDropdown({
  onSelect,
  label,
  resetTrigger,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<Exercises[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercises[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [recentExercises, setRecentExercises] = useState<Exercises[]>([]);
  const [showDropdown, setShowDropdown] = useState(true);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);

  useEffect(() => {
    const fetchExersises = async () => {
      setIsDropdownLoading(true);
      const res = await fetch("/api/gym/exercises");
      const data = await res.json();
      setIsDropdownLoading(false);
      console.log("Fetched exercises:", data);

      if (res.ok && data) {
        setExercises(data);
      } else {
        console.error("Error fetching exercises:", data.error);
      }
    };
    fetchExersises();
  }, []);

  useEffect(() => {
    const fetchRecentExercises = async () => {
      setIsDropdownLoading(true);
      const res = await fetch("/api/gym/recent-exercises");
      const data = await res.json();
      setIsDropdownLoading(false);
      if (res.ok && data) {
        setRecentExercises(data);
      } else {
        console.error("Error fetching recent exercises:", data.error);
      }
    };
    fetchRecentExercises();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    if (value.length > 0) {
      const filteredExercises = exercises.filter((exercise) => {
        const combinedText =
          `${exercise.name} ${exercise.equipment} ${exercise.muscle_group}`.toLowerCase();
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

  const handleSelectExercise = (exercise: Exercises) => {
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

  return (
    <>
      <div className="relative flex flex-col px-2 pb-2 w-full  h-full items-center gap-3 z-50 ">
        <div className="flex h-10 items-center gap-2 mt-5 relative ">
          <label className={`${russoOne.className} text-gray-100 text-xl`}>
            {label}.
          </label>
          <input
            className="text-lg p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
            type="text"
            value={searchQuery}
            placeholder="Exercise... "
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
              className={`${russoOne.className} text-gray-100 text-md flex justify-between w-full items-center mt-5 px-4 z-10`}
            >
              <span>Exercise</span>
              <span>Equipment</span>
            </div>
            <div
              ref={dropdownRef}
              className={`relative w-full overflow-y-auto border rounded-md shadow-md bg-slate-900 border-gray-100 touch-pan-y ${
                isDropdownLoading ? "h-full" : ""
              }`}
            >
              {isDropdownLoading && (
                <div className="absolute left-0 w-full h-full flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-100"></div>
                </div>
              )}
              {searchQuery.length === 0 && recentExercises.length > 0 && (
                <div className="border-b-2 border-gray-400 bg-gray-900">
                  <h2 className="text-gray-100 text-center">
                    Recent Exercises
                  </h2>
                  {recentExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      className="w-full text-left px-4 py-2 text-lg cursor-pointer z-40 text-gray-100 hover:bg-slate-600 hover:text-gray-100"
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <div className="flex justify-between items-center">
                        <span>{exercise.name} </span>
                        <span>{exercise.equipment}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {(searchQuery.length > 0 ? filteredExercises : exercises).map(
                (exercise, index) => {
                  return (
                    <div
                      key={index}
                      onClick={() => handleSelectExercise(exercise)}
                      className={`px-4 py-2 text-lg cursor-pointer z-40  text-gray-100  ${
                        selectedIndex === index
                          ? "bg-slate-600 hover:bg-slate-500"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{exercise.name}</span>
                        <span>{exercise.equipment}</span>
                      </div>
                    </div>
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
