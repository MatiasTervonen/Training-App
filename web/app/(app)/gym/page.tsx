"use client";

import LinkButton from "@/components/buttons/LinkButton";
import { useTimerStore } from "@/lib/stores/timerStore";
import toast from "react-hot-toast";
import { List, ChartNoAxesCombined } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TrainingPage() {
  const { t } = useTranslation("gym");
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = (e: React.MouseEvent) => {
    if (activeSession && activeSession?.type !== "gym") {
      e.preventDefault();
      toast.error(
        `${t("gym.activeSessionError")} ${t("gym.activeSessionErrorSub")}`,
      );
      return;
    }
  };

  return (
    <div className="page-padding">
      <h1 className="text-2xl mb-10 text-center">{t("gym.title")}</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href={"/gym/gym"} onClick={handleClick}>
          {t("gym.startEmptyWorkout")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/create-template"}>
          {t("gym.createTemplate")}
        </LinkButton>
        <LinkButton href={"/gym/templates"}>{t("gym.templates")}</LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/add-exercise"}>
          {t("gym.addExercise")}
        </LinkButton>
        <LinkButton href={"/gym/edit-exercises"}>
          {t("gym.editExercise")}
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/workout-analytics"}>
          <p>{t("gym.workoutAnalytics")}</p>
          <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
        </LinkButton>
        <LinkButton href={"/gym/my-sessions"}>
          <p>{t("gym.mySessions.title")}</p>
          <List color="#f3f4f6" className="ml-2" />
        </LinkButton>
      </div>
    </div>
  );
}
