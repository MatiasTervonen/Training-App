import { CirclePlay, CirclePause } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect, useRef } from "react";
import { View, TouchableOpacity, AppState, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

type TimerProps = {
  className?: string;
  buttonsAlwaysVisible?: boolean;
  manualSession?: ActiveSession;
  textClassName?: string;
  fullWidth?: boolean;
  fontSize?: number;
  iconSize?: number;
};

export default function Timer({
  buttonsAlwaysVisible = false,
  className = "",
  manualSession,
  textClassName = "",
  fullWidth = false,
  fontSize,
  iconSize,
}: TimerProps) {
  const screenWidth = Dimensions.get("window").width;

  const appState = useRef(AppState.currentState);

  const colorProgress = useSharedValue(0);

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      ["#f3f4f6", "#ef4444"] // gray-100 → red-500
    ),
  }));

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
    if (alarmFired) {
      // Pulse between 0 and 1 repeatedly (color loop)
      colorProgress.value = withRepeat(
        withTiming(1, { duration: 500 }),
        -1,
        true
      );
    } else {
      colorProgress.value = withTiming(0, { duration: 300 });
    }
  }, [alarmFired, colorProgress]);

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
    <View className={`flex-row gap-2 items-center ${className}`}>
      <View style={{ width: fullWidth ? screenWidth * 0.95 : "auto" }}>
        <Animated.Text
          style={[{ fontSize: fullWidth ? 200 : fontSize }, animatedTextStyle]}
          className={`font-mono  font-bold  ${textClassName}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.1}
        >
          {formatTime(elapsedTime)}
        </Animated.Text>
      </View>
      {(buttonsAlwaysVisible ||
        !(alarmFired || (totalDuration > 0 && elapsedTime >= totalDuration))) &&
        (isRunning ? (
          <TouchableOpacity onPress={handlePause} hitSlop={20}>
            <CirclePause color="#f3f4f6" size={iconSize} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStart} hitSlop={20}>
            <CirclePlay color="#f3f4f6" size={iconSize} />
          </TouchableOpacity>
        ))}
    </View>
  );
}
