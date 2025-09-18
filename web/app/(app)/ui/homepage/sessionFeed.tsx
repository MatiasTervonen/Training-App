"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import NotesSession from "@/app/(app)/components/expandSession/notes";
import Modal from "@/app/(app)/components/modal";
import { useInView } from "react-intersection-observer";
import FeedCard from "@/app/(app)/components/FeedCard";
import { Pin } from "lucide-react";
import EditNote from "@/app/(app)/ui/editSession/EditNotes";
import EditGym from "@/app/(app)/ui/editSession/EditGym";
import GymSession from "@/app/(app)/components/expandSession/gym";
import useSWR from "swr";
import Spinner from "@/app/(app)/components/spinner";
import usePullToRefresh from "@/app/(app)/lib/usePullToRefresh";
import WeightSession from "@/app/(app)/components/expandSession/weight";
import EditWeight from "@/app/(app)/ui/editSession/EditWeight";
import toast from "react-hot-toast";
import { FeedSkeleton } from "../loadingSkeletons/skeletons";
import { full_gym_session, full_todo_session } from "@/app/(app)/types/models";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { Feed_item } from "@/app/(app)/types/session";
import useSWRInfinite from "swr/infinite";
import { getFeedKey } from "@/app/(app)/lib/feedKeys";
import TodoSession from "@/app/(app)/components/expandSession/todo";
import EditTodo from "@/app/(app)/ui/editSession/EditTodo";

type FeedItem = {
  table: "notes" | "weight" | "gym_sessions" | "todo_lists";
  item: Feed_item;
  pinned: boolean;
};

