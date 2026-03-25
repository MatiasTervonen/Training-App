"use client";

import {
  BookOpen,
  Dumbbell,
  Activity,
  Scale,
  NotebookPen,
  Bell,
  Repeat,
  ListTodo,
  MessageCircle,
  FileBarChart,
  Utensils,
  ArrowLeftRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import Link from "next/link";

type TutorialFeature = {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  titleKey: string;
  descKey: string;
  route: string;
};

const TUTORIAL_FEATURES: TutorialFeature[] = [
  {
    icon: Dumbbell,
    color: "text-blue-500",
    bgColor: "bg-blue-900/40",
    titleKey: "feed.tutorial.gym.title",
    descKey: "feed.tutorial.gym.desc",
    route: "/gym",
  },
  {
    icon: Activity,
    color: "text-green-400",
    bgColor: "bg-green-900/40",
    titleKey: "feed.tutorial.activities.title",
    descKey: "feed.tutorial.activities.desc",
    route: "/activities",
  },
  {
    icon: Utensils,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-900/40",
    titleKey: "feed.tutorial.nutrition.title",
    descKey: "feed.tutorial.nutrition.desc",
    route: "/nutrition",
  },
  {
    icon: Scale,
    color: "text-amber-500",
    bgColor: "bg-amber-900/40",
    titleKey: "feed.tutorial.weight.title",
    descKey: "feed.tutorial.weight.desc",
    route: "/weight",
  },
  {
    icon: NotebookPen,
    color: "text-purple-500",
    bgColor: "bg-purple-900/40",
    titleKey: "feed.tutorial.notes.title",
    descKey: "feed.tutorial.notes.desc",
    route: "/notes",
  },
  {
    icon: Bell,
    color: "text-pink-500",
    bgColor: "bg-pink-900/40",
    titleKey: "feed.tutorial.reminders.title",
    descKey: "feed.tutorial.reminders.desc",
    route: "/reminders",
  },
  {
    icon: Repeat,
    color: "text-rose-500",
    bgColor: "bg-rose-900/40",
    titleKey: "feed.tutorial.habits.title",
    descKey: "feed.tutorial.habits.desc",
    route: "/habits",
  },
  {
    icon: ListTodo,
    color: "text-cyan-500",
    bgColor: "bg-cyan-900/40",
    titleKey: "feed.tutorial.todo.title",
    descKey: "feed.tutorial.todo.desc",
    route: "/todo",
  },
  {
    icon: MessageCircle,
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/40",
    titleKey: "feed.tutorial.chat.title",
    descKey: "feed.tutorial.chat.desc",
    route: "/chat",
  },
  {
    icon: FileBarChart,
    color: "text-indigo-500",
    bgColor: "bg-indigo-900/40",
    titleKey: "feed.tutorial.reports.title",
    descKey: "feed.tutorial.reports.desc",
    route: "/dashboard",
  },
];

interface TutorialSessionProps {
  onClose?: () => void;
}

export default function TutorialSession({ onClose }: TutorialSessionProps) {
  const { t } = useTranslation("feed");

  return (
    <div className="page-padding pb-10 max-w-lg mx-auto">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center mb-4">
          <BookOpen size={32} className="text-blue-300" />
        </div>
        <h2 className="text-2xl text-center text-gray-100">
          {t("feed.tutorial.title", { appName: APP_NAME })}
        </h2>
        <p className="text-gray-400 text-center mt-2 font-body">
          {t("feed.tutorial.subtitle", { appName: APP_NAME })}
        </p>

        <div className="flex flex-col gap-2 mt-4 w-full">
          <div className="flex items-center bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
            <ArrowLeftRight size={18} className="text-slate-400 shrink-0" />
            <p className="text-sm text-gray-400 ml-3 font-body">
              {t("feed.tutorial.navigation_hint")}
            </p>
          </div>
          <p className="text-xs text-slate-500 text-center font-body">
            {t("feed.tutorial.platform_hint")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {TUTORIAL_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.titleKey}
              href={feature.route}
              onClick={onClose}
              className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex items-center hover:bg-slate-700/70 transition-colors cursor-pointer"
            >
              <div className={`w-11 h-11 rounded-full ${feature.bgColor} flex items-center justify-center shrink-0`}>
                <Icon size={22} className={feature.color} />
              </div>
              <div className="flex-1 ml-3 mr-2">
                <h3 className="text-base text-gray-100">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-body">
                  {t(feature.descKey)}
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-500 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
