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
import { startNativeTimer } from "@/native/android/NativeTimer";
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
      ["#f3f4f6", "#ef4444"], // gray-100 → red-500
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
        true,
      );
    } else {
      colorProgress.value = withTiming(0, { duration: 300 });
    }
  }, [alarmFired, colorProgress]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
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
        <View className="flex-row gap-5">
          <View className="flex-1">
            <AnimatedButton
              label="Stop alarm"
              className="btn-danger"
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
                  t("timer.notification.stopAlarm"),
                  t("timer.notification.extendTimer"),
                );
                startTimer(totalDuration, "Timer");
                setActiveSession({
                  type: t("timer.title"),
                  label: "Timer",
                  path: "/timer/empty-timer",
                });
              }}
              className="btn-base flex-row gap-2 justify-center items-center"
              textClassName="text-gray-100"
            >
              <RotateCcw color="#f3f4f6" />
            </AnimatedButton>
          </View>
          <View className="flex-1">
            <AnimatedButton
              label={t("timer.notification.extendTimer")}
              onPress={() => {
                onStopAlarmSound?.();
                stopNativeAlarm();

                const snoozeDuration = 60;
                const newEndTimestamp = Date.now() + snoozeDuration * 1000;

                cancelNativeAlarm("timer");
                scheduleNativeAlarm(
                  newEndTimestamp,
                  "timer",
                  t("timer.title"),
                  "timer",
                  "",
                  t("timer.notification.tapToOpenTimer"),
                  t("timer.notification.timesUp"),
                  t("timer.notification.stopAlarm"),
                  t("timer.notification.extendTimer"),
                );

                startNativeTimer(
                  newEndTimestamp,
                  t("timer.title"),
                  "countdown",
                  t("timer.notification.timeRemaining"),
                );

                useTimerStore
                  .getState()
                  .snoozedTimer(newEndTimestamp, snoozeDuration);
              }}
              className="btn-neutral"
              textClassName="text-gray-100"
            />
          </View>
        </View>
      )}
    </View>
  );
}
