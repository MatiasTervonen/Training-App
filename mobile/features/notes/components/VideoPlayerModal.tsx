import { View, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { X } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";

type Props = {
  uri: string;
  visible: boolean;
  onClose: () => void;
};

export default function VideoPlayerModal({ uri, visible, onClose }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1">
          <VideoView
            player={player}
            style={{ width: "100%", height: "100%" }}
            nativeControls
            allowsFullscreen
          />
        </SafeAreaView>
        <View className="absolute right-4" style={{ top: insets.top + 8 }}>
          <AnimatedButton
            onPress={onClose}
            className="bg-black/60 rounded-full p-2 border border-white/30"
          >
            <X color="white" size={24} />
          </AnimatedButton>
        </View>
      </View>
    </Modal>
  );
}
