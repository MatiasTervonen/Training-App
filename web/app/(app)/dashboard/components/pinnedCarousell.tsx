"use client";

import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Pin } from "lucide-react";
import FeedCard from "@/app/(app)/components/cards/FeedCard";
import { useRouter } from "next/navigation";
import { useModalPageConfig } from "@/app/(app)/lib/stores/modalPageConfig";
import { FeedItem } from "@/app/(app)/types/models";

type Table =
  | "gym_sessions"
  | "notes"
  | "weight"
  | "todo_lists"
  | "reminders"
  | "custom_reminders";

interface PinnedCarouselProps {
  pinnedFeed: FeedItem[];
  setExpandedItem: (item: FeedItem) => void;
  setEditingItem: (item: FeedItem) => void;
  togglePin: (id: string, table: Table, pinned: boolean) => void;
  handleDelete: (id: string, table: Table) => void;
}

export default function PinnedCarousel({
  pinnedFeed,
  setExpandedItem,
  setEditingItem,
  togglePin,
  handleDelete,
}: PinnedCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const setBlockSwipe = useModalPageConfig((s) => s.setBlockSwipe);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi!.selectedScrollSnap);
    };

    const onPointerDown = () => setBlockSwipe(true);
    const onPointerUp = () => setBlockSwipe(false);

    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, setBlockSwipe]);

  useEffect(() => {
    if (activeIndex >= pinnedFeed.length) {
      setActiveIndex(0);
    }
  }, [pinnedFeed, activeIndex]);

  return (
    <>
      {pinnedFeed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Pin size={20} />
            <p className="text-gray-400">Pinned</p>
            <p className="text-gray-400">
              {activeIndex + 1} / {pinnedFeed.length}
            </p>
          </div>

          <div className="embla" ref={emblaRef}>
            <div className="embla__container flex">
              {pinnedFeed.map((feedItem) => (
                <div
                  className="flex-none w-full min-w-0 mr-5 select-none"
                  key={feedItem.item.id}
                >
                  <FeedCard
                    {...feedItem}
                    pinned={true}
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(feedItem.item.id, feedItem.table, true)
                    }
                    onDelete={() =>
                      handleDelete(feedItem.item.id!, feedItem.table)
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
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
