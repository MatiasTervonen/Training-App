import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { MapPin, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import type { LocationShareContent } from "@/types/chat";

type ChatLocationCardProps = {
  data: LocationShareContent;
};

export default function ChatLocationCard({ data }: ChatLocationCardProps) {
  const { t } = useTranslation("chat");

  const displayText = data.address ?? `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;

  return (
    <LinearGradient
      colors={["rgba(6,182,212,0.15)", "rgba(6,182,212,0.05)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-xl overflow-hidden border border-slate-600/50"
      style={{ width: 280 }}
    >
      <View className="px-4 pt-3.5 pb-3">
        <View className="flex-row items-center gap-2 mb-2.5">
          <MapPin size={16} color="#06b6d4" />
          <BodyTextNC className="text-sm text-slate-400">
            {t("chat.locationCard.location")}
          </BodyTextNC>
        </View>

        <AppText className="text-base mb-3" numberOfLines={2}>
          {displayText}
        </AppText>

        <View className="flex-row items-center justify-start gap-0.5">
          <BodyTextNC className="text-xs text-slate-500">
            {t("chat.locationCard.tapToView")}
          </BodyTextNC>
          <ChevronRight size={13} color="#64748b" />
        </View>
      </View>
    </LinearGradient>
  );
}
