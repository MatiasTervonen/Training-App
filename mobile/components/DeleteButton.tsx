import { Pressable, Alert } from "react-native";
import AppText from "./AppText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

type DeleteButtonProps = {
  onPress: () => void;
  label?: string;
  confirm?: boolean;
};

export default function DeleteButton({
  onPress,
  label,
  confirm = true,
}: DeleteButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    opacity.value = withSpring(0.8);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 200, damping: 15 });
    opacity.value = withSpring(1);
  };

  const handleDelete = () => {
    if (confirm) {
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: onPress,
          },
        ],
        { cancelable: true }
      );
    } else {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handleDelete}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={animatedStyle}
        className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500"
      >
        <AppText className="text-center text-lg">{label || "Delete"}</AppText>
      </Animated.View>
    </Pressable>
  );
}
