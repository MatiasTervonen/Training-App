import { Ellipsis, SquareArrowOutUpRight, Calendar } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import DropdownMenu from "@/components/DropdownMenu";
import { formatDate } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "@/components/buttons/animatedButton";
import { ReactNode } from "react";

type BaseCardProps = {
  item: FeedCardProps["item"];
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
  statsContent: ReactNode; // Middle section with stats
  typeIcon: ReactNode; // Icon for activity type
  typeName: string; // Name of the activity type
  showUpdatedAt?: boolean; // Whether to show updated at or created at
};

export default function BaseFeedCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  statsContent,
  typeIcon,
  typeName,
  showUpdatedAt = false,
}: BaseCardProps) {
  return (
    <LinearGradient
      colors={
        pinned
          ? ["#fcd34d", "#fbbf24", "#f59e0b"] // yellow gradient when pinned
          : ["#1e3a8a", "#0f172a", "#0f172a"] // blue gradient when not pinned
      }
      start={{ x: 1, y: 0 }} // bottom-left
      end={{ x: 0, y: 1 }} // top-right
      className={`
       border rounded-md flex-col justify-between transition-colors min-h-[159px] overflow-hidden ${
         pinned
           ? `border-yellow-200 bg-yellow-200`
           : "bg-slate-700 border-gray-100"
       }`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mt-2 mx-4">
        <AppText
          className={`flex-1 mr-8 underline text-lg  ${
            pinned
              ? "text-slate-900 border-slate-900"
              : "text-gray-100 border-gray-100"
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </AppText>
        <DropdownMenu
          button={<Ellipsis size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />}
          pinned={pinned}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      </View>

      {/* Middle content - always centered */}
      <View className="flex-1 justify-center">
        <View className={`flex-row items-center justify-start`}>
          {statsContent}
        </View>
      </View>

      {/* Updated timestamp (optional) */}
      {showUpdatedAt &&
        (item.updated_at ? (
          <AppText
            className={`ml-4 text-sm ${
              pinned ? "text-slate-900" : "text-yellow-500"
            }`}
          >
            updated: {formatDate(item.updated_at)}
          </AppText>
        ) : (
          <AppText className="min-h-5"></AppText>
        ))}

      <View className="flex-row justify-between items-center mt-2 bg-black/40 rounded-b-md ">
        <View className="flex-row items-center gap-2 pl-2">
          {typeIcon}
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            {typeName || "Activity"}
          </AppText>
        </View>
        <View className="flex-row gap-2 items-center">
          <Calendar size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            {formatDate(item.created_at)}
          </AppText>
        </View>

        <AnimatedButton
          onPress={() => {
            onExpand();
          }}
          className="bg-blue-700 py-2 px-4  rounded-br-md flex-row items-center gap-2"
        >
          <AppText>Details</AppText>
          <SquareArrowOutUpRight size={20} color="#f3f4f6" />
        </AnimatedButton>
      </View>
    </LinearGradient>
  );
}
