import { StyleProp, View, ViewStyle } from "react-native";
import AppText from "../../../components/AppText";
import { Gauge, Compass, Mountain, Footprints, Flame } from "lucide-react-native";
import Timer from "../../../components/timer";
import { TrackPoint } from "@/types/session";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { formatAveragePace, formatMeters } from "@/lib/formatDate";
import { useTimerStore } from "@/lib/stores/timerStore";

function mapDegreesToDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.floor((normalized + 22.5) / 45) % 8;
  return directions[index];
}

type SessionStatsProps = {
  title: string;
  style?: StyleProp<ViewStyle>;
  currentStepCount: number;
  liveCalories?: number;
  gpsEnabled?: boolean;
  lastMovingPoint?: TrackPoint | null;
  startGPStracking?: () => void;
  stopGPStracking?: () => void;
  totalDistance?: number;
  hasStartedTracking?: boolean;
  averagePacePerKm?: number;
};

export default function SessionStats({
  title,
  style,
  currentStepCount,
  liveCalories,
  gpsEnabled = false,
  lastMovingPoint,
  startGPStracking,
  stopGPStracking,
  totalDistance = 0,
  hasStartedTracking = false,
  averagePacePerKm = 0,
}: SessionStatsProps) {
  const activeSession = useTimerStore((state) => state.activeSession);
  const heading = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (typeof lastMovingPoint?.heading === "number") {
      heading.value = withTiming(lastMovingPoint.heading, { duration: 300 });
    }
  }, [lastMovingPoint?.heading, heading]);

  const headingAnimated = useAnimatedStyle(() => ({
    transform: [{ rotate: `${heading.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (gpsEnabled && !hasStartedTracking) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [gpsEnabled, hasStartedTracking, opacity]);

  return (
    <View className="bg-slate-950 py-5" style={style}>
      <View className={`flex-row items-center justify-around ${gpsEnabled ? "mb-5" : ""}`}>
        {gpsEnabled ? (
          <>
            <View>
              <Timer
                textClassName="text-2xl z-[999]"
                manualSession={{
                  label: title || "Activity",
                  path: "/activities/start-activity",
                  type: activeSession?.type || "Activity",
                }}
                onStart={startGPStracking}
                onPause={stopGPStracking}
                color="#3b82f6"
              />
              <View className="z-[999] flex-row gap-4 items-center mt-2">
                <View className="flex-row gap-2 items-center">
                  <Footprints size={20} color="#f3f4f6" />
                  <AppText className="text-xl z-[999]">{currentStepCount}</AppText>
                </View>
                <View className="flex-row gap-1 items-center">
                  <Flame size={20} color="#f97316" />
                  <AppText className="text-xl z-[999]">{liveCalories ?? 0} kcal</AppText>
                </View>
              </View>
            </View>
            <View>
              <AppText className="text-xl z-[999]">
                {formatAveragePace(averagePacePerKm)} min/km
              </AppText>
              <AppText className="text-xl z-[999] mt-2">
                {formatMeters(totalDistance)}
              </AppText>
            </View>
          </>
        ) : (
          <>
            <Timer
              textClassName="text-2xl z-[999]"
              manualSession={{
                label: title || "Activity",
                path: "/activities/start-activity",
                type: activeSession?.type || "Activity",
              }}
              color="#3b82f6"
            />
            <View className="flex-row gap-2 items-center">
              <Footprints size={20} color="#f3f4f6" />
              <AppText className="text-xl z-[999]">{currentStepCount}</AppText>
            </View>
            <View className="flex-row gap-1 items-center">
              <Flame size={20} color="#f97316" />
              <AppText className="text-xl z-[999]">{liveCalories ?? 0} kcal</AppText>
            </View>
          </>
        )}
      </View>
      {gpsEnabled && (
        <View className="gap-10 flex-row items-center justify-around">
          <View>
            {hasStartedTracking && lastMovingPoint?.speed != null ? (
              <View className="items-center justify-center">
                <View className="flex-row items-center gap-2">
                  <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                    <AppText className="text-xl">
                      {Math.round(lastMovingPoint?.speed * 3.6)}
                    </AppText>
                  </View>
                  <View>
                    <AppText>km/h</AppText>
                  </View>
                </View>
                <Gauge size={20} color="#f3f4f6" />
              </View>
            ) : (
              <View className="items-center justify-center">
                <Animated.View style={pulseStyle}>
                  <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                    <AppText className="text-xl">-</AppText>
                  </View>
                </Animated.View>
                <Gauge size={20} color="#f3f4f6" />
              </View>
            )}
          </View>

          <View>
            {hasStartedTracking && lastMovingPoint?.heading != null ? (
              <View className="items-center justify-center">
                <View className="flex-row items-center gap-2">
                  <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                    <AppText className="text-xl">
                      {Math.round(lastMovingPoint.heading)}
                    </AppText>
                  </View>
                  <View>
                    <AppText>{mapDegreesToDirection(lastMovingPoint.heading)}</AppText>
                  </View>
                </View>
                <Animated.View style={headingAnimated}>
                  <Compass size={20} color="#f3f4f6" />
                </Animated.View>
              </View>
            ) : (
              <View className="items-center justify-center">
                <Animated.View style={pulseStyle}>
                  <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                    <AppText className="text-xl">-</AppText>
                  </View>
                </Animated.View>
                <Compass size={20} color="#f3f4f6" />
              </View>
            )}
          </View>

          <View>
            {hasStartedTracking && lastMovingPoint?.altitude != null ? (
              <View className="items-center justify-center">
                <View className="flex-row items-center gap-2">
                  <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                    <AppText className="text-xl">
                      {Math.round(lastMovingPoint.altitude)}
                    </AppText>
                  </View>
                  <View>
                    <AppText>m</AppText>
                  </View>
                </View>
                <Mountain size={20} color="#3b82f6" />
              </View>
            ) : (
              <View className="items-center justify-center">
                <Animated.View style={pulseStyle}>
                  <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                    <AppText className="text-xl">-</AppText>
                  </View>
                </Animated.View>
                <Mountain size={20} color="#f3f4f6" />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
