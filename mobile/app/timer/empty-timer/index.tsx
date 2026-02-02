import { Pressable, View, Keyboard, DeviceEventEmitter } from "react-native";
import AppText from "@/components/AppText";
import NumberInput from "@/components/NumberInput";
import { AlarmClock, CircleX } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import AnimatedButton from "@/components/buttons/animatedButton";
import Animated from "react-native-reanimated";
import Timer from "@/Features/timer/timer";
import {
  scheduleNativeAlarm,
  stopNativeAlarm,
} from "@/native/android/NativeAlarm";
import { useAudioPlayer } from "expo-audio";
import { formatDurationLong } from "@/lib/formatDate";
import useRotation from "@/Features/timer/hooks/useRotation";
import { confirmAction } from "@/lib/confirmAction";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation("timer");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [skipPlaying, setSkipPlaying] = useState(false);

  const audioSource = require("@/assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource);

  const { isLandscape } = useRotation();

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

  const handleReset = async () => {
    setAlarmMinutes("");
    setAlarmSeconds("");
  };

  const minutes = parseInt(alarmMinutes) || 0;
  const seconds = parseInt(alarmSeconds) || 0;
  const totalDurationInSeconds = minutes * 60 + seconds;
  const totalDurationMs = (totalDuration ?? 0) * 1000;

  const handleStartTimer = () => {
    if (minutes === 0 && seconds === 0) {
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
      label: "Timer",
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
      t("timer.notification.stopAlarm")
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

  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        handleStopTimer();
      }}
      className="flex-1"
    >
      <View className="flex-1 px-4">
        {hasSessionStarted ? (
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
              <View className="w-full bg-gray-300 h-6 rounded-full overflow-hidden mt-4">
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
        ) : (
          <View className="flex-1 justify-between max-w-lg mx-auto w-full mt-5 mb-5">
            <View className="gap-5 flex-row justify-center items-center">
              <AppText className="text-2xl text-center">
                {t("timer.title")}
              </AppText>
              <AlarmClock color="#d1d5db" size={30} />
            </View>
            <View
              className={`gap-10 mb-5 px-10 justify-center items-center ${
                isLandscape ? "flex-row px-0 gap-5" : "flex-col"
              }`}
            >
              <View className={`${isLandscape ? "w-1/2" : "w-full"}`}>
                <NumberInput
                  label={t("timer.minutes")}
                  placeholder="0 min"
                  value={alarmMinutes}
                  onChangeText={(value) => setAlarmMinutes(value)}
                />
              </View>
              <View className={`${isLandscape ? "w-1/2" : "w-full"}`}>
                <NumberInput
                  label={t("timer.seconds")}
                  placeholder="0 sec"
                  value={alarmSeconds}
                  onChangeText={(value) => setAlarmSeconds(value)}
                />
              </View>
            </View>
            <View
              className={`justify-center gap-5 items-center ${
                isLandscape ? "flex-row" : "flex-col"
              }`}
            >
              <View className={`${isLandscape ? "w-1/2" : "w-full"}`}>
                <AnimatedButton
                  label={t("timer.start")}
                  onPress={handleStartTimer}
                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500"
                  textClassName="text-gray-100 text-center"
                />
              </View>
              <View className={`${isLandscape ? "w-1/2" : "w-full pb-5"}`}>
                <AnimatedButton
                  label={t("timer.clear")}
                  onPress={handleReset}
                  className=" bg-red-600 border-2 border-red-400 py-2 shadow-md rounded-md"
                  textClassName="text-gray-100 text-center"
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
