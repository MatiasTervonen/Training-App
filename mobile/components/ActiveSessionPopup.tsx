import { Link } from "expo-router";
import { SquareArrowRight } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import AppText from "./AppText";
import { useAudioPlayer } from "expo-audio";
import { View, Pressable, TouchableOpacity } from "react-native";
import Timer from "./timer";

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
      className={`w-full bg-gray-600 py-4 flex-row items-center z-50 border-2 border-green-500 ${
        alarmFired ? "bg-red-500 animate-pulse" : ""
      }`}
    >
      <View className="ml-10 flex-1">
        <AppText
          numberOfLines={1}
          ellipsizeMode="tail"
          className="pb-2 text-start text-gray-100 mr-8"
        >
          {activeSession.label}
        </AppText>
        <View className="flex-row items-center gap-5 text-slate-900 text-start">
          <Timer />
          <AppText className="text-gray-100">
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
        <Link asChild onPress={stopAlarm} href={activeSession.path as any}>
          <TouchableOpacity>
            <SquareArrowRight size={40} color="#f3f4f6" />
          </TouchableOpacity>
        </Link>
      </View>
    </Pressable>
  );
}
