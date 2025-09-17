"use client";

import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import useSWR from "swr";
import FriendRequestForm from "./components/FriendRequestForm";
import FriendCard from "./components/FriendCard";
import { Friends } from "@/app/(app)/types/models";
import { FriendCardSkeleton } from "../../ui/loadingSkeletons/skeletons";
import { fetcher } from "../../lib/fetcher";

export default function FriendsPage() {
  const {
    data,
    error: friendsError,
    isLoading,
  } = useSWR<{ friends: Friends[]; currentUserid: string }>(
    "/api/friend/get-friends",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );
  const friends = data?.friends || [];

  return (
    <ModalPageWrapper>
      <div className="p-5 h-full text-gray-100 max-w-md mx-auto">
        <h1 className="text-gray-100 text-center  my-5 text-2xl">Friends</h1>
        <FriendRequestForm />
        <div className="flex flex-col items-center justify-center mt-5 px-2 rounded-md shadow-xl bg-slate-950">
          <div className="flex items-center justify-center mt-5 mb-10">
            <h2 className="text-2xl">My Friends</h2>
          </div>
          {friendsError ? (
            <p className="text-red-500">Failed to load friends</p>
          ) : isLoading ? (
            <FriendCardSkeleton count={3} />
          ) : friends.length === 0 ? (
            <p className="text-gray-400 my-10">No friends found</p>
          ) : (
            friends.map((friend: Friends) => {
              return (
                <div key={friend.id} className="mb-3 w-full">
                  <FriendCard friend={friend} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </ModalPageWrapper>
  );
}
