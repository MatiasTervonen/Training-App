import { Link, usePathname } from "expo-router";
import { SquareArrowRight, PartyPopper } from "lucide-react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import AppText from "@/components/AppText";
import { View, Pressable, TouchableOpacity, DeviceEventEmitter } from "react-native";
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
  const { t } = useTranslation(["gym", "timer", "habits"]);
  const activeSession = useTimerStore((state) => state.activeSession);
  const alarmFired = useTimerStore((state) => state.alarmFired);

  const pathname = usePathname();

  const isHabitSession = activeSession?.type === "habit";

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (alarmFired && !isHabitSession) {
      opacity.value = withRepeat(withTiming(0.2, { duration: 500 }), -1, true);
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [alarmFired, opacity, isHabitSession]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!activeSession) return null;

  // Habit completed — timer page has its own UI, hide popup there
  if (isHabitSession && alarmFired && pathname === "/timer/empty-timer") return null;

  // Habit completed state — show celebration bar on other pages
  if (isHabitSession && alarmFired) {
    return (
      <View className="z-0">
        <LinearGradient
          colors={["#0a1f1a", "#0f172a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View className="flex-row items-center justify-center gap-3" style={{ height: 61 }}>
            <PartyPopper size={22} color="#22c55e" />
            <AppText className="text-lg">
              {t("habits:durationCompleted")}
            </AppText>
            <PartyPopper size={22} color="#22c55e" />
          </View>
        </LinearGradient>
        <View className="h-px bg-white/5" />
      </View>
    );
  }

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
    pathname === "/timer/empty-timer" &&
    activeSession.type === "habit"
  ) {
    return null;
  }
  if (pathname === "/habits" && activeSession.type === "habit") {
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
      style={[
        animatedStyle,
        {
          shadowColor: alarmFired ? "#ef4444" : "#22d3ee",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
      ]}
      className="z-0"
    >
      <LinearGradient
        colors={alarmFired ? ["#3a0a0a", "#1a0f2a"] : ["#0d3326", "#0f172a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View className="flex-row">
          <Pressable
            onPress={() => {
              if (isHabitSession) {
                // Pause habit timer — reuses TIMER_STOPPED flow (saves progress + pauses)
                DeviceEventEmitter.emit("TIMER_STOPPED");
              } else {
                stopNativeAlarm();
                cancelNativeAlarm("timer");
              }
            }}
            className="flex-1 py-3 flex-row items-center z-50"
          >
            <View className="flex-row flex-1 justify-between items-center gap-5 ml-7">
              <Timer textClassName="text-2xl" />
              {activeSession?.label && (
                <AppText
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="mr-8 text-lg"
                >
                  {activeSession.label}
                </AppText>
              )}
              {alarmFired && (
                <AppText>{t("timer:timer.notification.alarm")}</AppText>
              )}

              {activeSession && (
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
                  <SquareArrowRight size={40} color="#6b7280" />
                </TouchableOpacity>
              </Link>
              )}
            </View>
          </Pressable>
        </View>
        <View className={`h-px ${alarmFired ? "bg-red-500/20" : "bg-white/5"}`} />
      </LinearGradient>
    </Animated.View>
  );
}
