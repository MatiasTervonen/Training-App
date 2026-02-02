import { Scale } from "lucide-react";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { FeedCardProps } from "@/app/(app)/types/session";
import BaseFeedCard from "./BaseFeedCard";

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
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Scale size={20} className={pinned ? "text-slate-900" : "text-gray-100"} />}
      typeName="Weight"
      statsContent={
        <p className={`text-lg ${pinned ? "text-slate-900" : "text-gray-100"}`}>
          {payload.weight} {weightUnit}
        </p>
      }
    />
  );
}
