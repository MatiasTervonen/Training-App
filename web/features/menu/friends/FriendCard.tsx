"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useDeleteFriend } from "@/features/menu/friends/hooks/useDeleteFriend";
import { useTranslation } from "react-i18next";

type FriendCardProps = {
  id: string;
  user: {
    display_name: string;
    id: string;
    profile_picture: string | null;
  };
};

export default function FriendCard({ id, user }: FriendCardProps) {
  const { t } = useTranslation("menu");
  const deleteFriend = useDeleteFriend();

  const handleDeleteFriend = async () => {
    const confirmed = confirm(t("friends.deleteConfirmation"));
    if (!confirmed) return;

    try {
      await deleteFriend.mutateAsync(id);
      toast.success(t("friends.deleteSuccess"));
    } catch {
      toast.error(t("friends.deleteError"));
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
        <button
          onClick={handleDeleteFriend}
          disabled={deleteFriend.isPending}
          className="bg-red-600 px-2 py-2 rounded-md hover:bg-red-500 transition-colors text-gray-100 disabled:opacity-50"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
