"use client";

import { useTranslation } from "react-i18next";

type CalorieRingProps = {
  consumed: number;
  goal: number;
  size?: number;
};

export default function CalorieRing({ consumed, goal, size = 160 }: CalorieRingProps) {
  const { t } = useTranslation("nutrition");
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = goal - consumed;
  const isOver = remaining < 0;

  return (
    <div className="flex items-center justify-center relative">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#334155" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={isOver ? "#ef4444" : "#ff00ff"} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl">{consumed}</span>
        <span className="font-body text-sm text-slate-400">/ {goal} {t("feed.kcal")}</span>
        <span className={`text-xs mt-1 ${isOver ? "text-red-400" : "text-fuchsia-400"}`}>
          {Math.abs(remaining)} {isOver ? t("daily.over") : t("daily.remaining")}
        </span>
      </div>
    </div>
  );
}
