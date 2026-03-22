"use client";

import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import Image from "next/image";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const TUTORIAL_IMAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/tutorial-images`;

const TUTORIAL_SECTIONS = [
  {
    image: `${TUTORIAL_IMAGE_BASE}/gym-tracking.webp`,
    titleKey: "feed.tutorial.gym.title",
    descKey: "feed.tutorial.gym.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/activities.webp`,
    titleKey: "feed.tutorial.activities.title",
    descKey: "feed.tutorial.activities.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/weight.webp`,
    titleKey: "feed.tutorial.weight.title",
    descKey: "feed.tutorial.weight.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/notes.webp`,
    titleKey: "feed.tutorial.notes.title",
    descKey: "feed.tutorial.notes.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/reminders.webp`,
    titleKey: "feed.tutorial.reminders.title",
    descKey: "feed.tutorial.reminders.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/habits.webp`,
    titleKey: "feed.tutorial.habits.title",
    descKey: "feed.tutorial.habits.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/todo.webp`,
    titleKey: "feed.tutorial.todo.title",
    descKey: "feed.tutorial.todo.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/chat.webp`,
    titleKey: "feed.tutorial.chat.title",
    descKey: "feed.tutorial.chat.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/reports.webp`,
    titleKey: "feed.tutorial.reports.title",
    descKey: "feed.tutorial.reports.desc",
  },
];

export default function TutorialSession() {
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
          {t("feed.tutorial.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {TUTORIAL_SECTIONS.map((section) => (
          <div
            key={section.titleKey}
            className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
          >
            <div className="relative w-full h-48">
              <Image
                src={section.image}
                alt={t(section.titleKey)}
                fill
                className="object-cover"
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg mb-2 text-gray-100">
                {t(section.titleKey)}
              </h3>
              <p className="text-sm text-gray-400 font-body">
                {t(section.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
