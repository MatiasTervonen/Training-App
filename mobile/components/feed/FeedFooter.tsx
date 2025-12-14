import { View, ActivityIndicator } from "react-native";
import AppText from "../AppText";
import { FeedPage } from "@/hooks/feed/useFeedPrefetch";
import { InfiniteData } from "@tanstack/react-query";

export default function FeedFooter({
  isFetchingNextPage,
  hasNextPage,
  data,
}: {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  data: InfiniteData<FeedPage>;
}) {
  if (isFetchingNextPage) {
    return (
      <View className="items-center justify-center gap-2">
        <AppText className="text-center text-gray-300 text-lg">
          Loading more...
        </AppText>
        <ActivityIndicator size="large" color="#193cb8" className="my-5" />
      </View>
    );
  }

  if (hasNextPage) {
    return <View className="h-20" />;
  }

  if (!hasNextPage && data?.pages.length > 1) {
    return (
      <AppText className="text-center justify-center mt-10 text-gray-300">
        No more sessions
      </AppText>
    );
  }

  return null;
}
