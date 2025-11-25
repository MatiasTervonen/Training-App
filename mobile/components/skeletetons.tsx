import { View, ActivityIndicator } from "react-native";

export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <View
        key={i}
        className="items-center justify-center bg-gray-800 py-2 mt-[32px] rounded-md shadow border border-gray-700 h-[150px] animate-pulse mx-4"
      >
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    ))}
  </>
);

export const TemplateSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <View
        key={i}
        className="flex items-center justify-center animate-pulse bg-gray-700 py-2 mb-10 rounded-md shadow border border-gray-800 h-[130px]"
      >
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    ))}
  </>
);

export const FriendCardSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <View
        key={i}
        className="flex items-center mb-3 justify-center animate-pulse bg-slate-900 py-2 w-full rounded-md shadow border border-gray-700 h-[72px]"
      >
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    ))}
  </>
);
