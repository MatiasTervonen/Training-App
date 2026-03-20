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
import * as Haptics from "expo-haptics";
import { formatDurationLong } from "@/lib/formatDate";

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

  const isRunning = useTimerStore((s) => s.isRunning);
  const startTimer = useTimerStore((s) => s.startTimer);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const alarmFired = useTimerStore((s) => s.alarmFired);
  const setActiveSession = useTimerStore((s) => s.setActiveSession);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const clearEverything = useTimerStore((s) => s.clearEverything);
  const remainingMs = useTimerStore((s) => s.remainingMs);
  const endTimestamp = useTimerStore((s) => s.endTimestamp);
  const totalDuration = useTimerStore((s) => s.totalDuration);
  const paused = useTimerStore((s) => s.paused);
  const activeSession = useTimerStore((s) => s.activeSession);

  const isHabitSession = activeSession?.type === "habit";

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

  const handleStart = () => {
    if (!remainingMs) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (paused) {
      resumeTimer(t("timer.title"));
    } else {
      startTimer(remainingMs, t("timer.title"));
    }
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          {formatDurationLong(displaySeconds)}
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
        <View className="flex-row gap-3 justify-center">
          <View className={isHabitSession ? "w-1/2" : "flex-1"}>
            <AnimatedButton
              label={t("timer.notification.stopAlarm")}
              className="btn-danger"
              onPress={() => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                onStopAlarmSound?.();
                stopNativeAlarm();
                cancelNativeAlarm("timer");
              }}
            />
          </View>
          {!isHabitSession && (
            <>
              <View className="flex-1">
                <AnimatedButton
                  label={t("timer.notification.restart")}
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
                    startTimer(totalDuration, t("timer.title"));
                    setActiveSession({
                      type: t("timer.title"),
                      label: t("timer.title"),
                      path: "/timer/empty-timer",
                    });
                  }}
                  className="btn-base flex-row gap-2 justify-center items-center"
                >
                  <RotateCcw size={20} color="#f3f4f6" />
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
                      t("timer.notification.pauseTimer"),
                      t("timer.notification.extendTimer"),
                    );

                    useTimerStore
                      .getState()
                      .snoozedTimer(newEndTimestamp, snoozeDuration);
                  }}
                  className="btn-neutral"
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}
