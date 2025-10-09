import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";
import { Pressable } from "react-native";

type AppButtonProps = {
  label: string;
  className?: string;
  onPress?: () => void; // Optional onPress for additional functionality
};

export default function GradientButton({
  label,
  className,
  onPress,
}: AppButtonProps) {
  return (
    <LinearGradient
      colors={["#020618", "#1447e6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`rounded-md overflow-hidden ${className}`}
    >
      <Pressable
        className="py-2 border-2 border-blue-700 rounded-md"
        onPress={onPress}
        android_ripple={{ color: "#666" }}
      >
        <AppText className="text-center text-xl">{label}</AppText>
      </Pressable>
    </LinearGradient>
  );
}
