import { View, ActivityIndicator } from "react-native";

export const FeedSkeleton = ({
  count = 3,
  subFeed = false,
}: {
  count?: number;
  subFeed?: boolean;
}) => (
  <View className={subFeed ? "pt-[50px]" : "pt-3"}>
    {[...Array(count)].map((_, i) => (
      <View
        key={i}
        className="items-center justify-center bg-slate-800/30 mb-5 rounded-md border border-slate-700 min-h-[160px] animate-pulse mx-4"
      >
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    ))}
  </View>
);

export const TemplateSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <View
        key={i}
        className="flex items-center justify-center animate-pulse bg-slate-800/30 mb-5 rounded-md border border-slate-700 h-[130px]"
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
        className="flex items-center mb-3 justify-center animate-pulse bg-slate-500/10 p-4 w-full rounded-md border border-slate-500/20 h-[72px]"
      >
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    ))}
  </>
);

export const NotesVoiceSkeleton = ({ count = 1 }: { count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <View
        key={i}
        className="items-center justify-center bg-slate-950 mb-4 rounded-xl border-[1.5px] border-blue-500/60 w-full animate-pulse h-[78px]"
      >
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    ))}
  </>
);
