import { Link, usePathname } from "expo-router";
import { SquareArrowRight } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import AppText from "./AppText";
import { useAudioPlayer } from "expo-audio";
import { View, Pressable, TouchableOpacity } from "react-native";
import Timer from "./timer";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export default function ActiveSessionPopup() {
  const activeSession = useTimerStore((state) => state.activeSession);
  const alarmFired = useTimerStore((state) => state.alarmFired);
  const totalDuration = useTimerStore((state) => state.totalDuration);
  const alarmSoundPlaying = useTimerStore((state) => state.alarmSoundPlaying);
  const setAlarmSoundPlaying = useTimerStore(
    (state) => state.setAlarmSoundPlaying
  );

  const pathname = usePathname();

  const audioSource = require("@/assets/audio/mixkit-classic-alarm-995.wav");

  const player = useAudioPlayer(audioSource, { loop: true } as any);

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (alarmSoundPlaying) {
      player.play();
      player.loop = true;
      opacity.value = withRepeat(withTiming(0.2, { duration: 500 }), -1, true);
    } else {
      opacity.value = withTiming(1, { duration: 300 });
      player.pause();
      player.seekTo(0);
    }
  }, [alarmSoundPlaying, player, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const stopAlarm = () => {
    setAlarmSoundPlaying(false);
    player.pause();
    player.seekTo(0);
  };

  if (!activeSession) return null;

  if (pathname === "/training/gym" && activeSession.type === "gym") {
    return null;
  }

  if (pathname === "/timer/empty-timer" && activeSession.type === "timer") {
    return null;
  }

  if (pathname === "/disc-golf/game" && activeSession.type === "disc-golf") {
    return null;
  }

  return (
    <Animated.View
      style={animatedStyle}
      className={`z-0 ${
        alarmSoundPlaying
          ? "bg-red-500 border-2 border-red-400"
          : "bg-gray-600 border-2 border-green-500"
      } `}
    >
      <Pressable
        onPress={stopAlarm}
        className="w-full py-3 flex-row items-center z-50"
      >
        <View className="ml-10 flex-1">
          <View className="flex-row items-center mb-2">
            {activeSession.label && (
              <AppText
                numberOfLines={1}
                ellipsizeMode="tail"
                className=" mr-8 text-lg"
              >
                {activeSession.label}
              </AppText>
            )}
            {alarmFired && <AppText>ALARM!</AppText>}
          </View>
          <View className="flex-row items-center gap-5">
            <Timer textClassName="text-xl" onPress={stopAlarm} />
            <AppText>{activeSession.type.toUpperCase()}</AppText>
            {activeSession.type === "timer" && totalDuration && (
              <AppText>
                {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
              </AppText>
            )}
          </View>
        </View>
        <View className="mr-5">
          <Link onPress={stopAlarm} asChild href={activeSession.path as any}>
            <TouchableOpacity>
              <SquareArrowRight size={40} color="#f3f4f6" />
            </TouchableOpacity>
          </Link>
        </View>
      </Pressable>
    </Animated.View>
  );
}
