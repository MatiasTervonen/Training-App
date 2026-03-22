"use client";

import { List, ChartNoAxesCombined } from "lucide-react";
import LinkButton from "@/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function Sessions() {
  const { t } = useTranslation("activities");

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">{t("activities.title")}</h1>
      <div className="flex flex-col gap-3">
        <LinkButton href="/activities/templates" className="link-activities">
          {t("activities.templates")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href="/activities/add-activity" className="link-activities">
          {t("activities.addActivity")}
        </LinkButton>
        <LinkButton href="/activities/edit-activity" className="link-activities">
          {t("activities.editActivity")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href="/activities/analytics" className="link-activities">
          {t("activities.analytics")}
          <ChartNoAxesCombined color="#22c55e" className="ml-2" />
        </LinkButton>
        <LinkButton href="/activities/my-sessions" className="link-activities">
          {t("activities.mySessions.title")}
          <List color="#22c55e" className="ml-2" />
        </LinkButton>
      </div>
    </div>
  );
}
