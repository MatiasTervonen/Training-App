import { forwardRef } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { Image } from "expo-image";
import { formatDuration, formatMeters, formatDateShort } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import {
  ShareCardTheme,
  ShareCardSize,
} from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";
import {
  ReportFeature,
  ReportData,
  GymReportData,
  ActivitiesReportData,
  WeightReportData,
  HabitsReportData,
  TodoReportData,
} from "@/types/report";

type ReportShareCardProps = {
  title: string;
  periodStart: string;
  periodEnd: string;
  reportData: ReportData;
  selectedFeatures: ReportFeature[];
  theme: ShareCardTheme;
  size: ShareCardSize;
};

function ShareStatRow({
  label,
  value,
  theme,
  fontSize = 24,
}: {
  label: string;
  value: string;
  theme: ShareCardTheme;
  fontSize?: number;
}) {
  return (
    <View
      className="flex-row justify-between border-b"
      style={{ borderColor: `${theme.colors.textMuted}40`, paddingVertical: 10 }}
    >
      <AppText style={{ fontSize, color: theme.colors.textMuted }}>
        {label}
      </AppText>
      <AppText style={{ fontSize, color: theme.colors.textSecondary }}>
        {value}
      </AppText>
    </View>
  );
}

function FeatureCard({
  feature,
  data,
  theme,
  fontSize = 24,
  titleFontSize = 32,
}: {
  feature: ReportFeature;
  data: ReportData;
  theme: ShareCardTheme;
  fontSize?: number;
  titleFontSize?: number;
}) {
  const { t } = useTranslation("reports");
  const { t: tActivities } = useTranslation("activities");
  const featureData = data[feature];
  if (!featureData) return null;

  const label = t(`reports.features.${feature}`);

  switch (feature) {
    case "gym": {
      const d = featureData as GymReportData;
      return (
        <View
          className="flex-1 border rounded-lg"
          style={{
            borderColor: theme.colors.statBoxBorder,
            backgroundColor: theme.colors.statBoxBg,
            paddingVertical: 28,
            paddingHorizontal: 24,
          }}
        >
          <AppText
            style={{ fontSize: titleFontSize, color: theme.colors.textPrimary, marginBottom: 12 }}
          >
            {label}
          </AppText>
          <ShareStatRow label={t("reports.expanded.sessions")} value={String(d.session_count)} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.totalVolume")} value={`${d.total_volume.toLocaleString()} kg`} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.totalDuration")} value={formatDuration(d.total_duration)} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.avgDuration")} value={formatDuration(d.avg_duration)} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.totalCalories")} value={String(d.total_calories)} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.exercises")} value={String(d.exercise_count)} theme={theme} fontSize={fontSize} />
        </View>
      );
    }
    case "activities": {
      const d = featureData as ActivitiesReportData;
      if (!d.by_activity || d.by_activity.length === 0) return null;
      return (
        <View
          className="flex-1 border rounded-lg"
          style={{
            borderColor: theme.colors.statBoxBorder,
            backgroundColor: theme.colors.statBoxBg,
            paddingVertical: 28,
            paddingHorizontal: 24,
          }}
        >
          <AppText
            style={{ fontSize: titleFontSize, color: theme.colors.textPrimary, marginBottom: 12 }}
          >
            {label}
          </AppText>
          {d.by_activity.map((activity) => {
            const name = activity.activity_slug
              ? tActivities(`activities.activityNames.${activity.activity_slug}`, {
                  defaultValue: activity.activity_name,
                })
              : activity.activity_name;
            return (
              <View key={activity.activity_slug ?? activity.activity_name} style={{ marginBottom: 8 }}>
                <AppText style={{ fontSize: fontSize, color: theme.colors.textPrimary, marginBottom: 4 }}>
                  {name}
                </AppText>
                <ShareStatRow label={t("reports.expanded.sessions")} value={String(activity.session_count)} theme={theme} fontSize={fontSize} />
                <ShareStatRow label={t("reports.expanded.totalDuration")} value={formatDuration(activity.total_duration)} theme={theme} fontSize={fontSize} />
                {activity.total_distance_meters != null && activity.total_distance_meters > 0 && (
                  <ShareStatRow label={t("reports.expanded.totalDistance")} value={formatMeters(activity.total_distance_meters)} theme={theme} fontSize={fontSize} />
                )}
                <ShareStatRow label={t("reports.expanded.totalCalories")} value={String(activity.total_calories)} theme={theme} fontSize={fontSize} />
                {activity.total_steps != null && activity.total_steps > 0 && (
                  <ShareStatRow label={t("reports.expanded.totalSteps")} value={activity.total_steps.toLocaleString()} theme={theme} fontSize={fontSize} />
                )}
              </View>
            );
          })}
        </View>
      );
    }
    case "weight": {
      const d = featureData as WeightReportData;
      return (
        <View
          className="flex-1 border rounded-lg"
          style={{
            borderColor: theme.colors.statBoxBorder,
            backgroundColor: theme.colors.statBoxBg,
            paddingVertical: 28,
            paddingHorizontal: 24,
          }}
        >
          <AppText
            style={{ fontSize: titleFontSize, color: theme.colors.textPrimary, marginBottom: 12 }}
          >
            {label}
          </AppText>
          <ShareStatRow label={t("reports.expanded.entries")} value={String(d.entry_count)} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.startWeight")} value={d.start_weight != null ? `${d.start_weight} kg` : "-"} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.endWeight")} value={d.end_weight != null ? `${d.end_weight} kg` : "-"} theme={theme} fontSize={fontSize} />
          <ShareStatRow
            label={t("reports.expanded.weightChange")}
            value={d.change != null ? `${d.change > 0 ? "+" : ""}${d.change} kg` : "-"}
            theme={theme}
            fontSize={fontSize}
          />
        </View>
      );
    }
    case "habits": {
      const d = featureData as HabitsReportData;
      return (
        <View
          className="flex-1 border rounded-lg"
          style={{
            borderColor: theme.colors.statBoxBorder,
            backgroundColor: theme.colors.statBoxBg,
            paddingVertical: 28,
            paddingHorizontal: 24,
          }}
        >
          <AppText
            style={{ fontSize: titleFontSize, color: theme.colors.textPrimary, marginBottom: 12 }}
          >
            {label}
          </AppText>
          <ShareStatRow label={t("reports.expanded.completionRate")} value={`${d.completion_rate}%`} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.daysAllDone")} value={`${d.days_all_done}/${d.total_days}`} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.totalCompletions")} value={String(d.total_completions)} theme={theme} fontSize={fontSize} />
        </View>
      );
    }
    case "todo": {
      const d = featureData as TodoReportData;
      return (
        <View
          className="flex-1 border rounded-lg"
          style={{
            borderColor: theme.colors.statBoxBorder,
            backgroundColor: theme.colors.statBoxBg,
            paddingVertical: 28,
            paddingHorizontal: 24,
          }}
        >
          <AppText
            style={{ fontSize: titleFontSize, color: theme.colors.textPrimary, marginBottom: 12 }}
          >
            {label}
          </AppText>
          <ShareStatRow label={t("reports.expanded.tasksCompleted")} value={String(d.tasks_completed)} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.tasksCreated")} value={String(d.tasks_created)} theme={theme} fontSize={fontSize} />
          <ShareStatRow label={t("reports.expanded.listsUpdated")} value={String(d.lists_updated)} theme={theme} fontSize={fontSize} />
        </View>
      );
    }
  }
}

