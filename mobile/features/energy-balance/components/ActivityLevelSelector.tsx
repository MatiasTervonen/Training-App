import { View, Modal } from "react-native";
import { useState } from "react";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Info } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type ActivityLevelSelectorProps = {
  level: number;
  onSelect: (level: number) => void;
};

const LEVELS = [1, 2, 3, 4, 5];

export default function ActivityLevelSelector({
  level,
  onSelect,
}: ActivityLevelSelectorProps) {
  const { t } = useTranslation("nutrition");
  const [showInfo, setShowInfo] = useState(false);

  return (
    <View className="flex-row items-center justify-between mt-3">
      <View className="flex-row items-center gap-2">
        <BodyText className="text-sm">
          {t("energyBalance.activityLevel")}
        </BodyText>
        <AnimatedButton onPress={() => setShowInfo(true)} hitSlop={12}>
          <Info size={16} color="#64748b" />
        </AnimatedButton>
      </View>

      <View className="flex-row gap-2">
        {LEVELS.map((l) => (
          <AnimatedButton
            key={l}
            onPress={() => onSelect(l)}
            className={`w-9 h-9 rounded-lg items-center justify-center ${
              l === level
                ? "bg-blue-900/60 border border-blue-500/50"
                : "bg-slate-700/50 border border-slate-600/50"
            }`}
          >
            <AppTextNC
              className={`text-sm ${
                l === level ? "text-blue-400" : "text-slate-400"
              }`}
            >
              {l}
            </AppTextNC>
          </AnimatedButton>
        ))}
      </View>

      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-900 rounded-xl p-6 w-full border-[1.5px] border-slate-600 shadow-lg shadow-blue-500/40 elevation-5">
            <View className="absolute top-4 left-4">
              <Info size={28} color="#fbbf24" />
            </View>
            <AppText className="text-xl mb-4 text-center mt-1">
              {t("energyBalance.activityLevel")}
            </AppText>
            <BodyText className="mb-4 text-center">
              {t("energyBalance.activityInfo")}
            </BodyText>

            {LEVELS.map((l) => (
              <View key={l} className="flex-row items-start gap-3 mb-3">
                <View className="w-7 h-7 rounded-md bg-slate-700/50 items-center justify-center mt-0.5">
                  <AppTextNC className="text-sm text-slate-300">{l}</AppTextNC>
                </View>
                <View className="flex-1">
                  <BodyTextNC className="text-sm text-slate-200">
                    {t(`energyBalance.activityLevel${l}`)}
                  </BodyTextNC>
                  <BodyText className="text-xs text-slate-500">
                    {t(`energyBalance.activityLevel${l}Desc`)}
                  </BodyText>
                </View>
              </View>
            ))}

            <View className="mt-2">
              <AnimatedButton
                onPress={() => setShowInfo(false)}
                className="btn-neutral"
                label="OK"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
