"use client";

import { List, ChartNoAxesCombined } from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";
import { useTimerStore } from "../lib/stores/timerStore";
import toast from "react-hot-toast";

export default function Sessions() {
  const { t } = useTranslation("activities");
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = (e: React.MouseEvent) => {
    if (activeSession) {
      e.preventDefault();
      toast.error(
        `${t("activities.activeSessionError")} ${t("activities.activeSessionErrorSub")}`,
      );
      return;
    }
  };

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">{t("activities.title")}</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/activities/start-activity" onClick={handleClick}>
          {t("activities.startActivity")}
        </LinkButton>
        <LinkButton href="/activities/templates">
          {t("activities.templates")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href="/activities/add-activity">
          {t("activities.addActivity")}
        </LinkButton>
        <LinkButton href="/activities/edit-activity">
          {t("activities.editActivity")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href="/activities/analytics">
          {t("activities.analytics")}
          <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
        </LinkButton>
        <LinkButton href="/activities/my-sessions">
          {t("activities.mySessions.title")}
          <List color="#f3f4f6" className="ml-2" />
        </LinkButton>
      </div>
    </div>
  );
}
