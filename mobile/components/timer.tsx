import { CirclePlay, CirclePause } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
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
};

export default function Timer({
  className = "",
  color = "#f3f4f6",
  manualSession,
  textClassName = "",
}: TimerProps) {
  const {
    isRunning,
    startSession,
    pauseTimer,
    setActiveSession,
    activeSession,
    resumeTimer,
    startTimestamp,
    remainingMs,
    endTimestamp,
    mode,
  } = useTimerStore();

  const handleStart = () => {
    if (!activeSession && manualSession) {
      setActiveSession(manualSession);
    }

    const label = activeSession?.label || "Session";
    const isPaused = !isRunning && startTimestamp === null && remainingMs;

    if (isPaused) {
      resumeTimer(label);
    } else {
      startSession(label);
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const now = Date.now();

  const remainingSeconds = Math.max(0, Math.ceil((endTimestamp! - now) / 1000));

  const displaySeconds =
    mode === "countdown"
      ? isRunning
        ? remainingSeconds
        : Math.ceil(remainingMs! / 1000)
      : isRunning
        ? Math.floor((now - startTimestamp!) / 1000)
        : Math.floor(remainingMs! / 1000);

  return (
    <View className={`flex-row gap-2 items-center ${className}`}>
      <View className="items-center">
        <AppText className={`font-mono font-bold ${textClassName} `}>
          {formatTime(displaySeconds)}
        </AppText>
      </View>
      {isRunning ? (
        <TouchableOpacity onPress={handlePause} hitSlop={20}>
          <CirclePause color={color} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleStart} hitSlop={20}>
          <CirclePlay color={color} />
        </TouchableOpacity>
      )}
    </View>
  );
}
