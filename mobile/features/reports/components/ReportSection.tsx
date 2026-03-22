import { View } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { formatDuration, formatMeters } from "@/lib/formatDate";
import {
  Dumbbell,
  Activity,
  Scale,
  Repeat,
  ListTodo,
} from "lucide-react-native";
import {
  ReportFeature,
  GymReportData,
  ActivitiesReportData,
  WeightReportData,
  HabitsReportData,
  TodoReportData,
  ReportData,
} from "@/types/report";
import { useUserStore } from "@/lib/stores/useUserStore";
import BodyTextNC from "@/components/BodyTextNC";
import BodyText from "@/components/BodyText";

const FEATURE_ICONS: Record<ReportFeature, React.ReactNode> = {
  gym: <Dumbbell size={20} color="#cbd5e1" />,
  activities: <Activity size={20} color="#cbd5e1" />,
  weight: <Scale size={20} color="#cbd5e1" />,
  habits: <Repeat size={20} color="#cbd5e1" />,
  todo: <ListTodo size={20} color="#cbd5e1" />,
};

type Delta = { text: string; direction: "up" | "down" | "same" } | null;

function makeDelta(
  current: number,
  previous: number | undefined | null,
  format?: (n: number) => string,
): Delta {
  if (previous == null) return null;
  const diff = current - previous;
  if (diff === 0) return { text: "0", direction: "same" };
  const direction = diff > 0 ? "up" : "down";
  const abs = Math.abs(diff);
  const prefix = diff > 0 ? "+" : "-";
  const text = format ? `${prefix}${format(abs)}` : `${prefix}${abs}`;
  return { text, direction };
}

type ReportSectionProps = {
  feature: ReportFeature;
  data: ReportData;
};

function StatRow({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: Delta;
}) {
  return (
    <View className="flex-row items-center py-2 border-b border-gray-700/50">
      <BodyTextNC className="text-gray-400 text-sm flex-1">{label}</BodyTextNC>
      <View className="w-28 items-center">
        {delta && delta.direction === "up" && (
          <BodyTextNC className="text-xs text-green-400">
            ▲ {delta.text}
          </BodyTextNC>
        )}
        {delta && delta.direction === "down" && (
          <BodyTextNC className="text-xs text-red-400">
            ▼ {delta.text}
          </BodyTextNC>
        )}
        {delta && delta.direction === "same" && (
          <BodyTextNC className="text-xs text-gray-500">—</BodyTextNC>
        )}
      </View>
      <BodyText className="text-sm w-24 text-right">{value}</BodyText>
    </View>
  );
}

function GymSection({
  data,
  prev,
}: {
  data: GymReportData;
  prev?: GymReportData;
}) {
  const { t } = useTranslation("reports");
  const unit = useUserStore((s) => s.profile?.weight_unit) || "kg";
  return (
    <>
      <StatRow
        label={t("reports.expanded.sessions")}
        value={String(data.session_count)}
        delta={makeDelta(data.session_count, prev?.session_count)}
      />
      <StatRow
        label={t("reports.expanded.totalVolume")}
        value={`${data.total_volume.toLocaleString()} ${unit}`}
        delta={makeDelta(data.total_volume, prev?.total_volume)}
      />
      <StatRow
        label={t("reports.expanded.totalDuration")}
        value={formatDuration(data.total_duration)}
        delta={makeDelta(data.total_duration, prev?.total_duration, (n) =>
          formatDuration(n),
        )}
      />
      <StatRow
        label={t("reports.expanded.avgDuration")}
        value={formatDuration(data.avg_duration)}
        delta={makeDelta(data.avg_duration, prev?.avg_duration, (n) =>
          formatDuration(n),
        )}
      />
      <StatRow
        label={t("reports.expanded.totalCalories")}
        value={String(data.total_calories)}
        delta={makeDelta(data.total_calories, prev?.total_calories)}
      />
      <StatRow
        label={t("reports.expanded.exercises")}
        value={String(data.exercise_count)}
        delta={makeDelta(data.exercise_count, prev?.exercise_count)}
      />
    </>
  );
}

function ActivitiesSection({
  data,
  prev,
}: {
  data: ActivitiesReportData;
  prev?: ActivitiesReportData;
}) {
  const { t } = useTranslation("reports");
  const { t: tActivities } = useTranslation("activities");

  if (!data.by_activity || data.by_activity.length === 0) {
    return (
      <BodyText className="text-gray-400 text-sm py-2">
        {t("reports.expanded.noActivities")}
      </BodyText>
    );
  }

  // Build lookup for previous period's activities by slug/name
  const prevMap = new Map(
    (prev?.by_activity ?? []).map((a) => [a.activity_slug ?? a.activity_name, a]),
  );

  return (
    <>
      {data.by_activity.map((activity) => {
        const key = activity.activity_slug ?? activity.activity_name;
        const prevActivity = prevMap.get(key);
        const name = activity.activity_slug
          ? tActivities(`activities.activityNames.${activity.activity_slug}`, {
              defaultValue: activity.activity_name,
            })
          : activity.activity_name;

        return (
          <View key={key} className="mb-3">
            <AppText className="text-sm mb-1">{name}</AppText>
            <StatRow
              label={t("reports.expanded.sessions")}
              value={String(activity.session_count)}
              delta={makeDelta(activity.session_count, prevActivity?.session_count)}
            />
            <StatRow
              label={t("reports.expanded.totalDuration")}
              value={formatDuration(activity.total_duration)}
              delta={makeDelta(activity.total_duration, prevActivity?.total_duration, (n) => formatDuration(n))}
            />
            {activity.total_distance_meters != null && activity.total_distance_meters > 0 && (
              <StatRow
                label={t("reports.expanded.totalDistance")}
                value={formatMeters(activity.total_distance_meters)}
                delta={makeDelta(activity.total_distance_meters, prevActivity?.total_distance_meters, (n) => formatMeters(n))}
              />
            )}
            <StatRow
              label={t("reports.expanded.totalCalories")}
              value={String(activity.total_calories)}
              delta={makeDelta(activity.total_calories, prevActivity?.total_calories)}
            />
            {activity.total_steps != null && activity.total_steps > 0 && (
              <StatRow
                label={t("reports.expanded.totalSteps")}
                value={activity.total_steps.toLocaleString()}
                delta={makeDelta(activity.total_steps, prevActivity?.total_steps)}
              />
            )}
          </View>
        );
      })}
    </>
  );
}

