"use client";

import { useState, useEffect } from "react";
import { russoOne } from "@/app/ui/fonts";
import { useRouter } from "next/navigation";
import NotesSession from "@/app/(app)/components/expandSession/notes";
import Modal from "@/app/(app)/components/modal";
import { useInView } from "react-intersection-observer";
import FeedCard from "@/app/(app)/components/FeedCard";
import { Pin } from "lucide-react";
import EditNote from "@/app/(app)/ui/editSession/EditNotes";
import EditGym from "@/app/(app)/ui/editSession/EditGym";
import GymSession from "@/app/(app)/components/expandSession/gym";
import useSWR, { mutate } from "swr";
import Spinner from "@/app/(app)/components/spinner";
import usePullToRefresh from "@/app/(app)/lib/usePullToRefresh";
import WeightSession from "@/app/(app)/components/expandSession/weight";
import EditWeight from "@/app/(app)/ui/editSession/EditWeight";
import toast from "react-hot-toast";
import { FeedSkeleton } from "../loadingSkeletons/skeletons";
import { notes, weight, full_gym_session } from "@/app/(app)/types/models";
import { fetcher } from "../../lib/fetcher";

type FeedItem =
  | { table: "notes"; item: notes; pinned: boolean }
  | { table: "weight"; item: weight; pinned: boolean }
  | { table: "gym_sessions"; item: full_gym_session; pinned: boolean };

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(10);
  const { ref, inView } = useInView({
    threshold: 0,
  });
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: async () => {
      await mutate("/api/feed");
    },
  });

  const {
    data: feed = [],
    error,
    isLoading,
  } = useSWR<FeedItem[]>("/api/feed", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (inView && visibleCount < feed.length) {
      setVisibleCount((prev) => prev + 10);
    }
  }, [inView, feed.length, visibleCount]);

  const togglePin = async (
    item_id: string,
    table: string,
    isPinned: boolean
  ) => {
    const endpoint = isPinned
      ? "/api/pinned/unpin-items"
      : "/api/pinned/pin-items";

    mutate(
      "/api/feed",
      (currentFeed: FeedItem[] = []) => {
        return currentFeed.map((item) => {
          if (item.item.id === item_id && item.table === table) {
            return { ...item, pinned: !isPinned };
          }
          return item;
        });
      },
      false
    ); // Optimistically update the feed

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item_id: item_id, table }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Failed to toggle pin:", data.error);
      toast.error("Failed to toggle pin");
      mutate("/api/feed");
      return;
    }

    mutate("/api/feed");
  };

  const handleDelete = async (item_id: string, table: string) => {
    const confirmDetlete = confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmDetlete) return;

    mutate(
      "/api/feed",
      (currentFeed: FeedItem[] = []) => {
        return currentFeed.filter(
          (item) => !(item.item.id === item_id && item.table === table)
        );
      },
      false
    ); // Optimistically update the feed

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

      await res.json();
      mutate("/api/feed");
    } catch (error) {
      mutate("/api/feed");

      toast.error("Failed to delete session");
      console.error("Failed to delete session:", error);
    }
  };

  const sortedFeed = [...feed].sort((a, b) => {
    const aIsPinned = a.pinned;
    const bIsPinned = b.pinned;

    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return (
      new Date(b.item.created_at).getTime() -
      new Date(a.item.created_at).getTime()
    );
  });

  return (
    <>
      <div
        ref={containerRef}
        className={` ${russoOne.className} max-w-3xl mx-auto relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800  px-5 pt-3 pb-20 text-gray-100 overflow-y-auto touch-pan-y`}
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
        {isLoading ? (
          <>
            <FeedSkeleton count={5} />
          </>
        ) : error ? (
          <p className="text-center text-lg mt-10 ">
            Failed to load sessions. Please try again later.
          </p>
        ) : feed.length === 0 ? (
          <p className="text-center text-lg mt-10">
            No sessions yet. Let&apos;s get started!
          </p>
        ) : (
          sortedFeed.slice(0, visibleCount).map((feedItem) => {
            const isPinned = feedItem.pinned;

            return (
              <div key={feedItem.item.id}>
                {isPinned && (
                  <div className="flex items-center gap-2 mb-2">
                    <Pin size={20} />
                    <p className={`${russoOne.className} text-gray-400`}>
                      Pinned
                    </p>
                  </div>
                )}
                {!isPinned && <div className="mt-[32px]"></div>}
                <FeedCard
                  {...feedItem}
                  pinned={isPinned}
                  onExpand={() => setExpandedItem(feedItem)}
                  onTogglePin={() =>
                    togglePin(feedItem.item.id, feedItem.table, isPinned)
                  }
                  onDelete={() =>
                    handleDelete(feedItem.item.id, feedItem.table)
                  }
                  onEdit={() => setEditingItem(feedItem)}
                />
              </div>
            );
          })
        )}

        {visibleCount < feed.length && <div ref={ref} className="h-10" />}

        {expandedItem && (
          <Modal onClose={() => setExpandedItem(null)} isOpen={true}>
            {expandedItem.table === "notes" && (
              <NotesSession notes={expandedItem.item} />
            )}
            {expandedItem.table === "gym_sessions" && (
              <GymSession {...expandedItem.item} />
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
            onClose={() => setEditingItem(null)}
          >
            {editingItem.table === "notes" && (
              <EditNote
                note={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={() => {
                  setEditingItem(null);
                  router.refresh(); // Refresh to get updated feed
                }}
              />
            )}
            {editingItem.table === "gym_sessions" && (
              <EditGym
                gym_session={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={() => {
                  setEditingItem(null);
                  router.refresh(); // Refresh to get updated feed
                }}
              />
            )}
            {editingItem.table === "weight" && (
              <EditWeight
                weight={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={() => {
                  setEditingItem(null);
                  router.refresh(); // Refresh to get updated feed
                }}
              />
            )}
          </Modal>
        )}
      </div>
    </>
  );
}
