import { CirclePlay, CirclePause, RotateCcw } from "lucide-react-native";
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("timer");
  const { width } = useWindowDimensions();

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
    clearEverything,
    remainingMs,
    endTimestamp,
    totalDuration,
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
    if (!remainingMs) return;

    if (paused) {
      resumeTimer("Timer");
    } else {
      startTimer(remainingMs, "Timer");
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const now = Date.now();

  const remainingSeconds = Math.max(0, Math.ceil((endTimestamp! - now) / 1000));

  const displaySeconds = isRunning
    ? remainingSeconds
    : Math.ceil(remainingMs! / 1000);

  return (
    <View className={`items-center flex-col ${className}`}>
      <View className="items-center" style={{ width: width * 0.95 }}>
        <Animated.Text
          style={[
            {
              fontSize: 200,
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
          <AnimatedButton onPress={handlePause} hitSlop={20}>
            <CirclePause color="#f3f4f6" size={iconSize} />
          </AnimatedButton>
        ) : (
          <AnimatedButton onPress={handleStart} hitSlop={20}>
            <CirclePlay color="#f3f4f6" size={iconSize} />
          </AnimatedButton>
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
                  t("timer.title"),
                  "timer",
                  "",
                  t("timer.notification.tapToOpenTimer"),
                  t("timer.notification.timesUp"),
                  t("timer.notification.stopAlarm")
                );
                startTimer(totalDuration, "Timer");
                setActiveSession({
                  type: t("timer.title"),
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
