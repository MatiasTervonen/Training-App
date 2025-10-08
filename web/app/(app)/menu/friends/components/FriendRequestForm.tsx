"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState } from "react";
import toast from "react-hot-toast";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { handleError } from "@/app/(app)/utils/handleError";

export default function FriendRequestForm() {
  const [identifier, setIdentifier] = useState("");
  const { role } = useUserStore();

  const sendFriendRequest = async (identifier: string) => {
    try {
      const response = await fetch("/api/friend/send-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send friend request");
        return;
      }

      toast.success("Friend request sent successfully!");
      setIdentifier(""); // Clear the input field after sending the request
    } catch (error) {
      handleError(error, {
        message: "Error sending friend request",
        route: "/api/friend/send-request",
        method: "POST",
      });
      toast.error("Failed to send friend request. Please try again.");
    }
  };

  return (
    <div className="flex flex-col max-w-md mx-auto bg-slate-950 p-5 rounded-md shadow-xl">
      <CustomInput
        id="friend-identifier"
        label="Send Friend Request"
        placeholder="Enter friend's username or id"
        value={identifier}
        setValue={setIdentifier}
      />
      {role === "guest" ? (
        <button
          disabled
          className="mt-5 w-full gap-2 bg-gray-400 py-2 rounded-md shadow-xl border-2 border-gray-300 text-gray-100 text-lg cursor-not-allowed"
        >
          Send Request
        </button>
      ) : (
        <button
          onClick={() => sendFriendRequest(identifier)}
          className="w-full mt-5 bg-blue-800 py-2 px-10 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
        >
          Send Request
        </button>
      )}
    </div>
  );
}