const ReportShareCard = forwardRef<View, ReportShareCardProps>(
  ({ title, periodStart, periodEnd, reportData, selectedFeatures, theme, size }, ref) => {
    const features = selectedFeatures.filter((f) => reportData[f]);
    const isStory = size === "story";
    const isWide = size === "wide";
    const isLarger = isStory || isWide;

    const rowFontSize = isLarger ? 30 : 24;
    const featureTitleSize = isLarger ? 38 : 32;

    return (
      <ThemedCardWrapper ref={ref} theme={theme} size={size}>
        {/* Header */}
        <View>
          <AppText
            style={{ fontSize: isStory ? 68 : isWide ? 56 : 52, color: theme.colors.textPrimary }}
            numberOfLines={1}
          >
            {title}
          </AppText>
          <AppText
            style={{ fontSize: isLarger ? 36 : 28, color: theme.colors.textSecondary, marginTop: 4 }}
          >
            {formatDateShort(periodStart)} – {formatDateShort(periodEnd)}
          </AppText>
        </View>

        {/* Feature Grid */}
        <View style={{ gap: 16 }}>
          <FeatureGrid features={features} reportData={reportData} theme={theme} size={size} fontSize={rowFontSize} titleFontSize={featureTitleSize} />
        </View>

        {/* Footer */}
        <View className="flex-row items-center gap-3 self-end">
          <Image
            source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
            style={{ width: isLarger ? 56 : 48, height: isLarger ? 56 : 48, borderRadius: 8 }}
          />
          <AppText
            style={{ fontSize: isLarger ? 36 : 30, color: theme.colors.accent }}
          >
            {APP_NAME}
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

ReportShareCard.displayName = "ReportShareCard";

function FeatureGrid({
  features,
  reportData,
  theme,
  size,
  fontSize = 24,
  titleFontSize = 32,
}: {
  features: ReportFeature[];
  reportData: ReportData;
  theme: ShareCardTheme;
  size: ShareCardSize;
  fontSize?: number;
  titleFontSize?: number;
}) {
  // Story layout: single column stacking
  if (size === "story") {
    if (features.length === 1) {
      return (
        <View className="items-center">
          <View className="flex-row" style={{ width: "70%" }}>
            <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          </View>
        </View>
      );
    }
    if (features.length === 2) {
      return (
        <>
          {features.map((f) => (
            <View key={f} className="flex-row">
              <FeatureCard feature={f} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
            </View>
          ))}
        </>
      );
    }

    // 3+ features: 2 per row
    const rows: ReportFeature[][] = [];
    for (let i = 0; i < features.length; i += 2) {
      rows.push(features.slice(i, i + 2));
    }
    return (
      <>
        {rows.map((row, i) => (
          <View key={i} className="flex-row gap-4">
            {row.map((f) => (
              <FeatureCard key={f} feature={f} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
            ))}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}
      </>
    );
  }

  // Wide layout: more cards per row
  if (size === "wide") {
    if (features.length === 1) {
      return (
        <View className="items-center">
          <View className="flex-row" style={{ width: "50%" }}>
            <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          </View>
        </View>
      );
    }

    if (features.length <= 3) {
      return (
        <View className="flex-row gap-4">
          {features.map((f) => (
            <FeatureCard key={f} feature={f} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          ))}
        </View>
      );
    }

    if (features.length === 4) {
      return (
        <>
          <View className="flex-row gap-4">
            <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
            <FeatureCard feature={features[1]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          </View>
          <View className="flex-row gap-4">
            <FeatureCard feature={features[2]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
            <FeatureCard feature={features[3]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          </View>
        </>
      );
    }

    // 5 features: 3+2
    return (
      <>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <FeatureCard feature={features[1]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <FeatureCard feature={features[2]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        </View>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[3]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <FeatureCard feature={features[4]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <View className="flex-1" />
        </View>
      </>
    );
  }

  // Square layout: original adaptive grid
  if (features.length === 1) {
    return (
      <View className="items-center">
        <View className="flex-row" style={{ width: "60%" }}>
          <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        </View>
      </View>
    );
  }

  if (features.length === 2) {
    return (
      <View className="flex-row gap-4">
        {features.map((f) => (
          <FeatureCard key={f} feature={f} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        ))}
      </View>
    );
  }

  if (features.length === 3) {
    return (
      <>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <FeatureCard feature={features[1]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        </View>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[2]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <View className="flex-1" />
        </View>
      </>
    );
  }

  if (features.length === 4) {
    return (
      <>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <FeatureCard feature={features[1]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        </View>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[2]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
          <FeatureCard feature={features[3]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        </View>
      </>
    );
  }

  // 5 features: 3+2
  return (
    <>
      <View className="flex-row gap-4">
        <FeatureCard feature={features[0]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        <FeatureCard feature={features[1]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        <FeatureCard feature={features[2]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
      </View>
      <View className="flex-row gap-4">
        <FeatureCard feature={features[3]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        <FeatureCard feature={features[4]} data={reportData} theme={theme} fontSize={fontSize} titleFontSize={titleFontSize} />
        <View className="flex-1" />
      </View>
    </>
  );
}

export default ReportShareCard;
