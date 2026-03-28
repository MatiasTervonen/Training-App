"use client";

import LinkButton from "@/components/buttons/LinkButton";
import { List, ChartNoAxesCombined } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TrainingPage() {
  const { t } = useTranslation("gym");

  return (
    <div className="page-padding">
      <h1 className="text-2xl mb-10 text-center">{t("gym.title")}</h1>
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        <LinkButton href={"/gym/create-template"} className="link-gym">
          {t("gym.createTemplate")}
        </LinkButton>
        <LinkButton href={"/gym/templates"} className="link-gym">
          {t("gym.templates")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/add-exercise"} className="link-gym">
          {t("gym.addExercise")}
        </LinkButton>
        <LinkButton href={"/gym/edit-exercises"} className="link-gym">
          {t("gym.editExercise")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/workout-analytics"} className="link-gym">
          <p>{t("gym.workoutAnalytics")}</p>
          <ChartNoAxesCombined color="#3b82f6" className="ml-2" />
        </LinkButton>
        <LinkButton href={"/gym/my-sessions"} className="link-gym">
          <p>{t("gym.mySessions.title")}</p>
          <List color="#3b82f6" className="ml-2" />
        </LinkButton>
      </div>
    </div>
  );
}
