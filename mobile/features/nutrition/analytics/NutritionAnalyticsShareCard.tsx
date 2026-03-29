import { forwardRef, useMemo } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import { ShareCardTheme, ShareCardSize } from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";
import ThemedStatBox from "@/lib/components/share/ThemedStatBox";
import type { DailyTotal, TopFood } from "@/database/nutrition/get-analytics";
import type { CalorieChartOptions } from "@/features/nutrition/analytics/useAnalyticsChartImage";

export type AnalyticsSection =
  | "summary"
  | "calorieTrend"
  | "macroTrend"
  | "macroDistribution"
  | "topFoods";

type NutritionAnalyticsShareCardProps = {
  selectedSections: AnalyticsSection[];
  dailyTotals: DailyTotal[];
  topFoods: TopFood[];
  dateRangeText: string;
  chartImages: Record<string, string | null>;
  theme: ShareCardTheme;
  size: ShareCardSize;
  calorieChartOptions?: CalorieChartOptions;
};

function getChartDimensions(
  size: ShareCardSize,
  sectionCount: number,
): { width: number; height: number } {
  if (size === "wide") {
    return sectionCount === 1
      ? { width: 1100, height: 550 }
      : { width: 800, height: 450 };
  }
  if (size === "story") {
    return sectionCount === 1
      ? { width: 900, height: 900 }
      : { width: 900, height: 600 };
  }
  // square
  return sectionCount === 1
    ? { width: 800, height: 500 }
    : { width: 700, height: 380 };
}

/* ── Summary section ── */
function ShareSummary({
  dailyTotals,
  theme,
  size,
}: {
  dailyTotals: DailyTotal[];
  theme: ShareCardTheme;
  size: ShareCardSize;
}) {
  const { t } = useTranslation("nutrition");
  const days = dailyTotals.length;
  const avg = (fn: (d: DailyTotal) => number) =>
    days > 0 ? Math.round(dailyTotals.reduce((s, d) => s + fn(d), 0) / days) : 0;

  const statSize = size === "wide" ? "normal" : size === "story" ? "normal" : "small";

  return (
    <View style={{ gap: 16, width: "100%" }}>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <ThemedStatBox
            label={t("analytics.summary.avgCalories")}
            value={`${avg((d) => d.calories)}`}
            theme={theme}
            size={statSize}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedStatBox
            label={t("analytics.summary.avgProtein")}
            value={`${avg((d) => d.protein)}g`}
            theme={theme}
            size={statSize}
          />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <ThemedStatBox
            label={t("analytics.summary.avgCarbs")}
            value={`${avg((d) => d.carbs)}g`}
            theme={theme}
            size={statSize}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedStatBox
            label={t("analytics.summary.avgFat")}
            value={`${avg((d) => d.fat)}g`}
            theme={theme}
            size={statSize}
          />
        </View>
      </View>
    </View>
  );
}

/* ── Top foods section ── */
function ShareTopFoods({
  foods,
  theme,
  fontSize,
}: {
  foods: TopFood[];
  theme: ShareCardTheme;
  fontSize: number;
}) {
  const { t } = useTranslation("nutrition");
  const display = foods.slice(0, 5);

  return (
    <View style={{ width: "100%", gap: fontSize * 0.4 }}>
      <AppText style={{ fontSize: fontSize * 1.2, color: theme.colors.textPrimary, textAlign: "center" }}>
        {t("analytics.topFoods.title")}
      </AppText>
      {display.map((food, i) => (
        <View key={food.food_name} style={{ flexDirection: "row", alignItems: "center", gap: fontSize * 0.5 }}>
          <AppTextNC style={{ fontSize, color: theme.colors.accent, width: fontSize * 1.8, textAlign: "center" }}>
            {i + 1}
          </AppTextNC>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize, color: theme.colors.textPrimary }} numberOfLines={1}>
              {food.food_name}
            </AppText>
          </View>
          <AppText style={{ fontSize: fontSize * 0.85, color: theme.colors.textMuted }}>
            {food.log_count}x · {food.total_calories} kcal
          </AppText>
        </View>
      ))}
    </View>
  );
}

