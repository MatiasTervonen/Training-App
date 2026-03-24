"use client";

import { useState, useMemo, useCallback } from "react";
import Modal from "@/components/modal";
import FeedCard from "@/features/feed-cards/FeedCard";
import TodoSession from "@/features/todo/cards/todo-expanded";
import EditTodo from "@/features/todo/cards/todo-edit";
import Spinner from "@/components/spinner";
import { FeedSkeleton } from "@/ui/loadingSkeletons/skeletons";
import { FeedItemUI } from "@/types/session";
import useMyTodoFeed from "@/features/todo/hooks/useMyTodoFeed";
import useTodoTogglePin from "@/features/todo/hooks/useTodoTogglePin";
import useTodoDeleteSession from "@/features/todo/hooks/useTodoDeleteSession";
import useTodoUpdateFeedItemToTop from "@/features/todo/hooks/useTodoUpdateFeedItemToTop";
import { useQuery } from "@tanstack/react-query";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import { full_todo_session } from "@/types/models";
import FeedHeader from "@/features/dashboard/components/feedHeader";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

type TodoFilter = "active" | "completed" | "all";
const FILTERS: TodoFilter[] = ["active", "completed", "all"];
type TodoExtraFields = { completed?: number; total?: number } | null;

export default function TodoPage() {
  const { t } = useTranslation("todo");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedExpandedChanges, setHasUnsavedExpandedChanges] = useState(false);
  const [filter, setFilter] = useState<TodoFilter>("active");

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

  // Client-side filter
  const filterItem = useCallback((item: FeedItemUI) => {
    if (filter === "all") return true;
    const extra = item.extra_fields as TodoExtraFields;
    const completed = extra?.completed ?? 0;
    const total = extra?.total ?? 0;
    if (filter === "active") return completed < total;
    return total > 0 && completed === total;
  }, [filter]);

  const filteredPinned = useMemo(
    () => pinnedFeed.filter(filterItem),
    [pinnedFeed, filterItem]
  );
  const filteredUnpinned = useMemo(
    () => unpinnedFeed.filter(filterItem),
    [unpinnedFeed, filterItem]
  );

  const getEmptyMessage = () => {
    if (filter === "active") return t("todo.noActiveTodoLists");
    if (filter === "completed") return t("todo.noCompletedTodoLists");
    return t("todo.noTodoLists");
  };

  const getEmptyDescription = () => {
    if (filter === "active") return t("todo.noActiveTodoListsDesc");
    if (filter === "completed") return t("todo.noCompletedTodoListsDesc");
    return "";
  };

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
    <div className="h-full relative">
      <div
        ref={containerRef}
        className="max-w-2xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full"
      >
        {/* Filter tabs */}
        <div className="sticky top-0 z-10 bg-slate-800 rounded-lg mb-4">
          <div className="flex p-1 gap-2">
            {FILTERS.map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 px-3 rounded-md cursor-pointer transition-colors ${
                    isActive
                      ? "bg-slate-700 text-cyan-400"
                      : "text-gray-200 hover:text-gray-100"
                  }`}
                >
                  {t(`todo.filter.${f}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pull to refresh */}
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          {refreshing ? (
            <div className="flex text-xl items-center gap-4">
              <p className="font-body">Refreshing...</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="font-body text-gray-100/70">Pull to refresh...</p>
            </div>
          ) : null}
        </div>

        {isLoading && !data ? (
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="font-body text-center text-lg mt-10">
            {t("todo.failedToLoad")}
          </p>
        ) : !data ||
          (filteredUnpinned.length === 0 && filteredPinned.length === 0) ? (
          <div className="flex flex-col items-center mt-[15%] px-8">
            <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
              <ClipboardList size={36} className="text-slate-400" />
            </div>
            <p className="text-xl text-center mb-3">{getEmptyMessage()}</p>
            {getEmptyDescription() && (
              <p className="font-body text-sm text-gray-400 text-center">
                {getEmptyDescription()}
              </p>
            )}
          </div>
        ) : (
          <>
            <FeedHeader
              pinnedFeed={filteredPinned}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              pinned_context="todo"
              queryKey={["myTodoLists"]}
            />
            {filteredUnpinned.map((feedItem, i) => (
              <div className={i === 0 && filteredPinned.length === 0 ? "mt-2" : "mt-8"} key={feedItem.id}>
                <FeedCard
                  item={feedItem}
                  pinned={false}
                  onExpand={() => setExpandedItem(feedItem)}
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
                  onEdit={() => setEditingItem(feedItem)}
                />
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="flex flex-col gap-2 items-center mt-10">
                <p className="font-body">{t("todo.loadingMore")}</p>
                <Spinner />
              </div>
            )}

            {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

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
                <p className="font-body">{t("todo.loadingTodoList")}</p>
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

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-6 z-50 pointer-events-none">
        <Link
          href="/todo/create-todo"
          className="pointer-events-auto w-14 h-14 rounded-full bg-slate-800 border-[1.5px] border-cyan-400/60 shadow-lg shadow-cyan-400/30 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus size={30} className="text-cyan-400" />
        </Link>
      </div>
    </div>
  );
}
