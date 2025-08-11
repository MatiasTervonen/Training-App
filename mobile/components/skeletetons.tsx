import { View, ActivityIndicator } from "react-native";

export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <View
        key={i}
        className="flex-1 items-center justify-center bg-gray-800 py-2 mt-[32px] rounded-md shadow border border-gray-700 h-[80px]"
      >
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    ))}
  </>
);

