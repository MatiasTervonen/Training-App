import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { last30DaysAnalytics } from "@/database/gym/analytics/last-30-days";
import { useQuery } from "@tanstack/react-query";
import AnalyticsForm from "@/Features/gym/analytics/AnalyticsForm";
import { ScrollView, ActivityIndicator, View } from "react-native";
import { last30DaysAnalyticsRPC } from "@/database/gym/analytics/last-30-days-rpc";

export default function AnalyticsScreen() {
  const {
    data: heatMap,
    error: heatMapError,
    isLoading: heatMapLoading,
  } = useQuery({
    queryKey: ["heatmap-analytics"],
    queryFn: last30DaysAnalytics,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data, error, isLoading } = useQuery({
    queryKey: ["last-30-days-analytics"],
    queryFn: last30DaysAnalyticsRPC,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const isUnifiedLoading = isLoading || heatMapLoading;
  const unifiedError = error || heatMapError;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <PageContainer>
        <AppText className="text-2xl mb-10 text-center">
          Workout Analytics
        </AppText>

        {isUnifiedLoading ? (
          <View className="items-center gap-2 mt-20">
            <AppText className="text-gray-300 text-center text-xl">
              Loading...
            </AppText>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : unifiedError ? (
          <AppText className="text-red-500 text-center mt-20 text-lg">
            Error loading workout data. Try again!
          </AppText>
        ) : !data || data.total_sessions === 0 ? (
          <AppText className="text-gray-300 text-center mt-20 text-lg">
            No workout data available. Start logging your workouts to see
            analytics!
          </AppText>
        ) : (
          <AnalyticsForm data={data} heatmap={heatMap ?? []} />
        )}
      </PageContainer>
    </ScrollView>
  );
}
