import { useMemo } from "react";
import FullScreenModal, { useFullScreenModalScroll } from "@/components/FullScreenModal";
import { ActivityIndicator, View, NativeSyntheticEvent, NativeScrollEvent, FlatList } from "react-native";
import { formatDateShort } from "@/lib/formatDate";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import ErrorMessage from "@/components/ErrorMessage";
import { HistoryResult } from "@/types/session";
import { LinearGradient } from "expo-linear-gradient";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTranslation } from "react-i18next";
import ExerciseHistoryChart from "./ExerciseHistoryChart";
import BodyTextNC from "@/components/BodyTextNC";

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
    <FullScreenModal isOpen={isOpen} onClose={onClose} scrollable={false}>
      <ExerciseHistoryContent
        isLoading={isLoading}
        history={history}
        error={error}
      />
    </FullScreenModal>
  );
}

function ExerciseHistoryContent({
  isLoading,
  history,
  error,
}: Omit<ExerciseHistoryModalProps, "isOpen" | "onClose">) {
  const { t, i18n } = useTranslation("gym");
  const locale = i18n.language;
  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";
  const modalScroll = useFullScreenModalScroll();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (modalScroll) {
      modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
    }
  };

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

  // Personal best calculations
  const personalBests = useMemo(() => {
    if (!history || history.length === 0) return null;

    let bestWeight = { weight: 0, reps: 0, date: "" };
    let bestE1rm = { e1rm: 0, weight: 0, reps: 0, date: "" };
    let bestVolume = { volume: 0, weight: 0, reps: 0, date: "" };

    for (const session of history) {
      if (!session) continue;
      for (const set of session.sets) {
        const w = set.weight || 0;
        const r = set.reps || 0;
        if (w === 0) continue;

        // Heaviest weight
        if (w > bestWeight.weight) {
          bestWeight = { weight: w, reps: r, date: session.date };
        }

        // Best estimated 1RM (Epley formula)
        const e1rm = r <= 1 ? w : w * (1 + r / 30);
        if (e1rm > bestE1rm.e1rm) {
          bestE1rm = { e1rm, weight: w, reps: r, date: session.date };
        }

        // Best volume set (weight × reps)
        const volume = w * r;
        if (volume > bestVolume.volume) {
          bestVolume = { volume, weight: w, reps: r, date: session.date };
        }
      }
    }

    if (bestWeight.weight === 0) return null;
    return { bestWeight, bestE1rm, bestVolume };
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
      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="justify-center items-center mt-40 gap-5 mx-4">
            <BodyText className="text-lg">
              {t("gym.exerciseHistory.loading")}
            </BodyText>
            <ActivityIndicator size="large" />
          </View>
        ) : error ? (
          <ErrorMessage message={t("gym.exerciseHistory.loadError")} fullPage />
        ) : history.length === 0 ? (
          <BodyText className="text-center mt-40 px-10 text-lg">
            {t("gym.exerciseHistory.noHistory")}
          </BodyText>
        ) : (
          <View className="flex-1">
            <FlatList
              data={history}
              keyExtractor={(item, index) => `${item!.date}-${index}`}
              contentContainerStyle={{
                paddingBottom: 50,
                paddingTop: 4,
              }}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              ListHeaderComponent={
                <View className="mb-10">
                  {/* Header */}
                  <AppText className="text-center text-xl">
                    {exerciseName}
                  </AppText>
                  <BodyTextNC className="text-center text-gray-300 mt-2">
                    {t(`gym.equipment.${equipment?.toLowerCase()}`)}
                  </BodyTextNC>

                  <ExerciseHistoryChart
                    history={history}
                    valueUnit={weightUnit}
                  />

                  {personalBests && (
                    <View className="mt-6 gap-3">
                      <AppText className="text-center text-base">
                        {t("gym.exerciseHistory.personalBests")}
                      </AppText>
                      <View className="flex-row gap-2">
                        {/* Best Est. 1RM */}
                        <LinearGradient
                          colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          className="flex-1 rounded-md px-2 py-3 overflow-hidden border-[1.5px] border-gray-700"
                        >
                          <BodyTextNC className="text-center text-gray-400 text-xs mb-1">
                            {t("gym.exerciseHistory.estOneRm")}
                          </BodyTextNC>
                          <AppTextNC className="text-center text-base text-cyan-400">
                            {Math.round(personalBests.bestE1rm.e1rm)}{" "}
                            {weightUnit}
                          </AppTextNC>
                          <BodyTextNC className="text-center text-gray-500 text-xs mt-1">
                            {personalBests.bestE1rm.weight} × {personalBests.bestE1rm.reps}
                          </BodyTextNC>
                        </LinearGradient>

                        {/* Heaviest Weight */}
                        <LinearGradient
                          colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          className="flex-1 rounded-md px-2 py-3 overflow-hidden border-[1.5px] border-gray-700"
                        >
                          <BodyTextNC className="text-center text-gray-400 text-xs mb-1">
                            {t("gym.exerciseHistory.heaviestWeight")}
                          </BodyTextNC>
                          <AppTextNC className="text-center text-base text-cyan-400">
                            {personalBests.bestWeight.weight} {weightUnit}
                          </AppTextNC>
                          <BodyTextNC className="text-center text-gray-500 text-xs mt-1">
                            × {personalBests.bestWeight.reps}{" "}
                            {t("gym.exerciseCard.reps").toLowerCase()}
                          </BodyTextNC>
                        </LinearGradient>

                        {/* Best Volume */}
                        <LinearGradient
                          colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          className="flex-1 rounded-md px-2 py-3 overflow-hidden border-[1.5px] border-gray-700"
                        >
                          <BodyTextNC className="text-center text-gray-400 text-xs mb-1">
                            {t("gym.exerciseHistory.bestVolume")}
                          </BodyTextNC>
                          <AppTextNC className="text-center text-base text-cyan-400">
                            {personalBests.bestVolume.volume} {weightUnit}
                          </AppTextNC>
                          <BodyTextNC className="text-center text-gray-500 text-xs mt-1">
                            {personalBests.bestVolume.weight} × {personalBests.bestVolume.reps}
                          </BodyTextNC>
                        </LinearGradient>
                      </View>
                    </View>
                  )}
                </View>
              }
              renderItem={({ item: session }) => (
                <LinearGradient
                  colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="py-5 px-4 rounded-md overflow-hidden mb-5 border-[1.5px] border-gray-700"
                >
                  <BodyTextNC className="text-base text-gray-300 mb-3 text-center">
                    {formatDateShort(session!.date)}
                  </BodyTextNC>
                    <View className="w-full text-left">
                      <View className="w-full">
                        <View className="border-b border-gray-700 flex-row">
                          <View className="flex-1 items-center">
                            <AppTextNC className="p-2 text-sm text-gray-400">
                              {t("gym.session.set")}
                            </AppTextNC>
                          </View>
                          <View className="flex-1 items-center">
                            <AppTextNC className="p-2 text-sm text-gray-400">
                              {t("gym.session.weight")}
                            </AppTextNC>
                          </View>
                          <View className="flex-1 items-center">
                            <AppTextNC className="p-2 text-sm text-gray-400">
                              {t("gym.session.reps")}
                            </AppTextNC>
                          </View>
                          <View className="flex-1 items-center">
                            <AppTextNC className="p-2 text-sm text-gray-400">
                              {t("gym.session.rpe")}
                            </AppTextNC>
                          </View>
                        </View>
                      </View>
                      <View>
                        {session!.sets.map((set, setIndex) => (
                          <View
                            key={setIndex}
                            className={`border-b border-gray-700 flex-row items-center ${
                              set.rpe === "Failure"
                                ? "bg-red-500/15"
                                : set.rpe === "Warm-up"
                                  ? "bg-blue-500/15"
                                  : ""
                            }`}
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
  );
}
