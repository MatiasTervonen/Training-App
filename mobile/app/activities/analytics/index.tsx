import { useState, useEffect, useMemo } from "react";
import { View, ActivityIndicator, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import StepsChart from "@/Features/activities/analytics/StepsChart";
import ActivityBreakdownChart from "@/Features/activities/analytics/ActivityBreakdownChart";
import { getStepsData } from "@/database/activities/get-steps";
import { getActivitySessions } from "@/database/activities/get-activity-sessions";
import { getTodaysSteps } from "@/Features/activities/analytics/getTodaysSteps";
import Toast from "react-native-toast-message";
import PageContainer from "@/components/PageContainer";
import * as Device from "expo-device";

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
  const [selectedRange, setSelectedRange] = useState<RangeType>("week");
  const [todaySteps, setTodaySteps] = useState(0);
  const [loadingToday, setLoadingToday] = useState(true);

  const { data: stepsData = [], isLoading: isLoadingSteps } = useQuery({
    queryKey: ["steps-analytics"],
    queryFn: () => getStepsData(90),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: sessionsData = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["activity-sessions-analytics"],
    queryFn: () => getActivitySessions(90),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (!Device.isDevice) return;

    const fetchTodaySteps = async () => {
      setLoadingToday(true);
      try {
        const steps = await getTodaysSteps();
        setTodaySteps(steps);
      } catch (error) {
        console.error("Error fetching today's steps:", error);
        Toast.show({
          type: "error",
          text1: "Error fetching today's steps",
          text2: "Unable to retrieve today's step count.",
        });
      } finally {
        setLoadingToday(false);
      }
    };

    fetchTodaySteps();
  }, []);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - getRangeDays(selectedRange) + 1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  }, [selectedRange]);

  const isLoading = isLoadingSteps && isLoadingSessions && loadingToday;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <PageContainer>
        <AppText className="text-2xl text-center mb-6">
          Activity Analytics
        </AppText>
        <View className="flex-row bg-slate-800 rounded-lg p-1 mb-4">
          {ranges.map((range) => (
            <AnimatedButton
              key={range.key}
              onPress={() => setSelectedRange(range.key)}
              tabClassName="flex-1"
              className={`py-2 rounded-md ${
                selectedRange === range.key ? "bg-slate-700" : ""
              }`}
            >
              <AppTextNC
                className={`text-center font-medium ${
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
        <StepsChart
          range={selectedRange}
          data={stepsData}
          todaySteps={todaySteps}
        />
        {todaySteps > 0 && (
          <View className="mt-4 bg-slate-900 rounded-xl p-4">
            <View className="flex-row justify-between items-center">
              <AppText className="text-gray-400">Today</AppText>
              <AppText className="text-2xl font-bold text-green-400">
                {todaySteps.toLocaleString()} steps
              </AppText>
            </View>
          </View>
        )}
        <View className="mt-4">
          <ActivityBreakdownChart
            data={sessionsData}
            startDate={startDate}
            endDate={endDate}
          />
        </View>
      </PageContainer>
    </ScrollView>
  );
}
