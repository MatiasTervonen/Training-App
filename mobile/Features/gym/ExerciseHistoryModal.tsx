import FullScreenModal from "@/components/FullScreenModal";
import { ActivityIndicator, View } from "react-native";
import { formatDateShort } from "@/lib/formatDate";
import AppText from "@/components/AppText";
import { HistoryResult } from "@/types/session";
import { FlatList } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("gym");
  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const exerciseName = history?.[0]?.name;
  const equipment = history?.[0]?.equipment;

  const translateRpe = (rpe: string) => {
    const rpeMap: Record<string, string> = {
      "Warm-up": t("gym.exerciseCard.rpeOptions.warmup"),
      "Easy": t("gym.exerciseCard.rpeOptions.easy"),
      "Medium": t("gym.exerciseCard.rpeOptions.medium"),
      "Hard": t("gym.exerciseCard.rpeOptions.hard"),
      "Failure": t("gym.exerciseCard.rpeOptions.failure"),
    };
    return rpeMap[rpe] || rpe;
  };

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="justify-center items-center mt-40 gap-5 mx-4">
            <AppText className="text-lg">
              {t("gym.exerciseHistory.loading")}
            </AppText>
            <ActivityIndicator size="large" />
          </View>
        ) : error ? (
          <AppText className="text-center mt-40 px-10 text-lg">
            {t("gym.exerciseHistory.loadError")}
          </AppText>
        ) : history.length === 0 ? (
          <AppText className="text-center mt-40 px-10 text-lg">
            {t("gym.exerciseHistory.noHistory")}
          </AppText>
        ) : (
          <View className="flex-1">
            <FlatList
              data={history}
              keyExtractor={(item, index) => `${item!.date}-${index}`}
              contentContainerStyle={{
                paddingBottom: 50,
                paddingTop: 40,
              }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View className="mb-10">
                  <AppText className="text-center text-xl">
                    {exerciseName}
                  </AppText>
                  <AppText className="text-center text-gray-300 mt-2">
                    {equipment}
                  </AppText>
                </View>
              }
              renderItem={({ item: session }) => (
                <>
                  <AppText className="text-lg mb-5 text-center">
                    {formatDateShort(session!.date)}
                  </AppText>
                  <LinearGradient
                    colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="py-5 px-4 rounded-md overflow-hidden mb-10 border-2 border-gray-600"
                  >
                    <View className="w-full text-left">
                      <View className="w-full">
                        <View className="text-gray-300 border-b border-gray-300 flex-row">
                          {session!.main_group === "cardio" ? (
                            <>
                              <View className="flex-1 items-center">
                                <AppText className="p-2 text-lg">
                                  {t("gym.session.set")}
                                </AppText>
                              </View>
                              <View className="flex-1 items-center">
                                <AppText className="p-2 text-lg">
                                  {t("gym.session.time")}
                                </AppText>
                                <AppText className="text-sm">
                                  ({t("gym.session.min")})
                                </AppText>
                              </View>
                              <View className="flex-1 items-center">
                                <AppText className="p-2 text-lg">
                                  {t("gym.session.distance")}
                                </AppText>
                                <AppText className="text-sm">
                                  ({t("gym.session.meters")})
                                </AppText>
                              </View>
                            </>
                          ) : (
                            <>
                              <View className="flex-1 items-center">
                                <AppText className="p-2 text-lg">
                                  {t("gym.session.set")}
                                </AppText>
                              </View>
                              <View className="flex-1 items-center">
                                <AppText className="p-2 text-lg">
                                  {t("gym.session.weight")}
                                </AppText>
                              </View>
                              <View className="flex-1 items-center">
                                <AppText className="p-2 text-lg">
                                  {t("gym.session.reps")}
                                </AppText>
                              </View>
                              <View className="flex-1 items-center">
                                <AppText className="p-2 text-lg">
                                  {t("gym.session.rpe")}
                                </AppText>
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                      <View>
                        {session!.sets.map((set, setIndex) => (
                          <View
                            key={setIndex}
                            className={`border-b border-gray-300 flex-row items-center ${
                              set.rpe === "Failure" ? "bg-red-500" : ""
                            } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                          >
                            {session!.main_group === "cardio" ? (
                              <>
                                <View className="flex-1 items-center">
                                  <AppText className="p-2 text-lg">
                                    {setIndex + 1}
                                  </AppText>
                                </View>
                                <View className="flex-1 items-center">
                                  <AppText className="p-2 text-lg">
                                    {set.time_min}
                                  </AppText>
                                </View>
                                <View className="flex-1 items-center">
                                  <AppText className="p-2 text-lg">
                                    {set.distance_meters}
                                  </AppText>
                                </View>
                              </>
                            ) : (
                              <>
                                <View className="flex-1 items-center">
                                  <AppText className="p-2 text-lg">
                                    {setIndex + 1}
                                  </AppText>
                                </View>
                                <View className="flex-1 items-center">
                                  <AppText className="p-2 text-lg">
                                    {set.weight} {weightUnit}
                                  </AppText>
                                </View>
                                <View className="flex-1 items-center">
                                  <AppText className="p-2 text-lg">
                                    {set.reps}
                                  </AppText>
                                </View>
                                <View className="flex-1 items-center">
                                  <AppText className="p-2 text-lg" numberOfLines={1}>
                                    {set.rpe ? translateRpe(set.rpe) : ""}
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
          </View>
        )}
      </View>
    </FullScreenModal>
  );
}
