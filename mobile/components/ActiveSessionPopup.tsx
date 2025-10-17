import { Link } from "expo-router";
import { SquareArrowRight } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import AppText from "./AppText";
import { useAudioPlayer } from "expo-audio";
import { View, Pressable } from "react-native";

export default function ActiveSessionPopup() {
  const activeSession = useTimerStore((state) => state.activeSession);
  const alarmFired = useTimerStore((state) => state.alarmFired);
  const setAlarmFired = useTimerStore((state) => state.setAlarmFired);
  const totalDuration = useTimerStore((state) => state.totalDuration);

  const audioSource = require("../assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource, { loop: true } as any);

  useEffect(() => {
    if (alarmFired) {
      player.play();
    } else {
      player.pause();
      player.seekTo(0);
    }
  }, [alarmFired, player]);

  const stopAlarm = () => {
    player.pause();
    player.seekTo(0);
    setAlarmFired(false);
  };

  if (!activeSession) return null;

  return (
    <Pressable
      onPress={stopAlarm}
      className={`flex-row w-full justify-between items-center text-center bg-gray-300 py-4 absolute bottom-0 z-50 border-2 border-green-500 ${
        alarmFired ? "bg-red-500 animate-pulse" : ""
      }`}
    >
      <View className="ml-10">
        <AppText className="pb-2 text-start text-slate-900">
          {activeSession.label}
        </AppText>
        <View className="flex-row gap-5 text-slate-900 text-start">
          {/* <Timer /> */}
          <AppText className="text-slate-900">
            {activeSession.type.toUpperCase()}
          </AppText>
          {alarmFired && <AppText className="text-gray-100">ALARM!</AppText>}
          {activeSession.type === "timer" && totalDuration && (
            <AppText>
              {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
            </AppText>
          )}
        </View>
      </View>
      <View className="mr-5">
        <Link onPress={stopAlarm} href={activeSession.path as any}>
          <SquareArrowRight size={40} color="#0f172b" />
        </Link>
      </View>
    </Pressable>
  );
}
