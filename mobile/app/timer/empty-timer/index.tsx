import { Pressable, View, DeviceEventEmitter } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { AlarmClock, CircleX, Check } from "lucide-react-native";
import { Confetti } from "react-native-fast-confetti";
import { TimerPicker } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import AnimatedButton from "@/components/buttons/animatedButton";
import Animated from "react-native-reanimated";
import Timer from "@/features/timer/timer";
import {
  scheduleNativeAlarm,
  stopNativeAlarm,
} from "@/native/android/NativeAlarm";
import { useAudioPlayer } from "expo-audio";
import { formatDurationLong } from "@/lib/formatDate";
import { useConfirmAction } from "@/lib/confirmAction";
import useRotation from "@/features/timer/hooks/useRotation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useHabitTimer } from "@/features/habits/hooks/useHabitTimer";

export default function SettingsScreen() {
  const { t } = useTranslation("timer");
  const [pickerDuration, setPickerDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [skipPlaying, setSkipPlaying] = useState(false);

  const confirmAction = useConfirmAction();
  const { isLandscape } = useRotation();

  const audioSource = require("@/assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource);

  const setAlarmFired = useTimerStore((s) => s.setAlarmFired);
  const setActiveSession = useTimerStore((s) => s.setActiveSession);
  const startTimer = useTimerStore((s) => s.startTimer);
  const remainingMs = useTimerStore((s) => s.remainingMs);
  const mode = useTimerStore((s) => s.mode);
  const startTimestamp = useTimerStore((s) => s.startTimestamp);
  const endTimestamp = useTimerStore((s) => s.endTimestamp);
  const isRunning = useTimerStore((s) => s.isRunning);
  const alarmFired = useTimerStore((s) => s.alarmFired);
  const setAlarmSoundPlaying = useTimerStore((s) => s.setAlarmSoundPlaying);
  const alarmSoundPlaying = useTimerStore((s) => s.alarmSoundPlaying);
  const totalDuration = useTimerStore((s) => s.totalDuration);
  const clearEverything = useTimerStore((s) => s.clearEverything);
  const activeSession = useTimerStore((s) => s.activeSession);
  useTimerStore((s) => (s.isRunning ? s.uiTick : 0));

  const isHabitSession = activeSession?.type === "habit";
  const completionSound = useAudioPlayer(
    require("@/assets/audio/freesound_community-bell-ringing-ii-98323.mp3"),
  );
  const { cancelHabitTimer } = useHabitTimer();

  const handleReset = () => {
    setPickerDuration({ hours: 0, minutes: 0, seconds: 0 });
  };

  const totalDurationInSeconds =
    pickerDuration.hours * 3600 + pickerDuration.minutes * 60 + pickerDuration.seconds;
  const totalDurationMs = (totalDuration ?? 0) * 1000;

  const handleStartTimer = () => {
    if (totalDurationInSeconds === 0) {
      Toast.show({
        type: "error",
        text1: t("timer.setDurationError"),
      });
      return;
    }

    setAlarmFired(false);
    startTimer(totalDurationInSeconds, t("timer.title"));

    setActiveSession({
      type: t("timer.title"),
      label: t("timer.title"),
      path: "/timer/empty-timer",
    });

    scheduleNativeAlarm(
      Date.now() + totalDurationInSeconds * 1000,
      "timer",
      t("timer.title"),
      "timer",
      "",
      t("timer.notification.tapToOpenTimer"),
      t("timer.notification.timesUp"),
      t("timer.notification.stopAlarm"),
      t("timer.notification.extendTimer"),
    );
  };

  const cancelTimer = async () => {
    if (isHabitSession) {
      const confirmed = await cancelHabitTimer();
      if (!confirmed) return;
      if (player) {
        try { player.pause(); player.seekTo(0); } catch {}
      }
      router.replace("/dashboard");
      handleReset();
      return;
    }

    const confirmCancel = await confirmAction({
      title: t("timer.cancelTimerTitle"),
      message: t("timer.cancelTimerMessage"),
    });
    if (!confirmCancel) return;

    if (player) {
      try {
        player.pause();
        player.seekTo(0);
      } catch (error) {
        console.error("Error stopping audio player:", error);
      }
    }

    clearEverything();
    AsyncStorage.removeItem("timer_session_draft");
    handleReset();
  };

  const hasSessionStarted = remainingMs !== null || startTimestamp !== null;

  const now = Date.now();

  const remainingMSLive = isRunning
    ? Math.max(0, Math.floor(endTimestamp! - now))
    : remainingMs;

  useEffect(() => {
    if (alarmSoundPlaying && !skipPlaying && !isHabitSession) {
      player.seekTo(0);
      player.play();
      player.loop = true;
    } else {
      player.pause();
      player.seekTo(0);
    }
  }, [alarmSoundPlaying, player, skipPlaying, isHabitSession]);

  // Play completion chime for habit timers
  useEffect(() => {
    if (isHabitSession && alarmFired && completionSound) {
      completionSound.seekTo(0);
      completionSound.play();
    }
  }, [isHabitSession, alarmFired, completionSound]);

  const handleStopTimer = async () => {
    setAlarmSoundPlaying(false);
    stopNativeAlarm();
    if (player) {
      try {
        player.pause();
        player.seekTo(0);
      } catch (error) {
        console.error("Error stopping audio player:", error);
      }
    }
  };

  // Listen for STOP_ALARM_SOUND event from native (when notification is tapped)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("STOP_ALARM_SOUND", () => {
      handleStopTimer();
      setSkipPlaying(true);
    });

    return () => {
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for TIMER_SNOOZED event from native (when snooze is tapped)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "TIMER_SNOOZED",
      (event: { endTimestamp: number; durationSeconds: number }) => {
        if (player) {
          try {
            player.pause();
            player.seekTo(0);
          } catch (error) {
            console.error("Error stopping audio player:", error);
          }
        }
        setSkipPlaying(false);
        useTimerStore
          .getState()
          .snoozedTimer(event.endTimestamp, event.durationSeconds);
      },
    );

    return () => {
      sub.remove();
    };
  }, [player]);

  return (
    <View className="flex-1 px-4">
      {isHabitSession && alarmFired ? (
        <View className="flex-1 items-center justify-center">
          <View className="absolute inset-0 pointer-events-none">
            <Confetti />
          </View>
          <View className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 items-center justify-center mb-6">
            <Check size={40} color="#22c55e" />
          </View>
          <AppText className="text-2xl text-center mb-2">
            {activeSession?.label}
          </AppText>
          <BodyText className="text-green-400 text-lg">
            {t("timer.habitCompleted", { defaultValue: "Completed!" })}
          </BodyText>
        </View>
      ) : hasSessionStarted ? (
        <Pressable
          onPress={handleStopTimer}
          className="flex-1"
        >
          <View className="flex-1 items-center">
            {mode === "countdown" && totalDuration && (
              <AppText className="text-gray-300 text-xl mt-5">
                {formatDurationLong(totalDuration)}
              </AppText>
            )}
            <Timer
              iconSize={40}
              onStopAlarmSound={() => setAlarmSoundPlaying(false)}
            />
            {mode === "countdown" && !alarmFired && (
              <View className="w-full bg-gray-700 h-6 rounded-full overflow-hidden mt-4">
                <Animated.View
                  className=" bg-green-500 h-6 w-full"
                  style={{
                    width: `${(remainingMSLive! / totalDurationMs) * 100}%`,
                  }}
                ></Animated.View>
              </View>
            )}

            <View className="absolute top-5 right-5" hitSlop={10}>
              <AnimatedButton hitSlop={10} onPress={isHabitSession ? cancelHabitTimer : cancelTimer}>
                <CircleX color="#d1d5db" size={30} />
              </AnimatedButton>
            </View>
          </View>
        </Pressable>
      ) : (
        <View className="flex-1 justify-between max-w-lg mx-auto w-full mt-2 mb-4">
          <View className="flex-row justify-center items-center gap-3">
            <AppText className="text-2xl text-center">
              {t("timer.title")}
            </AppText>
            <AlarmClock color="#d1d5db" size={30} />
          </View>
          <View className={`items-center bg-slate-800/60 rounded-2xl border border-slate-700/50 px-2 ${isLandscape ? "py-1" : "py-4"}`}>
            <TimerPicker
              onDurationChange={setPickerDuration}
              LinearGradient={LinearGradient}
              padWithNItems={isLandscape ? 1 : 2}
              hourLabel={t("timer.h")}
              minuteLabel={t("timer.m")}
              secondLabel={t("timer.s")}
              pickerFeedback={() =>
                Haptics.selectionAsync()
              }
              styles={{
                theme: "dark",
                backgroundColor: "transparent",
                pickerItem: {
                  fontSize: isLandscape ? 20 : 28,
                  color: "#94a3b8",
                },
                selectedPickerItem: {
                  fontSize: isLandscape ? 26 : 34,
                  color: "#f1f5f9",
                },
                pickerLabel: {
                  fontSize: isLandscape ? 11 : 14,
                  color: "#64748b",
                  marginTop: 0,
                },
                pickerContainer: {
                  marginRight: 6,
                },
              }}
            />
          </View>
          <AnimatedButton
            label={t("timer.start")}
            onPress={handleStartTimer}
            className="btn-start"
          />
        </View>
      )}
    </View>
  );
}
