import { CirclePlay, CirclePause } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import AppText from "./AppText";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

type TimerProps = {
  className?: string;
  manualSession?: ActiveSession;
  textClassName?: string;
  onPress?: () => void;
  onPause?: () => void;
  onStart?: () => void;
};

export default function Timer({
  className = "",
  manualSession,
  textClassName = "",
  onPress,
  onPause,
  onStart,
}: TimerProps) {
  const {
    elapsedTime,
    isRunning,
    startTimer,
    pauseTimer,
    totalDuration,
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!activeSession && manualSession) {
      setActiveSession(manualSession);
    }

    const isPaused = !isRunning && elapsedTime > 0 && startTimestamp === null;

    if (isPaused) {
      resumeTimer();
    } else {
      startTimer(totalDuration);
    }

    onStart?.();
  };

  const handlePause = () => {
    pauseTimer();
    onPause?.();
  };

  return (
    <View className={`flex-row gap-2 items-center ${className}`}>
      <View className="items-center">
        <AppText className={`font-mono font-bold ${textClassName} `}>
          {formatTime(elapsedTime)}
        </AppText>
      </View>
      {isRunning ? (
        <TouchableOpacity
          onPress={() => {
            onPress?.();
            handlePause();
          }}
          hitSlop={20}
        >
          <CirclePause color="#f3f4f6" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            onPress?.();
            handleStart();
          }}
          hitSlop={20}
        >
          <CirclePlay color="#f3f4f6" />
        </TouchableOpacity>
      )}
    </View>
  );
}
