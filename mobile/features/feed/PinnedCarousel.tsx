import { useState } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import Carousel from "react-native-reanimated-carousel";
import { Pin } from "lucide-react-native";
import FeedCard from "@/features/feed-cards/FeedCard";
import { useTranslation } from "react-i18next";
import { FeedItemUI } from "@/types/session";

interface PinnedCarouselProps {
  pinnedFeed: FeedItemUI[];
  width: number;
  height: number;
  onExpand: (item: FeedItemUI) => void;
  onEdit: (item: FeedItemUI) => void;
  onDelete: (item: FeedItemUI) => void;
  onTogglePin: (item: FeedItemUI) => void;
  CardComponent?: React.ComponentType<any>;
}

export default function PinnedCarousel({
  pinnedFeed,
  width,
  height,
  onExpand,
  onEdit,
  onDelete,
  onTogglePin,
  CardComponent = FeedCard,
}: PinnedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslation();

  const safeActiveIndex =
    activeIndex >= pinnedFeed.length && pinnedFeed.length > 0
      ? 0
      : activeIndex;

  return (
    <View className="-mb-2">
      <View className="flex-row items-center mb-2 gap-2 ml-4 mt-3">
        <Pin size={20} color="#d1d5db" />
        <AppText>{t("common.pinned")}</AppText>
        <BodyText>
          {safeActiveIndex + 1} / {pinnedFeed.length}
        </BodyText>
      </View>
      <Carousel
        key={pinnedFeed.length}
        width={width}
        height={height}
        data={pinnedFeed}
        onSnapToItem={(index) => setActiveIndex(index)}
        loop={pinnedFeed.length > 1}
        autoPlayInterval={2000}
        autoPlay={pinnedFeed.length > 1}
        renderItem={({ item: feedItem }) => (
          <View key={`${feedItem.type}-${feedItem.id}`} className="px-4">
            <CardComponent
              item={feedItem}
              pinned={true}
              onExpand={() => onExpand(feedItem)}
              onTogglePin={() => onTogglePin(feedItem)}
              onDelete={() => onDelete(feedItem)}
              onEdit={() => onEdit(feedItem)}
            />
          </View>
        )}
      />
    </View>
  );
}
