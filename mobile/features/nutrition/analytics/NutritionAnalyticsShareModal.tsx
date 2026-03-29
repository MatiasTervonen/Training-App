import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import NutritionAnalyticsShareCard from "@/features/nutrition/analytics/NutritionAnalyticsShareCard";
import useAnalyticsChartImage from "@/features/nutrition/analytics/useAnalyticsChartImage";
import { useTranslation } from "react-i18next";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { getTheme } from "@/lib/share/themes";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import ShareModalShell from "@/lib/components/share/ShareModalShell";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import Toggle from "@/components/toggle";
import type { DailyTotal, TopFood } from "@/database/nutrition/get-analytics";
import type { AnalyticsSection } from "@/features/nutrition/analytics/NutritionAnalyticsShareCard";
import type { CalorieChartOptions } from "@/features/nutrition/analytics/useAnalyticsChartImage";

const CHART_SECTIONS: AnalyticsSection[] = ["calorieTrend", "macroTrend", "macroDistribution"];

const ALL_SECTIONS: AnalyticsSection[] = [
  "summary",
  "calorieTrend",
  "macroTrend",
  "macroDistribution",
];

type NutritionAnalyticsShareModalProps = {
  visible: boolean;
  onClose: () => void;
  range: "week" | "month" | "3months";
  startDate: string;
  endDate: string;
  dailyTotals: DailyTotal[];
  topFoods: TopFood[];
};

