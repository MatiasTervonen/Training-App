import { useMemo } from "react";
import FullScreenModal from "@/components/FullScreenModal";
import { ActivityIndicator, View } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import { TemplateHistorySession } from "@/types/session";
import { FlatList } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import StatCard from "@/components/StatCard";
import TemplateHistoryChart from "./TemplateHistoryChart";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
} from "@/lib/formatDate";

type TemplateHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  history: TemplateHistorySession[];
  templateName: string;
  error?: string | null;
};

export default function TemplateHistoryModal({
  isOpen,
  onClose,
  isLoading,
  history,
  templateName,
  error,
}: TemplateHistoryModalProps) {
  const { t, i18n } = useTranslation("activities");
  const locale = i18n.language;

  const personalBests = useMemo(() => {
    if (!history || history.length === 0) return null;

    let fastestPace: { value: number; date: string } | null = null;
    let shortestDuration: { value: number; date: string } | null = null;

    for (const session of history) {
      if (
        session.avg_pace !== null &&
        session.avg_pace > 0 &&
        (!fastestPace || session.avg_pace < fastestPace.value)
      ) {
        fastestPace = { value: session.avg_pace, date: session.start_time };
      }

      if (
        session.duration > 0 &&
        (!shortestDuration || session.duration < shortestDuration.value)
      ) {
        shortestDuration = {
          value: session.duration,
          date: session.start_time,
        };
      }
    }

    if (!fastestPace && !shortestDuration) return null;
    return { fastestPace, shortestDuration };
  }, [history]);

  const formatDateWithYear = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="justify-center items-center mt-40 gap-5 mx-4">
            <AppText className="text-lg">
              {t("activities.templateHistory.loading")}
            </AppText>
            <ActivityIndicator size="large" />
          </View>
        ) : error ? (
          <AppText className="text-center mt-40 px-10 text-lg">
            {t("activities.templateHistory.loadError")}
          </AppText>
        ) : history.length === 0 ? (
          <AppText className="text-center mt-40 px-10 text-lg">
            {t("activities.templateHistory.noHistory")}
          </AppText>
        ) : (
          <View className="flex-1">
            <FlatList
              data={history}
              keyExtractor={(item) => item.session_id}
              contentContainerStyle={{
                paddingBottom: 50,
                paddingTop: 40,
              }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View className="mb-10">
                  {/* Header */}
                  <AppText className="text-center text-xl">
                    {templateName}
                  </AppText>

                  {/* Personal Bests */}
                  {personalBests && (
                    <LinearGradient
                      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      className="mt-6 rounded-md px-4 py-4 overflow-hidden border-2 border-gray-600"
                    >
                      <AppText className="text-center text-gray-400 text-sm mb-3">
                        {t("activities.templateHistory.personalBests")}
                      </AppText>
                      <View className="flex-row gap-4">
                        {personalBests.fastestPace && (
                          <View className="flex-1 items-center">
                            <AppTextNC className="text-xl text-cyan-400">
                              {formatAveragePace(
                                personalBests.fastestPace.value,
                              )}
                            </AppTextNC>
                            <AppText className="text-gray-400 text-xs mt-1">
                              {t("activities.templateHistory.minPerKm")}
                            </AppText>
                            <AppText className="text-gray-500 text-xs mt-1">
                              {formatDateWithYear(
                                personalBests.fastestPace.date,
                              )}
                            </AppText>
                          </View>
                        )}
                        {personalBests.shortestDuration && (
                          <View className="flex-1 items-center">
                            <AppTextNC className="text-xl text-cyan-400">
                              {formatDurationLong(
                                personalBests.shortestDuration.value,
                              )}
                            </AppTextNC>
                            <AppText className="text-gray-400 text-xs mt-1">
                              {t("activities.templateHistory.shortestDuration")}
                            </AppText>
                            <AppText className="text-gray-500 text-xs mt-1">
                              {formatDateWithYear(
                                personalBests.shortestDuration.date,
                              )}
                            </AppText>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  )}

                  {/* Chart */}
                  <TemplateHistoryChart history={history} />
                </View>
              }
              renderItem={({ item: session }) => (
                <View className="mb-8">
                  <AppText className="text-lg mb-3 text-center">
                    {formatSessionDate(session.start_time)}
                  </AppText>
                  <LinearGradient
                    colors={["#1e3a8a", "#0f172a", "#0f172a"]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="py-4 px-4 rounded-md overflow-hidden border-2 border-gray-600"
                  >
                    <View className="gap-2">
                      {/* Row 1: Duration, Moving Time, Distance */}
                      <View className="flex-row gap-2">
                        <StatCard
                          label={t("activities.sessionStats.duration")}
                          value={formatDurationLong(session.duration)}
                        />
                        {session.moving_time_seconds !== null && (
                          <StatCard
                            label={t("activities.sessionStats.movingTime")}
                            value={formatDurationLong(
                              session.moving_time_seconds,
                            )}
                          />
                        )}
                        {session.distance_meters !== null && (
                          <StatCard
                            label={t("activities.sessionStats.distance")}
                            value={formatMeters(session.distance_meters)}
                          />
                        )}
                      </View>
                      {/* Row 2: Avg Pace, Avg Speed */}
                      {(session.avg_pace !== null ||
                        session.avg_speed !== null) && (
                        <View className="flex-row gap-2">
                          {session.avg_pace !== null && (
                            <StatCard
                              label={t("activities.sessionStats.avgPace")}
                              value={`${formatAveragePace(session.avg_pace)} ${t("activities.sessionStats.minPerKm")}`}
                            />
                          )}
                          {session.avg_speed !== null && (
                            <StatCard
                              label={t("activities.sessionStats.avgSpeed")}
                              value={`${session.avg_speed} ${t("activities.sessionStats.kmPerHour")}`}
                            />
                          )}
                        </View>
                      )}
                      {/* Row 3: Calories, Steps */}
                      {(session.calories !== null ||
                        session.steps !== null) && (
                        <View className="flex-row gap-2">
                          {session.calories !== null && (
                            <StatCard
                              label={t("activities.sessionStats.calories")}
                              value={String(Math.round(session.calories))}
                            />
                          )}
                          {session.steps !== null && (
                            <StatCard
                              label={t("activities.sessionStats.steps")}
                              value={String(session.steps)}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </FullScreenModal>
  );
}
