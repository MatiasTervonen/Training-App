import AnimatedButton from "@/components/buttons/animatedButton";

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
};

export default function SaveButton({
  onPress,
  label = "Save",
  disabled,
}: SaveButtonProps) {
  return (
    <AnimatedButton
      className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
      label={label}
      onPress={onPress}
      textClassName="text-gray-100 text-center"
      disabled={disabled}
    />
  );
}
