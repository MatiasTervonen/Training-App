"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState } from "react";
import toast from "react-hot-toast";
import { sendFriendRequest } from "@/app/(app)/database/friends";

export default function FriendRequestForm() {
  const [identifier, setIdentifier] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendFriendRequest = async (identifier: string) => {
    try {
      const result = await sendFriendRequest(identifier);

      if (result.message === "You cannot send a friend request to yourself") {
        setErrorMessage("You cannot send a friend request to yourself");
        return;
      }

      if (result.message === "Friend request already exists") {
        setErrorMessage("Friend request already exists");
        return;
      }

      if (result.message === "You are already friends") {
        setErrorMessage("You are already friends");
        return;
      }

      if (result.message === "User does not exist") {
        setErrorMessage("User does not exist");
        return;
      }

      toast.success("Friend request sent successfully!");
      setIdentifier(""); // Clear the input field after sending the request
    } catch {
      toast.error("Failed to send friend request. Please try again.");
    }
  };

  return (
    <div className="flex flex-col max-w-md mx-auto bg-slate-950 p-5 rounded-md shadow-md border-slate-700 border-2">
      <CustomInput
        id="friend-identifier"
        label="Send Friend Request"
        placeholder="Enter friend's username or id"
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
        disabled={!identifier}
        onClick={() => handleSendFriendRequest(identifier)}
        className="bg-blue-800 py-2 px-10 rounded-md shadow-md border-2 border-blue-500 text-md cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
      >
        Send Request
      </button>
    </div>
  );
}
