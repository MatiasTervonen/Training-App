import ExerciseDropdown from "@/features/gym/components/ExerciseDropdown";
import { X } from "lucide-react-native";
import { ExerciseEntry, emptyExerciseEntry } from "@/types/session";
import { generateUUID } from "@/utils/generateUUID";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { Pressable, View } from "react-native";
import React from "react";
import { useTranslation } from "react-i18next";

type PhaseType = "warmup" | "cooldown";

interface Props {
  draftExercises: ExerciseEntry[];
  setDraftExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  exerciseToChangeIndex: number | null;
  setExerciseToChangeIndex: (index: number | null) => void;
  exercises: ExerciseEntry[];
  setExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  setIsExerciseModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hasWarmup?: boolean;
  hasCooldown?: boolean;
  onSelectPhase?: (phaseType: PhaseType) => void;
}

export default function ExerciseSelectorList({
  draftExercises,
  setDraftExercises,
  exerciseToChangeIndex,
  setExerciseToChangeIndex,
  exercises,
  setExercises,
  setIsExerciseModalOpen,
  hasWarmup,
  hasCooldown,
  onSelectPhase,
}: Props) {
  const { t } = useTranslation("gym");

  const selectedExercises = draftExercises.filter(
    (ex, i) => !(i === draftExercises.length - 1 && !ex.name?.trim()),
  );

  return (
    <>
      {selectedExercises.length > 0 && (
        <View className="px-4 pt-2">
          {selectedExercises.map((exercise, index) => (
            <View
              key={`${exercise.exercise_id}-${index}`}
              className="bg-slate-800 border border-slate-600 px-4 py-1.5 mb-1 flex-row items-center justify-between rounded-md"
            >
              <BodyText className="text-sm flex-1" numberOfLines={1}>
                {exercise.name}
              </BodyText>
              <Pressable
                hitSlop={20}
                onPress={() =>
                  setDraftExercises((prev) =>
                    prev.filter((_, i) => i !== index),
                  )
                }
              >
                <X size={14} color="#9ca3af" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <ExerciseDropdown
        hasWarmup={hasWarmup}
        hasCooldown={hasCooldown}
        onSelectPhase={(phaseType) => {
          setIsExerciseModalOpen(false);
          onSelectPhase?.(phaseType);
        }}
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
            const updated = [...exercises];
            updated[exerciseToChangeIndex] = newExercise;
            setExercises(updated);
            setIsExerciseModalOpen(false);
            setExerciseToChangeIndex(null);
          } else {
            setDraftExercises((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = newExercise;
              return [...updated, emptyExerciseEntry];
            });
          }
        }}
      />
    </>
  );
}
