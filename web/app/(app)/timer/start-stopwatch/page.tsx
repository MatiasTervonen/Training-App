"use client";

import { useTranslation } from "react-i18next";
import Stopwatch from "@/features/timer/components/stopwatch";

export default function StartStopwatchPage() {
  const { t } = useTranslation("timer");

  return (
    <div className="flex flex-col h-full page-padding">
      <div>
        <p className="text-center text-xl text-gray-300">
          {t("timer.stopwatchTitle")}
        </p>

        <Stopwatch
          className={`flex-col items-center justify-center w-full`}
        />
      </div>
    </div>
  );
}
