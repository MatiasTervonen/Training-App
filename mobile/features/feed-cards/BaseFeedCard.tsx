import { Ellipsis, SquareArrowOutUpRight } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import DropdownMenu from "@/components/DropdownMenu";
import { formatDate, formatDateShort } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";
import AnimatedButton from "@/components/buttons/animatedButton";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

type BaseCardProps = {
  item: FeedCardProps["item"];
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit?: () => void;
  onMoveToFolder?: () => void;
  onHide?: () => void;
  statsContent: ReactNode; // Middle section with stats
  typeIcon: ReactNode; // Icon for activity type
  typeName: string; // Name of the activity type
  showUpdatedAt?: boolean; // Whether to show updated at or created at
};

function getGradientColors(type: string): [string, string] {
  switch (type) {
    case "gym_sessions":
      return ["rgba(59,130,246,0.12)", "rgba(59,130,246,0.03)"];
    case "activity_sessions":
      return ["rgba(34,197,94,0.12)", "rgba(34,197,94,0.03)"];
    case "notes":
      return ["rgba(168,85,247,0.12)", "rgba(168,85,247,0.03)"];
    case "weight":
      return ["rgba(245,158,11,0.12)", "rgba(245,158,11,0.03)"];
    case "todo_lists":
      return ["rgba(6,182,212,0.12)", "rgba(6,182,212,0.03)"];
    case "global_reminders":
    case "local_reminders":
      return ["rgba(234,179,8,0.12)", "rgba(234,179,8,0.03)"];
    case "habits":
      return ["rgba(244,63,94,0.12)", "rgba(244,63,94,0.03)"];
    case "reports":
      return ["rgba(99,102,241,0.12)", "rgba(99,102,241,0.03)"];
    case "tutorial":
      return ["rgba(20,184,166,0.12)", "rgba(20,184,166,0.03)"];
    default:
      return ["rgba(100,116,139,0.12)", "rgba(100,116,139,0.03)"];
  }
}

export default function BaseFeedCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  onMoveToFolder,
  onHide,
  statsContent,
  typeIcon,
  typeName,
  showUpdatedAt = false,
}: BaseCardProps) {
  const { t } = useTranslation("feed");
  const gradientColors = pinned
    ? ["rgba(234,179,8,0.15)", "rgba(234,179,8,0.05)"] as [string, string]
    : getGradientColors(item.type);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`border rounded-xl overflow-hidden min-h-[160px] ${
        pinned ? "border-yellow-500/60" : "border-slate-700"
      }`}
    >
      {/* Header - title + menu */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-1">
        <AppText className="flex-1 mr-4 text-lg" numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </AppText>
        <DropdownMenu
          button={<Ellipsis size={20} color="#94a3b8" />}
          pinned={pinned}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onMoveToFolder={onMoveToFolder}
          onHide={onHide}
        />
      </View>

      {/* Stats content */}
      <View className="flex-1 justify-center px-4 pb-2">
        {statsContent}
      </View>

      {/* Updated timestamp (optional) */}
      {showUpdatedAt && item.updated_at && (
        <View className="px-4 pb-1">
          <AppText className="text-xs text-yellow-500">
            {t("feed.card.updated")} {formatDate(item.updated_at)}
          </AppText>
        </View>
      )}

      {/* Footer - type, date, details */}
      <View className="flex-row items-center justify-between bg-slate-900/40 px-4 py-2">
        <View className="flex-row items-center gap-2">
          {typeIcon}
          <AppText className="text-slate-400 text-xs">
            {typeName || t("feed.card.types.activity")}
          </AppText>
          <AppText className="text-slate-500 text-xs">·</AppText>
          <AppText className="text-slate-400 text-xs">
            {formatDateShort(item.created_at)}
          </AppText>
        </View>
        <AnimatedButton
          onPress={onExpand}
          className="flex-row items-center gap-2"
          hitSlop={15}
        >
          <SquareArrowOutUpRight size={18} color="#64748b" />
          <AppText className="text-slate-500 text-sm">{t("feed.card.details")}</AppText>
        </AnimatedButton>
      </View>
    </LinearGradient>
  );
}
