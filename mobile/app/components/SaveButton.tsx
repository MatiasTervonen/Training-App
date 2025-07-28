import AppText from "./AppText";
import { Pressable } from "react-native";
import { useUserStore } from "@/lib/stores/useUserStore";

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
};

export default function SaveButton({
  onPress,
  label = "Save",
}: SaveButtonProps) {
  const isGuest = useUserStore((state) => state.preferences?.role === "guest");

  if (isGuest) {
    return (
      <Pressable
        disabled
        className="bg-gray-400 py-2 rounded-md shadow-md border-2 border-gray-300"
      >
        <AppText className="text-gray-100 text-center">
          Save (not allowed)
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500"
      onPress={onPress}
    >
      <AppText className="text-gray-100 text-center">{label}</AppText>
    </Pressable>
  );
}
