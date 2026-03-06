import { forwardRef, useMemo } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { StepRecord } from "@/database/activities/get-steps";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";

type StepsShareCardProps = {
  range: "week" | "month" | "3months";
  data: StepRecord[];
  todaySteps: number;
  chartImageUri: string | null;
};

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateDateRange(start: Date, end: Date): string[] {
  const dateList: string[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateList.push(toLocalDateString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateList;
}

function formatDateLabel(
  dateString: string,
  range: "week" | "month" | "3months",
  locale: string,
): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    case "month":
      return new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
    case "3months":
      return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  }
}

function getRangeDays(range: "week" | "month" | "3months"): number {
  switch (range) {
    case "week":
      return 7;
    case "month":
      return 30;
    case "3months":
      return 90;
  }
}

export function useStepsShareData(
  range: "week" | "month" | "3months",
  data: StepRecord[],
  todaySteps: number,
  locale: string,
) {
  return useMemo(() => {
    const end = new Date();
    const start = new Date();
    const days = getRangeDays(range);
    start.setDate(end.getDate() - (days - 1));

    const todayStr = toLocalDateString(new Date());
    const fullDateRange = generateDateRange(start, end);

    const stepsMap = new Map<string, number>();
    data.forEach((record) => {
      stepsMap.set(record.day, record.steps);
    });
    if (todaySteps > 0) {
      stepsMap.set(todayStr, todaySteps);
    }

    let chartData: { label: string; value: number }[];
    if (range === "3months") {
      const weeklyData: { label: string; value: number }[] = [];
      let weekSum = 0;
      let weekCount = 0;
      let currentWeekLabel = "";

      fullDateRange.forEach((date, index) => {
        const steps = stepsMap.get(date) || 0;
        weekSum += steps;
        if (steps > 0) weekCount++;

        if (index % 7 === 0) {
          currentWeekLabel = formatDateLabel(date, range, locale);
        }

        if ((index + 1) % 7 === 0 || index === fullDateRange.length - 1) {
          weeklyData.push({
            label: currentWeekLabel,
            value: weekCount > 0 ? Math.round(weekSum / weekCount) : 0,
          });
          weekSum = 0;
          weekCount = 0;
        }
      });

      chartData = weeklyData;
    } else {
      chartData = fullDateRange.map((date) => ({
        label: formatDateLabel(date, range, locale),
        value: stepsMap.get(date) || 0,
      }));
    }

    const totalSteps = fullDateRange.reduce((sum, date) => {
      return sum + (stepsMap.get(date) || 0);
    }, 0);

    const daysWithData = fullDateRange.filter(
      (date) => (stepsMap.get(date) || 0) > 0,
    ).length;
    const avgSteps = daysWithData > 0 ? Math.round(totalSteps / daysWithData) : 0;

    return { start, end, chartData, totalSteps, avgSteps };
  }, [data, todaySteps, range, locale]);
}

const StepsShareCard = forwardRef<View, StepsShareCardProps>(
  ({ range, data, todaySteps, chartImageUri }, ref) => {
    const { t, i18n } = useTranslation("activities");
    const locale = i18n.language;

    const { start, end, totalSteps, avgSteps } = useStepsShareData(
      range,
      data,
      todaySteps,
      locale,
    );

    const dateRangeText = useMemo(() => {
      const fmt = (d: Date) =>
        d.toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      return `${fmt(start)} - ${fmt(end)}`;
    }, [start, end, locale]);

    return (
      <View ref={ref} collapsable={false} className="w-[1080px] h-[1080px]">
        <LinearGradient
          colors={["#065f46", "#0f172a", "#0f172a"]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          className="flex-1 p-[60px] justify-between"
        >
          <View className="absolute top-[30px] left-[30px] flex-row items-center gap-4">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[64px] h-[64px] rounded-lg"
            />
            <AppText className="text-[36px] text-green-400">{APP_NAME}</AppText>
          </View>

          <View className="items-center gap-3">
            <AppText className="text-[52px] text-center">
              {t("activities.stepsShare.title")}
            </AppText>
            <AppText className="text-[28px] text-gray-400">
              {dateRangeText}
            </AppText>
          </View>

          <View className="items-center mt-[20px]">
            <View className="w-[960px] h-[620px]">
              {chartImageUri ? (
                <Image
                  source={{ uri: chartImageUri }}
                  className="w-[960px] h-[620px]"
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>

          <View className="flex-row gap-4 mt-[20px]">
            <StatBox
              label={t("activities.stepsShare.totalSteps")}
              value={totalSteps.toLocaleString()}
            />
            <StatBox
              label={t("activities.stepsShare.dailyAvg")}
              value={avgSteps.toLocaleString()}
            />
          </View>
        </LinearGradient>
      </View>
    );
  },
);

StepsShareCard.displayName = "StepsShareCard";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 border-green-500 border rounded-lg bg-slate-950/50 py-[30px] px-[20px]">
      <AppText className="text-[24px] text-gray-300">{label}</AppText>
      <AppText className="text-[36px] text-gray-100">{value}</AppText>
    </View>
  );
}

export default StepsShareCard;
