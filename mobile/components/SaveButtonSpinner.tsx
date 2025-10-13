import AppText from "./AppText";
import { Pressable, ActivityIndicator } from "react-native";
import { useUserStore } from "@/lib/stores/useUserStore";

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function SaveButton({
  onPress,
  label = "Save",
  disabled,
  loading,
}: SaveButtonProps) {
  const isGuest = useUserStore((state) => state.preferences?.role === "guest");

  if (isGuest) {
    return (
      <Pressable
        disabled
        className="bg-gray-400 py-2 rounded-md shadow-md border-2 border-gray-300"
      >
        <AppText className="text-center tewxt-lg">Save (not allowed)</AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      className="flex-row justify-center items-center gap-3 bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
      onPress={onPress}
      disabled={disabled}
    >
      <AppText text-lg>{label}</AppText>
      {loading && <ActivityIndicator size="small" color="#fff" />}
    </Pressable>
  );
}
