import { Bell } from "lucide-react";
import useSWR, { mutate } from "swr";
import DropdownMenu from "@/app/(app)/components/dropdownMenu";
import { russoOne } from "@/app/ui/fonts";
import { formatDate } from "@/app/(app)/lib/formatDate";
import toast from "react-hot-toast";
import { FriendRequest } from "@/app/(app)/types/models";

export default function NotificationBell() {
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const { data: friendRequest } = useSWR<FriendRequest[]>(
    "/api/friend/get-request",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );
  const requests = friendRequest ?? [];

  const acceptFriendRequest = async (sender_id: string) => {
    mutate(
      "/api/friend/get-request",
      (prevRequests: FriendRequest[] | undefined) => {
        if (!prevRequests) return prevRequests;
        return prevRequests.filter(
          (request: FriendRequest) => request.sender_id !== sender_id
        );
      },
      false
    );

    try {
      const response = await fetch("/api/friend/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender_id }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }

      await response.json();

      mutate("/api/friend/get-request");
    } catch (error) {
      mutate("/api/friend/get-request");

      toast.error("Failed to accept friend request");
      console.error("Error accepting friend request:", error);
    }
  };

  return (
    <div className="relative">
      {requests.length > 0 && (
        <div className="absolute flex items-center justify-center -top-1 -right-2  w-5 h-5 bg-red-500 z-50  rounded-full text-xs text-gray-100 font-bold">
          {requests.length}
        </div>
      )}
      <DropdownMenu
        className="mr-[-110px] mt-[10px] bg-slate-950 border-blue-500"
        button={
          <div className="text-gray-100 border-2 p-2 rounded-full border-blue-500">
            <Bell size={20} />
          </div>
        }
      >
        <div
          className={`${russoOne.className} relative text-gray-100 p-4 w-96`}
        >
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
                  <div className="">
                    <p className="text-gray-400 text-sm mb-2">
                      {formatDate(request.created_at)}
                    </p>
                    <p className="text-gray-200">
                      Friend request from {request.sender.display_name}
                    </p>
                  </div>
                  <div className="flex gap-5 mt-4 text-sm text-gray-300">
                    <button
                      onClick={() => acceptFriendRequest(request.sender_id)}
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
      </DropdownMenu>
    </div>
  );
}
