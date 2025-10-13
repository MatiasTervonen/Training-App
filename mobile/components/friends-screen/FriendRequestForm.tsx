import AppInput from "../AppInput";
import { useState } from "react";
import toast from "react-native-toast-message";
import { handleError } from "@/utils/handleError";
import { sendFriendRequest } from "@/api/friend/send-request";
import { View } from "react-native";
import SaveButton from "../SaveButton";

export default function FriendRequestForm() {
  const [identifier, setIdentifier] = useState("");

  const handleSendFriendRequest = async (identifier: string) => {
    try {
      const response = await sendFriendRequest(identifier);

      if ("error" in response && response.error) {
        throw new Error(response.message || "Failed to send friend request");
      }

      toast.show({
        type: "success",
        text1: "Friend request sent successfully!",
      });
      setIdentifier(""); // Clear the input field after sending the request
    } catch (error) {
      handleError(error, {
        message: "Error sending friend request",
        route: "/api/friend/send-request",
        method: "POST",
      });
    }
  };

  return (
    <View className="flex flex-col max-w-md mx-auto bg-slate-950 p-5 rounded-md shadow-xl">
      <AppInput
        id="friend-identifier"
        label="Send Friend Request"
        placeholder="Enter friend's username or id"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <SaveButton
        onPress={() => handleSendFriendRequest(identifier)}
        label="Send Request"
      />
    </View>
  );
}
