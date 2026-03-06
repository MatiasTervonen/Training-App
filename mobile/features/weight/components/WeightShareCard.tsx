import { forwardRef, useMemo } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { weight } from "@/types/session";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";

type WeightShareCardProps = {
  range: "week" | "month" | "year";
  data: weight[];
  weightUnit: string;
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
  range: "week" | "month" | "year",
  locale: string,
): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    case "month":
      return new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
    case "year":
      return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  }
}

function getDateRange(range: "week" | "month" | "year"): [Date, Date] {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case "week":
      start.setDate(end.getDate() - 6);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
  }
  return [start, end];
}

export function useWeightShareData(
  range: "week" | "month" | "year",
  data: weight[],
  locale: string,
) {
  return useMemo(() => {
    const [calculatedStart, rangeEnd] = getDateRange(range);

    const oldestDate = new Date(
      Math.min(...data.map((entry) => new Date(entry.created_at).getTime())),
    );
    const rangeStart =
      range === "year" && calculatedStart < oldestDate
        ? oldestDate
        : calculatedStart;

    const fullDateRange = generateDateRange(rangeStart, rangeEnd);

    const weightMap = new Map(
      data
        .filter((entry) => {
          const entryDate = new Date(entry.created_at);
          return entryDate >= rangeStart && entryDate <= rangeEnd;
        })
        .map((entry) => [entry.created_at.split("T")[0], entry.weight]),
    );

    const firstDate = fullDateRange[0];
    let priorWeight: number | null = null;
    let priorDate = "";
    for (const entry of data) {
      const entryDate = entry.created_at.split("T")[0];
      if (
        entryDate < firstDate &&
        entry.weight !== null &&
        entryDate > priorDate
      ) {
        priorWeight = entry.weight;
        priorDate = entryDate;
      }
    }

    let carry: number | null = priorWeight;
    const chartData = fullDateRange.map((date) => {
      if (weightMap.has(date)) {
        carry = weightMap.get(date)!;
      }
      return {
        value: carry,
        label: formatDateLabel(date, range, locale),
      };
    });

    return { start: rangeStart, end: rangeEnd, chartData };
  }, [data, range, locale]);
}

const WeightShareCard = forwardRef<View, WeightShareCardProps>(
  ({ range, data, weightUnit, chartImageUri }, ref) => {
    const { t, i18n } = useTranslation("weight");
    const locale = i18n.language;

    const { start, end, chartData } = useWeightShareData(range, data, locale);

    const firstValue = chartData[0]?.value;
    const lastValue = chartData[chartData.length - 1]?.value;

    let weightChange = "N/A";
    if (firstValue != null && lastValue != null) {
      const diff = lastValue - firstValue;
      const rounded = Math.round(diff * 10) / 10;
      weightChange =
        rounded > 0
          ? `+ ${rounded}`
          : rounded < 0
            ? `- ${Math.abs(rounded)}`
            : `${rounded}`;
    }

    const currentWeight =
      lastValue != null ? `${Math.round(lastValue * 10) / 10}` : "N/A";

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
          colors={["#1e3a8a", "#0f172a", "#0f172a"]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          className="flex-1 p-[60px] justify-between"
        >
          {/* App branding - absolute so it doesn't affect layout */}
          <View className="absolute top-[30px] left-[30px] flex-row items-center gap-4">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[64px] h-[64px] rounded-lg"
            />
            <AppText className="text-[36px] text-blue-400">{APP_NAME}</AppText>
          </View>

          {/* Title + Date range */}
          <View className="items-center gap-3">
            <AppText className="text-[52px] text-center">
              {t("weight.share.title")}
            </AppText>
            <AppText className="text-[28px] text-gray-400">
              {dateRangeText}
            </AppText>
          </View>

          {/* Chart as captured image */}
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

          {/* Stat Boxes */}
          <View className="flex-row gap-4 mt-[20px]">
            <StatBox
              label={t("weight.share.weightChange")}
              value={`${weightChange} ${weightUnit}`}
            />
            <StatBox
              label={t("weight.share.currentWeight")}
              value={`${currentWeight} ${weightUnit}`}
            />
          </View>
        </LinearGradient>
      </View>
    );
  },
);

WeightShareCard.displayName = "WeightShareCard";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 border-blue-500 border rounded-lg bg-slate-950/50 py-[30px] px-[20px]">
      <AppText className="text-[24px] text-gray-300">{label}</AppText>
      <AppText className="text-[36px] text-gray-100">{value}</AppText>
    </View>
  );
}

export default WeightShareCard;
