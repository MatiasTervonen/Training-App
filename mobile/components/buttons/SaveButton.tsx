import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

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
      className="btn-save"
      label={label ?? t("common.save")}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      disabled={disabled}
    />
  );
}
