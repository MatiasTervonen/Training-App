import { forwardRef, useMemo } from "react";
import { Image, View } from "react-native";
import { weight } from "@/types/session";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import { ShareCardTheme, ShareCardSize } from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";
import ThemedStatBox from "@/lib/components/share/ThemedStatBox";
import AppTextNC from "@/components/AppTextNC";

type WeightShareCardProps = {
  range: "week" | "month" | "year";
  data: weight[];
  weightUnit: string;
  chartImageUri: string | null;
  theme: ShareCardTheme;
  size: ShareCardSize;
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

function getChartDimensions(size: ShareCardSize): {
  width: number;
  height: number;
} {
  switch (size) {
    case "square":
      return { width: 800, height: 480 };
    case "story":
      return { width: 960, height: 1100 };
    case "wide":
      return { width: 1100, height: 620 };
  }
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
  ({ range, data, weightUnit, chartImageUri, theme, size }, ref) => {
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

    const chartDims = getChartDimensions(size);

    if (size === "wide") {
      return (
        <ThemedCardWrapper ref={ref} theme={theme} size={size} className="flex-1 justify-center" contentStyle={{ paddingBottom: 80 }}>
          {/* Header - App branding */}
          <View className="flex-row items-center gap-4" style={{ position: "absolute", top: 40, left: 60 }}>
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />
            <AppTextNC style={{ fontSize: 36, color: theme.colors.accent }}>
              {APP_NAME}
            </AppTextNC>
          </View>

          <View style={{ gap: 30 }}>
            {/* Title + Date centered */}
            <View className="items-center gap-3" style={{ transform: [{ translateY: -30 }] }}>
              <AppTextNC
                className="text-center"
                style={{ fontSize: 56, color: theme.colors.textPrimary }}
              >
                {t("weight.share.title")}
              </AppTextNC>
              <AppTextNC style={{ fontSize: 32, color: theme.colors.textMuted }}>
                {dateRangeText}
              </AppTextNC>
            </View>

            {/* Chart + Stats side by side */}
            <View className="flex-row items-center" style={{ gap: 20 }}>
              <View className="flex-1 items-center justify-center">
                <View
                  style={{ width: chartDims.width, height: chartDims.height }}
                >
                  {chartImageUri ? (
                    <Image
                      source={{ uri: chartImageUri }}
                      style={{ width: chartDims.width, height: chartDims.height }}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>

              <View
                className="justify-center"
                style={{ width: 400, gap: 16, position: "relative", right: 80 }}
              >
                <ThemedStatBox
                  label={t("weight.share.weightChange")}
                  value={`${weightChange} ${weightUnit}`}
                  theme={theme}
                />
                <ThemedStatBox
                  label={t("weight.share.currentWeight")}
                  value={`${currentWeight} ${weightUnit}`}
                  theme={theme}
                />
              </View>
            </View>
          </View>
        </ThemedCardWrapper>
      );
    }

    if (size === "story") {
      return (
        <ThemedCardWrapper ref={ref} theme={theme} size={size} contentStyle={{ paddingTop: 200 }}>
          {/* Header - App branding */}
          <View className="flex-row items-center gap-4">
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
              style={{ width: 80, height: 80, borderRadius: 8 }}
            />
            <AppTextNC style={{ fontSize: 44, color: theme.colors.accent }}>
              {APP_NAME}
            </AppTextNC>
          </View>

          {/* Title + Date range */}
          <View className="items-center gap-3" style={{ transform: [{ translateY: -30 }] }}>
            <AppTextNC
              className="text-center"
              style={{ fontSize: 68, color: theme.colors.textPrimary }}
            >
              {t("weight.share.title")}
            </AppTextNC>
            <AppTextNC style={{ fontSize: 40, color: theme.colors.textMuted }}>
              {dateRangeText}
            </AppTextNC>
          </View>

          {/* Chart as captured image */}
          <View className="items-center" style={{ position: "relative", bottom: 60 }}>
            <View style={{ width: chartDims.width, height: chartDims.height }}>
              {chartImageUri ? (
                <Image
                  source={{ uri: chartImageUri }}
                  style={{ width: chartDims.width, height: chartDims.height }}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>

          {/* Stat Boxes */}
          <View
            className="flex-row"
            style={{ gap: 16, position: "relative", bottom: 200 }}
          >
            <View className="flex-1">
              <ThemedStatBox
                label={t("weight.share.weightChange")}
                value={`${weightChange} ${weightUnit}`}
                theme={theme}
              />
            </View>
            <View className="flex-1">
              <ThemedStatBox
                label={t("weight.share.currentWeight")}
                value={`${currentWeight} ${weightUnit}`}
                theme={theme}
              />
            </View>
          </View>

          {/* URL bottom center */}
          <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
            <AppTextNC style={{ fontSize: 28, color: theme.colors.textMuted, opacity: 0.5 }}>
              kurvi.io
            </AppTextNC>
          </View>
        </ThemedCardWrapper>
      );
    }

    // Square (default)
    return (
      <ThemedCardWrapper ref={ref} theme={theme} size={size} contentStyle={{ paddingBottom: 120 }}>
        {/* Header - App branding */}
        <View className="flex-row items-center gap-4">
          <Image
            source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
            style={{ width: 48, height: 48, borderRadius: 8 }}
          />
          <AppTextNC style={{ fontSize: 28, color: theme.colors.accent }}>
            {APP_NAME}
          </AppTextNC>
        </View>

        {/* Title + Date range */}
        <View className="items-center gap-3" style={{ transform: [{ translateY: -50 }] }}>
          <AppTextNC
            className="text-center"
            style={{ fontSize: 42, color: theme.colors.textPrimary }}
          >
            {t("weight.share.title")}
          </AppTextNC>
          <AppTextNC style={{ fontSize: 22, color: theme.colors.textMuted }}>
            {dateRangeText}
          </AppTextNC>
        </View>

        {/* Chart as captured image */}
        <View className="items-center" style={{ position: "relative", bottom: 40 }}>
          <View style={{ width: chartDims.width, height: chartDims.height }}>
            {chartImageUri ? (
              <Image
                source={{ uri: chartImageUri }}
                style={{ width: chartDims.width, height: chartDims.height }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>

        {/* Stat Boxes */}
        <View className="flex-row gap-4" style={{ position: "relative", bottom: 60, paddingHorizontal: 100 }}>
          <View className="flex-1">
            <ThemedStatBox
              label={t("weight.share.weightChange")}
              value={`${weightChange} ${weightUnit}`}
              theme={theme}
              size="small"
            />
          </View>
          <View className="flex-1">
            <ThemedStatBox
              label={t("weight.share.currentWeight")}
              value={`${currentWeight} ${weightUnit}`}
              theme={theme}
              size="small"
            />
          </View>
        </View>

        {/* URL bottom center */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <AppTextNC style={{ fontSize: 24, color: theme.colors.textMuted, opacity: 0.5 }}>
            kurvi.io
          </AppTextNC>
        </View>
      </ThemedCardWrapper>
    );
  },
);

WeightShareCard.displayName = "WeightShareCard";

export default WeightShareCard;
