import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
};

export default function SaveButton({
  onPress,
  label,
  disabled,
}: SaveButtonProps) {
  const { t } = useTranslation("common");

  return (
    <AnimatedButton
      className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
      label={label ?? t("common.save")}
      onPress={onPress}
      textClassName="text-gray-100 text-center"
      disabled={disabled}
    />
  );
}
