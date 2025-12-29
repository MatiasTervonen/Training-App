import ExerciseDropdown from "@/Features/gym/ExerciseDropdown";
import { CircleX } from "lucide-react-native";
import { ExerciseEntry, emptyExerciseEntry } from "@/types/session";
import { generateUUID } from "@/utils/generateUUID";
import AppText from "@/components/AppText";
import { Pressable, View } from "react-native";
import React from "react";

interface Props {
  draftExercises: ExerciseEntry[];
  setDraftExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  exerciseToChangeIndex: number | null;
  setExerciseToChangeIndex: (index: number | null) => void;
  exercises: ExerciseEntry[];
  setExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  resetTrigger: number;
  setIsExerciseModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ExerciseSelectorList({
  draftExercises,
  setDraftExercises,
  exerciseToChangeIndex,
  setExerciseToChangeIndex,
  exercises,
  setExercises,
  resetTrigger,
  setIsExerciseModalOpen,
}: Props) {
  return (
    <>
      {draftExercises.map((exercise, index) => {
        const isLast = index === draftExercises.length - 1;
        const isEmpty = !exercise.name?.trim();

        if (isLast && isEmpty) {
          // Show dropdown only for the last, empty item
          return (
            <ExerciseDropdown
              key={index}
              onSelect={(selected) => {
                const newExercise: ExerciseEntry = {
                  exercise_id: String(selected.id),
                  name: selected.name,
                  equipment: selected.equipment,
                  main_group: selected.main_group || "",
                  sets: [],
                  notes: "",
                  superset_id:
                    exerciseToChangeIndex !== null
                      ? exercises[exerciseToChangeIndex]?.superset_id ||
                        generateUUID()
                      : "",
                  muscle_group: selected.muscle_group || "",
                };

                if (exerciseToChangeIndex !== null) {
                  // Update single exercise in session
                  const updated = [...exercises];
                  updated[exerciseToChangeIndex] = newExercise;
                  setExercises(updated);
                  setIsExerciseModalOpen(false);
                  setExerciseToChangeIndex(null);
                } else {
                  // Add new exercise to superset draft
                  setDraftExercises((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = newExercise;
                    return [...updated, emptyExerciseEntry]; // allow adding another
                  });
                }
              }}
              resetTrigger={resetTrigger}
            />
          );
        }

        // All others: just show a summary
        return (
          <View
            key={index}
            className="bg-slate-700 p-2 my-2 px-4 flex-row justify-between items-center mr-20 ml-0"
          >
            <View>
              <AppText className="">{exercise.name}</AppText>
              <AppText className="text-sm text-gray-400">
                {exercise.equipment} / {exercise.muscle_group}
              </AppText>
            </View>
            <Pressable
              hitSlop={10}
              onPress={() =>
                setDraftExercises((prev) => prev.filter((_, i) => i !== index))
              }
            >
              <CircleX color="#f3f4f6" />
            </Pressable>
          </View>
        );
      })}
    </>
  );
}
