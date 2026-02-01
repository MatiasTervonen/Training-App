import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

type ConfirmActionParams = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  cancelable?: boolean;
};

export function confirmAction({
  title,
  message,
  confirmText,
  cancelText,
  cancelable = false,
}: ConfirmActionParams): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title ?? "Are you sure?",
      message ?? "This action cannot be undone.",
      [
        {
          text: cancelText ?? "Cancel",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: confirmText ?? "Yes",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable },
    );
  });
}

export function useConfirmAction() {
  const { t } = useTranslation("common");

  return useCallback(
    ({
      title,
      message,
      confirmText,
      cancelText,
      cancelable = false,
    }: ConfirmActionParams): Promise<boolean> => {
      return confirmAction({
        title: title ?? t("common.confirmAction.defaultTitle"),
        message: message ?? t("common.confirmAction.defaultMessage"),
        confirmText: confirmText ?? t("common.confirmAction.confirm"),
        cancelText: cancelText ?? t("common.confirmAction.cancel"),
        cancelable,
      });
    },
    [t],
  );
}
