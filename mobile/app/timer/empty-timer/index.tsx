import {
  Pressable,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import NumberInput from "@/components/NumberInput";
import AppInput from "@/components/AppInput";
import { CircleX, RotateCcw } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import { confirmAction } from "@/lib/confirmAction";
import { useAudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError } from "@/utils/handleError";
import { useDebouncedCallback } from "use-debounce";
import Timer from "@/components/timer";
import AnimatedButton from "@/components/animatedButton";
import NotesInput from "@/components/NotesInput";
import Animated from "react-native-reanimated";

export default function SettingsScreen() {
  const [timerTitle, setTimerTitle] = useState("");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const audioSource = require("@/assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource);

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
    const confirmReset = await confirmAction({
      title: "Delete Timer",
      message: "Are you sure you want to delete the timer?",
    });
    if (!confirmReset) return;

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

  // const progress = useSharedValue(0);

  // useEffect(() => {
  //   if (totalDuration > 0) {
  //     const progressValue = (elapsedTime / totalDuration) * 100;
  //     progress.value = withSpring(progressValue, {
  //       stiffness: 100,
  //       damping: 10,
  //     });
  //   }
  // }, [elapsedTime, totalDuration, progress]);

  return (
    <PageContainer>
      <Pressable
        onPress={() => {
          if (alarmFired) {
            player.seekTo(0);
            player.pause();
            setAlarmFired(false);
          }
        }}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {showTimerUI ? (
            <View className="flex-1 items-center gap-5">
              {timerTitle && (
                <AppText className="text-2xl mt-5">{timerTitle}</AppText>
              )}
              <AppText className="text-gray-300 text-xl mt-5">
                {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
              </AppText>
              <Timer fullWidth className="flex-col" iconSize={40} />
              {notes && (
                <AppText className="text-center text-gray-300 mt-5">
                  {notes}
                </AppText>
              )}
              <View className="w-full bg-gray-200 h-6 rounded-full overflow-hidden">
                <Animated.View
                  className=" bg-green-500 h-6 w-full"
                  style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
                ></Animated.View>
              </View>
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
            <View className="flex-1 justify-between mb-10">
              <View className="gap-5">
                <AppText className="text-2xl text-center mb-5 mt-10">
                  Timer
                </AppText>
                <View className="">
                  <AppInput
                    value={timerTitle}
                    onChangeText={setTimerTitle}
                    placeholder="Timer title (optional)"
                    label="Timer Title"
                  />
                </View>
                <View className="min-h-[80px]">
                  <NotesInput
                    placeholder="Notes (optional)"
                    label="Notes"
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>
                <View className="flex-row gap-4 mb-5">
                  <View className="flex-1">
                    <NumberInput
                      label="Minutes"
                      placeholder="0 min"
                      value={alarmMinutes}
                      onChangeText={(value) => setAlarmMinutes(value)}
                    />
                  </View>
                  <View className="flex-1">
                    <NumberInput
                      label="Seconds"
                      placeholder="0 sec"
                      value={alarmSeconds}
                      onChangeText={(value) => setAlarmSeconds(value)}
                    />
                  </View>
                </View>
              </View>
              <View className="gap-5 w-full">
                <AnimatedButton
                  label="Start"
                  onPress={handleStartTimer}
                  className="items-center gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 "
                />

                <AnimatedButton
                  label="Delete"
                  onPress={handleReset}
                  className="items-center gap-2 bg-red-600 border-2 border-red-400 py-2 shadow-md rounded-md"
                />
              </View>
            </View>
          )}
        </TouchableWithoutFeedback>
      </Pressable>
    </PageContainer>
  );
}
