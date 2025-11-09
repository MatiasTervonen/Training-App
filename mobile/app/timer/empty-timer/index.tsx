import {
  Pressable,
  View,
  Keyboard,
} from "react-native";
import AppText from "@/components/AppText";
import NumberInput from "@/components/NumberInput";
import { CircleX, RotateCcw, AlarmClock } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import { confirmAction } from "@/lib/confirmAction";
import { useAudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError } from "@/utils/handleError";
import { useDebouncedCallback } from "use-debounce";
import Timer from "@/components/timer";
import AnimatedButton from "@/components/buttons/animatedButton";
import Animated from "react-native-reanimated";
import * as ScreenOrientation from "expo-screen-orientation";

export default function SettingsScreen() {
  const [timerTitle, setTimerTitle] = useState("");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [orieantation, setOrientation] =
    useState<ScreenOrientation.Orientation | null>(null);

  const audioSource = require("@/assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource);

  useEffect(() => {
    const getOrientation = async () => {
      const orientation = await ScreenOrientation.getOrientationAsync();
      setOrientation(orientation);
    };
    getOrientation();

    // Subscribe to orientation changes
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        setOrientation(event.orientationInfo.orientation);
      }
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  const isLandscape =
    orieantation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orieantation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

  useEffect(() => {
    const loadfDraft = async () => {
      try {
        const draftString = await AsyncStorage.getItem("timer_session_draft");
        if (draftString) {
          const draft = JSON.parse(draftString);
          setTimerTitle(draft.title || "");
          setNotes(draft.notes || "");
          if (draft.durationInSeconds) {
            setAlarmMinutes(
              Math.floor(draft.durationInSeconds / 60).toString()
            );
            setAlarmSeconds((draft.durationInSeconds % 60).toString());
          }
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading timer draft",
          route: "timer/empty-timer",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadfDraft();
  }, []);

  const saveTimerDraft = useDebouncedCallback(async () => {
    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;
    const draft = {
      title: timerTitle,
      notes,
      durationInSeconds: totalSeconds,
    };
    await AsyncStorage.setItem("timer_session_draft", JSON.stringify(draft));
  }, 1000);

  useEffect(() => {
    if (!isLoaded) return;
    saveTimerDraft();
  }, [timerTitle, alarmMinutes, alarmSeconds, notes, isLoaded, saveTimerDraft]);

  const {
    totalDuration,
    elapsedTime,
    alarmFired,
    setAlarmFired,
    setActiveSession,
    stopTimer,
    startTimer,
  } = useTimerStore();

  const handleReset = async () => {
    stopTimer();
    setTimerTitle("");
    setAlarmMinutes("");
    setAlarmSeconds("");
    setNotes("");
  };

  const cancelTimer = async () => {
    const confirmCancel = await confirmAction({
      title: "Cancel Timer",
      message: "Are you sure you want to cancel the timer?",
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

    const { setActiveSession, stopTimer } = useTimerStore.getState();

    setActiveSession(null);
    stopTimer();
    AsyncStorage.removeItem("timer_session_draft");
    setTimerTitle("");
    setAlarmMinutes("");
    setAlarmSeconds("");
    setNotes("");
  };

  const handleStartTimer = () => {
    setActiveSession({
      type: "timer",
      label: timerTitle,
      path: "/timer/empty-timer",
    });

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;

    if (minutes === 0 && seconds === 0) {
      Toast.show({
        type: "error",
        text1: "Please set a duration for the timer.",
      });
      return;
    }

    const totalSeconds = minutes * 60 + seconds;

    startTimer(totalSeconds);
  };

  const restartTimer = () => {
    player.seekTo(0);
    player.pause();
    setAlarmFired(false);
    stopTimer();
    handleStartTimer();
  };

  useEffect(() => {
    if (alarmFired) {
      player.seekTo(0);
      player.play();
      player.loop = true;
    }
  }, [alarmFired, player]);

  const showTimerUI = totalDuration > 0;

  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        if (alarmFired) {
          player.seekTo(0);
          player.pause();
          setAlarmFired(false);
        }
      }}
      className="flex-1"
    >
      {showTimerUI ? (
        <View className="flex-1 items-center justify-center px-10">
          <AppText className="text-gray-300 text-xl mt-5">
            {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
          </AppText>
          <Timer fullWidth className="flex-col" iconSize={40} />
          {elapsedTime < totalDuration && (
            <View className="w-full bg-gray-300 h-6 rounded-full overflow-hidden mt-4">
              <Animated.View
                className=" bg-green-500 h-6 w-full"
                style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
              ></Animated.View>
            </View>
          )}

          {elapsedTime >= totalDuration && (
            <View className="flex-row  mt-10 gap-5">
              <View className="flex-1">
                <AnimatedButton
                  label="Stop alarm"
                  className="bg-red-600 border-2 border-red-400 py-2 px-4 shadow-md rounded-md items-center justify-center"
                  onPress={() => {
                    player.pause();
                    setAlarmFired(false);
                  }}
                />
              </View>
              <View className="flex-1">
                <AnimatedButton
                  label="Restart"
                  onPress={restartTimer}
                  className="flex-row justify-center items-center gap-2 bg-blue-800 py-2 border-2 border-blue-500 rounded-md px-4"
                >
                  <RotateCcw color="#f3f4f6" />
                </AnimatedButton>
              </View>
            </View>
          )}
          <View className="absolute top-5 right-5" hitSlop={10}>
            <AnimatedButton hitSlop={10} onPress={cancelTimer}>
              <CircleX color="#d1d5db" size={30} />
            </AnimatedButton>
          </View>
        </View>
      ) : (
        <View className="flex-1 justify-between mb-10 max-w-md mx-auto w-full">
          <View className="gap-5 flex-row justify-center items-center mt-10">
            <AppText className="text-2xl text-center ">Timer</AppText>
            <AlarmClock color="#d1d5db" size={30} />
          </View>
          <View
            className={`gap-10 mb-5 px-20 justify-center w-full ${
              isLandscape ? "flex-row" : "flex-col"
            }`}
          >
            <View className="w-full">
              <NumberInput
                label="Minutes"
                placeholder="0 min"
                value={alarmMinutes}
                onChangeText={(value) => setAlarmMinutes(value)}
              />
            </View>
            <View className="w-full">
              <NumberInput
                label="Seconds"
                placeholder="0 sec"
                value={alarmSeconds}
                onChangeText={(value) => setAlarmSeconds(value)}
              />
            </View>
          </View>

          <View
            className={`justify-center gap-5 w-full ${
              isLandscape ? "flex-row" : "flex-col"
            }`}
          >
            <View className="w-full">
              <AnimatedButton
                label="Start"
                onPress={handleStartTimer}
                className="items-center gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500"
              />
            </View>

            <View className="w-full">
              <AnimatedButton
                label="Clear"
                onPress={handleReset}
                className="items-center gap-2 bg-red-600 border-2 border-red-400 py-2 shadow-md rounded-md"
              />
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}
