import { useMutation, useQueryClient } from "@tanstack/react-query";
import { forwardMessage } from "@/database/chat/forward-message";
import { ChatMessage } from "@/types/chat";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

type ForwardInput = {
  message: ChatMessage;
  friendId: string;
};

export default function useForwardMessage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("chat");

  return useMutation({
    mutationFn: ({ message, friendId }: ForwardInput) =>
      forwardMessage(message, friendId),

    onSuccess: () => {
      Toast.show({ type: "success", text1: t("chat.messageForwarded") });
    },

    onError: () => {
      Toast.show({ type: "error", text1: t("chat.messageSendError") });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
