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
import { full_gym_session } from "@/app/(app)/types/models";
import { fetcher } from "../../lib/fetcher";
import { feed_view } from "@/app/(app)/types/session";
import useSWRInfinite from "swr/infinite";
import { getFeedKey } from "../../lib/feedKeys";

type FeedItem = {
  table: "notes" | "weight" | "gym_sessions";
  item: feed_view;
  pinned: boolean;
};

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  const loadingMoreRef = useRef(false);

  const {
    data,
    error,
    isLoading,
    mutate: mutateFeed,
    setSize,
    isValidating,
  } = useSWRInfinite<{
    feed: feed_view[];
    nextPage: number | null;
  }>(getFeedKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateFirstPage: false, // Prevent revalidating page 1 unnecessarily
  });

  const hasNextPage = useMemo(() => {
    if (!data || data.length === 0) return false;
    return Boolean(data[data.length - 1]?.nextPage);
  }, [data]);

  // Load more when the bottom of the feed is in view
  useEffect(() => {
    if (!inView) return;
    if (!hasNextPage) return;
    if (loadingMoreRef.current) return;
    if (isLoading || isValidating) return;

    loadingMoreRef.current = true;

    setSize((prev) => prev + 1).finally(() => {
      loadingMoreRef.current = false;
    });
  }, [inView, hasNextPage, isLoading, isValidating, setSize]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: async () => {
      await mutateFeed();
    },
  });

  // Flattens the data in single array of FeedItem[]

  const feed: FeedItem[] = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) =>
      page.feed.map((item) => ({
        table: item.type as FeedItem["table"],
        item: {
          ...item,
          id: item.pinned && item.item_id ? item.item_id : item.id,
        },
        pinned: item.pinned,
      }))
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
    duration?: number,
    created_at?: string
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
          created_at,
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

  // Use item_id for pinned items, id for non-pinned items
  const id =
    expandedItem?.table === "gym_sessions"
      ? expandedItem.pinned && expandedItem.item.item_id
        ? expandedItem.item.item_id
        : expandedItem.item.id
      : editingItem?.table === "gym_sessions"
      ? editingItem.pinned && editingItem.item.item_id
        ? editingItem.item.item_id
        : editingItem.item.id
      : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
    mutate: mutateFullSession,
  } = useSWR<full_gym_session>(
    id ? `/api/gym/get-full-gym-session?id=${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  console.log("sortedFeed:", sortedFeed);

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
                        feedItem.item.id!,
                        feedItem.table,
                        isPinned,
                        feedItem.item.notes ?? "",
                        feedItem.item.title ?? "",
                        feedItem.item.weight ?? undefined,
                        feedItem.item.duration ?? undefined,
                        feedItem.item.created_at ?? ""
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
          </Modal>
        )}

        {editingItem && (
          <Modal
            footerButton
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
