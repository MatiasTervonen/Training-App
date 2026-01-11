import { RotateCcw } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import AnimatedButton from "@/components/buttons/animatedButton";
import {
  cancelNativeAlarm,
  stopNativeAlarm,
  scheduleNativeAlarm,
} from "@/native/android/NativeAlarm";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { confirmAction } from "@/lib/confirmAction";

type TimerProps = {
  className?: string;
  textClassName?: string;
  onStopAlarmSound?: () => void;
};

export default function Timer({
  className = "",
  textClassName = "",
  onStopAlarmSound,
}: TimerProps) {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  const colorProgress = useSharedValue(0);

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      ["#f3f4f6", "#ef4444"] // gray-100 → red-500
    ),
  }));

  const {
    isRunning,
    startTimer,
    pauseTimer,
    alarmFired,
    setActiveSession,
    resumeTimer,
    startTimestamp,
    clearEverything,
    remainingMs,
    totalDuration,
    startSession,
    paused,
  } = useTimerStore();

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const handleStart = () => {
    setActiveSession({
      type: "stopwatch",
      label: "Stopwatch",
      path: "/timer/start-stopwatch",
    });

    if (paused) {
      resumeTimer("Stopwatch");
    } else {
      startSession("Stopwatch");
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const now = Date.now();

  const displaySeconds = isRunning
    ? Math.floor((now - startTimestamp!) / 1000)
    : Math.floor(remainingMs! / 1000);

  const timerWidth = isLandscape ? width : width * 0.95;
  const timerFontSize = isLandscape ? height * 0.6 : 200;

  const cancelTimer = async () => {
    const confirmCancel = await confirmAction({
      title: "Cancel Session",
      message: "Are you sure you want to cancel the session?",
    });

    if (!confirmCancel) return;

    clearEverything();
    AsyncStorage.removeItem("timer_session_draft");
    router.replace("/timer");
  };

  return (
    <View className={`items-center flex-col ${className}`}>
      <View className="items-center" style={{ width: timerWidth }}>
        <Animated.Text
          style={[
            {
              fontSize: timerFontSize,
              includeFontPadding: false,
              textAlign: "center",
            },
            animatedTextStyle,
          ]}
          className={`font-mono font-bold ${textClassName} `}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.1}
        >
          {formatTime(displaySeconds)}
        </Animated.Text>
      </View>

      {!alarmFired ? (
        isRunning ? (
          <View className="flex-row gap-5 w-full justify-center">
            <View className="w-1/3">
              <AnimatedButton
                onPress={cancelTimer}
                hitSlop={20}
                className="bg-red-600 border-2 border-red-400 py-2 px-4 shadow-md rounded-md items-center justify-center"
                textClassName="text-gray-100"
                label="Cancel"
              />
            </View>
            <View className="w-1/3">
              <AnimatedButton
                onPress={handlePause}
                hitSlop={20}
                className="flex-row justify-center items-center gap-2 bg-blue-800 py-2 border-2 border-blue-500 rounded-md px-4"
                textClassName="text-gray-100"
                label="Pause"
              />
            </View>
          </View>
        ) : (
          <View className="flex-row gap-5 w-full justify-center">
            <View className="w-1/3">
              <AnimatedButton
                onPress={cancelTimer}
                hitSlop={20}
                className="bg-red-600 border-2 border-red-400 py-2 px-4 shadow-md rounded-md items-center justify-center"
                textClassName="text-gray-100"
                label="Cancel"
              />
            </View>
            <View className="w-1/3">
              <AnimatedButton
                onPress={handleStart}
                hitSlop={20}
                className="flex-row justify-center items-center gap-2 bg-blue-800 py-2 border-2 border-blue-500 rounded-md px-4"
                textClassName="text-gray-100"
                label="Start"
              />
            </View>
          </View>
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
                stopNativeAlarm();
                cancelNativeAlarm("timer");
              }}
            />
          </View>
          <View className="flex-1">
            <AnimatedButton
              label="Restart"
              onPress={() => {
                if (!totalDuration) return;

                clearEverything();
                cancelNativeAlarm("timer");
                scheduleNativeAlarm(
                  Date.now() + totalDuration * 1000,
                  "timer",
                  "Timer",
                  "timer"
                );
                startTimer(totalDuration, "Timer");
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
