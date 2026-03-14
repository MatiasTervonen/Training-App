import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { last30DaysAnalytics } from "@/database/gym/analytics/last-30-days";
import { useQuery } from "@tanstack/react-query";
import AnalyticsForm from "@/features/gym/analytics/AnalyticsForm";
import { ScrollView, ActivityIndicator, View } from "react-native";
import { last30DaysAnalyticsRPC } from "@/database/gym/analytics/last-30-days-rpc";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react-native";

export default function AnalyticsScreen() {
  const { t } = useTranslation("gym");
  const {
    data: heatMap,
    error: heatMapError,
    isLoading: heatMapLoading,
  } = useQuery({
    queryKey: ["heatmap-analytics"],
    queryFn: last30DaysAnalytics,
  });

  const { data, error, isLoading } = useQuery({
    queryKey: ["last-30-days-analytics"],
    queryFn: last30DaysAnalyticsRPC,
  });

  const isUnifiedLoading = isLoading || heatMapLoading;
  const unifiedError = error || heatMapError;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <PageContainer>
        {isUnifiedLoading ? (
          <View className="items-center gap-2 mt-20">
            <AppText className="text-gray-300 text-center text-xl">
              {t("gym.analyticsScreen.loading")}
            </AppText>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : unifiedError ? (
          <AppText className="text-red-500 text-center mt-20 text-lg">
            {t("gym.analyticsScreen.error")}
          </AppText>
        ) : !data || data.total_sessions === 0 ? (
          <View className="items-center mt-[30%] px-8">
            <View className="items-center">
              <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
                <BarChart3 size={36} color="#94a3b8" />
              </View>
              <AppText className="text-xl text-center mb-3">
                {t("gym.analyticsScreen.noData")}
              </AppText>
              <AppText className="text-sm text-gray-400 text-center leading-5">
                {t("gym.analyticsScreen.noDataDesc")}
              </AppText>
            </View>
          </View>
        ) : (
          <AnalyticsForm data={data} heatmap={heatMap ?? []} />
        )}
      </PageContainer>
    </ScrollView>
  );
}
