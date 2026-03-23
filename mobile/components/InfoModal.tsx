import { Modal, View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Info } from "lucide-react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { ReactNode } from "react";

type InfoModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string | string[];
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  customActions?: ReactNode;
};

export default function InfoModal({
  visible,
  onClose,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  customActions,
}: InfoModalProps) {
  const descriptions = Array.isArray(description) ? description : [description];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-center items-center bg-black/50 px-5">
        <View className="bg-slate-900 rounded-xl p-6 w-full border-[1.5px] border-slate-600 shadow-lg shadow-blue-500/40 elevation-5">
          <View className="mb-5 items-center">
            <Info size={35} color="#fbbf24" />
          </View>
          <AppText className="text-xl mb-4 text-center">{title}</AppText>
          {descriptions.map((text, index) => (
            <BodyText key={index} className="mb-4 text-center">
              {text}
            </BodyText>
          ))}
          {customActions ? (
            <View className="flex-row gap-4 w-full mt-2">
              {customActions}
            </View>
          ) : (
            <View className="flex-row gap-4 w-full mt-2">
              <View className="flex-1">
                <AnimatedButton
                  onPress={onClose}
                  className="btn-neutral"
                  label={cancelLabel!}
                />
              </View>
              <View className="flex-1">
                <AnimatedButton
                  onPress={onConfirm!}
                  className="btn-base"
                  label={confirmLabel!}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
