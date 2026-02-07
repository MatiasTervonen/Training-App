"use client";

import { useState } from "react";
import NotesSession from "@/app/(app)/components/expand-session-cards/notes";
import Modal from "@/app/(app)/components/modal";
import FeedCard from "@/app/(app)/components/feed-cards/FeedCard";
import EditNote from "@/app/(app)/components/edit-session-cards/EditNotes";
import GymSession from "@/app/(app)/components/expand-session-cards/gym";
import Spinner from "@/app/(app)/components/spinner";
import WeightSession from "@/app/(app)/components/expand-session-cards/weight";
import EditWeight from "@/app/(app)/components/edit-session-cards/EditWeight";
import { FeedSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import TodoSession from "@/app/(app)/components/expand-session-cards/todo";
import EditTodo from "@/app/(app)/components/edit-session-cards/EditTodo";
import ReminderSession from "@/app/(app)/components/expand-session-cards/reminder";
import EditReminder from "@/app/(app)/components/edit-session-cards/EditGlobalReminder";
import { useRouter } from "next/navigation";
import useDeleteSession from "@/app/(app)/dashboard/hooks/useDeleteSession";
import useTogglePin from "@/app/(app)/dashboard/hooks/useTogglePin";
import { FeedItemUI } from "@/app/(app)/types/session";
import useFeed from "@/app/(app)/dashboard/hooks/useFeed";
import useFullSessions from "@/app/(app)/dashboard/hooks/useFullSessions";
import PinnedCarousel from "./pinnedCarousell";
import useUpdateFeedItem from "@/app/(app)/dashboard/hooks/useUpdateFeedItem";
import useUpdateFeedItemToTop from "@/app/(app)/dashboard/hooks/useUpdateFeedItemToTop";
import { useTranslation } from "react-i18next";
import ActivitySession from "@/app/(app)/activities/cards/activity-feed-expanded/activity";
import EditActivity from "@/app/(app)/activities/cards/activity-edit";

export default function SessionFeed() {
  const { t } = useTranslation("feed");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedExpandedChanges, setHasUnsavedExpandedChanges] = useState(false);

  const router = useRouter();

  // useFeed hook to get feed data
  // includes infinite scrolling, prefetching, sorting, and other feed related logic
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
  } = useFeed();

  // Toggle pin

  const { togglePin } = useTogglePin();

  // Delete session

  const { handleDelete } = useDeleteSession();

  // useFullSessions hook to get full sessions

  const {
    GymSessionFull,
    GymSessionError,
    isLoadingGymSession,
    TodoSessionFull,
    TodoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    refetchFullActivity,
  } = useFullSessions(expandedItem, editingItem);

  // useUpdateFeedItem hook to update feed item in cache
  const { updateFeedItem } = useUpdateFeedItem();

  // useUpdateFeedItem hook to update feed item in cache and move it to top
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

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
              <p>{t("feed.refreshing")}</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="text-gray-100/70">{t("feed.pullToRefresh")}</p>
            </div>
          ) : null}
        </div>
        {isLoading && !data ? (
          <>
            <FeedSkeleton count={6} />
          </>
        ) : error ? (
          <p className="text-center text-lg mt-10">{t("feed.failedToLoad")}</p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">{t("feed.noSessions")}</p>
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
                        feedItem.feed_context,
                      )
                    }
                    onDelete={() =>
                      handleDelete(feedItem.source_id, feedItem.type)
                    }
                    onEdit={() => {
                      if (feedItem.type === "gym_sessions") {
                        router.push(`/gym/gym/${feedItem.source_id}/edit`);
                      } else {
                        setEditingItem(feedItem);
                      }
                    }}
                  />
                </div>
              );
            })}
            {isFetchingNextPage && (
              <div className="flex flex-col gap-2 items-center mt-10">
                <p>{t("feed.loadingMore")}</p>
                <Spinner />
              </div>
            )}

            {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

            {!hasNextPage && data?.pages.length > 1 && (
              <p className="text-center justify-center mt-10 text-gray-300">
                {t("feed.noMoreSessions")}
              </p>
            )}
          </>
        )}

        {expandedItem && (
          <Modal
            onClose={() => {
              setHasUnsavedExpandedChanges(false);
              setExpandedItem(null);
            }}
            isOpen={true}
            confirmBeforeClose={hasUnsavedExpandedChanges}
          >
            {expandedItem.type === "notes" && (
              <NotesSession {...expandedItem} />
            )}
            {expandedItem.type === "global_reminders" && (
              <ReminderSession {...expandedItem} />
            )}

            {expandedItem.type === "local_reminders" && (
              <ReminderSession {...expandedItem} />
            )}

            {expandedItem.type === "gym_sessions" && (
              <>
                {isLoadingGymSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                    <p className="text-lg">{t("feed.loadingGym")}</p>
                    <Spinner />
                  </div>
                ) : GymSessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    {t("feed.failedToLoadGymSession")}
                  </p>
                ) : (
                  GymSessionFull && <GymSession {...GymSessionFull} />
                )}
              </>
            )}

            {expandedItem.type === "activity_sessions" && (
              <>
                {isLoadingActivitySession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                    <p className="text-lg">{t("feed.loadingActivity")}</p>
                    <Spinner />
                  </div>
                ) : activitySessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    {t("feed.activityError")}
                  </p>
                ) : (
                  activitySessionFull && (
                    <ActivitySession {...activitySessionFull} />
                  )
                )}
              </>
            )}

            {expandedItem.type === "weight" && (
              <WeightSession {...expandedItem} />
            )}

            {expandedItem.type === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                    <p>{t("feed.loadingTodoSession")}</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    {t("feed.failedToLoadTodoSession")}
                  </p>
                ) : (
                  TodoSessionFull && (
                    <TodoSession
                      initialTodo={TodoSessionFull}
                      onSave={async (updatedItem) => {
                        await Promise.all([
                          updateFeedItemToTop(updatedItem),
                          refetchFullTodo(),
                        ]);
                        setHasUnsavedExpandedChanges(false);
                      }}
                      onDirtyChange={setHasUnsavedExpandedChanges}
                    />
                  )
                )}
              </>
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
            {editingItem.type === "notes" && (
              <EditNote
                note={editingItem}
                onDirtyChange={setHasUnsavedChanges}
                onSave={(updatedItem) => {
                  updateFeedItemToTop(updatedItem);
                  setEditingItem(null);
                  setHasUnsavedChanges(false);
                }}
              />
            )}
            {editingItem.type === "global_reminders" && (
              <EditReminder
                reminder={editingItem}
                onClose={() => setEditingItem(null)}
                onDirtyChange={setHasUnsavedChanges}
                onSave={(updatedItem) => {
                  updateFeedItemToTop(updatedItem);
                  setEditingItem(null);
                  setHasUnsavedChanges(false);
                }}
              />
            )}
            {editingItem.type === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                    <p>{t("feed.loadingTodoSession")}</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    {t("feed.failedToLoadTodoSession")}
                  </p>
                ) : (
                  TodoSessionFull && (
                    <EditTodo
                      todo_session={TodoSessionFull}
                      onClose={() => setEditingItem(null)}
                      onDirtyChange={setHasUnsavedChanges}
                      onSave={async (updatedItem) => {
                        await Promise.all([
                          updateFeedItemToTop(updatedItem),
                          refetchFullTodo(),
                        ]);
                        setEditingItem(null);
                        setHasUnsavedChanges(false);
                      }}
                    />
                  )
                )}
              </>
            )}
            {editingItem.type === "weight" && (
              <EditWeight
                weight={editingItem}
                onClose={() => setEditingItem(null)}
                onDirtyChange={setHasUnsavedChanges}
                onSave={(updatedItem) => {
                  updateFeedItem(updatedItem);
                  setEditingItem(null);
                  setHasUnsavedChanges(false);
                }}
              />
            )}
            {editingItem.type === "activity_sessions" && (
              <>
                {isLoadingActivitySession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                    <p>{t("feed.loadingActivity")}</p>
                    <Spinner />
                  </div>
                ) : activitySessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    {t("feed.activityError")}
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
              </>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
