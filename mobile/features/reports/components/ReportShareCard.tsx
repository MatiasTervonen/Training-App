import { forwardRef } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { formatDuration, formatMeters, formatDateShort } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import {
  ReportFeature,
  ReportData,
  GymReportData,
  ActivitiesReportData,
  WeightReportData,
  HabitsReportData,
  TodoReportData,
} from "@/types/report";

const GRADIENT_COLORS: [string, string, string] = ["#1e3a8a", "#0f172a", "#0f172a"];
const GRADIENT_START = { x: 0.8, y: 0 };
const GRADIENT_END = { x: 0.2, y: 1 };

type ReportShareCardProps = {
  title: string;
  periodStart: string;
  periodEnd: string;
  reportData: ReportData;
  selectedFeatures: ReportFeature[];
};

function ShareStatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-[10px] border-b border-gray-700/50">
      <AppText className="text-[24px] text-gray-400">{label}</AppText>
      <AppText className="text-[24px] text-gray-100">{value}</AppText>
    </View>
  );
}

function FeatureCard({ feature, data }: { feature: ReportFeature; data: ReportData }) {
  const { t } = useTranslation("reports");
  const featureData = data[feature];
  if (!featureData) return null;

  const label = t(`reports.features.${feature}`);

  switch (feature) {
    case "gym": {
      const d = featureData as GymReportData;
      return (
        <View className="flex-1 border-blue-500 border rounded-lg bg-slate-950/50 py-[28px] px-[24px]">
          <AppText className="text-[32px] text-gray-100 mb-[12px]">{label}</AppText>
          <ShareStatRow label={t("reports.expanded.sessions")} value={String(d.session_count)} />
          <ShareStatRow label={t("reports.expanded.totalVolume")} value={`${d.total_volume.toLocaleString()} kg`} />
          <ShareStatRow label={t("reports.expanded.totalDuration")} value={formatDuration(d.total_duration)} />
          <ShareStatRow label={t("reports.expanded.avgDuration")} value={formatDuration(d.avg_duration)} />
          <ShareStatRow label={t("reports.expanded.totalCalories")} value={String(d.total_calories)} />
          <ShareStatRow label={t("reports.expanded.exercises")} value={String(d.exercise_count)} />
        </View>
      );
    }
    case "activities": {
      const d = featureData as ActivitiesReportData;
      return (
        <View className="flex-1 border-blue-500 border rounded-lg bg-slate-950/50 py-[28px] px-[24px]">
          <AppText className="text-[32px] text-gray-100 mb-[12px]">{label}</AppText>
          <ShareStatRow label={t("reports.expanded.sessions")} value={String(d.session_count)} />
          <ShareStatRow label={t("reports.expanded.totalDistance")} value={formatMeters(d.total_distance_meters)} />
          <ShareStatRow label={t("reports.expanded.totalDuration")} value={formatDuration(d.total_duration)} />
          <ShareStatRow label={t("reports.expanded.totalCalories")} value={String(d.total_calories)} />
          <ShareStatRow label={t("reports.expanded.totalSteps")} value={d.total_steps.toLocaleString()} />
        </View>
      );
    }
    case "weight": {
      const d = featureData as WeightReportData;
      return (
        <View className="flex-1 border-blue-500 border rounded-lg bg-slate-950/50 py-[28px] px-[24px]">
          <AppText className="text-[32px] text-gray-100 mb-[12px]">{label}</AppText>
          <ShareStatRow label={t("reports.expanded.entries")} value={String(d.entry_count)} />
          <ShareStatRow label={t("reports.expanded.startWeight")} value={d.start_weight != null ? `${d.start_weight} kg` : "-"} />
          <ShareStatRow label={t("reports.expanded.endWeight")} value={d.end_weight != null ? `${d.end_weight} kg` : "-"} />
          <ShareStatRow
            label={t("reports.expanded.weightChange")}
            value={d.change != null ? `${d.change > 0 ? "+" : ""}${d.change} kg` : "-"}
          />
        </View>
      );
    }
    case "habits": {
      const d = featureData as HabitsReportData;
      return (
        <View className="flex-1 border-blue-500 border rounded-lg bg-slate-950/50 py-[28px] px-[24px]">
          <AppText className="text-[32px] text-gray-100 mb-[12px]">{label}</AppText>
          <ShareStatRow label={t("reports.expanded.completionRate")} value={`${d.completion_rate}%`} />
          <ShareStatRow label={t("reports.expanded.daysAllDone")} value={`${d.days_all_done}/${d.total_days}`} />
          <ShareStatRow label={t("reports.expanded.totalCompletions")} value={String(d.total_completions)} />
        </View>
      );
    }
    case "todo": {
      const d = featureData as TodoReportData;
      return (
        <View className="flex-1 border-blue-500 border rounded-lg bg-slate-950/50 py-[28px] px-[24px]">
          <AppText className="text-[32px] text-gray-100 mb-[12px]">{label}</AppText>
          <ShareStatRow label={t("reports.expanded.tasksCompleted")} value={String(d.tasks_completed)} />
          <ShareStatRow label={t("reports.expanded.tasksCreated")} value={String(d.tasks_created)} />
          <ShareStatRow label={t("reports.expanded.listsUpdated")} value={String(d.lists_updated)} />
        </View>
      );
    }
  }
}

