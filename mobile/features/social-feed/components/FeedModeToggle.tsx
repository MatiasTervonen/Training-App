import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Users, LayoutDashboard } from "lucide-react-native";

type FeedMode = "my" | "friends";

type Props = {
  feedMode: FeedMode;
  setFeedMode: (mode: FeedMode) => void;
};

export default function FeedModeToggle({ feedMode, setFeedMode }: Props) {
  const isFriends = feedMode === "friends";

  return (
    <View className="absolute bottom-8 right-6 z-50">
      <View className="absolute -inset-1 rounded-full bg-cyan-400/30" />
      <View className="absolute -inset-3 rounded-full bg-cyan-400/15" />
      <AnimatedButton
        onPress={() => setFeedMode(isFriends ? "my" : "friends")}
        className="w-14 h-14 rounded-full items-center justify-center shadow-xl bg-slate-800 border-2 border-cyan-300 shadow-cyan-400/60"
      >
        {isFriends ? (
          <LayoutDashboard size={26} color="#67e8f9" />
        ) : (
          <Users size={26} color="#67e8f9" />
        )}
      </AnimatedButton>
    </View>
  );
}
