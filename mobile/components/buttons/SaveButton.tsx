import { useUserStore } from "@/lib/stores/useUserStore";
import AnimatedButton from "./animatedButton";

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
      <AnimatedButton
        className="bg-gray-400 py-2 rounded-md shadow-md border-2 border-gray-300"
        label="Save (not allowed)"
        onPress={onPress}
        textClassName="text-gray-100 text-center"
      />
    );
  }

  return (
    <AnimatedButton
      className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
      label={label}
      onPress={onPress}
      textClassName="text-gray-100 text-center"
    />
  );
}
