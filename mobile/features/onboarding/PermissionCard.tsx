import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Check } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  isGranted: boolean;
  onEnable: () => void;
  enableLabel: string;
  enabledLabel: string;
  openSettingsLabel: string;
  isPermanentlyDenied?: boolean;
  onOpenSettings?: () => void;
};

export default function PermissionCard({
  icon: Icon,
  title,
  description,
  isGranted,
  onEnable,
  enableLabel,
  enabledLabel,
  openSettingsLabel,
  isPermanentlyDenied,
  onOpenSettings,
}: Props) {
  return (
    <View className="bg-slate-800 rounded-lg p-4 mb-3 border border-slate-700">
      <View className="flex-row items-center mb-2">
        <View className="mr-3">
          <Icon size={24} color={isGranted ? "#22c55e" : "#94a3b8"} />
        </View>
        <AppText className="text-lg flex-1">{title}</AppText>
        {isGranted && <Check size={20} color="#22c55e" />}
      </View>
      <BodyText className="mb-3">{description}</BodyText>
      {isGranted ? (
        <View className="bg-green-900/30 border border-green-700 py-2 rounded-md">
          <AppText className="text-center text-green-400 text-sm">
            {enabledLabel}
          </AppText>
        </View>
      ) : isPermanentlyDenied ? (
        <AnimatedButton
          onPress={onOpenSettings ?? (() => {})}
          className="bg-slate-700 border border-slate-500 py-2 rounded-md"
          label={openSettingsLabel}
          textClassName="text-sm"
        />
      ) : (
        <AnimatedButton
          onPress={onEnable}
          className="btn-base"
          label={enableLabel}
          textClassName="text-sm"
        />
      )}
    </View>
  );
}
