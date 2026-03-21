import { View, ActivityIndicator } from "react-native";

export const FeedSkeleton = ({
  count = 3,
  subFeed = false,
}: {
  count?: number;
  subFeed?: boolean;
}) => (
  <View style={subFeed ? { paddingTop: 66 } : { paddingTop: 20 }}>
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
