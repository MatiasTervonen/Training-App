"use client";

import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Pin } from "lucide-react";
import FeedCard from "@/app/(app)/components/feed-cards/FeedCard";
import { useModalPageConfig } from "@/app/(app)/lib/stores/modalPageConfig";
import { FeedItemUI } from "@/app/(app)/types/session";
import { useTranslation } from "react-i18next";

interface PinnedCarouselProps {
  pinnedFeed: FeedItemUI[];
  onExpand: (item: FeedItemUI) => void;
  onEdit: (item: FeedItemUI) => void;
  onDelete: (item: FeedItemUI) => void;
  onTogglePin: (item: FeedItemUI) => void;
}

export default function PinnedCarousel({
  pinnedFeed,
  onExpand,
  onEdit,
  onDelete,
  onTogglePin,
}: PinnedCarouselProps) {
  const { t } = useTranslation("common");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);
  const [activeIndex, setActiveIndex] = useState(0);

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
                    onExpand={() => onExpand(feedItem)}
                    onTogglePin={() => onTogglePin(feedItem)}
                    onDelete={() => onDelete(feedItem)}
                    onEdit={() => onEdit(feedItem)}
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
