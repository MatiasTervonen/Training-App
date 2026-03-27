"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import { useNutritionAnalytics } from "@/features/nutrition/hooks/useNutritionAnalytics";
import SummaryCards from "@/features/nutrition/analytics/SummaryCards";
import CalorieTrendChart from "@/features/nutrition/analytics/CalorieTrendChart";
import MacroTrendChart from "@/features/nutrition/analytics/MacroTrendChart";
import MacroDistributionChart from "@/features/nutrition/analytics/MacroDistributionChart";
import TopFoodsList from "@/features/nutrition/analytics/TopFoodsList";
import EmptyState from "@/components/EmptyState";
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

  const { data, isLoading } = useNutritionAnalytics(startDate, endDate);

  const dailyTotals = data?.daily_totals ?? [];
  const topFoods = data?.top_foods ?? [];
  const hasNoData = !isLoading && dailyTotals.length === 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className="max-w-2xl mx-auto page-padding">
        <EmptyState
          icon={BarChart3}
          title={t("analytics.noData")}
          description={t("analytics.noDataDesc")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto page-padding pb-12">
      {/* Range Selector */}
      <div className="flex bg-slate-800 rounded-lg p-1 mb-4">
        {ranges.map((range) => (
          <button
            key={range.key}
            onClick={() => setSelectedRange(range.key)}
            className={`flex-1 py-2 rounded-md text-center transition-colors cursor-pointer ${
              selectedRange === range.key
                ? "bg-slate-700 text-green-400"
                : "text-gray-200 hover:bg-slate-700/50"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <SummaryCards dailyTotals={dailyTotals} />

      {/* Charts */}
      <div className="mt-4 flex flex-col gap-4">
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
      </div>
    </div>
  );
}
