import { Alert } from "react-native";

export function confirmAction({
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
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: confirmText,
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable },
    );
  });
}
