"use client";

import TitleInput from "@/app/(app)/training/components/TitleInput";
import { useState } from "react";
import toast from "react-hot-toast";

export default function FriendRequestForm() {
  const [identifier, setIdentifier] = useState("");

  const sendFriendRequest = async (identifier: string) => {
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
  };

  return (
    <div className="flex flex-col max-w-md mx-auto bg-slate-950 p-5 rounded-md shadow-xl">
      <TitleInput
        id="friend-identifier"
        label="Send Friend Request"
        placeholder="Enter friend's username or id"
        title={identifier}
        setTitle={setIdentifier}
      />
      <button
        onClick={() => sendFriendRequest(identifier)}
        className="w-fit mt-5 bg-blue-800 py-2 px-10 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
      >
        Send Request
      </button>
    </div>
  );
}
