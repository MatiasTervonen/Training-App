import { Pressable, View, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import NumberInput from "@/components/NumberInput";
import { CircleX, AlarmClock } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import { confirmAction } from "@/lib/confirmAction";
import { useAudioPlayer } from "expo-audio";
import AnimatedButton from "@/components/buttons/animatedButton";
import Animated from "react-native-reanimated";
import * as ScreenOrientation from "expo-screen-orientation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Timer from "@/Features/timer/timer";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [orieantation, setOrientation] =
    useState<ScreenOrientation.Orientation | null>(null);

  const audioSource = require("@/assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource);

  const router = useRouter();

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
    // Allow full rotation on this page
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);

    return () => {
      // Reset back to portrait when leaving the page
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  const {
    totalDuration,
    elapsedTime,
    alarmSoundPlaying,
    setAlarmFired,
    setActiveSession,
    startTimer,
    setAlarmSoundPlaying,
    clearEverything,
  } = useTimerStore();

  const handleReset = async () => {
    setAlarmMinutes("");
    setAlarmSeconds("");
  };

  const cancelTimer = async () => {
    const confirmCancel = await confirmAction({
      title: "Cancel Timer",
      message: "Are you sure you want to cancel the timer?",
    });
    if (!confirmCancel) return;

    setIsCancelling(true);

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

  const handleStartTimer = () => {
    setActiveSession({
      type: "timer",
      label: "Timer",
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

    setAlarmFired(false);
    startTimer(totalSeconds);
  };

  useEffect(() => {
    if (alarmSoundPlaying) {
      player.seekTo(0);
      player.play();
      player.loop = true;
    } else {
      player.pause();
      player.seekTo(0);
    }
  }, [alarmSoundPlaying, player]);

  const handleStopTimer = async () => {
    setAlarmSoundPlaying(false);
    if (player) {
      try {
        player.pause();
        player.seekTo(0);
      } catch (error) {
        console.error("Error stopping audio player:", error);
      }
    }
  };

  const showTimerUI = isCancelling || totalDuration > 0;

  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        handleStopTimer();
      }}
      className="flex-1"
    >
      <View className="flex-1 px-4">
        {showTimerUI ? (
          <View className="flex-1 items-center">
            <AppText className="text-gray-300 text-xl mt-5">
              {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
            </AppText>
            <Timer
              className="flex-col"
              iconSize={40}
              onStopAlarmSound={() => setAlarmSoundPlaying(false)}
            />
            {elapsedTime < totalDuration && (
              <View className="w-full bg-gray-300 h-6 rounded-full overflow-hidden mt-4">
                <Animated.View
                  className=" bg-green-500 h-6 w-full"
                  style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
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
              <AppText className="text-2xl text-center">Timer</AppText>
              <AlarmClock color="#d1d5db" size={30} />
            </View>
            <View
              className={`gap-10 mb-5 px-10 justify-center items-center ${
                isLandscape ? "flex-row px-0 gap-5" : "flex-col"
              }`}
            >
              <View className={`${isLandscape ? "w-1/2" : "w-full"}`}>
                <NumberInput
                  label="Minutes"
                  placeholder="0 min"
                  value={alarmMinutes}
                  onChangeText={(value) => setAlarmMinutes(value)}
                />
              </View>
              <View className={`${isLandscape ? "w-1/2" : "w-full"}`}>
                <NumberInput
                  label="Seconds"
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
                  label="Start"
                  onPress={handleStartTimer}
                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500"
                  textClassName="text-gray-100 text-center"
                />
              </View>
              <View className={`${isLandscape ? "w-1/2" : "w-full pb-5"}`}>
                <AnimatedButton
                  label="Clear"
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
