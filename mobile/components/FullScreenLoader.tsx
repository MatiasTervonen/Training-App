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
      <View className="flex-1 bg-[#f3f4f657] justify-center items-center">
        <View className="p-6 bg-[#314158] rounded-xl">
          <ActivityIndicator size="large" color="#0000ff" />
          <AppText className="mt-4">{message}</AppText>
        </View>
      </View>
    </Modal>
  );
}
