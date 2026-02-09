import { View, Modal, Linking } from "react-native";
import AppText from "@/components/AppText";
import { Info } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

export default function InfoModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const { t } = useTranslation("activities");

  return (
    <Modal visible={isOpen} transparent={true} animationType="slide">
      <View className="flex-1 justify-center items-center bg-black/50 px-5">
        <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
          <View className="mb-5">
            <Info size={35} color="#fbbf24" />
          </View>
          <AppText className="text-xl mb-6 text-center underline text-yellow-500">
            {t("activities.gpsInfoModal.title")}
          </AppText>
          <AppText className="text-lg mb-6 text-left">
            {t("activities.gpsInfoModal.description1")}
          </AppText>
          <AppText className="text-lg mb-6 text-left">
            {t("activities.gpsInfoModal.description2")}
          </AppText>
          <View className="flex-row gap-4 w-full">
            <View className="w-1/2 min-w-0">
              <AnimatedButton
                onPress={() => setIsOpen(false)}
                className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
                textClassName="text-gray-100 text-center"
                label={t("activities.gpsInfoModal.cancel")}
              />
            </View>
            <View className="w-1/2 min-w-0">
              <AnimatedButton
                onPress={() => {
                  Linking.openSettings();
                  setIsOpen(false);
                }}
                className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
                textClassName="text-gray-100 text-center"
                label={t("activities.gpsInfoModal.openSettings")}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
