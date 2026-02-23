"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Friends } from "@/types/models";
import { deleteFriend } from "@/database/friends/delete-friend";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type FriendCardProps = {
  id: string;
  created_at?: string;
  user: {
    display_name: string;
    id: string;
    profile_picture: string | null;
  };
};

export default function FriendCard({ id, user }: FriendCardProps) {
  const { t } = useTranslation("menu");
  const queryClient = useQueryClient();

  const handleDeleteFriend = async () => {
    const confirmation = confirm(t("friends.deleteConfirmation"));
    if (!confirmation) return;

    const queryKey = ["get-friends"];

    await queryClient.cancelQueries({ queryKey });

    const previousData = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<Friends[]>(queryKey, (oldData) => {
      if (!oldData) return;

      return oldData.filter((f) => f.id !== id);
    });

    try {

      // Pass the friendship id not the actual user id.

      await deleteFriend(id);

      toast.success(t("friends.deleteSuccess"));
    } catch (error) {
      console.log("failed to delete friend", error);
      toast.error(t("friends.deleteError"));
      queryClient.setQueryData(queryKey, previousData);
    }
  };

  return (
    <div className="bg-slate-900 p-4 rounded-md shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Image
            src={user.profile_picture || "/default-avatar.png"}
            alt={t("friends.profilePicture")}
            width={40}
            height={40}
            className="rounded-full border-2 border-blue-500 w-10 h-10"
          />
          <h3 className="text-lg">{user.display_name}</h3>
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
