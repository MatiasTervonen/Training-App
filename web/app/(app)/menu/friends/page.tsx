"use client";

import FriendRequestForm from "@/features/menu/friends/FriendRequestForm";
import FriendCard from "@/features/menu/friends/FriendCard";
import { FriendCardSkeleton } from "@/ui/loadingSkeletons/skeletons";
import { getFirends } from "@/database/friends/get-friends";
import { useQuery } from "@tanstack/react-query";

type Friends = {
  id: string;
  created_at?: string;
  user: {
    display_name: string;
    id: string;
    profile_picture: string | null;
  } | null;
};

export default function FriendsPage() {
  const {
    data,
    error: friendsError,
    isLoading,
  } = useQuery<Friends[]>({
    queryKey: ["get-friends"],
    queryFn: getFirends,
  });

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className=" text-center mb-10 text-2xl">Friends</h1>
      <FriendRequestForm />
      <div className="flex flex-col items-center justify-center mt-5 px-2 rounded-md shadow-md bg-slate-950 border-slate-700 border-2">
        <div className="flex items-center justify-center mt-5 mb-10">
          <h2 className="text-2xl">My Friends</h2>
        </div>
        {friendsError ? (
          <p className="text-red-500">Failed to load friends</p>
        ) : isLoading ? (
          <FriendCardSkeleton count={3} />
        ) : data?.length === 0 ? (
          <p className="text-gray-400 my-10">No friends found</p>
        ) : (
          data!.map((friend) => {
            return (
              <div key={friend.id} className="mb-3 w-full">
                <FriendCard
                  id={friend.id}
                  created_at={friend.created_at}
                  user={friend.user!}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
