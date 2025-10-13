import { Alert } from "react-native";

export function confirmDeletion({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  cancelable = false,
}: {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  cancelable?: boolean;
}) {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: "cancel",
        onPress: () => {},
      },
      {
        text: confirmText,
        style: "destructive",
        onPress: onConfirm,
      },
    ],
    { cancelable }
  );
}