const ReportShareCard = forwardRef<View, ReportShareCardProps>(
  ({ title, periodStart, periodEnd, reportData, selectedFeatures }, ref) => {
    const features = selectedFeatures.filter((f) => reportData[f]);

    return (
      <View
        ref={ref}
        collapsable={false}
        className="w-[1080px] h-[1080px]"
      >
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={GRADIENT_START}
          end={GRADIENT_END}
          className="flex-1 px-[60px] pt-[60px] pb-[60px] justify-between"
        >
          {/* Header */}
          <View>
            <AppText className="text-[52px] text-white" numberOfLines={1}>
              {title}
            </AppText>
            <AppText className="text-[28px] text-gray-300 mt-1">
              {formatDateShort(periodStart)} – {formatDateShort(periodEnd)}
            </AppText>
          </View>

          {/* Feature Grid */}
          <View className="gap-4">
            <FeatureGrid features={features} reportData={reportData} />
          </View>

          {/* Footer */}
          <View className="flex-row items-center gap-3 self-end">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[48px] h-[48px] rounded-lg"
            />
            <AppText className="text-[30px] text-white/80">{APP_NAME}</AppText>
          </View>
        </LinearGradient>
      </View>
    );
  },
);

ReportShareCard.displayName = "ReportShareCard";

function FeatureGrid({ features, reportData }: { features: ReportFeature[]; reportData: ReportData }) {
  if (features.length === 1) {
    return (
      <View className="flex-row">
        <FeatureCard feature={features[0]} data={reportData} />
      </View>
    );
  }

  if (features.length === 2) {
    return (
      <View className="flex-row gap-4">
        {features.map((f) => (
          <FeatureCard key={f} feature={f} data={reportData} />
        ))}
      </View>
    );
  }

  if (features.length === 3) {
    return (
      <>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[0]} data={reportData} />
          <FeatureCard feature={features[1]} data={reportData} />
        </View>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[2]} data={reportData} />
          <View className="flex-1" />
        </View>
      </>
    );
  }

  if (features.length === 4) {
    return (
      <>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[0]} data={reportData} />
          <FeatureCard feature={features[1]} data={reportData} />
        </View>
        <View className="flex-row gap-4">
          <FeatureCard feature={features[2]} data={reportData} />
          <FeatureCard feature={features[3]} data={reportData} />
        </View>
      </>
    );
  }

  // 5 features: 3+2
  return (
    <>
      <View className="flex-row gap-4">
        <FeatureCard feature={features[0]} data={reportData} />
        <FeatureCard feature={features[1]} data={reportData} />
        <FeatureCard feature={features[2]} data={reportData} />
      </View>
      <View className="flex-row gap-4">
        <FeatureCard feature={features[3]} data={reportData} />
        <FeatureCard feature={features[4]} data={reportData} />
        <View className="flex-1" />
      </View>
    </>
  );
}

export default ReportShareCard;
