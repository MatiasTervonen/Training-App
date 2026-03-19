import { useState, useEffect, useMemo } from "react";
import { View, ActivityIndicator, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import StepsChart from "@/features/activities/analytics/StepsChart";
import ActivityBreakdownChart from "@/features/activities/analytics/ActivityBreakdownChart";
import StepsShareModal from "@/features/activities/analytics/StepsShareModal";
import { getStepsData } from "@/database/activities/get-steps";
import { getActivitySessions } from "@/database/activities/get-activity-sessions";
import { getTodaysSteps } from "@/features/activities/analytics/getTodaysSteps";
import Toast from "react-native-toast-message";
import PageContainer from "@/components/PageContainer";
import * as Device from "expo-device";
import { useTranslation } from "react-i18next";
import { hasStepsPermission } from "@/features/activities/stepToggle/stepPermission";
import { BarChart3 } from "lucide-react-native";
import AppTextNC from "@/components/AppTextNC";

type RangeType = "week" | "month" | "3months";

const ranges: { key: RangeType; label: string }[] = [
  { key: "week", label: "7D" },
  { key: "month", label: "30D" },
  { key: "3months", label: "90D" },
];

function getRangeDays(range: RangeType): number {
  switch (range) {
    case "week":
      return 7;
    case "month":
      return 30;
    case "3months":
      return 90;
  }
}

export default function ActivityAnalytics() {
  const { t } = useTranslation("activities");
  const [selectedRange, setSelectedRange] = useState<RangeType>("week");
  const [todaySteps, setTodaySteps] = useState(0);
  const [loadingToday, setLoadingToday] = useState(true);
  const [stepsPermitted, setStepsPermitted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: stepsData = [], isLoading: isLoadingSteps } = useQuery({
    queryKey: ["steps-analytics"],
    queryFn: () => getStepsData(90),
    enabled: stepsPermitted,
  });

  const { data: sessionsData = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["activity-sessions-analytics"],
    queryFn: () => getActivitySessions(90),
  });

  useEffect(() => {
    if (!Device.isDevice) {
      setLoadingToday(false);
      return;
    }

    const fetchTodaySteps = async () => {
      setLoadingToday(true);
      try {
        const permitted = await hasStepsPermission();
        setStepsPermitted(permitted);
        if (!permitted) return;

        const steps = await getTodaysSteps();
        setTodaySteps(steps);
      } catch (error) {
        console.error("Error fetching today's steps:", error);
        Toast.show({
          type: "error",
          text1: t("activities.analyticsScreen.errorFetchingSteps"),
          text2: t("activities.analyticsScreen.errorFetchingStepsDesc"),
        });
      } finally {
        setLoadingToday(false);
      }
    };

    fetchTodaySteps();
  }, [t]);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - getRangeDays(selectedRange) + 1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  }, [selectedRange]);

  const isLoading =
    isLoadingSessions || loadingToday || (stepsPermitted && isLoadingSteps);

  const hasNoData =
    sessionsData.length === 0 && stepsData.length === 0 && todaySteps === 0;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (hasNoData) {
    return (
      <PageContainer>
        <View className="items-center mt-[30%] px-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
              <BarChart3 size={36} color="#94a3b8" />
            </View>
            <AppText className="text-xl text-center mb-3">
              {t("activities.analyticsScreen.noData")}
            </AppText>
            <AppText className="text-sm text-gray-400 text-center leading-5">
              {t("activities.analyticsScreen.noDataDesc")}
            </AppText>
          </View>
        </View>
      </PageContainer>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <PageContainer>
        <View className="flex-row bg-slate-800 rounded-lg p-1">
          {ranges.map((range) => (
            <AnimatedButton
              key={range.key}
              onPress={() => setSelectedRange(range.key)}
              className={`flex-1 py-2 rounded-md ${
                selectedRange === range.key ? "bg-slate-700" : ""
              }`}
              hitSlop={10}
            >
              <AppTextNC
                className={`text-center ${
                  selectedRange === range.key
                    ? "text-green-400"
                    : "text-gray-200"
                }`}
              >
                {range.label}
              </AppTextNC>
            </AnimatedButton>
          ))}
        </View>
        {stepsPermitted && (
          <View className="pt-5">
            <StepsChart
              range={selectedRange}
              data={stepsData}
              todaySteps={todaySteps}
              onSharePress={() => setIsShareModalOpen(true)}
            />
            {todaySteps > 0 && (
              <View className="mt-4 bg-slate-900 rounded-xl p-4">
                <View className="flex-row justify-between items-center">
                  <AppTextNC className="text-gray-400">
                    {t("activities.analyticsScreen.today")}
                  </AppTextNC>
                  <AppTextNC className="text-2xl font-bold text-green-400">
                    {todaySteps.toLocaleString()}{" "}
                    {t("activities.analyticsScreen.steps")}
                  </AppTextNC>
                </View>
              </View>
            )}
          </View>
        )}
        <View className="mt-4">
          <ActivityBreakdownChart
            data={sessionsData}
            startDate={startDate}
            endDate={endDate}
          />
        </View>
        {stepsPermitted && (
          <StepsShareModal
            visible={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            range={selectedRange}
            data={stepsData}
            todaySteps={todaySteps}
          />
        )}
      </PageContainer>
    </ScrollView>
  );
}
