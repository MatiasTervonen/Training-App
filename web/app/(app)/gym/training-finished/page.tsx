"use client";

import Image from "next/image";
import LinkButton from "@/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function TrainingFinished() {
  const { t } = useTranslation("gym");

  return (
    <div className="h-full flex w-full bg-slate-800 page-padding">
      <div className="flex flex-col items-center justify-center gap-10 max-w-md mx-auto">
        <Image
          src="/Confetti.png"
          alt="Confetti"
          width={50}
          height={50}
          priority
        />
        <h1 className="text-lg">{t("gym.trainingFinished.congratulations")}</h1>

        <p className="text-center text-lg">
          {t("gym.trainingFinished.completed")}
        </p>
        <LinkButton href="/dashboard">{t("gym.trainingFinished.done")}</LinkButton>
      </div>
    </div>
  );
}