export default function NutritionAnalyticsShareModal({
  visible,
  onClose,
  range,
  startDate,
  endDate,
  dailyTotals,
  topFoods,
}: NutritionAnalyticsShareModalProps) {
  const { t, i18n } = useTranslation("nutrition");
  const locale = i18n.language;
  const { theme: themeId } = useShareCardPreferences();
  const theme = getTheme(themeId);

  const [selectedSections, setSelectedSections] = useState<Set<AnalyticsSection>>(
    () => new Set<AnalyticsSection>(["summary", "calorieTrend"]),
  );

  const [chartImages, setChartImages] = useState<Record<string, string | null>>({});
  const [showGoalLine, setShowGoalLine] = useState(true);
  const [showTdeeLine, setShowTdeeLine] = useState(true);

  const calorieChartOptions: CalorieChartOptions = useMemo(
    () => ({ showGoalLine, showTdeeLine }),
    [showGoalLine, showTdeeLine],
  );

  // Reset chart images when modal opens or theme changes
  useEffect(() => {
    if (!visible) {
      setChartImages({});
    }
  }, [visible, range]);

  useEffect(() => {
    setChartImages({});
  }, [themeId]);

  // Re-render calorie chart when options change
  useEffect(() => {
    setChartImages((prev) => {
      if (!prev.calorieTrend) return prev;
      const { calorieTrend: _, ...rest } = prev;
      return rest;
    });
  }, [showGoalLine, showTdeeLine]);

  const macroLabels = useMemo(
    () => ({
      protein: t("daily.protein"),
      carbs: t("daily.carbs"),
      fat: t("daily.fat"),
    }),
    [t],
  );

  // Determine which chart sections need rendering
  const chartsToRender = useMemo(
    () => Array.from(selectedSections).filter((s): s is typeof CHART_SECTIONS[number] =>
      CHART_SECTIONS.includes(s),
    ),
    [selectedSections],
  );

  // Generate HTML for each needed chart
  const calorieTrendHtml = useAnalyticsChartImage(
    "calorieTrend", dailyTotals, range, startDate, endDate, locale, theme, macroLabels, calorieChartOptions,
  );
  const macroTrendHtml = useAnalyticsChartImage(
    "macroTrend", dailyTotals, range, startDate, endDate, locale, theme, macroLabels,
  );
  const macroDistributionHtml = useAnalyticsChartImage(
    "macroDistribution", dailyTotals, range, startDate, endDate, locale, theme, macroLabels,
  );

  const chartHtmlMap: Record<string, string> = {
    calorieTrend: calorieTrendHtml,
    macroTrend: macroTrendHtml,
    macroDistribution: macroDistributionHtml,
  };

  const onWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; url: string };
      if (msg.url?.startsWith("data:image/png")) {
        setChartImages((prev) => ({ ...prev, [msg.type]: msg.url }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleToggle = useCallback((section: AnalyticsSection) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else if (next.size < 2) {
        next.add(section);
      }
      return next;
    });
  }, []);

  const dateRangeText = useMemo(() => {
    const fmt = (d: string) => {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };
    return `${fmt(startDate)} - ${fmt(endDate)}`;
  }, [startDate, endDate, locale]);

  const sectionLabels: Record<AnalyticsSection, string> = useMemo(
    () => ({
      summary: t("analytics.share.summary"),
      calorieTrend: t("analytics.share.calorieTrend"),
      macroTrend: t("analytics.share.macroTrend"),
      macroDistribution: t("analytics.share.macroDistribution"),
      topFoods: t("analytics.share.topFoods"),
    }),
    [t],
  );

  const selectedArray = useMemo(() => Array.from(selectedSections), [selectedSections]);

  // Charts that need rendering (selected + not yet captured)
  const pendingCharts = chartsToRender.filter((c) => !chartImages[c]);

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="nutrition-analytics-"
      scrollable
      labels={{
        save: t("analytics.share.save"),
        saving: t("analytics.share.saving"),
        share: t("analytics.share.share"),
        sharing: t("analytics.share.sharing"),
        close: t("analytics.share.close"),
        saveSuccess: t("analytics.share.saveSuccess"),
        saveError: t("analytics.share.saveError"),
        shareError: t("analytics.share.shareError"),
        error: t("toast.error"),
      }}
      renderCard={({ cardRef, theme: cardTheme, size }) => (
        <NutritionAnalyticsShareCard
          ref={cardRef}
          selectedSections={selectedArray}
          dailyTotals={dailyTotals}
          topFoods={topFoods}
          dateRangeText={dateRangeText}
          chartImages={chartImages}
          theme={cardTheme}
          size={size}
          calorieChartOptions={calorieChartOptions}
        />
      )}
      middleContent={() => (
        <View className="w-full mt-4">
          <AppTextNC className="text-sm text-gray-400 mb-2">
            {t("analytics.share.showOnCard")}
          </AppTextNC>
          <View className="flex-row flex-wrap gap-2">
            {ALL_SECTIONS.map((section) => {
              const isSelected = selectedSections.has(section);
              const isDisabled = !isSelected && selectedSections.size >= 2;
              return (
                <AnimatedButton
                  key={section}
                  onPress={() => handleToggle(section)}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-full border ${
                    isSelected
                      ? "bg-blue-700 border-blue-500"
                      : isDisabled
                        ? "bg-transparent border-gray-700 opacity-40"
                        : "bg-transparent border-gray-500"
                  }`}
                >
                  <AppTextNC
                    className={`text-sm ${
                      isSelected
                        ? "text-gray-100"
                        : isDisabled
                          ? "text-gray-600"
                          : "text-gray-400"
                    }`}
                  >
                    {sectionLabels[section]}
                  </AppTextNC>
                </AnimatedButton>
              );
            })}
          </View>
          {selectedSections.has("calorieTrend") && (
            <View className="mt-3 gap-2">
              <View className="flex-row items-center justify-between">
                <BodyText className="text-sm">{t("analytics.charts.goal")}</BodyText>
                <Toggle isOn={showGoalLine} onToggle={() => setShowGoalLine((v) => !v)} />
              </View>
              <View className="flex-row items-center justify-between">
                <BodyText className="text-sm">{t("analytics.charts.tdee")}</BodyText>
                <Toggle isOn={showTdeeLine} onToggle={() => setShowTdeeLine((v) => !v)} />
              </View>
            </View>
          )}
        </View>
      )}
      outsideContent={
        visible && pendingCharts.length > 0 ? (
          <>
            {pendingCharts.map((chartType) => (
              <View
                key={chartType}
                className="absolute"
                style={{ width: 1, height: 1, opacity: 0 }}
                pointerEvents="none"
              >
                <WebView
                  source={{ html: chartHtmlMap[chartType] }}
                  onMessage={onWebViewMessage}
                  javaScriptEnabled
                  originWhitelist={["*"]}
                  style={{ width: 960, height: 620 }}
                />
              </View>
            ))}
          </>
        ) : null
      }
    />
  );
}
