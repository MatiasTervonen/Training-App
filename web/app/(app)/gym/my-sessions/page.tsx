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
import { useTranslation } from "react-i18next";
import FeedHeader from "../../dashboard/components/feedHeader";
import useFullSessions from "../../dashboard/hooks/useFullSessions";

export default function MySessionsPage() {
  const { t } = useTranslation(["gym", "common"]);
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);

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

  const { GymSessionFull, GymSessionError, isLoadingGymSession } =
    useFullSessions(expandedItem, editingItem);

  return (
    <div className="h-full">
      <div
        ref={containerRef}
        className="max-w-2xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full"
      >
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          {refreshing ? (
            <div className="flex text-xl items-center gap-4">
              <p>{t("common:feed.refreshing")}</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="text-gray-100/70">
                {t("common:feed.pullToRefresh")}
              </p>
            </div>
          ) : null}
        </div>

        {isLoading && !data ? (
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="text-center text-lg mt-10">
            {t("gym:gym.mySessions.loadError")}
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">
            {t("gym:gym.mySessions.noSessions")}
          </p>
        ) : (
          <>
            <FeedHeader
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              pinned_context="gym"
              queryKey={["myGymSessions"]}
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
                        feedItem.feed_context,
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
                <p>{t("common:feed.loadingMore")}</p>
                <Spinner />
              </div>
            )}

            {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

            {!hasNextPage && data?.pages.length > 1 && (
              <p className="text-center justify-center mt-10 text-gray-300">
                {t("common:feed.noMoreSessions")}
              </p>
            )}
          </>
        )}

        {expandedItem && (
          <Modal onClose={() => setExpandedItem(null)} isOpen={true}>
            {isLoadingGymSession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                <p>{t("gym:gym.mySessions.loadingDetails")}</p>
                <Spinner />
              </div>
            ) : GymSessionError ? (
              <p className="text-center text-lg mt-40 px-10">
                {t("gym:gym.mySessions.loadDetailsError")}
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
