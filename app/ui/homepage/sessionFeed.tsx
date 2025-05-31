"use client";

import { useState, useEffect } from "react";
import { russoOne } from "@/app/ui/fonts";
import { useRouter } from "next/navigation";
import NotesSession from "@/app/components/expandSession/notes";
import Modal from "@/app/components/modal";
import { useInView } from "react-intersection-observer";
import FeedCard from "@/app/components/FeedCard";
import { Pin } from "lucide-react";
import EditNote from "@/app/ui/editSession/EditNotes";
import EditGym from "@/app/ui/editSession/EditGym";
import GymSession from "@/app/components/expandSession/gym";
import { Notes, GymSessionFull } from "@/types/session";

type FeedItem =
  | { table: "notes"; item: Notes; pinned: boolean }
  | { table: "gym_sessions"; item: GymSessionFull; pinned: boolean };

type Props = {
  feed: FeedItem[];
};

export default function SessionFeed({ feed }: Props) {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [pinnedItem, setPinnedItem] = useState<string[]>([]);
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(10);
  const { ref, inView } = useInView({
    threshold: 0,
  });
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  useEffect(() => {
    const initiallyPinned = feed
      .filter((item) => item.pinned)
      .map((item) => item.item.id);
    setPinnedItem(initiallyPinned);
  }, [feed]);

  useEffect(() => {
    if (inView && visibleCount < feed.length) {
      setVisibleCount((prev) => prev + 10);
    }
  }, [inView]);

  const togglePin = async (
    item_id: string,
    table: string,
    isPinned: boolean
  ) => {
    const endpoint = isPinned
      ? "/api/pinned/unpin-items"
      : "/api/pinned/pin-items";

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
      return;
    } else {
      setPinnedItem((prev) =>
        isPinned ? prev.filter((id) => id !== item_id) : [...prev, item_id]
      );
    }
  };

  const handleDelete = async (item_id: string, table: string) => {
    const confirmDetlete = confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmDetlete) return;

    const res = await fetch("/api/delete-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item_id, table }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete session");
    }
  };

  const sortedFeed = [...feed].sort((a, b) => {
    const aIsPinned = pinnedItem.includes(a.item.id);
    const bIsPinned = pinnedItem.includes(b.item.id);

    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return (
      new Date(b.item.created_at).getTime() -
      new Date(a.item.created_at).getTime()
    );
  });

  return (
    <>
      <div className="bg-slate-900 h-[calc(100vh-152px)] px-5 pt-3 pb-20 overflow-y-auto touch-pan-y text-gray-100">
        {feed.length === 0 ? (
          <p>No sessions yet. Let&apos;s get started!</p>
        ) : (
          sortedFeed.slice(0, visibleCount).map((feedItem) => {
            const isPinned = pinnedItem.includes(feedItem.item.id);

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
          </Modal>
        )}

        {editingItem && (
          <Modal isOpen={true} onClose={() => setEditingItem(null)}>
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
          </Modal>
        )}
      </div>
    </>
  );
}
