import { StyleProp, View, ViewStyle } from "react-native";
import AppText from "../../../components/AppText";
import { Gauge, Compass, Mountain, Footprints } from "lucide-react-native";
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

function mapDegreesToDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.floor((normalized + 22.5) / 45) % 8;
  return directions[index];
}

export default function MapIcons({
  title,
  lastPoint,
  style,
  startGPStracking,
  stopGPStracking,
  totalDistance,
  hasStartedTracking,
  averagePacePerKm,
  currentStepCount,
}: {
  title: string;
  lastPoint: TrackPoint;
  style?: StyleProp<ViewStyle>;
  startGPStracking: () => void;
  stopGPStracking: () => void;
  totalDistance: number;
  hasStartedTracking: boolean;
  averagePacePerKm: number;
  currentStepCount: number;
}) {
  const heading = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (typeof lastPoint?.heading === "number") {
      heading.value = withTiming(lastPoint.heading, { duration: 300 });
    }
  }, [lastPoint?.heading, heading]);

  const headingAnimated = useAnimatedStyle(() => ({
    transform: [{ rotate: `${heading.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (!hasStartedTracking) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [hasStartedTracking, opacity]);

  return (
    <View className="bg-slate-950 py-5" style={style}>
      <View className="flex-row items-center justify-around mb-5">
        <View>
          <Timer
            textClassName="text-2xl z-[999]"
            manualSession={{
              label: title || "Activity",
              path: "/activities/start-activity",
              type: "activity",
            }}
            onStart={startGPStracking}
            onPause={stopGPStracking}
            color="#3b82f6"
          />
          <View className="z-[999] flex-row gap-2 items-center mt-2">
            <Footprints size={20} color="#f3f4f6" />
            <AppText className="text-xl z-[999]">{currentStepCount}</AppText>
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
      </View>
      <View className="gap-10 flex-row items-center justify-around">
        <View>
          {hasStartedTracking && lastPoint?.speed != null ? (
            <View className="items-center justify-center">
              <View className="flex-row items-center gap-2">
                <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                  <AppText className="text-xl">
                    {Math.round(lastPoint?.speed * 3.6)}
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
          {hasStartedTracking && lastPoint?.heading != null ? (
            <View className="items-center justify-center">
              <View className="flex-row items-center gap-2">
                <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                  <AppText className="text-xl">
                    {Math.round(lastPoint.heading)}
                  </AppText>
                </View>
                <View>
                  <AppText>{mapDegreesToDirection(lastPoint.heading)}</AppText>
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
          {hasStartedTracking && lastPoint?.altitude != null ? (
            <View className="items-center justify-center">
              <View className="flex-row items-center gap-2">
                <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                  <AppText className="text-xl">
                    {Math.round(lastPoint.altitude)}
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
    </View>
  );
}
