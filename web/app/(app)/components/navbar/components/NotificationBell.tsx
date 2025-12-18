"use client";

import { Bell } from "lucide-react";
import { formatDate } from "@/app/(app)/lib/formatDate";
import toast from "react-hot-toast";
import { FriendRequest } from "@/app/(app)/types/models";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequest } from "@/app/(app)/database/friends";
import { acceptFriendRequest } from "@/app/(app)/database/friends";
import CustomDropDown from "@/app/(app)/components/customDropDown";

export default function NotificationBell() {
  const { data: friendRequest } = useQuery({
    queryKey: ["get-FriendRequest"],
    queryFn: getFriendRequest,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const requests = friendRequest ?? [];

  const handleAcceptFriendRequest = async (sender_id: string) => {
    try {
      await acceptFriendRequest(sender_id);

      toast.success("Friend request accepted!");
    } catch (error) {
      toast.error("Failed to accept friend request");
      console.error("Error accepting friend request:", error);
    }
  };

  return (
    <div className="relative">
      {requests.length > 0 && (
        <div className="absolute flex items-center justify-center -top-1 -right-2  w-5 h-5 bg-red-500 z-50  rounded-full text-xs text-gray-100 ">
          {requests.length}
        </div>
      )}
      <CustomDropDown
        className="mr-[-110px] mt-2.5 bg-slate-950 border-blue-500"
        button={
          <div className="text-gray-100 border-2 p-2 rounded-full border-blue-500 cursor-pointer">
            <Bell size={20} />
          </div>
        }
      >
        <div className=" p-4 w-96">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <h1>Notifications</h1>
            <Bell size={20} />
          </div>
          <div>
            {requests.length === 0 && (
              <p className="text-gray-400 text-center">No new notifications</p>
            )}
            {requests.length > 0 &&
              requests.map((request: FriendRequest) => (
                <div
                  key={request.id}
                  className="mb-2 p-2 bg-gray-800 rounded-md"
                >
                  <p className="text-gray-400 text-sm mb-2">
                    {formatDate(request.created_at)}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <p>Friend request from</p>
                    <p>{request.sender?.display_name}</p>
                  </div>
                  <div className="flex gap-5 mt-4 text-sm text-gray-300">
                    <button
                      onClick={() =>
                        handleAcceptFriendRequest(request.sender_id)
                      }
                      className="bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-500 transition-colors"
                    >
                      Accept
                    </button>
                    <button className="bg-red-600 px-3 py-1 rounded-md hover:bg-red-500 transition-colors">
                      reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CustomDropDown>
    </div>
  );
}
