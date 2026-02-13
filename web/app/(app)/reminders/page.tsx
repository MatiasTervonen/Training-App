"use client";

import { Globe, List } from "lucide-react";
import LinkButton from "@/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function Sessions() {
  const { t } = useTranslation("reminders");

  return (
    <div className="page-padding h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">{t("reminders.title")}</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/reminders/global-reminders">
          <p>{t("reminders.oneTimeGlobal")}</p>
          <Globe />
        </LinkButton>

        <LinkButton href="/reminders/my-reminders">
          <p>{t("reminders.myReminders")}</p>
          <List />
        </LinkButton>
      </div>
    </div>
  );
}
