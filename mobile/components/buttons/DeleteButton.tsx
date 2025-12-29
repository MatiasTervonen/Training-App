import AnimatedButton from "@/components/buttons/animatedButton";
import { Alert } from "react-native";

type DeleteButtonProps = {
  onPress: () => void;
  label?: string;
  confirm?: boolean;
};

export default function DeleteButton({
  onPress,
  confirm = true,
  label = "Delete",
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
        { cancelable: true },
      );
    } else {
      onPress();
    }
  };

  return (
    <AnimatedButton
      className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500"
      onPress={handleDelete}
      textClassName="text-gray-100 text-center"
      label={label}
    />
  );
}