/* ── Chart image section ── */
function ShareChartImage({
  uri,
  chartDims,
  title,
  theme,
  titleSize,
  extraContent,
}: {
  uri: string | null;
  chartDims: { width: number; height: number };
  title: string;
  theme: ShareCardTheme;
  titleSize: number;
  extraContent?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <AppText style={{ fontSize: titleSize, color: theme.colors.textPrimary }}>
        {title}
      </AppText>
      <View style={{ width: chartDims.width, height: chartDims.height }}>
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: chartDims.width, height: chartDims.height }}
            resizeMode="contain"
          />
        ) : null}
      </View>
      {extraContent}
    </View>
  );
}

/* ── Calorie chart legend + balance stats ── */
function ShareCalorieBalanceStats({
  dailyTotals,
  theme,
  fontSize,
  showGoalLine,
  showTdeeLine,
}: {
  dailyTotals: DailyTotal[];
  theme: ShareCardTheme;
  fontSize: number;
  showGoalLine: boolean;
  showTdeeLine: boolean;
}) {
  const { t } = useTranslation("nutrition");
  const calorieGoal = dailyTotals[0]?.calorie_goal ?? 2000;

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: fontSize * 1.5, marginTop: 4 }}>
      {showGoalLine && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: fontSize * 0.4 }}>
          <View style={{ width: fontSize * 1.2, height: 2, backgroundColor: "#ff00ff", borderStyle: "dashed" }} />
          <AppText style={{ fontSize: fontSize * 0.9, color: "#ff00ff" }}>
            {t("analytics.charts.goal")} ({calorieGoal})
          </AppText>
        </View>
      )}
      {showTdeeLine && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: fontSize * 0.4 }}>
          <View style={{ width: fontSize * 1.2, height: 2.5, backgroundColor: "#38bdf8" }} />
          <AppText style={{ fontSize: fontSize * 0.9, color: "#38bdf8" }}>
            {t("analytics.charts.tdee")}
          </AppText>
        </View>
      )}
    </View>
  );
}

/* ── Render a single section ── */
function RenderSection({
  section,
  dailyTotals,
  topFoods,
  chartImages,
  theme,
  size,
  chartDims,
  calorieChartOptions,
}: {
  section: AnalyticsSection;
  dailyTotals: DailyTotal[];
  topFoods: TopFood[];
  chartImages: Record<string, string | null>;
  theme: ShareCardTheme;
  size: ShareCardSize;
  chartDims: { width: number; height: number };
  calorieChartOptions?: CalorieChartOptions;
}) {
  const { t } = useTranslation("nutrition");
  const titleSize = size === "wide" ? 32 : size === "story" ? 38 : 28;
  const foodFontSize = size === "wide" ? 28 : size === "story" ? 34 : 24;

  switch (section) {
    case "summary":
      return <ShareSummary dailyTotals={dailyTotals} theme={theme} size={size} />;
    case "calorieTrend": {
      const balanceFontSize = size === "wide" ? 22 : size === "story" ? 28 : 20;
      const showGoal = calorieChartOptions?.showGoalLine ?? true;
      const showTdee = calorieChartOptions?.showTdeeLine ?? true;
      const hasExtras = showGoal || showTdee;
      return (
        <ShareChartImage
          uri={chartImages.calorieTrend ?? null}
          chartDims={chartDims}
          title={t("analytics.charts.calories")}
          theme={theme}
          titleSize={titleSize}
          extraContent={
            hasExtras ? (
              <ShareCalorieBalanceStats
                dailyTotals={dailyTotals}
                theme={theme}
                fontSize={balanceFontSize}
                showGoalLine={showGoal}
                showTdeeLine={showTdee}
              />
            ) : undefined
          }
        />
      );
    }
    case "macroTrend":
      return (
        <ShareChartImage
          uri={chartImages.macroTrend ?? null}
          chartDims={chartDims}
          title={t("analytics.charts.macros")}
          theme={theme}
          titleSize={titleSize}
        />
      );
    case "macroDistribution":
      return (
        <ShareChartImage
          uri={chartImages.macroDistribution ?? null}
          chartDims={chartDims}
          title={t("analytics.charts.distribution")}
          theme={theme}
          titleSize={titleSize}
        />
      );
    case "topFoods":
      return <ShareTopFoods foods={topFoods} theme={theme} fontSize={foodFontSize} />;
    default:
      return null;
  }
}

