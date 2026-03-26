"use client";

type MacroRingProps = {
  label: string;
  current: number;
  goal: number | null;
  color: string; // stroke color hex, e.g. "#38bdf8"
  totalMacros?: number;
  size?: number;
};

export default function MacroRing({
  label,
  current,
  goal,
  color,
  totalMacros,
  size = 72,
}: MacroRingProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasGoal = goal != null && goal > 0;
  const progress = hasGoal
    ? Math.min(current / goal, 1)
    : totalMacros && totalMacros > 0
      ? current / totalMacros
      : 0;
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
          {progress > 0 && (
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
        <span className="absolute text-sm">{Math.round(current)}</span>
      </div>
      <span className="font-body text-xs text-slate-400">{label}</span>
    </div>
  );
}
