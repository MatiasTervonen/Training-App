import { useState, useEffect } from "react";
import { View } from "react-native";
import AppText from "../AppText";
import Carousel from "react-native-reanimated-carousel";
import { Pin } from "lucide-react-native";
import FeedCard from "../cards/FeedCard";

interface PinnedCarouselProps {
  pinnedFeed: any[];
  width: number;
  height: number;
  onExpand: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onTogglePin: (item: any) => void;
}

export default function PinnedCarousel({
  pinnedFeed,
  width,
  height,
  onExpand,
  onEdit,
  onDelete,
  onTogglePin,
}: PinnedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= pinnedFeed.length) {
      setActiveIndex(0);
    }
  }, [pinnedFeed, activeIndex]);

  const carouselKey =
    pinnedFeed.length === 1 ? `single-${pinnedFeed[0].item.id}` : "multi";

  return (
    <View>
      <View className="flex-row items-center mb-2 gap-2 ml-4 mt-3">
        <Pin size={20} color="#d1d5db" />
        <AppText className="text-gray-300">Pinned</AppText>
        <AppText className="text-gray-300">
          {activeIndex + 1} / {pinnedFeed.length}
        </AppText>
      </View>
      <Carousel
        key={carouselKey}
        width={width}
        height={height}
        data={pinnedFeed}
        onSnapToItem={(index) => setActiveIndex(index)}
        loop={pinnedFeed.length > 1}
        autoPlayInterval={2000}
        autoPlay={pinnedFeed.length > 1}
        renderItem={({ item: feedItem }) => (
          <View className="px-4">
            <FeedCard
              {...feedItem}
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
