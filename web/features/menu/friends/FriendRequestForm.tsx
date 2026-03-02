"use client";

import CustomInput from "@/ui/CustomInput";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSendFriendRequest } from "@/features/menu/friends/hooks/useSendFriendRequest";
import { useTranslation } from "react-i18next";

const messageKeyMap: Record<string, string> = {
  "You cannot send a friend request to yourself": "friends.cannotSendToSelf",
  "Friend request already exists": "friends.requestAlreadyExists",
  "You are already friends": "friends.alreadyFriends",
  "User does not exist": "friends.userNotFound",
};

export default function FriendRequestForm() {
  const { t } = useTranslation("menu");
  const [identifier, setIdentifier] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const sendRequest = useSendFriendRequest();

  const handleSendFriendRequest = async () => {
    if (!identifier.trim()) return;

    try {
      const result = await sendRequest.mutateAsync(identifier.trim());

      if ("message" in result && result.message) {
        const key = messageKeyMap[result.message];
        setErrorMessage(key ? t(key) : result.message);
        return;
      }

      toast.success(t("friends.requestSentSuccess"));
      setIdentifier("");
    } catch {
      toast.error(t("friends.requestSentError"));
    }
  };

  return (
    <div className="flex flex-col max-w-md mx-auto bg-slate-950 p-5 rounded-md shadow-md border-slate-700 border-2">
      <CustomInput
        id="friend-identifier"
        label={t("friends.sendFriendRequest")}
        placeholder={t("friends.placeholder")}
        value={identifier}
        setValue={(val) => {
          setIdentifier(val);
          setErrorMessage("");
        }}
        autoComplete="off"
      />
      {errorMessage ? (
        <p className="text-red-500 my-3 text-sm text-center">{errorMessage}</p>
      ) : (
        <p className="invisible min-h-11"></p>
      )}
      <button
        disabled={sendRequest.isPending || !identifier.trim()}
        onClick={handleSendFriendRequest}
        className="bg-blue-800 py-2 px-10 rounded-md shadow-md border-2 border-blue-500 text-md cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {t("friends.sendRequest")}
      </button>
    </div>
  );
}
