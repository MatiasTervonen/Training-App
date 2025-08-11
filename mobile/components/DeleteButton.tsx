import { Pressable, Alert } from "react-native";
import AppText from "./AppText";

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
      className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500"
    >
      <AppText className="text-center">{label || "Delete"}</AppText>
    </Pressable>
  );
}
