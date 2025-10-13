import { View, ActivityIndicator, Modal } from "react-native";
import AppText from "./AppText";

type FullScreenLoaderProps = {
  visible?: boolean;
  message?: string;
};

export default function FullScreenLoader({
  visible = false,
  message = "Loading...",
}: FullScreenLoaderProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View className="flex-1 bg-slate-500/30 justify-center items-center">
        <View className="p-6 bg-slate-800 rounded-xl">
          <ActivityIndicator size="large" color="#0000ff" />
          <AppText className="mt-4 text-lg">{message}</AppText>
        </View>
      </View>
    </Modal>
  );
}
