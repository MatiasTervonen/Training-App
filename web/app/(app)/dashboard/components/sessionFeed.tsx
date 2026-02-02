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

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);

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
          <>
            <FeedSkeleton count={6} />
          </>
        ) : error ? (
          <p className="text-center text-lg mt-10">
            Failed to load sessions. Please try again later.
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">
            No sessions yet. Let&apos;s get started!
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
              </>
            )}
            {expandedItem.type === "weight" && (
              <WeightSession {...expandedItem} />
            )}
            {expandedItem.type === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                    <p>Loading todo session details...</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    Failed to load todo session details. Please try again later.
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
                      }}
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
            }}
          >
            {editingItem.type === "notes" && (
              <EditNote
                note={editingItem}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItemToTop(updatedItem);
                  setEditingItem(null);
                }}
              />
            )}
            {editingItem.type === "global_reminders" && (
              <EditReminder
                reminder={editingItem}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItemToTop(updatedItem);
                  setEditingItem(null);
                }}
              />
            )}
            {editingItem.type === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                    <p>Loading todo session details...</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    Failed to load todo session details. Please try again later.
                  </p>
                ) : (
                  TodoSessionFull && (
                    <EditTodo
                      todo_session={TodoSessionFull}
                      onClose={() => setEditingItem(null)}
                      onSave={async (updatedItem) => {
                        await Promise.all([
                          updateFeedItemToTop(updatedItem),
                          refetchFullTodo(),
                        ]);
                        setEditingItem(null);
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
                onSave={(updatedItem) => {
                  updateFeedItem(updatedItem);
                  setEditingItem(null);
                }}
              />
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
