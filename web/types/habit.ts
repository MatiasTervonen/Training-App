export type HabitType = "manual" | "steps" | "duration";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  target_value: number | null;
  frequency_days: number[] | null;
  reminder_time: string | null;
  alarm_type: "normal" | "priority";
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type HabitLog = {
  habit_id: string;
  completed_date: string;
  accumulated_seconds: number | null;
};

export type HabitStats = {
  total: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
};

export type DayStatus = "all" | "partial" | "none" | "empty";
