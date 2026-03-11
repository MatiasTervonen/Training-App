import { Link, usePathname } from "expo-router";
import { SquareArrowRight } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import AppText from "@/components/AppText";
import { View, Pressable, TouchableOpacity } from "react-native";
import Timer from "@/components/timer";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  stopNativeAlarm,
  cancelNativeAlarm,
} from "@/native/android/NativeAlarm";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

export default function ActiveSessionPopup() {
  const { t } = useTranslation(["gym", "timer"]);
  const activeSession = useTimerStore((state) => state.activeSession);
  const alarmFired = useTimerStore((state) => state.alarmFired);

  const pathname = usePathname();

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (alarmFired) {
      opacity.value = withRepeat(withTiming(0.2, { duration: 500 }), -1, true);
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [alarmFired, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!activeSession) return null;

  if (pathname === "/gym/gym" && activeSession.type === t("gym:gym.title")) {
    return null;
  }

  if (
    pathname === "/timer/empty-timer" &&
    activeSession.type === t("timer:timer.title")
  ) {
    return null;
  }
  if (
    pathname === "/timer/start-stopwatch" &&
    activeSession.type === t("timer:timer.stopwatch.title")
  ) {
    return null;
  }

  if (pathname === "/disc-golf/game" && activeSession.type === "disc-golf") {
    return null;
  }

  if (
    pathname === "/activities/start-activity" &&
    activeSession.path === "/activities/start-activity"
  ) {
    return null;
  }

  return (
    <Animated.View
      style={animatedStyle}
      className={`z-0 ${
        alarmFired
          ? "bg-red-500 border-2 border-red-400"
          : "bg-gray-600 border-2 border-green-500"
      } `}
    >
      <LinearGradient
        colors={["#1e3a8a", "#0f172a", "#0f172a"]}
        start={{ x: 1, y: 0 }} // bottom-left
        end={{ x: 0, y: 1 }} // top-right
      >
        <Pressable
          onPress={() => {
            stopNativeAlarm();
            cancelNativeAlarm("timer");
          }}
          className="w-full py-3 flex-row items-center z-50"
        >
          <View className="flex-row flex-1 justify-between items-center gap-5 ml-10">
            <Timer textClassName="text-3xl" />
            {activeSession.label && (
              <AppText numberOfLines={1} ellipsizeMode="tail" className=" mr-8">
                {activeSession.label}
              </AppText>
            )}
            {alarmFired && (
              <AppText>{t("timer:timer.notification.alarm")}</AppText>
            )}

            <Link
              className="mr-5"
              onPress={() => {
                stopNativeAlarm();
                cancelNativeAlarm("timer");
              }}
              asChild
              href={activeSession.path as any}
            >
              <TouchableOpacity>
                <SquareArrowRight size={40} color="#f3f4f6" />
              </TouchableOpacity>
            </Link>
          </View>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}
