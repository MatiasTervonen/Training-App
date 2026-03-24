"use client";

import FriendRequestForm from "@/features/menu/friends/FriendRequestForm";
import FriendCard from "@/features/menu/friends/FriendCard";
import { FriendCardSkeleton } from "@/ui/loadingSkeletons/skeletons";
import { useFriends } from "@/features/menu/friends/hooks/useFriends";
import { useFriendRequests } from "@/features/menu/friends/hooks/useFriendRequests";
import { useAcceptFriendRequest } from "@/features/menu/friends/hooks/useAcceptFriendRequest";
import { useRejectFriendRequest } from "@/features/menu/friends/hooks/useRejectFriendRequest";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/EmptyState";
import { Users } from "lucide-react";

export default function FriendsPage() {
  const { t } = useTranslation("menu");
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const handleAccept = async (senderId: string) => {
    try {
      await acceptRequest.mutateAsync(senderId);
      toast.success(t("friends.acceptSuccess"));
    } catch {
      toast.error(t("friends.acceptError"));
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      toast.success(t("friends.rejectSuccess"));
    } catch {
      toast.error(t("friends.rejectError"));
    }
  };

  const isLoading = friendsLoading || requestsLoading;

  return (
    <div className="page-padding max-w-md mx-auto">
      <FriendRequestForm />

      {isLoading ? (
        <div className="mt-10">
          <FriendCardSkeleton count={3} />
        </div>
      ) : (
        <>
          {requests && requests.length > 0 && (
            <div className="mt-5 px-4 rounded-md shadow-md bg-slate-950 border-slate-700 border-[1.5px] mb-5">
              <div className="flex items-center justify-center mt-5 mb-5">
                <h2 className="text-lg">{t("friends.pendingRequests")}</h2>
              </div>
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-slate-900 p-4 rounded-md shadow-md mb-3"
                >
                  <p className="mb-3">{request.sender.display_name}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAccept(request.sender_id)}
                      disabled={acceptRequest.isPending}
                      className="btn-base flex-1 py-2 px-8 disabled:opacity-50"
                    >
                      {t("friends.accept")}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={rejectRequest.isPending}
                      className="btn-danger flex-1 py-2 px-8 disabled:opacity-50"
                    >
                      {t("friends.reject")}
                    </button>
                  </div>
                </div>
              ))}
              <div className="mb-3" />
            </div>
          )}

          <div className="mt-5 px-2 rounded-md shadow-md bg-slate-950 border-slate-700 border-[1.5px] min-h-[400px]">
            <div className="flex items-center justify-center mt-5 mb-10">
              <h2 className="text-2xl">{t("friends.myFriends")}</h2>
            </div>
            {friends && friends.length > 0 ? (
              friends.map((friend) => (
                <div key={friend.id} className="mb-3 w-full">
                  <FriendCard id={friend.id} user={friend.user!} />
                </div>
              ))
            ) : (
              <div className="mb-5">
                <EmptyState
                  icon={Users}
                  title={t("friends.noFriendsFound")}
                  description={t("friends.noFriendsFoundDesc")}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
