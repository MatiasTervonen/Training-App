"use client";

import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Pin } from "lucide-react";
import FeedCard from "@/app/(app)/components/feed-cards/FeedCard";
import { useRouter } from "next/navigation";
import { useModalPageConfig } from "@/app/(app)/lib/stores/modalPageConfig";
import { FeedItemUI } from "../../types/session";
import { useTranslation } from "react-i18next";

interface PinnedCarouselProps {
  pinnedFeed: FeedItemUI[];
  setExpandedItem: (item: FeedItemUI) => void;
  setEditingItem: (item: FeedItemUI) => void;
  togglePin: (
    id: string,
    type: string,
    feed_context: "pinned" | "feed",
  ) => void;
  handleDelete: (id: string, type: string) => void;
}

export default function PinnedCarousel({
  pinnedFeed,
  setExpandedItem,
  setEditingItem,
  togglePin,
  handleDelete,
}: PinnedCarouselProps) {
  const { t } = useTranslation("common");
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
            <p className="text-gray-400">{t("common.pinned")}</p>
            <p className="text-gray-400">
              {activeIndex + 1} / {pinnedFeed.length}
            </p>
          </div>

          <div className="embla" ref={emblaRef}>
            <div className="embla__container flex">
              {pinnedFeed.map((feedItem) => (
                <div
                  className="flex-none w-full min-w-0 mr-5 select-none"
                  key={feedItem.id}
                >
                  <FeedCard
                    item={feedItem}
                    pinned={true}
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
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
