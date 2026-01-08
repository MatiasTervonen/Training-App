import { CirclePlay, CirclePause } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import AppText from "@/components/AppText";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

type TimerProps = {
  className?: string;
  color?: string;
  manualSession?: ActiveSession;
  textClassName?: string;
  onPress?: () => void;
  onPause?: () => void;
  onStart?: () => void;
};

export default function Timer({
  className = "",
  color = "#f3f4f6",
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

    const label = activeSession?.label || "Session";
    if (isRunning && startTimestamp) {
      resumeTimer(label);
    }
  }, [resumeTimer, activeSession]);

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

    const label = activeSession?.label || "Session";
    const isPaused = !isRunning && elapsedTime > 0 && startTimestamp === null;

    if (isPaused) {
      resumeTimer(label);
    } else {
      startTimer(totalDuration, label);
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
          <CirclePause color={color} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            onPress?.();
            handleStart();
          }}
          hitSlop={20}
        >
          <CirclePlay color={color} />
        </TouchableOpacity>
      )}
    </View>
  );
}
