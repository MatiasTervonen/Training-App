import { Modal, View } from "react-native";
import { Info } from "lucide-react-native";
import AppText from "../../components/AppText";
import LinkButton from "../../components/buttons/LinkButton";

export default function InfoModal({ showModal }: { showModal: boolean }) {
  return (
    <Modal visible={showModal} transparent={true} animationType="slide">
      <View className="flex-1 justify-center items-center bg-black/50 px-5">
        <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
          <View className="mb-5">
            <Info size={35} color="#fbbf24" />
          </View>
          <AppText className="text-xl mb-6 text-center">
            Location tracking disabled.
          </AppText>
          <AppText className="text-lg mb-6 text-center">
            Enable Location tracking from settings to track your activity.
          </AppText>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <LinkButton href="/sessions" label="Back" />
            </View>
            <View className="flex-1">
              <LinkButton href="/menu/settings" label="Settings" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
