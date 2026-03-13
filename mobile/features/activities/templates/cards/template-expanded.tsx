import {
  formatDate,
  formatMeters,
  formatDurationLong,
  formatAveragePace,
  formatSpeed,
  formatDateShort,
  getDistanceUnitLabels,
} from "@/lib/formatDate";
import { ScrollView, View } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { templateSummary } from "@/types/session";
import Map from "@/features/activities/components/templateMap";
import TemplateFullScreenMapModal from "@/features/activities/components/TemplateFullScreenMapModal";
import { useState } from "react";
import SaveButtonSpinner from "@/components/buttons/SaveButtonSpinner";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import StatCard from "@/components/StatCard";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  item: templateSummary;
  onStartActivity: () => void;
  isStartingActivity: boolean;
  onHistory: () => void;
};

export default function ActivityTemplateExpanded({
  item,
  onStartActivity,
  isStartingActivity,
  onHistory,
}: Props) {
  const { t } = useTranslation("activities");
  const [fullScreen, setFullScreen] = useState(false);
  const labels = getDistanceUnitLabels();

  const hasStats = item.template.times_completed > 0;

  return (
    <View className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageContainer className="mb-10">
          <AppText className="text-sm text-gray-300 text-center">
            {t("activities.templatesScreen.created")}{" "}
            {formatDate(item.template.created_at)}
          </AppText>
          {item.template.updated_at && (
            <AppText className="text-sm text-yellow-500 mt-2 text-center">
              {t("activities.templatesScreen.updated")}{" "}
              {formatDate(item.template.updated_at)}
            </AppText>
          )}
          <View className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
            <View className="flex-row items-center self-stretch mb-5 border-b border-gray-700 pb-2">
              <AppText className="text-xl flex-1 text-center">
                {item.template.name}
              </AppText>
              <AnimatedButton onPress={onHistory} hitSlop={10}>
                <History color="#9ca3af" size={20} />
              </AnimatedButton>
            </View>
            <AppText className="text-lg text-left mb-5">
              {t(`activities.activityNames.${item.activity.slug}`, {
                defaultValue: item.activity.name,
              })}
            </AppText>
            {item.template.distance_meters && (
              <AppText className="text-xl text-center mb-5">
                {t("activities.templatesScreen.distance")}{" "}
                {formatMeters(item.template.distance_meters)}
              </AppText>
            )}
            {item.template.notes && (
              <AppText className="text-lg text-left">
                {item.template.notes}
              </AppText>
            )}
          </View>

          {item.route && (
            <View className="mt-10">
              <Map template={item} setFullScreen={setFullScreen} />
            </View>
          )}

          {hasStats && (
            <LinearGradient
              colors={["#1e3a8a", "#0f172a", "#0f172a"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="p-4 rounded-lg overflow-hidden shadow-md mt-5"
            >
              <AppText className="text-base text-gray-200 text-center mb-1">
                {t("activities.templatesScreen.timesCompleted", {
                  count: item.template.times_completed,
                })}
              </AppText>
              {item.template.last_completed_at && (
                <AppText className="text-sm text-gray-400 text-center mb-3">
                  {t("activities.templatesScreen.lastCompleted")}:{" "}
                  {formatDateShort(item.template.last_completed_at)}
                </AppText>
              )}
              <View className="flex-row gap-2 mb-2">
                {item.template.avg_duration != null && (
                  <StatCard
                    label={t("activities.templatesScreen.avgDuration")}
                    value={formatDurationLong(item.template.avg_duration)}
                  />
                )}
                {item.template.avg_pace != null && (
                  <StatCard
                    label={t("activities.templatesScreen.avgPace")}
                    value={`${formatAveragePace(item.template.avg_pace)} ${labels.pace}`}
                  />
                )}
              </View>
              <View className="flex-row gap-2">
                {item.template.avg_distance != null && (
                  <StatCard
                    label={t("activities.templatesScreen.avgDistance")}
                    value={formatMeters(item.template.avg_distance)}
                  />
                )}
                {item.template.avg_speed != null && (
                  <StatCard
                    label={t("activities.templatesScreen.avgSpeed")}
                    value={formatSpeed(item.template.avg_speed)}
                  />
                )}
              </View>
            </LinearGradient>
          )}
        </PageContainer>
      </ScrollView>

      <View className="px-5 pb-5 pt-3 border-t border-gray-700">
        <SaveButtonSpinner
          disabled={isStartingActivity}
          onPress={onStartActivity}
          label={t("activities.templatesScreen.startActivity")}
          loading={isStartingActivity}
        />
      </View>

      {item.route && (
        <TemplateFullScreenMapModal
          template={item}
          fullScreen={fullScreen}
          setFullScreen={setFullScreen}
        />
      )}
    </View>
  );
}
