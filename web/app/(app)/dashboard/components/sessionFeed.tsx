"use client";

import { useState } from "react";
import NotesSession from "@/app/(app)/components/expandSession/notes";
import Modal from "@/app/(app)/components/modal";
import FeedCard from "@/app/(app)/components/cards/FeedCard";
import EditNote from "@/app/(app)/components/editSession/EditNotes";
import GymSession from "@/app/(app)/components/expandSession/gym";
import Spinner from "@/app/(app)/components/spinner";
import WeightSession from "@/app/(app)/components/expandSession/weight";
import EditWeight from "@/app/(app)/components/editSession/EditWeight";
import { FeedSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import TodoSession from "@/app/(app)/components/expandSession/todo";
import EditTodo from "@/app/(app)/components/editSession/EditTodo";
import ReminderSession from "@/app/(app)/components/expandSession/reminder";
import EditReminder from "@/app/(app)/components/editSession/EditGlobalReminder";
import { useRouter } from "next/navigation";
import useDeleteSession from "@/app/(app)/dashboard/hooks/useDeleteSession";
import useTogglePin from "@/app/(app)/dashboard/hooks/useTogglePin";
import { FeedItem } from "@/app/(app)/types/models";
import useFeed from "@/app/(app)/dashboard/hooks/useFeed";
import useFullSessions from "@/app/(app)/dashboard/hooks/useFullSessions";
import useFeedPrefetch from "@/app/(app)/dashboard/hooks/useFeedPrefetch";
import PinnedCarousel from "./pinnedCarousell";

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  const router = useRouter();

  // useFeed hook to get feed data
  // includes infinite scrolling, prefetching, sorting, and other feed related logic
  const {
    data,
    error,
    isLoading,
    mutateFeed,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
    feed,
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
    LocalReminderFull,
    LocalReminderError,
    isLoadingLocalReminder,
    TodoSessionFull,
    TodoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
  } = useFullSessions(expandedItem, editingItem);

  // prefetch full sessions when feed finishes loading

  useFeedPrefetch(data);

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
        ) : !data || feed.length === 0 ? (
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
                <div className="mt-8" key={feedItem.item.id}>
                  <FeedCard
                    {...feedItem}
                    pinned={false}
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(feedItem.item.id, feedItem.table, false)
                    }
                    onDelete={() =>
                      handleDelete(feedItem.item.id, feedItem.table)
                    }
                    onEdit={() => {
                      if (feedItem.table === "gym_sessions") {
                        router.push(`/training/gym/${feedItem.item.id}/edit`);
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
            {expandedItem.table === "notes" && (
              <NotesSession {...expandedItem.item} />
            )}
            {expandedItem.table === "global_reminders" && (
              <ReminderSession {...expandedItem.item} />
            )}

            {expandedItem.table === "local_reminders" && (
              <>
                {isLoadingLocalReminder ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading reminder details...</p>
                    <Spinner />
                  </div>
                ) : LocalReminderError ? (
                  <p className="text-center text-lg mt-10">
                    Failed to load reminder details. Please try again later.
                  </p>
                ) : (
                  LocalReminderFull && (
                    <ReminderSession {...LocalReminderFull} />
                  )
                )}
              </>
            )}

            {expandedItem.table === "gym_sessions" && (
              <>
                {isLoadingGymSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading gym session details...</p>
                    <Spinner />
                  </div>
                ) : GymSessionError ? (
                  <p className="text-center text-lg mt-10">
                    Failed to load gym session details. Please try again later.
                  </p>
                ) : (
                  GymSessionFull && <GymSession {...GymSessionFull} />
                )}
              </>
            )}
            {expandedItem.table === "weight" && (
              <WeightSession {...expandedItem.item} />
            )}
            {expandedItem.table === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading todo session details...</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-20">
                    Failed to load todo session details. Please try again later.
                  </p>
                ) : (
                  TodoSessionFull && (
                    <TodoSession
                      initialTodo={TodoSessionFull}
                      mutateFullTodoSession={async () => {
                        await refetchFullTodo();
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
            {editingItem.table === "notes" && (
              <EditNote
                note={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await mutateFeed();

                  setEditingItem(null);
                }}
              />
            )}
            {editingItem.table === "global_reminders" && (
              <EditReminder
                reminder={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await mutateFeed();

                  setEditingItem(null);
                }}
              />
            )}
            {editingItem.table === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading todo session details...</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-10">
                    Failed to load todo session details. Please try again later.
                  </p>
                ) : (
                  TodoSessionFull && (
                    <EditTodo
                      todo_session={TodoSessionFull}
                      onClose={() => setEditingItem(null)}
                      onSave={async () => {
                        await Promise.all([mutateFeed(), refetchFullTodo()]);

                        setEditingItem(null);
                      }}
                    />
                  )
                )}
              </>
            )}
            {editingItem.table === "weight" && (
              <EditWeight
                weight={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await mutateFeed();
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
