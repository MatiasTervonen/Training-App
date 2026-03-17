import { Pressable, View, DeviceEventEmitter } from "react-native";
import AppText from "@/components/AppText";
import { AlarmClock, CircleX } from "lucide-react-native";
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

export default function SettingsScreen() {
  const { t } = useTranslation("timer");
  const [pickerDuration, setPickerDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [skipPlaying, setSkipPlaying] = useState(false);

  const confirmAction = useConfirmAction();
  const { isLandscape } = useRotation();

  const audioSource = require("@/assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource);

  const {
    setAlarmFired,
    setActiveSession,
    startTimer,
    remainingMs,
    mode,
    startTimestamp,
    endTimestamp,
    isRunning,
    alarmFired,
    setAlarmSoundPlaying,
    alarmSoundPlaying,
    totalDuration,
    clearEverything,
  } = useTimerStore();

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
    router.replace("/timer/empty-timer");
  };

  const hasSessionStarted = remainingMs !== null || startTimestamp !== null;

  const now = Date.now();

  const remainingMSLive = isRunning
    ? Math.max(0, Math.floor(endTimestamp! - now))
    : remainingMs;

  useEffect(() => {
    if (alarmSoundPlaying && !skipPlaying) {
      player.seekTo(0);
      player.play();
      player.loop = true;
    } else {
      player.pause();
      player.seekTo(0);
    }
  }, [alarmSoundPlaying, player, skipPlaying]);

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
      {hasSessionStarted ? (
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
              <AnimatedButton hitSlop={10} onPress={cancelTimer}>
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
            className="btn-base py-2"
            textClassName="text-gray-100 text-center"
          />
        </View>
      )}
    </View>
  );
}
