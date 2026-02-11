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
import { useTranslation } from "react-i18next";
import ActivitySession from "@/app/(app)/activities/cards/activity-feed-expanded/activity";
import EditActivity from "@/app/(app)/activities/cards/activity-edit";
import FeedHeader from "../../dashboard/components/feedHeader";
import useFullSessions from "../../dashboard/hooks/useFullSessions";
import useUpdateFeedItem from "../../dashboard/hooks/useUpdateFeedItem";

export default function MyActivitySessionsPage() {
  const { t } = useTranslation(["activities", "common"]);
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const {
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    refetchFullActivity,
  } = useFullSessions(expandedItem, editingItem);

  // handle feed item updates
  const { updateFeedItem } = useUpdateFeedItem(["myActivitySessions"]);

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
            {t("activities:activities.mySessions.loadError")}
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">
            {t("activities:activities.mySessions.noSessions")}
          </p>
        ) : (
          <>
            <FeedHeader
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              pinned_context="activities"
              queryKey={["myActivitySessions"]}
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
              activitySessionFull && (
                <ActivitySession {...activitySessionFull} />
              )
            )}
          </Modal>
        )}

        {editingItem && (
          <Modal
            isOpen={true}
            onClose={() => {
              setEditingItem(null);
              setHasUnsavedChanges(false);
            }}
            confirmBeforeClose={hasUnsavedChanges}
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
                  onDirtyChange={setHasUnsavedChanges}
                  onSave={async (updatedItem) => {
                    await Promise.all([
                      updateFeedItem(updatedItem),
                      refetchFullActivity(),
                    ]);
                    setEditingItem(null);
                    setHasUnsavedChanges(false);
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
