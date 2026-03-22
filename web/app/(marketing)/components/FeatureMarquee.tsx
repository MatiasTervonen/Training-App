"use client";

import { useTranslation } from "react-i18next";
import {
  Dumbbell,
  Activity,
  Timer,
  NotebookPen,
  Scale,
  Target,
  ListChecks,
  Bell,
  ChartArea,
  MessageCircle,
  Users,
  TrendingUp,
  LucideIcon,
} from "lucide-react";

interface MarqueeFeature {
  key: string;
  icon: LucideIcon;
  color: string;
}

const features: MarqueeFeature[] = [
  { key: "gym", icon: Dumbbell, color: "text-blue-400" },
  { key: "activities", icon: Activity, color: "text-green-400" },
  { key: "timer", icon: Timer, color: "text-orange-400" },
  { key: "notes", icon: NotebookPen, color: "text-purple-400" },
  { key: "weight", icon: Scale, color: "text-amber-400" },
  { key: "habits", icon: Target, color: "text-rose-400" },
  { key: "todo", icon: ListChecks, color: "text-cyan-400" },
  { key: "reminders", icon: Bell, color: "text-yellow-400" },
  { key: "reports", icon: ChartArea, color: "text-indigo-400" },
  { key: "chat", icon: MessageCircle, color: "text-sky-400" },
  { key: "friends", icon: Users, color: "text-pink-400" },
  { key: "analytics", icon: TrendingUp, color: "text-emerald-400" },
];

function FeatureItems({
  suffix,
  t,
}: {
  suffix?: string;
  t: (key: string) => string;
}) {
  return (
    <>
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <div
            key={`${f.key}${suffix ?? ""}`}
            className="flex items-center gap-2.5 px-6 text-nowrap"
          >
            <Icon className={f.color} size={20} />
            <span className="text-gray-200 font-body text-sm sm:text-base">
              {t(`marquee.${f.key}`)}
            </span>
          </div>
        );
      })}
    </>
  );
}

export default function FeatureMarquee() {
  const { t } = useTranslation("marketing");

  return (
    <div className="relative overflow-hidden bg-slate-900/80 py-4 border-y border-slate-800">
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-linear-to-r from-slate-900 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-linear-to-l from-slate-900 to-transparent z-10" />
      <div className="flex animate-marquee">
        <div className="flex shrink-0">
          <FeatureItems t={t} />
        </div>
        <div className="flex shrink-0">
          <FeatureItems suffix="-dup" t={t} />
        </div>
      </div>
    </div>
  );
}
