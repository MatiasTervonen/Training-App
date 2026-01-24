import { Modal, View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Info } from "lucide-react-native";
import { requestExactAlarm } from "@/native/android/EnsureExactAlarmPermission";

interface ExactAlarmPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExactAlarmPermissionModal({
  visible,
  onClose,
}: ExactAlarmPermissionModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View className="flex-1 justify-center items-center bg-black/50 px-5">
        <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
          <View className="mb-5">
            <Info size={35} color="#fbbf24" />
          </View>
          <AppText className="text-xl mb-6 text-center">
            Allow setting alarms and reminders
          </AppText>
          <AppText className="text-lg mb-6 text-center">
            This reminder can use a high-priority alarm that rings continuously,
            even when your phone is locked, until you dismiss it.
            {"\n\n"}
            You can continue without enabling this, but reminders may be delayed
            or less reliable.
          </AppText>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <AnimatedButton
                onPress={onClose}
                label="Cancel"
                className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
                textClassName="text-gray-100 text-center"
              />
            </View>
            <View className="flex-1">
              <AnimatedButton
                onPress={async () => await requestExactAlarm()}
                label="Allow"
                className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
                textClassName="text-gray-100 text-center"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
