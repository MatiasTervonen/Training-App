export type ReportSchedule = {
  id: string;
  user_id: string;
  title: string;
  included_features: ReportFeature[];
  schedule_type: ScheduleType;
  delivery_day_of_week: number | null; // 0-6 (Sun-Sat)
  delivery_day_of_month: number | null; // 1-28
  delivery_hour: number; // 0-23 (UTC), default 8
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleType = "weekly" | "biweekly" | "monthly" | "quarterly";

export type ReportFeature = "gym" | "activities" | "weight" | "habits" | "todo";

export type GeneratedReport = {
  id: string;
  user_id: string;
  schedule_id: string;
  title: string;
  period_start: string; // "YYYY-MM-DD"
  period_end: string; // "YYYY-MM-DD"
  report_data: ReportData;
  created_at: string;
};

export type ReportData = {
  gym?: GymReportData;
  activities?: ActivitiesReportData;
  weight?: WeightReportData;
  habits?: HabitsReportData;
  todo?: TodoReportData;
  previous_data?: {
    gym?: GymReportData;
    activities?: ActivitiesReportData;
    weight?: WeightReportData;
    habits?: HabitsReportData;
    todo?: TodoReportData;
  };
};

export type GymReportData = {
  session_count: number;
  total_duration: number;
  avg_duration: number;
  total_volume: number;
  total_calories: number;
  exercise_count: number;
};

export type ActivityBreakdown = {
  activity_name: string;
  activity_slug: string | null;
  session_count: number;
  total_duration: number;
  total_distance_meters: number | null;
  total_calories: number;
  total_steps: number | null;
};

export type ActivitiesReportData = {
  by_activity: ActivityBreakdown[];
};

export type WeightReportData = {
  entry_count: number;
  start_weight: number | null;
  end_weight: number | null;
  change: number | null;
};

export type HabitsReportData = {
  completion_rate: number;
  days_all_done: number;
  total_days: number;
  total_completions: number;
};

export type TodoReportData = {
  tasks_completed: number;
  tasks_created: number;
  lists_updated: number;
};

export const REPORT_FEATURES: { key: ReportFeature; labelKey: string }[] = [
  { key: "gym", labelKey: "reports.features.gym" },
  { key: "activities", labelKey: "reports.features.activities" },
  { key: "weight", labelKey: "reports.features.weight" },
  { key: "habits", labelKey: "reports.features.habits" },
  { key: "todo", labelKey: "reports.features.todo" },
];

export const SCHEDULE_TYPES: { key: ScheduleType; labelKey: string; days: number }[] = [
  { key: "weekly", labelKey: "reports.scheduleTypes.weekly", days: 7 },
  { key: "biweekly", labelKey: "reports.scheduleTypes.biweekly", days: 14 },
  { key: "monthly", labelKey: "reports.scheduleTypes.monthly", days: 30 },
  { key: "quarterly", labelKey: "reports.scheduleTypes.quarterly", days: 90 },
];

export const MAX_REPORTS = 5;
