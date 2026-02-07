import AnimatedButton from "@/components/buttons/animatedButton";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

type DeleteButtonProps = {
  onPress: () => void;
  label?: string;
  confirm?: boolean;
};

export default function DeleteButton({
  onPress,
  confirm = true,
  label,
}: DeleteButtonProps) {
  const { t } = useTranslation("common");

  const handleDelete = () => {
    if (confirm) {
      Alert.alert(
        t("deleteButton.confirmDeleteTitle"),
        t("deleteButton.confirmDeleteMessage"),
        [
          {
            text: t("common.cancel"),
            style: "cancel",
          },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: onPress,
          },
        ],
        { cancelable: true },
      );
    } else {
      onPress();
    }
  };

  return (
    <AnimatedButton
      className="btn-danger"
      onPress={handleDelete}
      textClassName="text-gray-100 text-center"
      label={label ?? t("common.delete")}
    />
  );
}