/* ── Main share card ── */
const NutritionAnalyticsShareCard = forwardRef<View, NutritionAnalyticsShareCardProps>(
  ({ selectedSections, dailyTotals, topFoods, dateRangeText, chartImages, theme, size, calorieChartOptions }, ref) => {
    const { t } = useTranslation("nutrition");
    const { colors } = theme;

    const chartDims = useMemo(
      () => getChartDimensions(size, selectedSections.length),
      [size, selectedSections.length],
    );

    const titleSize = size === "wide" ? 56 : size === "story" ? 68 : 42;
    const dateSize = size === "wide" ? 32 : size === "story" ? 40 : 26;
    const contentGap = size === "wide" ? 30 : size === "story" ? 50 : 30;
    const contentPadding = size === "wide" ? 60 : size === "story" ? 60 : 40;

    return (
      <ThemedCardWrapper ref={ref} theme={theme} size={size}>
        {/* Logo */}
        <View
          className="flex-row items-center gap-4"
          style={{
            position: "absolute",
            ...(size === "story"
              ? { bottom: 80, left: 0, right: 0, justifyContent: "center" }
              : { top: 60, left: 60 }),
          }}
        >
          <Image
            source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
            style={{
              width: size === "story" ? 80 : 64,
              height: size === "story" ? 80 : 64,
              borderRadius: 8,
            }}
          />
          <AppText style={{ fontSize: size === "story" ? 44 : 36, color: colors.accent }}>
            {APP_NAME}
          </AppText>
        </View>

        {/* Content centered */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: contentGap, paddingHorizontal: contentPadding }}>
          {/* Title + Date */}
          <View style={{ alignItems: "center", gap: 12, transform: [{ translateY: -55 }] }}>
            <AppText style={{ fontSize: titleSize, color: colors.textPrimary, textAlign: "center" }}>
              {t("analytics.share.title")}
            </AppText>
            <AppText style={{ fontSize: dateSize, color: colors.textMuted }}>
              {dateRangeText}
            </AppText>
          </View>

          {/* Sections */}
          {size === "wide" && selectedSections.length === 2 ? (
            <View style={{ flexDirection: "row", gap: 40, alignItems: "center" }}>
              {selectedSections.map((section) => (
                <View key={section} style={{ flex: 1 }}>
                  <RenderSection
                    section={section}
                    dailyTotals={dailyTotals}
                    topFoods={topFoods}
                    chartImages={chartImages}
                    theme={theme}
                    size={size}
                    chartDims={chartDims}
                    calorieChartOptions={calorieChartOptions}
                  />
                </View>
              ))}
            </View>
          ) : (
            selectedSections.map((section) => (
              <RenderSection
                key={section}
                section={section}
                dailyTotals={dailyTotals}
                topFoods={topFoods}
                chartImages={chartImages}
                theme={theme}
                size={size}
                chartDims={chartDims}
                calorieChartOptions={calorieChartOptions}
              />
            ))
          )}
        </View>

        {/* URL bottom center */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <AppText style={{ fontSize: size === "story" ? 28 : 24, color: colors.textMuted, opacity: 0.5 }}>
            kurvi.io
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

NutritionAnalyticsShareCard.displayName = "NutritionAnalyticsShareCard";

export default NutritionAnalyticsShareCard;
