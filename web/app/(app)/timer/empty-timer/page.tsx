"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SetInput from "@/features/gym/components/SetInput";
import Timer from "@/features/timer/components/timer";
import { CircleX } from "lucide-react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { AlarmClock } from "lucide-react";
import {
  playAlarmAudio,
  stopAlarmAudio,
} from "@/features/timer/components/alarmAudio";
import BaseButton from "@/components/buttons/BaseButton";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";

export default function TimerPage() {
  const { t } = useTranslation("timer");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const router = useRouter();

  const {
    totalDuration,
    elapsedTime,
    alarmSoundPlaying,
    setAlarmFired,
    setActiveSession,
    startTimer,
    setAlarmSoundPlaying,
    clearEverything,
  } = useTimerStore();

  const clear = () => {
    setAlarmMinutes("");
    setAlarmSeconds("");
  };

  const cancelTimer = () => {
    const confirmCancel = confirm(t("timer.cancelTimerMessage"));
    if (!confirmCancel) return;

    setIsCancelling(true);

    stopAlarmAudio();
    clearEverything();
    localStorage.removeItem("timer_session_draft");
    clear();
    router.replace("/timer");
  };

  const now = formatDateShort(new Date());

  const handleStartTimer = () => {
    setActiveSession({
      type: t("timer.title"),
      label: `${t("timer.title")} - ${now}`,
      path: "/timer/empty-timer",
    });

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;

    if (minutes === 0 && seconds === 0) {
      alert(t("timer.setDurationError"));
      return;
    }

    const totalSeconds = minutes * 60 + seconds;

    setAlarmFired(false);
    startTimer(totalSeconds);
  };

  const handleStopTimer = () => {
    setAlarmSoundPlaying(false);
    stopAlarmAudio();
  };

  useEffect(() => {
    if (alarmSoundPlaying) {
      playAlarmAudio();
    } else {
      stopAlarmAudio();
    }
  }, [alarmSoundPlaying]);

  const showTimerUI = isCancelling || totalDuration > 0;

  return (
    <>
      {showTimerUI ? (
        <div
          onClick={() => {
            if (alarmSoundPlaying) {
              handleStopTimer();
            }
          }}
        >
          <div className="flex flex-col h-full page-padding">
            <div>
              <p className="text-center text-xl text-gray-300">
                {Math.floor(totalDuration / 60)} {t("timer.minAbbr")}{" "}
                {totalDuration % 60} {t("timer.secAbbr")}
              </p>

              <Timer
                className={`flex-col items-center justify-center w-full  ${
                  elapsedTime >= totalDuration
                    ? "animate-pulse text-red-500"
                    : ""
                }`}
              />

              <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden mt-5">
                <div
                  className="h-full bg-green-500 transition-all duration-100 ease-in-out"
                  style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <button>
            <CircleX
              className="absolute top-5 right-5 text-gray-300 hover:text-red-500 hover:scale-105 transition-transform duration-200 cursor-pointer"
              size={30}
              onClick={cancelTimer}
            />
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto flex flex-col page-padding justify-between h-full">
          <div className="flex justify-center items-center gap-5">
            <h1 className="text-2xl text-center">{t("timer.title")}</h1>
            <AlarmClock color="#d1d5db" size={30} />
          </div>
          <div className="flex flex-col items-center justify-center gap-4 mb-5">
            <div>
              <SetInput
                label={t("timer.minutes")}
                placeholder={`0 ${t("timer.minAbbr")}`}
                value={alarmMinutes}
                type="number"
                min={0}
                onChange={(e) => setAlarmMinutes(e.target.value)}
              />
            </div>
            <div>
              <SetInput
                label={t("timer.seconds")}
                placeholder={`0 ${t("timer.secAbbr")}`}
                value={alarmSeconds}
                type="number"
                min={0}
                onChange={(e) => setAlarmSeconds(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <BaseButton
              onClick={handleStartTimer}
              label={t("timer.startTimer")}
            />
            <DeleteSessionBtn
              confirm={false}
              label={t("timer.clear")}
              onDelete={clear}
            />
          </div>
        </div>
      )}
    </>
  );
}
