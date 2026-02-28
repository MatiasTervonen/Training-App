import AppInput from "@/components/AppInput";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { handleError } from "@/utils/handleError";
import { useSendFriendRequest } from "@/features/friends/hooks/useSendFriendRequest";
import { View } from "react-native";
import SaveButton from "@/components/buttons/SaveButton";
import { useTranslation } from "react-i18next";

export default function FriendRequestForm() {
  const [identifier, setIdentifier] = useState("");
  const { t } = useTranslation("friends");
  const sendRequest = useSendFriendRequest();

  const handleSendFriendRequest = async () => {
    if (!identifier.trim()) return;

    try {
      const response = await sendRequest.mutateAsync(identifier.trim());

      if ("error" in response && response.error) {
        Toast.show({
          type: "error",
          text1: t(`friends.${response.message}`),
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: t("friends.requestSentSuccess"),
      });
      setIdentifier("");
    } catch (error) {
      handleError(error, {
        message: "Error sending friend request",
        route: "/api/friend/send-request",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: t("friends.sendError"),
      });
    }
  };

  return (
    <View className="flex flex-col gap-3 bg-slate-950 p-5 rounded-md shadow-md border-slate-700 border-2">
      <AppInput
        label={t("friends.sendFriendRequest")}
        placeholder={t("friends.placeholder")}
        value={identifier}
        onChangeText={setIdentifier}
      />
      <SaveButton
        onPress={handleSendFriendRequest}
        label={t("friends.sendRequest")}
        disabled={sendRequest.isPending || !identifier.trim()}
      />
    </View>
  );
}
