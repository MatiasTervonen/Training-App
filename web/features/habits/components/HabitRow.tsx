"use client";

import { Check, Play, Pause, RotateCcw, Footprints } from "lucide-react";
import { Habit, HabitLog } from "@/types/habit";
import { useTranslation } from "react-i18next";
import Link from "next/link";

type HabitRowProps = {
  habit: Habit;
  completed: boolean;
  log: HabitLog | undefined;
  onToggle: () => void;
  onStartTimer?: () => void;
  onPauseTimer?: () => void;
  habitTimerState: "idle" | "running" | "paused";
  activeHabitId: string | null;
  elapsedTime: number;
};

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function HabitRow({
  habit,
  completed,
  log,
  onToggle,
  onStartTimer,
  onPauseTimer,
  habitTimerState,
  activeHabitId,
  elapsedTime,
}: HabitRowProps) {
  const { t } = useTranslation("habits");
  const isThisHabitActive = activeHabitId === habit.id;

  if (habit.type === "manual") {
    return (
      <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <Link href={`/habits/${habit.id}`} className="flex-1 mr-4">
          <p className={`${completed ? "text-green-400" : "text-gray-100"}`}>
            {habit.name}
          </p>
        </Link>
        <button
          onClick={onToggle}
          className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${
            completed
              ? "bg-green-500 border-green-500"
              : "border-slate-500 hover:border-slate-400"
          }`}
        >
          {completed && <Check size={18} className="text-white" />}
        </button>
      </div>
    );
  }

  if (habit.type === "duration") {
    const targetSeconds = habit.target_value ?? 0;
    const accumulated = log?.accumulated_seconds ?? 0;

    // Calculate display values based on timer state
    let displayAccumulated = accumulated;
    if (isThisHabitActive && (habitTimerState === "running" || habitTimerState === "paused")) {
      displayAccumulated = accumulated + elapsedTime;
    }

    const remaining = Math.max(0, targetSeconds - displayAccumulated);
    const remainingRatio = targetSeconds > 0 ? remaining / targetSeconds : 0;

    return (
      <div className="flex flex-col gap-2 py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div className="flex items-center justify-between">
          <Link href={`/habits/${habit.id}`} className="flex-1 mr-4">
            <p className={`${completed ? "text-green-400" : "text-gray-100"}`}>
              {habit.name}
            </p>
          </Link>
          {!completed && (
            <div className="flex items-center gap-2">
              {isThisHabitActive && habitTimerState === "running" ? (
                <button
                  onClick={onPauseTimer}
                  className="btn-neutral px-3 py-1 text-sm flex items-center gap-1 cursor-pointer"
                >
                  <Pause size={14} />
                  {t("habits.habitTimerPause")}
                </button>
              ) : isThisHabitActive && habitTimerState === "paused" ? (
                <button
                  onClick={onStartTimer}
                  className="btn-start px-3 py-1 text-sm flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  {t("habits.habitTimerResume")}
                </button>
              ) : (
                <button
                  onClick={onStartTimer}
                  className="btn-start px-3 py-1 text-sm flex items-center gap-1 cursor-pointer"
                >
                  <Play size={14} />
                  {t("habits.habitTimerStart")}
                </button>
              )}
            </div>
          )}
          {completed && <Check size={22} className="text-green-500" />}
        </div>

        {/* Countdown progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${completed ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${(completed ? 1 : remainingRatio) * 100}%` }}
            />
          </div>
          <span className="text-xs font-body text-slate-400 whitespace-nowrap">
            {completed
              ? formatSeconds(targetSeconds)
              : `${formatSeconds(Math.round(remaining))} / ${formatSeconds(targetSeconds)}`}
          </span>
        </div>
      </div>
    );
  }

  // Steps habit — read-only
  if (habit.type === "steps") {
    const targetSteps = habit.target_value ?? 0;
    const currentSteps = completed ? targetSteps : (log?.accumulated_seconds ?? 0);
    const progress = targetSteps > 0 ? Math.min(currentSteps / targetSteps, 1) : 0;

    return (
      <div className="flex flex-col gap-2 py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700 opacity-75">
        <div className="flex items-center justify-between">
          <Link href={`/habits/${habit.id}`} className="flex-1 mr-4">
            <p className={`${completed ? "text-green-400" : "text-gray-100"}`}>
              {habit.name}
            </p>
          </Link>
          <div className="flex items-center gap-2">
            <Footprints size={16} className="text-slate-400" />
            {completed && <Check size={22} className="text-green-500" />}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-xs font-body text-slate-400 whitespace-nowrap">
            {currentSteps} / {targetSteps}
          </span>
        </div>

        <p className="text-xs font-body text-slate-500">{t("habits.stepsReadOnly")}</p>
      </div>
    );
  }

  return null;
}
