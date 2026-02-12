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
  Home,
} from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function SessionsSidebar() {
  const { t } = useTranslation("common");

  return (
    <div className="px-6 py-4">
      <h2 className="text-xl text-center mb-6">{t("sessions.title")}</h2>
      <div className="flex flex-col gap-3">
        <LinkButton href="/dashboard">
          {t("navbar.feed")}
          <Home size={18} />
        </LinkButton>
        <LinkButton href="/gym">
          {t("sessions.gym")}
          <Dumbbell size={18} />
        </LinkButton>
        <LinkButton href="/activities">
          {t("sessions.activities")}
          <Activity size={18} />
        </LinkButton>
        <LinkButton href="/notes">
          {t("sessions.notes")}
          <NotebookPen size={18} />
        </LinkButton>
        <LinkButton href="/disc-golf">
          Disc Golf
          <Disc size={18} />
        </LinkButton>
        <LinkButton href="/timer">
          {t("sessions.timer")}
          <Timer size={18} />
        </LinkButton>
        <LinkButton href="/weight">
          {t("sessions.bodyWeight")}
          <Weight size={18} />
        </LinkButton>
        <LinkButton href="/todo">
          {t("sessions.todoList")}
          <ListTodo size={18} />
        </LinkButton>
        <LinkButton href="/reminders">
          {t("sessions.reminders")}
          <Bell size={18} />
        </LinkButton>
      </div>
    </div>
  );
}
