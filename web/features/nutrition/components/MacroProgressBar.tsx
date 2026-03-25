"use client";

type MacroProgressBarProps = {
  label: string;
  current: number;
  goal: number | null;
  color: string;
  unit?: string;
};

export default function MacroProgressBar({ label, current, goal, color, unit = "g" }: MacroProgressBarProps) {
  const progress = goal ? Math.min(current / goal, 1) : 0;
  const percentage = Math.round(progress * 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="font-body text-sm">{label}</span>
        <span className="font-body text-sm text-slate-400">
          {Math.round(current)}{goal ? ` / ${Math.round(goal)}` : ""} {unit}
        </span>
      </div>
      {goal ? (
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
        </div>
      ) : null}
    </div>
  );
}
