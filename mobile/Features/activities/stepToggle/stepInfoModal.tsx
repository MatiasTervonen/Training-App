import { View, Modal } from "react-native";
import AppText from "@/components/AppText";
import { Info } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";

type StepInfoModalProps = {
  visible: boolean;
  onCancel: () => void;
  onOpenSettings: () => void;
};

export default function StepInfoModal({
  visible,
  onCancel,
  onOpenSettings,
}: StepInfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-center items-center bg-black/50 px-5">
        <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
          <View className="mb-5 items-center">
            <Info size={35} color="#fbbf24" />
          </View>

          <AppText className="text-xl mb-4 text-center">
            Enable step tracking
          </AppText>

          <AppText className="text-base mb-6 text-center">
            MyTrack uses step data from Android Health Connect to show your
            activity insights.
            {"\n\n"}
            Please enable step access for MyTrack in Permissions under Health Connect.
          </AppText>

          <View className="flex-row gap-3 w-full">
            <View className="flex-1">
              <AnimatedButton
                label="Cancel"
                onPress={onCancel}
                className="bg-blue-800 border-2 border-blue-500 py-2 rounded-md"
                textClassName="text-gray-300 text-center"
              />
            </View>
            <View className="flex-1">
              <AnimatedButton
                label="Open settings"
                onPress={onOpenSettings}
                className="bg-blue-800 border-2 border-blue-500 py-2 rounded-md"
                textClassName="text-gray-100 text-center"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
