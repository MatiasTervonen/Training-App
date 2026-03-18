import { useMemo } from "react";
import FullScreenModal from "@/components/FullScreenModal";
import { ActivityIndicator, View } from "react-native";
import { formatDateShort } from "@/lib/formatDate";
import AppText from "@/components/AppText";
import ErrorMessage from "@/components/ErrorMessage";
import { HistoryResult } from "@/types/session";
import { FlatList } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTranslation } from "react-i18next";
import ExerciseHistoryChart from "./ExerciseHistoryChart";
import AppTextNC from "@/components/AppTextNC";

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
  const { t, i18n } = useTranslation("gym");
  const locale = i18n.language;
  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const exerciseName = history?.[0]?.name;
  const equipment = history?.[0]?.equipment;

  const translateRpe = (rpe: string) => {
    const rpeMap: Record<string, string> = {
      "Warm-up": "1",
      Easy: "2",
      Medium: "3",
      Hard: "4",
      Failure: "5",
    };
    return rpeMap[rpe] || rpe;
  };

  // Personal best calculation
  const personalBest = useMemo(() => {
    if (!history || history.length === 0) return null;

    let bestWeight = 0;
    let bestReps = 0;
    let bestDate = "";
    for (const session of history) {
      if (!session) continue;
      for (const set of session.sets) {
        if (set.weight && set.weight > bestWeight) {
          bestWeight = set.weight;
          bestReps = set.reps || 0;
          bestDate = session.date;
        }
      }
    }
    if (bestWeight === 0) return null;
    return { weight: bestWeight, reps: bestReps, date: bestDate };
  }, [history]);

  const formatDateWithYear = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
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
          <ErrorMessage message={t("gym.exerciseHistory.loadError")} fullPage />
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
                  {/* Header */}
                  <AppText className="text-center text-xl">
                    {exerciseName}
                  </AppText>
                  <AppText className="text-center text-gray-300 mt-2">
                    {t(`gym.equipment.${equipment?.toLowerCase()}`)}
                  </AppText>

                  <ExerciseHistoryChart
                    history={history}
                    valueUnit={weightUnit}
                  />

                  {personalBest && (
                    <LinearGradient
                      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      className="mt-6 rounded-md px-4 py-4 overflow-hidden border-2 border-gray-600"
                    >
                      <AppText className="text-center text-gray-400 text-sm mb-2">
                        {t("gym.exerciseHistory.personalBest")}
                      </AppText>
                      <AppTextNC className="text-center text-xl text-cyan-400">
                        {personalBest.weight} {weightUnit} x{" "}
                        {personalBest.reps}{" "}
                        {t("gym.exerciseCard.reps").toLowerCase()}
                      </AppTextNC>
                      <AppText className="text-center text-gray-400 text-sm mt-1">
                        {formatDateWithYear(personalBest.date)}
                      </AppText>
                    </LinearGradient>
                  )}
                </View>
              }
              renderItem={({ item: session }) => (
                <LinearGradient
                  colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="py-5 px-4 rounded-md overflow-hidden mb-10 border-2 border-gray-600"
                >
                  <AppText className="text-base text-gray-300 mb-3 text-center">
                    {formatDateShort(session!.date)}
                  </AppText>
                    <View className="w-full text-left">
                      <View className="w-full">
                        <View className="border-b border-gray-600 flex-row">
                          <View className="flex-1 items-center">
                            <AppText className="p-2 text-sm text-gray-400">
                              {t("gym.session.set")}
                            </AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2 text-sm text-gray-400">
                              {t("gym.session.weight")}
                            </AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2 text-sm text-gray-400">
                              {t("gym.session.reps")}
                            </AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2 text-sm text-gray-400">
                              {t("gym.session.rpe")}
                            </AppText>
                          </View>
                        </View>
                      </View>
                      <View>
                        {session!.sets.map((set, setIndex) => (
                          <View
                            key={setIndex}
                            className={`border-b border-gray-600 flex-row items-center ${
                              set.rpe === "Failure" ? "bg-red-500" : ""
                            } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                          >
                            <View className="flex-1 items-center">
                              <AppText className="p-2">
                                {setIndex + 1}
                              </AppText>
                            </View>
                            <View className="flex-1 items-center">
                              <AppText className="p-2">
                                {set.weight} {weightUnit}
                              </AppText>
                            </View>
                            <View className="flex-1 items-center">
                              <AppText className="p-2">
                                {set.reps}
                              </AppText>
                            </View>
                            <View className="flex-1 items-center">
                              <AppText className="p-2" numberOfLines={1}>
                                {set.rpe ? translateRpe(set.rpe) : ""}
                              </AppText>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                </LinearGradient>
              )}
            />
          </View>
        )}
      </View>
    </FullScreenModal>
  );
}
