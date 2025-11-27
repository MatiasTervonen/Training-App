import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import Last30DaysAnalytics from "@/api/gym/analytics/last-30-days";
import { useQuery } from "@tanstack/react-query";
import AnalyticsForm from "@/components/gym/AnalyticsForm";
import { ScrollView } from "react-native";

export default function AnalyticsScreen() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["last-30-days-analytics"],
    queryFn: Last30DaysAnalytics,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <PageContainer>
        <AppText className="text-2xl my-5 text-center">
          Workout Analytics
        </AppText>
        <AnalyticsForm data={data ?? []} isLoading={isLoading} error={error} />
      </PageContainer>
    </ScrollView>
  );
}