type FeedResponse = {
  feed: Feed_item[];
  nextPage: number | null;
};

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  const loadingMoreRef = useRef(false);

  const hasTriggeredWhileVisibleRef = useRef(false);

  const {
    data,
    error,
    isLoading,
    mutate: mutateFeed,
    setSize,
    isValidating,
  } = useSWRInfinite<FeedResponse>(getFeedKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateFirstPage: false, // Prevent revalidating page 1 unnecessarily
  });

  const hasNextPage = useMemo(() => {
    if (!data || data.length === 0) return false;
    return Boolean(data[data.length - 1]?.nextPage);
  }, [data]);

  function getCanonicalId(item: { id?: string; item_id?: string }) {
    return item.item_id ?? item.id ?? "";
  }

  // Load more when the bottom of the feed is in view
  useEffect(() => {
    if (!inView) {
      hasTriggeredWhileVisibleRef.current = false;
      return;
    }
    if (hasTriggeredWhileVisibleRef.current) return;
    if (!hasNextPage) return;
    if (loadingMoreRef.current) return;

    hasTriggeredWhileVisibleRef.current = true;
    loadingMoreRef.current = true;

    setSize((prev) => prev + 1).finally(() => {
      loadingMoreRef.current = false;
    });
  }, [inView, hasNextPage, setSize]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: async () => {
      await mutateFeed();
    },
  });

  // Flattens the data in single array of FeedItem[]

  const feed: FeedItem[] = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) =>
      page.feed.map((item) => {
        return {
          table: item.type as FeedItem["table"],
          item: { ...item, id: getCanonicalId(item) },
          pinned: item.pinned,
        } as FeedItem;
      })
    );
  }, [data]);

  // Pinned items first, then by created_at desc for stable ordering in UI
  const sortedFeed = useMemo(() => {
    const arr = [...feed];
    return arr.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const ad = a.item.created_at ? new Date(a.item.created_at).getTime() : 0;
      const bd = b.item.created_at ? new Date(b.item.created_at).getTime() : 0;
      return bd - ad;
    });
  }, [feed]);

  const togglePin = async (
    item_id: string,
    table: string,
    isPinned: boolean,
    notes?: string,
    title?: string,
    weight?: number,
    duration?: number
  ) => {
    const endpoint = isPinned
      ? "/api/pinned/unpin-items"
      : "/api/pinned/pin-items";

    const snapshot = data
      ? data.map((page) => ({
          ...page,
          feed: page.feed.map((item) => ({ ...item })),
        }))
      : undefined;

    await mutateFeed(
      (currentPages = []) => {
        return currentPages.map((page) => ({
          ...page,
          feed: page.feed.map((item) => {
            const matches = item.id === item_id || item.item_id === item_id;
            return matches ? { ...item, pinned: !isPinned } : item;
          }),
        }));
      },
      { revalidate: false }
    );

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: item_id,
          table,
          notes,
          title,
          weight,
          duration,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle pin");
      }

      toast.success(
        `Item has been ${isPinned ? "unpinned" : "pinned"} successfully.`
      );
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      toast.error("Failed to toggle pin");
      mutateFeed(snapshot, { revalidate: false });
    }
  };

  const handleDelete = async (item_id: string, table: string) => {
    const confirmDetlete = confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmDetlete) return;

    const snapshot = data
      ? data.map((page) => ({
          ...page,
          feed: page.feed.map((item) => ({ ...item })),
        }))
      : undefined;

    await mutateFeed(
      (currentPages = []) => {
        return currentPages.map((page) => ({
          ...page,
          feed: page.feed.filter(
            (item) => !(item.id === item_id && item.type === table)
          ),
        }));
      },
      { revalidate: false }
    );

    try {
      const res = await fetch("/api/delete-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id, table }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete session");
      }

      toast.success("Item has been deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete session");
      console.error("Failed to delete session:", error);
      mutateFeed(snapshot, { revalidate: false });
    }
  };

  const getId = (fi: FeedItem | null) => fi?.item.id ?? null;

  const expandedId = getId(expandedItem);
  const editingId = getId(editingItem);

  const gymId =
    expandedItem?.table === "gym_sessions"
      ? expandedId
      : editingItem?.table === "gym_sessions"
      ? editingId
      : null;

  const todoId =
    expandedItem?.table === "todo_lists"
      ? expandedId
      : editingItem?.table === "todo_lists"
      ? editingId
      : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
    mutate: mutateFullSession,
  } = useSWR<full_gym_session>(
    gymId ? `/api/gym/get-full-gym-session?id=${gymId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  const {
    data: TodoSessionFull,
    error: TodoSessionError,
    isLoading: isLoadingTodoSession,
    mutate: mutateFullTodoSession,
  } = useSWR<full_todo_session>(
    todoId ? `/api/todo-list/get-full-todo-session?id=${todoId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  return (
    <>
      <div
        ref={containerRef}
        className="max-w-3xl mx-auto relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800  px-5 pt-3 pb-20 text-gray-100 overflow-y-auto touch-pan-y"
      >
        <div
          className="flex items-center justify-center text-white transition-all"
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
            <FeedSkeleton count={5} />
          </>
        ) : error ? (
          <p className="text-center text-lg mt-10 ">
            Failed to load sessions. Please try again later.
          </p>
        ) : !data || feed.length === 0 ? (
          <p className="text-center text-lg mt-10">
            No sessions yet. Let&apos;s get started!
          </p>
        ) : (
          <>
            {sortedFeed.map((feedItem) => {
              const isPinned = feedItem.pinned;

              return (
                <div key={feedItem.item.id}>
                  {isPinned && (
                    <div className="flex items-center gap-2 mb-2">
                      <Pin size={20} />
                      <p className="text-gray-400">Pinned</p>
                    </div>
                  )}
                  {!isPinned && <div className="mt-[32px]"></div>}
                  <FeedCard
                    {...feedItem}
                    pinned={isPinned}
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(
                        getCanonicalId(feedItem.item),
                        feedItem.table,
                        isPinned,
                        feedItem.item.notes ?? "",
                        feedItem.item.title ?? "",
                        feedItem.item.weight ?? undefined,
                        feedItem.item.duration ?? undefined
                      )
                    }
                    onDelete={() =>
                      handleDelete(feedItem.item.id!, feedItem.table)
                    }
                    onEdit={() => {
                      setEditingItem(feedItem);
                    }}
                  />
                </div>
              );
            })}
            {feed.length > 0 && hasNextPage && (
              <div ref={ref} className="h-10" />
            )}
            {isValidating && (
              <div className="flex flex-col gap-2 items-center">
                <p>Loading...</p>
                <Spinner />
              </div>
            )}
          </>
        )}

        {expandedItem && (
          <Modal onClose={() => setExpandedItem(null)} isOpen={true}>
            {/* <div className="flex justify-end pr-15 pt-2">
              <button
                onClick={() => {
                  setEditingItem(expandedItem);
                  setExpandedItem(null);
                }}
                className="gap-2 px-4 bg-blue-800 py-1 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
              >
                Edit
              </button>
            </div> */}
            {expandedItem.table === "notes" && (
              <NotesSession {...expandedItem.item} />
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
                  <p className="text-center text-lg mt-10">
                    Failed to load todo session details. Please try again later.
                  </p>
                ) : (
                  TodoSessionFull && (
                    <TodoSession
                      initialTodo={TodoSessionFull}
                      mutateFullTodoSession={async () => {
                        await mutateFullTodoSession();
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
            {editingItem.table === "gym_sessions" && (
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
                  GymSessionFull && (
                    <EditGym
                      gym_session={GymSessionFull}
                      onClose={() => setEditingItem(null)}
                      onSave={async () => {
                        await Promise.all([
                          mutateFeed(),
                          mutateFullSession?.(),
                        ]);

                        setEditingItem(null);
                      }}
                    />
                  )
                )}
              </>
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
                        await Promise.all([
                          mutateFeed(),
                          mutateFullTodoSession(),
                        ]);

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
    </>
  );
}
