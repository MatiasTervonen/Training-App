import { forwardRef, useMemo } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/AppText";
import { StepRecord } from "@/database/activities/get-steps";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import { ShareCardTheme, ShareCardSize } from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";
import ThemedStatBox from "@/lib/components/share/ThemedStatBox";

type StepsShareCardProps = {
  range: "week" | "month" | "3months";
  data: StepRecord[];
  todaySteps: number;
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

function getChartDimensions(size: ShareCardSize): { width: number; height: number } {
  switch (size) {
    case "square":
      return { width: 960, height: 620 };
    case "story":
      return { width: 960, height: 1100 };
    case "wide":
      return { width: 1100, height: 620 };
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
      let lastShownMonth = "";

      fullDateRange.forEach((date, index) => {
        const steps = stepsMap.get(date) || 0;
        weekSum += steps;
        if (steps > 0) weekCount++;

        if (index % 7 === 0) {
          currentWeekLabel = formatDateLabel(date, range, locale);
        }

        if ((index + 1) % 7 === 0 || index === fullDateRange.length - 1) {
          const label = currentWeekLabel !== lastShownMonth ? currentWeekLabel : "";
          if (currentWeekLabel !== lastShownMonth) {
            lastShownMonth = currentWeekLabel;
          }
          weeklyData.push({
            label,
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
  ({ range, data, todaySteps, chartImageUri, theme, size }, ref) => {
    const { t, i18n } = useTranslation("activities");
    const locale = i18n.language;

    const { start, end, totalSteps, avgSteps } = useStepsShareData(
      range,
      data,
      todaySteps,
      locale,
    );

    const { colors } = theme;
    const chartDims = getChartDimensions(size);

    const dateRangeText = useMemo(() => {
      const fmt = (d: Date) =>
        d.toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      return `${fmt(start)} - ${fmt(end)}`;
    }, [start, end, locale]);

    if (size === "wide") {
      return (
        <ThemedCardWrapper ref={ref} theme={theme} size={size}>
          {/* Header - App branding */}
          <View className="flex-row items-center gap-4">
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />
            <AppText style={{ fontSize: 36, color: colors.accent }}>
              {APP_NAME}
            </AppText>
          </View>

          {/* Title + Date centered */}
          <View className="items-center gap-3">
            <AppText
              className="text-center"
              style={{ fontSize: 56, color: colors.textPrimary }}
            >
              {t("activities.stepsShare.title")}
            </AppText>
            <AppText style={{ fontSize: 32, color: colors.textMuted }}>
              {dateRangeText}
            </AppText>
          </View>

          {/* Chart + Stats side by side */}
          <View className="flex-row items-center" style={{ gap: 20 }}>
            <View className="flex-1 items-center justify-center">
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

            <View className="justify-center" style={{ width: 400, gap: 16, position: "relative", right: 80 }}>
              <ThemedStatBox
                label={t("activities.stepsShare.totalSteps")}
                value={totalSteps.toLocaleString()}
                theme={theme}
              />
              <ThemedStatBox
                label={t("activities.stepsShare.dailyAvg")}
                value={avgSteps.toLocaleString()}
                theme={theme}
              />
            </View>
          </View>

          {/* URL bottom center */}
          <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
            <AppText style={{ fontSize: 24, color: colors.textMuted, opacity: 0.5 }}>
              kurvi.io
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    const isStory = size === "story";

    return (
      <ThemedCardWrapper ref={ref} theme={theme} size={size}>
        {/* Header - App branding */}
        <View className="flex-row items-center gap-4">
          <Image
            source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
            style={{ width: isStory ? 80 : 64, height: isStory ? 80 : 64, borderRadius: 8 }}
          />
          <AppText style={{ fontSize: isStory ? 44 : 36, color: colors.accent }}>
            {APP_NAME}
          </AppText>
        </View>

        {/* Title + Date range */}
        <View className="items-center gap-3">
          <AppText
            className="text-center"
            style={{ fontSize: isStory ? 68 : 52, color: colors.textPrimary }}
          >
            {t("activities.stepsShare.title")}
          </AppText>
          <AppText style={{ fontSize: isStory ? 40 : 28, color: colors.textMuted }}>
            {dateRangeText}
          </AppText>
        </View>

        {/* Chart as captured image */}
        <View className="items-center">
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
        <View className="flex-row" style={{ gap: isStory ? 16 : 16, position: "relative", bottom: isStory ? 80 : 0 }}>
          <View className="flex-1">
            <ThemedStatBox
              label={t("activities.stepsShare.totalSteps")}
              value={totalSteps.toLocaleString()}
              theme={theme}
              size={isStory ? "large" : "normal"}
            />
          </View>
          <View className="flex-1">
            <ThemedStatBox
              label={t("activities.stepsShare.dailyAvg")}
              value={avgSteps.toLocaleString()}
              theme={theme}
              size={isStory ? "large" : "normal"}
            />
          </View>
        </View>

        {/* URL bottom center */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <AppText style={{ fontSize: isStory ? 28 : 24, color: colors.textMuted, opacity: 0.5 }}>
            kurvi.io
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

StepsShareCard.displayName = "StepsShareCard";

export default StepsShareCard;