function WeightSection({
  data,
  prev,
}: {
  data: WeightReportData;
  prev?: WeightReportData;
}) {
  const { t } = useTranslation("reports");
  const unit = useUserStore((s) => s.profile?.weight_unit) || "kg";
  const formatWeight = (n: number) => `${n.toFixed(1)} ${unit}`;
  return (
    <>
      <StatRow
        label={t("reports.expanded.entries")}
        value={String(data.entry_count)}
        delta={makeDelta(data.entry_count, prev?.entry_count)}
      />
      <StatRow
        label={t("reports.expanded.startWeight")}
        value={data.start_weight != null ? formatWeight(data.start_weight) : "-"}
        delta={
          data.start_weight != null
            ? makeDelta(data.start_weight, prev?.start_weight, formatWeight)
            : null
        }
      />
      <StatRow
        label={t("reports.expanded.endWeight")}
        value={data.end_weight != null ? formatWeight(data.end_weight) : "-"}
        delta={
          data.end_weight != null
            ? makeDelta(data.end_weight, prev?.end_weight, formatWeight)
            : null
        }
      />
      <StatRow
        label={t("reports.expanded.weightChange")}
        value={
          data.change != null
            ? `${data.change > 0 ? "+" : ""}${data.change.toFixed(1)} ${unit}`
            : "-"
        }
      />
    </>
  );
}

function HabitsSection({
  data,
  prev,
}: {
  data: HabitsReportData;
  prev?: HabitsReportData;
}) {
  const { t } = useTranslation("reports");
  return (
    <>
      <StatRow
        label={t("reports.expanded.completionRate")}
        value={`${data.completion_rate}%`}
        delta={makeDelta(
          data.completion_rate,
          prev?.completion_rate,
          (n) => `${n}%`,
        )}
      />
      <StatRow
        label={t("reports.expanded.daysAllDone")}
        value={`${data.days_all_done}/${data.total_days}`}
        delta={makeDelta(data.days_all_done, prev?.days_all_done)}
      />
      <StatRow
        label={t("reports.expanded.totalCompletions")}
        value={String(data.total_completions)}
        delta={makeDelta(data.total_completions, prev?.total_completions)}
      />
    </>
  );
}

function TodoSection({
  data,
  prev,
}: {
  data: TodoReportData;
  prev?: TodoReportData;
}) {
  const { t } = useTranslation("reports");
  return (
    <>
      <StatRow
        label={t("reports.expanded.tasksCompleted")}
        value={String(data.tasks_completed)}
        delta={makeDelta(data.tasks_completed, prev?.tasks_completed)}
      />
      <StatRow
        label={t("reports.expanded.tasksCreated")}
        value={String(data.tasks_created)}
        delta={makeDelta(data.tasks_created, prev?.tasks_created)}
      />
    </>
  );
}

const FEATURE_LABELS: Record<ReportFeature, string> = {
  gym: "reports.features.gym",
  activities: "reports.features.activities",
  weight: "reports.features.weight",
  habits: "reports.features.habits",
  todo: "reports.features.todo",
};

export default function ReportSection({ feature, data }: ReportSectionProps) {
  const { t } = useTranslation("reports");

  const featureData = data[feature];
  if (!featureData) return null;

  const prev = data.previous_data?.[feature];

  return (
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="rounded-lg overflow-hidden p-4 border-[1.5px] border-gray-600"
    >
      <View className="flex-row items-center gap-2 mb-2">
        {FEATURE_ICONS[feature]}
        <AppText className="text-lg">{t(FEATURE_LABELS[feature])}</AppText>
      </View>
      {feature === "gym" && (
        <GymSection
          data={featureData as GymReportData}
          prev={prev as GymReportData | undefined}
        />
      )}
      {feature === "activities" && (
        <ActivitiesSection
          data={featureData as ActivitiesReportData}
          prev={prev as ActivitiesReportData | undefined}
        />
      )}
      {feature === "weight" && (
        <WeightSection
          data={featureData as WeightReportData}
          prev={prev as WeightReportData | undefined}
        />
      )}
      {feature === "habits" && (
        <HabitsSection
          data={featureData as HabitsReportData}
          prev={prev as HabitsReportData | undefined}
        />
      )}
      {feature === "todo" && (
        <TodoSection
          data={featureData as TodoReportData}
          prev={prev as TodoReportData | undefined}
        />
      )}
    </LinearGradient>
  );
}
