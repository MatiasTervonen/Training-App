"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import FeedCard from "@/features/feed-cards/FeedCard";
import TodoSession from "@/features/todo/cards/todo-expanded";
import EditTodo from "@/features/todo/cards/todo-edit";
import Spinner from "@/components/spinner";
import { FeedSkeleton } from "@/ui/loadingSkeletons/skeletons";
import { FeedItemUI } from "@/types/session";
import useMyTodoFeed from "@/features/todo/hooks/useMyTodoFeed";
import useTogglePin from "@/hooks/useTogglePin";
import useTodoDeleteSession from "@/features/todo/hooks/useTodoDeleteSession";
import useTodoUpdateFeedItemToTop from "@/features/todo/hooks/useTodoUpdateFeedItemToTop";
import { useQuery } from "@tanstack/react-query";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import { full_todo_session } from "@/types/models";
import FeedHeader from "@/features/dashboard/components/feedHeader";
import EmptyState from "@/components/EmptyState";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MyTodoListsPage() {
  const { t } = useTranslation(["todo", "common"]);
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

  const { togglePin } = useTogglePin(["myTodoLists"], "todo");
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
  });

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
              <p className="font-body">{t("common:feed.refreshing")}</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="font-body text-gray-100/70">{t("common:feed.pullToRefresh")}</p>
            </div>
          ) : null}
        </div>

        {isLoading && !data ? (
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="font-body text-center text-lg mt-10">
            {t("todo.failedToLoad")}
          </p>
        ) : (
          <>
            <FeedHeader
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              pinned_context="todo"
              queryKey={["myTodoLists"]}
            />

            {unpinnedFeed.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={t("todo.noTodoLists")}
                description={t("todo.noTodoListsDesc")}
              />
            ) : (
              <>
                {unpinnedFeed.map((feedItem, i) => {
                  return (
                    <div className={i === 0 && pinnedFeed.length === 0 ? "mt-2" : "mt-8"} key={feedItem.id}>
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
                    <p className="font-body">{t("common:feed.loadingMore")}</p>
                    <Spinner />
                  </div>
                )}

                {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

                {!hasNextPage && (data?.pages.length ?? 0) > 1 && (
                  <p className="font-body text-center justify-center mt-10 text-gray-300">
                    {t("todo.noMoreTodoLists")}
                  </p>
                )}
              </>
            )}
          </>
        )}

        {expandedItem && (
          <Modal
            onClose={() => { setExpandedItem(null); setHasUnsavedExpandedChanges(false); }}
            isOpen={true}
            confirmBeforeClose={hasUnsavedExpandedChanges}
          >
            {isLoadingTodoSession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                <p className="font-body">{t("todo.loadingDetails")}</p>
                <Spinner />
              </div>
            ) : TodoSessionError ? (
              <p className="font-body text-center text-lg mt-40 px-10">
                {t("todo.failedToLoadDetails")}
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
                  onDirtyChange={setHasUnsavedExpandedChanges}
                />
              )
            )}
          </Modal>
        )}

        {editingItem && (
          <Modal
            isOpen={true}
            onClose={() => { setEditingItem(null); setHasUnsavedChanges(false); }}
            confirmBeforeClose={hasUnsavedChanges}
          >
            {isLoadingTodoSession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                <p className="font-body">{t("todo.loadingDetails")}</p>
                <Spinner />
              </div>
            ) : TodoSessionError ? (
              <p className="font-body text-center text-lg mt-40 px-10">
                {t("todo.failedToLoadDetails")}
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
                  }}
                  onDirtyChange={setHasUnsavedChanges}
                />
              )
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
