import { useMemo } from "react";
import FullScreenModal, { useFullScreenModalScroll } from "@/components/FullScreenModal";
import { ActivityIndicator, View, NativeSyntheticEvent, NativeScrollEvent, FlatList } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import ErrorMessage from "@/components/ErrorMessage";
import { TemplateHistorySession } from "@/types/session";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import StatCard from "@/components/StatCard";
import TemplateHistoryChart from "./TemplateHistoryChart";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
  formatSpeed,
  getDistanceUnitLabels,
} from "@/lib/formatDate";
import BodyTextNC from "@/components/BodyTextNC";

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
  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose} scrollable={false}>
      <TemplateHistoryContent
        isLoading={isLoading}
        history={history}
        templateName={templateName}
        error={error}
      />
    </FullScreenModal>
  );
}

function TemplateHistoryContent({
  isLoading,
  history,
  templateName,
  error,
}: Omit<TemplateHistoryModalProps, "isOpen" | "onClose">) {
  const { t, i18n } = useTranslation("activities");
  const locale = i18n.language;
  const labels = getDistanceUnitLabels();
  const modalScroll = useFullScreenModalScroll();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (modalScroll) {
      modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
    }
  };

  const personalBests = useMemo(() => {
    if (!history || history.length === 0) return null;

    let fastestPace: { value: number; date: string; sessionId: string } | null = null;
    let shortestDuration: { value: number; date: string; sessionId: string } | null = null;

    for (const session of history) {
      if (
        session.avg_pace !== null &&
        session.avg_pace > 0 &&
        (!fastestPace || session.avg_pace < fastestPace.value)
      ) {
        fastestPace = { value: session.avg_pace, date: session.start_time, sessionId: session.session_id };
      }

      if (
        session.duration > 0 &&
        (!shortestDuration || session.duration < shortestDuration.value)
      ) {
        shortestDuration = {
          value: session.duration,
          date: session.start_time,
          sessionId: session.session_id,
        };
      }
    }

    if (!fastestPace && !shortestDuration) return null;
    return { fastestPace, shortestDuration };
  }, [history]);

  const bestSessionIds = useMemo(() => {
    const ids = new Set<string>();
    if (personalBests?.fastestPace) ids.add(personalBests.fastestPace.sessionId);
    if (personalBests?.shortestDuration) ids.add(personalBests.shortestDuration.sessionId);
    return ids;
  }, [personalBests]);

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
      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="justify-center items-center mt-40 gap-5 mx-4">
            <BodyText className="text-lg">
              {t("activities.templateHistory.loading")}
            </BodyText>
            <ActivityIndicator size="large" />
          </View>
        ) : error ? (
          <ErrorMessage message={t("activities.templateHistory.loadError")} fullPage />
        ) : history.length === 0 ? (
          <BodyText className="text-center mt-40 px-10 text-lg">
            {t("activities.templateHistory.noHistory")}
          </BodyText>
        ) : (
          <View className="flex-1">
            <FlatList
              data={history}
              keyExtractor={(item) => item.session_id}
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
                    {templateName}
                  </AppText>

                  {/* Personal Bests */}
                  {personalBests && (
                    <LinearGradient
                      colors={["#78350f", "#1e1b4b", "#0f172a"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="mt-6 rounded-md px-4 py-4 overflow-hidden border-2 border-amber-500/60"
                    >
                      <BodyTextNC className="text-center text-amber-400 text-sm mb-3">
                        {t("activities.templateHistory.personalBests")}
                      </BodyTextNC>
                      <View className="flex-row gap-4">
                        {personalBests.fastestPace && (
                          <View className="flex-1 items-center">
                            <AppTextNC className="text-xl text-cyan-400">
                              {formatAveragePace(
                                personalBests.fastestPace.value,
                              )}
                            </AppTextNC>
                            <BodyTextNC className="text-gray-400 text-xs mt-1">
                              {labels.pace}
                            </BodyTextNC>
                            <BodyTextNC className="text-gray-500 text-xs mt-1">
                              {formatDateWithYear(
                                personalBests.fastestPace.date,
                              )}
                            </BodyTextNC>
                          </View>
                        )}
                        {personalBests.shortestDuration && (
                          <View className="flex-1 items-center">
                            <AppTextNC className="text-xl text-cyan-400">
                              {formatDurationLong(
                                personalBests.shortestDuration.value,
                              )}
                            </AppTextNC>
                            <BodyTextNC className="text-gray-400 text-xs mt-1">
                              {t("activities.templateHistory.shortestDuration")}
                            </BodyTextNC>
                            <BodyTextNC className="text-gray-500 text-xs mt-1">
                              {formatDateWithYear(
                                personalBests.shortestDuration.date,
                              )}
                            </BodyTextNC>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  )}

                  {/* Chart */}
                  <TemplateHistoryChart history={history} />
                </View>
              }
              renderItem={({ item: session }) => {
                const isBest = bestSessionIds.has(session.session_id);
                return (
                <View className="mb-8">
                  <BodyText className="text-lg mb-3 text-center">
                    {formatSessionDate(session.start_time)}
                  </BodyText>
                  <LinearGradient
                    colors={isBest ? ["#78350f", "#1e1b4b", "#0f172a"] : ["#1e3a8a", "#0f172a", "#0f172a"]}
                    start={isBest ? { x: 0, y: 0 } : { x: 1, y: 0 }}
                    end={{ x: isBest ? 1 : 0, y: 1 }}
                    className={`pb-4 px-4 rounded-md overflow-hidden border-2 ${isBest ? "pt-2 border-amber-500/60" : "pt-4 border-gray-600"}`}
                  >
                    {isBest && (
                      <BodyTextNC className="text-amber-400 text-xs text-center mt-1 mb-3">
                        {t("activities.templateHistory.personalBest")}
                      </BodyTextNC>
                    )}
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
                              value={`${formatAveragePace(session.avg_pace)} ${labels.pace}`}
                            />
                          )}
                          {session.avg_speed !== null && (
                            <StatCard
                              label={t("activities.sessionStats.avgSpeed")}
                              value={formatSpeed(session.avg_speed)}
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
                );
              }}
            />
          </View>
        )}
      </View>
  );
}
