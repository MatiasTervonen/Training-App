import { Scale } from "lucide-react-native";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("feed");
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
      typeIcon={<Scale size={20} color={pinned ? "#0f172a" : "#cbd5e1"} />}
      typeName={t("feed.card.types.weight")}
      statsContent={
        <>
          <AppText
            className={` ${pinned ? "text-slate-900" : "text-slate-300"}`}
          >
            {payload.weight} {weightUnit}
          </AppText>
        </>
      }
    />
  );
}
