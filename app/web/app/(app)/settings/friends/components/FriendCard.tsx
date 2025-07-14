import Image from "next/image";
import { Trash2 } from "lucide-react";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { Friends } from "@/app/(app)/types/models";

type FriendCardProps = {
  friend: Friends;
};

export default function FriendCard({ friend }: FriendCardProps) {
  const handleDeleteFriend = async () => {
    const confirmation = confirm(
      "Are you sure you want to delete this friend? This action cannot be undone."
    );
    if (!confirmation) return;

    // Optimistically update the UI
    mutate(
      "/api/friend/get-friends",
      (currentData?: { friends: Friends[]; currentUserId: string }) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          friends: currentData.friends.filter((f) => f.id !== friend.id),
        };
      },
      false
    );

    try {
      const response = await fetch("/api/friend/delete-friend", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId: friend.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete friend");
      }

      await response.json();
      mutate("/api/friend/get-friends"); // Revalidate the friends list
      toast.success("Friend deleted successfully!");
    } catch (error) {
      mutate("/api/friend/get-friends"); // Revalidate the friends list in case of error
      toast.error("Failed to delete friend");
      console.error("Error deleting friend:", error);
    }
  };

  return (
    <div className="bg-slate-900 p-4 rounded-md shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Image
            src={friend.user.profile_picture || "/default-avatar.png"}
            alt="Profile Picture"
            width={40}
            height={40}
            className="rounded-full border-2 border-blue-500 w-[40px] h-[40px]"
          />
          <h3 className="text-lg">{friend.user.display_name}</h3>
        </div>
        <div>
          <button
            onClick={() => handleDeleteFriend()}
            className="bg-red-600 px-2 py-2 rounded-md hover:bg-red-500 transition-colors text-gray-100"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
