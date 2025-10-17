"use client";

import FullScreenModal from "@/components/FullScreenModal";
import { ActivityIndicator, View } from "react-native";
import { formatDate } from "@/lib/formatDate";
import AppText from "../AppText";
import { HistoryResult } from "@/types/session";

type ExerciseHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  history: HistoryResult;
  error?: string | null;
};

export default function ExerciseHistoryModal({
  isOpen,
  onClose,
  isLoading,
  history,
  error,
}: ExerciseHistoryModalProps) {
  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <View className="text-lg text-gray-100 justify-center items-center mt-20 gap-5 mx-4">
          <AppText>Loading history</AppText>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <AppText className="text-gray-100 text-center mt-20 mx-4">
          Could not load exercise history. Please try again.
        </AppText>
      ) : history.length === 0 ? (
        <AppText className="text-center mt-20 text-lg mx-4 text-gray-100">
          No history available for this exercise.
        </AppText>
      ) : history ? (
        <View className="items-center mb-20">
          {history.map((session, sessionIndex) => (
            <View key={sessionIndex} className="mb-4 w-full">
              <View className="text-gray-100 items-center mt-10 mx-4">
                <AppText className="text-lg">
                  {formatDate(session!.date)}
                </AppText>
                <View className="mt-6 bg-slate-900 rounded-md px-4 py-2 shadow-lg max-w-md w-full mx-auto">
                  <View className="w-full text-left ">
                    <View>
                      <View className="text-gray-100 border-b">
                        <AppText className="p-2">Set</AppText>
                        <AppText className="p-2">Weight</AppText>
                        <AppText className="p-2">Reps</AppText>
                        <AppText className="p-2">Rpe</AppText>
                      </View>
                    </View>
                    <View>
                      {session!.sets.map((set, setIndex) => (
                        <View
                          key={setIndex}
                          className={`mb-2 ${
                            set.rpe === "Failure" ? "bg-red-500" : ""
                          } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                        >
                          <AppText className="p-2">{setIndex + 1}</AppText>
                          <AppText className="p-2">{set.weight}</AppText>
                          <AppText className="p-2">{set.reps}</AppText>
                          <AppText className="p-2">{set.rpe}</AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <AppText className="text-gray-100 text-center">No data found</AppText>
      )}
    </FullScreenModal>
  );
}
