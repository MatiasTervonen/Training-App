import { View, ActivityIndicator, Modal } from "react-native";
import BodyText from "@/components/BodyText";

type FullScreenLoaderProps = {
  visible?: boolean;
  message?: string;
  progress?: number; // 0 to 1
};

export default function FullScreenLoader({
  visible = false,
  message = "Loading...",
  progress,
}: FullScreenLoaderProps) {
  const showProgress = progress !== undefined && progress >= 0;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View className="flex-1 bg-slate-500/30 justify-center items-center">
        <View className="p-6 bg-[#1C2431] rounded-xl border-2 border-blue-500 w-2/4">
          <BodyText className="mb-4 text-lg text-center">{message}</BodyText>
          {showProgress ? (
            <View>
              <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(Math.round(progress * 100), 100)}%` }}
                />
              </View>
              <BodyText className="text-center text-sm mt-2">
                {Math.min(Math.round(progress * 100), 100)}%
              </BodyText>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#0000ff" />
          )}
        </View>
      </View>
    </Modal>
  );
}
