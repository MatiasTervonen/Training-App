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
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View
          className="p-6 bg-slate-900 rounded-xl border-[1.5px] border-slate-600 w-2/4"
          style={{
            shadowColor: "#3b82f6",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
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
