import { View } from "react-native";
import { FeedSkeleton } from "@/components/skeletetons";
import { LinearGradient } from "expo-linear-gradient";
import Navbar from "@/Features/navbar/Navbar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FakeFeedLoader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute inset-0 z-50"
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <Navbar />
      <LinearGradient
        className="flex-1 pb-10 overflow-hidden"
        colors={["#020618", "#1d293d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FeedSkeleton count={5} />
      </LinearGradient>
    </View>
  );
}
