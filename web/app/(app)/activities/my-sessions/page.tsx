"use client";

import { useState } from "react";
import Modal from "@/app/(app)/components/modal";
import FeedCard from "@/app/(app)/components/feed-cards/FeedCard";
import Spinner from "@/app/(app)/components/spinner";
import { FeedSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import { FeedItemUI } from "@/app/(app)/types/session";
import useMyActivityFeed from "@/app/(app)/activities/hooks/useMyActivityFeed";
import useActivityTogglePin from "@/app/(app)/activities/hooks/useActivityTogglePin";
import useActivityDeleteSession from "@/app/(app)/activities/hooks/useActivityDeleteSession";
import PinnedCarousel from "./components/PinnedCarousel";
import { useQuery } from "@tanstack/react-query";
import { getFullActivitySession } from "@/app/(app)/database/activities/get-full-activity-session";
import { useTranslation } from "react-i18next";
import ActivitySession from "@/app/(app)/activities/cards/activity-feed-expanded/activity";
import EditActivity from "@/app/(app)/activities/cards/activity-edit";
import { FullActivitySession } from "@/app/(app)/types/models";
import { useQueryClient } from "@tanstack/react-query";

export default function MyActivitySessionsPage() {
  const { t } = useTranslation(["activities", "common"]);
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const queryClient = useQueryClient();

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
  } = useMyActivityFeed();

  const { togglePin } = useActivityTogglePin();
  const { handleDelete } = useActivityDeleteSession();

  const activeItem = expandedItem || editingItem;
  const activityId = activeItem?.source_id ?? null;

  const {
    data: activitySessionFull,
    error: activitySessionError,
    isLoading: isLoadingActivitySession,
    refetch: refetchFullActivity,
  } = useQuery<FullActivitySession & { feed_context: "pinned" | "feed" }>({
    queryKey: ["fullActivitySession", activityId],
    queryFn: async () => {
      const data = await getFullActivitySession(activityId!);
      return { ...data, feed_context: activeItem!.feed_context };
    },
    enabled: !!activityId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const updateFeedItem = (updatedItem: FeedItemUI) => {
    queryClient.setQueryData(
      ["activitySessions"],
      (oldData: { pages: { items: FeedItemUI[] }[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          })),
        };
      }
    );
  };

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
              <p>{t("common:feed.refreshing")}</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="text-gray-100/70">{t("common:feed.pullToRefresh")}</p>
            </div>
          ) : null}
        </div>

        {isLoading && !data ? (
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="text-center text-lg mt-10">
            {t("activities:activities.mySessions.loadError")}
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">
            {t("activities:activities.mySessions.noSessions")}
          </p>
        ) : (
          <>
            <PinnedCarousel
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
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
                      setEditingItem(feedItem);
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
            {isLoadingActivitySession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                <p>{t("activities:activities.mySessions.loadingDetails")}</p>
                <Spinner />
              </div>
            ) : activitySessionError ? (
              <p className="text-center text-lg mt-40 px-10">
                {t("activities:activities.mySessions.loadDetailsError")}
              </p>
            ) : (
              activitySessionFull && <ActivitySession {...activitySessionFull} />
            )}
          </Modal>
        )}

        {editingItem && (
          <Modal
            isOpen={true}
            onClose={() => {
              setEditingItem(null);
            }}
          >
            {isLoadingActivitySession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                <p>{t("activities:activities.mySessions.loadingDetails")}</p>
                <Spinner />
              </div>
            ) : activitySessionError ? (
              <p className="text-center text-lg mt-40 px-10">
                {t("activities:activities.mySessions.loadDetailsError")}
              </p>
            ) : (
              activitySessionFull && (
                <EditActivity
                  activity={activitySessionFull}
                  onClose={() => setEditingItem(null)}
                  onSave={async (updatedItem) => {
                    await Promise.all([
                      updateFeedItem(updatedItem),
                      refetchFullActivity(),
                    ]);
                    setEditingItem(null);
                  }}
                />
              )
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
