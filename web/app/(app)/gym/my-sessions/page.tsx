"use client";

import { useState } from "react";
import Modal from "@/app/(app)/components/modal";
import FeedCard from "@/app/(app)/components/feed-cards/FeedCard";
import GymSession from "@/app/(app)/components/expand-session-cards/gym";
import Spinner from "@/app/(app)/components/spinner";
import { FeedSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import { useRouter } from "next/navigation";
import { FeedItemUI } from "@/app/(app)/types/session";
import useMyGymFeed from "@/app/(app)/gym/hooks/useMyGymFeed";
import useGymTogglePin from "@/app/(app)/gym/hooks/useGymTogglePin";
import useGymDeleteSession from "@/app/(app)/gym/hooks/useGymDeleteSession";
import PinnedCarousel from "./components/PinnedCarousel";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/app/(app)/database/gym/get-full-gym-session";
import { full_gym_session } from "@/app/(app)/types/models";

export default function MySessionsPage() {
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);

  const router = useRouter();

  const {
    data,
    error,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
    containerRef,
    pullDistance,
    refreshing,
    loadMoreRef,
  } = useMyGymFeed();

  const { togglePin } = useGymTogglePin();
  const { handleDelete } = useGymDeleteSession();

  const gymId = expandedItem?.source_id ?? null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", gymId],
    queryFn: async () => await getFullGymSession(gymId!),
    enabled: !!gymId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return (
    <div className="h-full">
      <div
        ref={containerRef}
        className="max-w-3xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full"
      >
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          {refreshing ? (
            <div className="flex text-xl items-center gap-4">
              <p>Refreshing...</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="text-gray-100/70">Pull to refresh...</p>
            </div>
          ) : null}
        </div>



        {isLoading && !data ? (
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="text-center text-lg mt-10">
            Failed to load sessions. Please try again later.
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">
            No gym sessions yet. Start a workout to see your sessions here!
          </p>
        ) : (
          <>
            <PinnedCarousel
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              togglePin={togglePin}
              handleDelete={handleDelete}
            />

            {unpinnedFeed.map((feedItem) => {
              return (
                <div className="mt-8" key={feedItem.id}>
                  <FeedCard
                    item={feedItem}
                    pinned={false}
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(
                        feedItem.id,
                        feedItem.type,
                        feedItem.feed_context
                      )
                    }
                    onDelete={() =>
                      handleDelete(feedItem.source_id, feedItem.type)
                    }
                    onEdit={() => {
                      router.push(`/gym/gym/${feedItem.source_id}/edit`);
                    }}
                  />
                </div>
              );
            })}
            {isFetchingNextPage && (
              <div className="flex flex-col gap-2 items-center mt-10">
                <p>Loading more...</p>
                <Spinner />
              </div>
            )}

            {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

            {!hasNextPage && data?.pages.length > 1 && (
              <p className="text-center justify-center mt-10 text-gray-300">
                No more sessions
              </p>
            )}
          </>
        )}

        {expandedItem && (
          <Modal onClose={() => setExpandedItem(null)} isOpen={true}>
            {isLoadingGymSession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                <p>Loading gym session details...</p>
                <Spinner />
              </div>
            ) : GymSessionError ? (
              <p className="text-center text-lg mt-40 px-10">
                Failed to load gym session details. Please try again later.
              </p>
            ) : (
              GymSessionFull && <GymSession {...GymSessionFull} />
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
