import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { ImageIcon, LayoutList, ChevronLeft } from "lucide-react-native";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";

type ShareTypePickerProps = {
  onSelectImage: () => void;
  onSelectSession: () => void;
  onBack?: () => void;
};

export default function ShareTypePicker({
  onSelectImage,
  onSelectSession,
  onBack,
}: ShareTypePickerProps) {
  const { t } = useTranslation("chat");

  return (
    <View className="flex-1 mt-8">
      {onBack && (
        <View className="flex-row items-center mb-4">
          <AnimatedButton onPress={onBack} className="p-1">
            <ChevronLeft color="#f3f4f6" size={24} />
          </AnimatedButton>
          <AppText className="text-lg flex-1 text-center mr-8">
            {t("chat.shareTypePicker.title")}
          </AppText>
        </View>
      )}
      {!onBack && (
        <AppText className="text-lg text-center mb-6">
          {t("chat.shareTypePicker.title")}
        </AppText>
      )}

      <View className="gap-3">
        <AnimatedButton
          onPress={onSelectImage}
          className="flex-row items-center gap-4 p-4 rounded-xl border border-slate-600 bg-slate-800/50"
        >
          <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center">
            <ImageIcon size={20} color="#94a3b8" />
          </View>
          <View className="flex-1">
            <AppText className="text-base">
              {t("chat.shareTypePicker.imageTitle")}
            </AppText>
            <BodyTextNC className="text-xs text-slate-400 mt-0.5">
              {t("chat.shareTypePicker.imageDesc")}
            </BodyTextNC>
          </View>
        </AnimatedButton>

        <AnimatedButton
          onPress={onSelectSession}
          className="flex-row items-center gap-4 p-4 rounded-xl border border-cyan-700/50 bg-cyan-900/20"
        >
          <View className="w-10 h-10 rounded-full bg-cyan-800/50 items-center justify-center">
            <LayoutList size={20} color="#22d3ee" />
          </View>
          <View className="flex-1">
            <AppText className="text-base">
              {t("chat.shareTypePicker.sessionTitle")}
            </AppText>
            <BodyTextNC className="text-xs text-slate-400 mt-0.5">
              {t("chat.shareTypePicker.sessionDesc")}
            </BodyTextNC>
          </View>
        </AnimatedButton>
      </View>
    </View>
  );
}
