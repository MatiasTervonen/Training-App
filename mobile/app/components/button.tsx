import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  className?: string;
};

export default function AppButton({
  title,
  onPress,
  className,
}: AppButtonProps) {
  return (
    <TouchableOpacity
      className={`border-2 border-blue-700 rounded-xl ${className}`}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#020618", "#1447e6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius:8 }}
        className="px-4 py-2"
      >
        <AppText className="text-center" style={{ fontSize: 20 }}>{title}</AppText>
      </LinearGradient>
    </TouchableOpacity>
  );
}
