import { useState } from "react";
import { View } from "react-native";
import AppText from "../AppText";
import Carousel from "react-native-reanimated-carousel";
import { Pin } from "lucide-react-native";
import FeedCard from "../cards/FeedCard";

interface PinnedCarouselProps {
  pinnedFeed: any[];
  width: number;
  onExpand: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onTogglePin: (item: any) => void;
}

export default function PinnedCarousel({
  pinnedFeed,
  width,
  onExpand,
  onEdit,
  onDelete,
  onTogglePin,
}: PinnedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(1);

  console.log("rendered carousel");

  return (
    <View>
      <View className="flex-row items-center mb-2 gap-2 ml-4">
        <Pin size={20} color="#9ca3af" />
        <AppText className="text-gray-400">Pinned</AppText>
        <AppText className="text-gray-400">
          {activeIndex + 1} / {pinnedFeed.length}
        </AppText>
      </View>
      <Carousel
        width={width}
        height={width / 2}
        data={pinnedFeed}
        onSnapToItem={(index) => setActiveIndex(index)}
        loop={true}
        autoPlayInterval={2000}
        autoPlay
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
