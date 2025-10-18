"use client";

import { CirclePlay, CirclePause } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect, useRef } from "react";
import { View, TouchableOpacity, AppState } from "react-native";
import AppText from "./AppText";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

type TimerProps = {
  className?: string;
  buttonsAlwaysVisible?: boolean;
  manualSession?: ActiveSession;
};

export default function Timer({
  buttonsAlwaysVisible = false,
  className = "",
  manualSession,
}: TimerProps) {
  const appState = useRef(AppState.currentState);

  const {
    elapsedTime,
    isRunning,
    startTimer,
    pauseTimer,
    totalDuration,
    alarmFired,
    setActiveSession,
    activeSession,
    resumeTimer,
    startTimestamp,
  } = useTimerStore();

  useEffect(() => {
    const { isRunning, startTimestamp } = useTimerStore.getState();

    if (isRunning && startTimestamp) {
      resumeTimer();
    }
  }, [resumeTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const { isRunning, startTimestamp } = useTimerStore.getState();
        if (isRunning && startTimestamp) {
          resumeTimer();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [resumeTimer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (buttonsAlwaysVisible && !activeSession && manualSession) {
      setActiveSession(manualSession);
    }

    const isPaused = !isRunning && elapsedTime > 0 && startTimestamp === null;

    if (isPaused) {
      resumeTimer();
    } else {
      startTimer(totalDuration);
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  return (
    <View className={`flex-row items-center justify-center gap-2 ${className}`}>
      <AppText className="font-mono font-bold text-lg">
        {formatTime(elapsedTime)}
      </AppText>
      {(buttonsAlwaysVisible ||
        !(alarmFired || (totalDuration > 0 && elapsedTime >= totalDuration))) &&
        (isRunning ? (
          <TouchableOpacity onPress={handlePause}>
            <CirclePause color="#f3f4f6" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStart}>
            <CirclePlay color="#f3f4f6" />
          </TouchableOpacity>
        ))}
    </View>
  );
}
