import { useState, useEffect, useMemo } from "react";
import { View, ScrollView, ActivityIndicator, InteractionManager } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyTextNC from "@/components/BodyTextNC";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import SummaryCards from "@/features/nutrition/analytics/SummaryCards";
import CalorieTrendChart from "@/features/nutrition/analytics/CalorieTrendChart";
import MacroTrendChart from "@/features/nutrition/analytics/MacroTrendChart";
import MacroDistributionChart from "@/features/nutrition/analytics/MacroDistributionChart";
import TopFoodsList from "@/features/nutrition/analytics/TopFoodsList";
import { useNutritionAnalytics } from "@/features/nutrition/hooks/useNutritionAnalytics";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react-native";
import { getTrackingDate } from "@/lib/formatDate";

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

export default function NutritionAnalytics() {
  const { t } = useTranslation("nutrition");
  const [selectedRange, setSelectedRange] = useState<RangeType>("week");
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setChartsReady(true);
    });
    return () => task.cancel();
  }, []);

  const { startDate, endDate } = useMemo(() => {
    const today = getTrackingDate();
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(end.getDate() - getRangeDays(selectedRange) + 1);
    return {
      startDate: start.toLocaleDateString("en-CA"),
      endDate: today,
    };
  }, [selectedRange]);

  const { data, isLoading, error } = useNutritionAnalytics(startDate, endDate);

  if (error) {
    console.error("Nutrition analytics error:", error);
  }

  const dailyTotals = data?.daily_totals ?? [];
  const topFoods = data?.top_foods ?? [];
  const hasNoData = !isLoading && dailyTotals.length === 0;

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
              {t("analytics.noData")}
            </AppText>
            <BodyTextNC className="text-sm text-gray-400 text-center leading-5">
              {t("analytics.noDataDesc")}
            </BodyTextNC>
          </View>
        </View>
      </PageContainer>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <PageContainer>
        {/* Range Selector */}
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

        {/* Summary Cards */}
        <View className="mt-4">
          <SummaryCards dailyTotals={dailyTotals} />
        </View>

        {/* Charts */}
        {chartsReady && (
          <View className="mt-4 gap-4">
            <CalorieTrendChart
              range={selectedRange}
              dailyTotals={dailyTotals}
              startDate={startDate}
              endDate={endDate}
            />
            <MacroTrendChart
              range={selectedRange}
              dailyTotals={dailyTotals}
              startDate={startDate}
              endDate={endDate}
            />
            <MacroDistributionChart dailyTotals={dailyTotals} />
            <TopFoodsList foods={topFoods} />
          </View>
        )}
      </PageContainer>
    </ScrollView>
  );
}
