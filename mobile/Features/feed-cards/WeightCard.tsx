import { Scale } from "lucide-react-native";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "./BaseFeedCard";
import { View } from "react-native";

type weightPayload = {
  weight: number;
};

export default function WeightCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const payload = item.extra_fields as weightPayload;

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Scale size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />}
      typeName={"Weight"}
      statsContent={
        <View className="ml-4 rounded-md py-4 px-6 bg-slate-950/50">
          <AppText
            className={` ${pinned ? "text-slate-900" : "text-gray-100"}`}
          >
            {payload.weight} {weightUnit}
          </AppText>
        </View>
      }
    />
  );
}
