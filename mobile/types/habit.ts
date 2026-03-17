export type Habit = {
  id: string;
  user_id: string;
  name: string;
  reminder_time: string | null;
  frequency_days: number[] | null; // null = daily, [1..7] = specific days (1=Sun, 2=Mon, ..., 7=Sat)
  is_active: boolean;
  sort_order: number;
  created_at: string;
  type: "manual" | "steps" | "duration";
  target_value: number | null; // seconds for duration, steps for steps
  alarm_type: "normal" | "priority";
};

export type HabitLog = {
  habit_id: string;
  completed_date: string;
  accumulated_seconds: number | null; // null for manual/steps, seconds for duration
};

export type HabitStats = {
  total: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
};

export type DayStatus = "all" | "partial" | "none" | "empty";
