import AnimatedButton from "@/components/buttons/animatedButton";

type EditButtonProps = {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
};

export default function EditButton({
  onPress,
  label = "Edit",
  disabled,
}: EditButtonProps) {
  return (
    <AnimatedButton
      className="btn-edit py-2"
      label={label}
      onPress={onPress}
      textClassName="text-gray-100 text-center"
      disabled={disabled}
    />
  );
}
