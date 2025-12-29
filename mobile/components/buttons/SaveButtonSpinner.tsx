import AppText from "@/components/AppText";
import { ActivityIndicator } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function SaveButtonSpinner({
  onPress,
  label = "Save",
  disabled,
  loading,
  className,
}: SaveButtonProps) {
  return (
    <AnimatedButton
      className={`flex-row justify-center items-center gap-3 bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2 ${className}`}
      onPress={onPress}
      disabled={disabled}
    >
      <AppText className="text-lg">{label}</AppText>
      {loading && <ActivityIndicator size="small" color="#fff" />}
    </AnimatedButton>
  );
}
