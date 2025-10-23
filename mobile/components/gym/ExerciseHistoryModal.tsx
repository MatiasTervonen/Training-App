import FullScreenModal from "@/components/FullScreenModal";
import { ActivityIndicator, View } from "react-native";
import { formatDate } from "@/lib/formatDate";
import AppText from "../AppText";
import { HistoryResult } from "@/types/session";
import { FlatList } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { full_gym_exercises } from "@/types/models";
import { useUserStore } from "@/lib/stores/useUserStore";

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
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <View className="justify-center items-center mt-20 gap-5 mx-4">
          <AppText className="text-lg">Loading history</AppText>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <AppText className="text-center mt-20 mx-4 text-lg">
          Could not load exercise history. Please try again.
        </AppText>
      ) : history.length === 0 ? (
        <AppText className="text-center mt-20 mx-4 text-lg">
          No history available for this exercise.
        </AppText>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => `${item!.date}-${index}`}
          contentContainerStyle={{
            paddingBottom: 80,
            paddingHorizontal: 12,
            paddingTop: 30,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: session }) => (
            <>
              <View className="items-center my-5 mx-4">
                <AppText className="text-lg">
                  {formatDate(session!.date)}
                </AppText>
              </View>
              <LinearGradient
                colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                start={{ x: 1, y: 0 }} // bottom-left
                end={{ x: 0, y: 1 }} // top-right
                className="py-5 px-4 rounded-md overflow-hidden mb-10 border-2 border-gray-600 max-w-md mx-auto"
              >
                <View className="w-full text-left ">
                  <View className="w-full">
                    <View className="text-gray-300 border-b border-gray-300 flex-row">
                      {session!.main_group === "cardio" ? (
                        <>
                          <AppText className="p-2">Time (min)</AppText>
                          <AppText className="p-2">Duration (km)</AppText>
                        </>
                      ) : (
                        <>
                          <View className="w-[17%] text-center">
                            <AppText className="p-2 text-lg">Set</AppText>
                          </View>
                          <View className="w-[28%] text-center">
                            <AppText className="p-2 text-lg">Weight</AppText>
                          </View>
                          <View className="w-[20%] text-center">
                            <AppText className="p-2 text-lg">Reps</AppText>
                          </View>
                          <View className="w-[30%] text-center">
                            <AppText className="p-2 text-lg">RPE</AppText>
                          </View>
                          <View className="w-[5%] text-center">
                            <AppText className="p-2"></AppText>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                  <View>
                    {session!.sets.map((set, setIndex) => (
                      <View
                        key={setIndex}
                        className={`border-b border-gray-300 flex-row  items-center ${
                          set.rpe === "Failure" ? "bg-red-500" : ""
                        } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                      >
                        {session!.main_group === "cardio" ? (
                          <>
                            <AppText className="p-2 text-lg">
                              {setIndex + 1}
                            </AppText>
                            <AppText className="p-2 text-lg">
                              {set.weight} min
                            </AppText>
                            <AppText className="p-2 text-lg">{set.rpe}</AppText>
                          </>
                        ) : (
                          <>
                            <View className="w-[17%] text-center">
                              <AppText className="p-2 text-lg">
                                {setIndex + 1}
                              </AppText>
                            </View>
                            <View className="w-[28%] text-center">
                              <AppText className="p-2 text-lg">
                                {set.weight} {weightUnit}
                              </AppText>
                            </View>
                            <View className="w-[20%] text-center">
                              <AppText className="p-2 text-lg">
                                {set.reps}
                              </AppText>
                            </View>
                            <View className="w-[30%] text-center">
                              <AppText className="p-2 text-lg">
                                {set.rpe}
                              </AppText>
                            </View>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </>
          )}
        />
      )}
    </FullScreenModal>
  );
}
