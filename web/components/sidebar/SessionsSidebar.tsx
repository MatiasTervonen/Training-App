"use client";

import {
  NotebookPen,
  Dumbbell,
  Timer,
  Weight,
  ListTodo,
  Bell,
  Activity,
  Home,
  Repeat,
  Utensils,
} from "lucide-react";
import LinkButton from "@/components/buttons/LinkButton";
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
        <LinkButton href="/gym" className="link-gym">
          {t("sessions.gym")}
          <Dumbbell size={18} />
        </LinkButton>
        <LinkButton href="/activities" className="link-activities">
          {t("sessions.activities")}
          <Activity size={18} />
        </LinkButton>
        <LinkButton href="/notes" className="link-notes">
          {t("sessions.notes")}
          <NotebookPen size={18} />
        </LinkButton>
        <LinkButton href="/timer" className="link-timer">
          {t("sessions.timer")}
          <Timer size={18} />
        </LinkButton>
        <LinkButton href="/weight" className="link-weight">
          {t("sessions.bodyWeight")}
          <Weight size={18} />
        </LinkButton>
        <LinkButton href="/todo" className="link-todo">
          {t("sessions.todoList")}
          <ListTodo size={18} />
        </LinkButton>
        <LinkButton href="/reminders" className="link-reminders">
          {t("sessions.reminders")}
          <Bell size={18} />
        </LinkButton>
        <LinkButton href="/habits" className="link-habits">
          {t("sessions.habits")}
          <Repeat size={18} />
        </LinkButton>
        <LinkButton href="/nutrition" className="link-nutrition">
          {t("sessions.nutrition")}
          <Utensils size={18} />
        </LinkButton>
      </div>
    </div>
  );
}
