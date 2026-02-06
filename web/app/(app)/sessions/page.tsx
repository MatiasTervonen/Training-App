"use client";

import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Weight,
  ListTodo,
  Bell,
  Activity,
} from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function Sessions() {
  const { t } = useTranslation("common");

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">{t("sessions.title")}</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/gym">
          {t("sessions.gym")}
          <Dumbbell />
        </LinkButton>
        <LinkButton href="/activities">
          {t("sessions.activities")}
          <Activity />
        </LinkButton>

        <LinkButton href="/notes">
          {t("sessions.notes")}
          <NotebookPen />
        </LinkButton>
        <LinkButton href="/disc-golf">
          Disc Golf
          <Disc />
        </LinkButton>

        <LinkButton href="/timer">
          {t("sessions.timer")}
          <Timer />
        </LinkButton>
        <LinkButton href="/weight">
          {t("sessions.bodyWeight")}
          <Weight />
        </LinkButton>
        <LinkButton href="/todo">
          {t("sessions.todoList")}
          <ListTodo />
        </LinkButton>
        <LinkButton href="/reminders">
          {t("sessions.reminders")}
          <Bell />
        </LinkButton>
      </div>
    </div>
  );
}
