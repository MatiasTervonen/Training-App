import { CirclePlay, CirclePause, RotateCcw } from "lucide-react-native";
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
import AnimatedButton from "../buttons/animatedButton";

type TimerProps = {
  className?: string;
  textClassName?: string;
  iconSize?: number;
  onStopAlarmSound?: () => void;
};

export default function Timer({
  className = "",
  textClassName = "",
  iconSize,
  onStopAlarmSound,
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
    resumeTimer,
    startTimestamp,
    stopTimer,
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
      <View className="items-center" style={{ width: screenWidth * 0.95 }}>
        <Animated.Text
          style={[
            {
              fontSize: 200,
              includeFontPadding: false,
            },
            animatedTextStyle,
          ]}
          className={`font-mono font-bold ${textClassName} `}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.1}
        >
          {formatTime(elapsedTime)}
        </Animated.Text>
      </View>

      {!alarmFired ? (
        isRunning ? (
          <TouchableOpacity onPress={handlePause} hitSlop={20}>
            <CirclePause color="#f3f4f6" size={iconSize} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStart} hitSlop={20}>
            <CirclePlay color="#f3f4f6" size={iconSize} />
          </TouchableOpacity>
        )
      ) : (
        <View className="flex-row  mt-10 gap-5">
          <View className="flex-1">
            <AnimatedButton
              label="Stop alarm"
              className="bg-red-600 border-2 border-red-400 py-2 px-4 shadow-md rounded-md items-center justify-center"
              textClassName="text-gray-100"
              onPress={() => {
                onStopAlarmSound?.();
              }}
            />
          </View>
          <View className="flex-1">
            <AnimatedButton
              label="Restart"
              onPress={() => {
                stopTimer();
                startTimer(totalDuration);
                setActiveSession({
                  type: "timer",
                  label: "Timer",
                  path: "/timer/empty-timer",
                });
              }}
              className="flex-row justify-center items-center gap-2 bg-blue-800 py-2 border-2 border-blue-500 rounded-md px-4"
              textClassName="text-gray-100"
            >
              <RotateCcw color="#f3f4f6" />
            </AnimatedButton>
          </View>
        </View>
      )}
    </View>
  );
}
