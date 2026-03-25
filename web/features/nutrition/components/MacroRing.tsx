"use client";

type MacroRingProps = {
  label: string;
  current: number;
  goal: number | null;
  color: string; // stroke color hex, e.g. "#3b82f6"
  unit?: string;
  size?: number;
};

export default function MacroRing({
  label,
  current,
  goal,
  color,
  unit = "g",
  size = 90,
}: MacroRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal ? Math.min(current / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#334155"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {goal && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm">{Math.round(current)}</span>
          {goal ? (
            <span className="font-body text-[10px] text-slate-400">/ {Math.round(goal)}</span>
          ) : null}
        </div>
      </div>
      <span className="font-body text-xs text-slate-400">{label} ({unit})</span>
    </div>
  );
}
