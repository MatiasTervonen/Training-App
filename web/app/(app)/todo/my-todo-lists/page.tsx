"use client";

import { useState } from "react";
import Modal from "@/app/(app)/components/modal";
import FeedCard from "@/app/(app)/components/feed-cards/FeedCard";
import TodoSession from "@/app/(app)/components/expand-session-cards/todo";
import EditTodo from "@/app/(app)/components/edit-session-cards/EditTodo";
import Spinner from "@/app/(app)/components/spinner";
import { FeedSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import { FeedItemUI } from "@/app/(app)/types/session";
import useMyTodoFeed from "@/app/(app)/todo/hooks/useMyTodoFeed";
import useTodoTogglePin from "@/app/(app)/todo/hooks/useTodoTogglePin";
import useTodoDeleteSession from "@/app/(app)/todo/hooks/useTodoDeleteSession";
import useTodoUpdateFeedItemToTop from "@/app/(app)/todo/hooks/useTodoUpdateFeedItemToTop";
import PinnedCarousel from "./components/PinnedCarousel";
import { useQuery } from "@tanstack/react-query";
import { getFullTodoSession } from "@/app/(app)/database/todo/get-full-todo";
import { full_todo_session } from "@/app/(app)/types/models";

export default function MyTodoListsPage() {
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedExpandedChanges, setHasUnsavedExpandedChanges] = useState(false);

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
  } = useMyTodoFeed();

  const { togglePin } = useTodoTogglePin();
  const { handleDelete } = useTodoDeleteSession();
  const { updateFeedItemToTop } = useTodoUpdateFeedItemToTop();

  const todoId = expandedItem?.source_id ?? editingItem?.source_id ?? null;

  const {
    data: TodoSessionFull,
    error: TodoSessionError,
    isLoading: isLoadingTodoSession,
    refetch: refetchFullTodo,
  } = useQuery<full_todo_session>({
    queryKey: ["fullTodoSession", todoId],
    queryFn: async () => await getFullTodoSession(todoId!),
    enabled: !!todoId,
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
            Failed to load todo lists. Please try again later.
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">
            No todo lists yet. Create a todo list to see it here!
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
                <p>Loading more...</p>
                <Spinner />
              </div>
            )}

            {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

            {!hasNextPage && data?.pages.length > 1 && (
              <p className="text-center justify-center mt-10 text-gray-300">
                No more todo lists
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
                    setHasUnsavedExpandedChanges(false);
                  }}
                  onDirtyChange={setHasUnsavedExpandedChanges}
                />
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
          </Modal>
        )}
      </div>
    </div>
  );
}
