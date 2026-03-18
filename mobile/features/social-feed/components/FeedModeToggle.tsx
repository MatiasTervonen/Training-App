import FloatingActionButton from "@/components/buttons/FloatingActionButton";
import { Users, LayoutDashboard } from "lucide-react-native";

type FeedMode = "my" | "friends";

type Props = {
  feedMode: FeedMode;
  setFeedMode: (mode: FeedMode) => void;
};

export default function FeedModeToggle({ feedMode, setFeedMode }: Props) {
  const isFriends = feedMode === "friends";

  return (
    <FloatingActionButton onPress={() => setFeedMode(isFriends ? "my" : "friends")}>
      {isFriends ? (
        <LayoutDashboard size={26} color="#06b6d4" />
      ) : (
        <Users size={26} color="#06b6d4" />
      )}
    </FloatingActionButton>
  );
}
