import { Modal, View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Info } from "lucide-react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";

type InfoModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string | string[];
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export default function InfoModal({
  visible,
  onClose,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: InfoModalProps) {
  const descriptions = Array.isArray(description) ? description : [description];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-center items-center bg-black/50 px-5">
        <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
          <View className="mb-5 items-center">
            <Info size={35} color="#fbbf24" />
          </View>
          <AppText className="text-xl mb-4 text-center">{title}</AppText>
          {descriptions.map((text, index) => (
            <BodyText key={index} className="text-base mb-4 text-center">
              {text}
            </BodyText>
          ))}
          <View className="flex-row gap-4 w-full mt-2">
            <View className="flex-1">
              <AnimatedButton
                onPress={onClose}
                className="bg-blue-800 border-2 border-blue-500 py-2 rounded-md"
                textClassName="text-gray-100 text-center"
                label={cancelLabel}
              />
            </View>
            <View className="flex-1">
              <AnimatedButton
                onPress={onConfirm}
                className="bg-blue-800 border-2 border-blue-500 py-2 rounded-md"
                textClassName="text-gray-100 text-center"
                label={confirmLabel}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
