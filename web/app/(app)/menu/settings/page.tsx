"use client";

import { PushNotificationManager } from "@/components/pushnotifications/pushnotifications";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation("menu");

  return (
    <div className="page-padding max-w-md mx-auto flex flex-col">
      <h1 className="text-2xl text-center mb-10">{t("settings.title")}</h1>
      <div className="flex flex-col gap-5">
        <div className="bg-slate-900 p-4 rounded-md">
          <LanguageSelector />
        </div>
        <div className="bg-slate-900 p-4 rounded-md">
          <PushNotificationManager />
        </div>
      </div>
    </div>
  );
}
