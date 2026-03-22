"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import Modal from "@/components/modal";
import { useFriends } from "@/features/menu/friends/hooks/useFriends";
import { MessageCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";

type FriendPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (friendId: string) => void;
  title: string;
};

export default function FriendPickerModal({
  isOpen,
  onClose,
  onSelect,
  title,
}: FriendPickerModalProps) {
  const { t } = useTranslation("chat");
  const { data: friends, isLoading } = useFriends();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg mb-4">{title}</h2>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-pulse"
              >
                <div className="w-10 h-10 bg-slate-700 rounded-full" />
                <div className="h-4 bg-slate-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : !friends || friends.length === 0 ? (
          <EmptyState icon={MessageCircle} title={t("chat.noFriends")} />
        ) : (
          <div className="flex flex-col gap-1">
            {friends.filter((f) => f.user).map((friend) => (
              <button
                key={friend.id}
                onClick={() => onSelect(friend.user!.id)}
                className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-800 transition-colors w-full"
              >
                <Image
                  src={friend.user!.profile_picture || "/default-avatar.png"}
                  alt={friend.user!.display_name || ""}
                  width={40}
                  height={40}
                  className="rounded-full w-10 h-10 object-cover"
                />
                <span className="text-sm">
                  {friend.user!.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
