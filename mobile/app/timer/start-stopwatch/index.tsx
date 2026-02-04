import { View } from "react-native";
import Timer from "@/features/timer/stopWatch";
import useRotation from "@/features/timer/hooks/useRotation";

export default function StartStopwatch() {
  useRotation();

  return (
    <View className="flex-1">
      <Timer />
      <View className="absolute top-5 right-5" hitSlop={10}></View>
    </View>
  );
}
