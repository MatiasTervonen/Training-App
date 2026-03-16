import { View } from "react-native";
import { FileBarChart } from "lucide-react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";
import { ReportFeature } from "@/types/report";

type ReportPayload = {
  period_start: string;
  period_end: string;
  included_features: ReportFeature[];
  schedule_id: string;
};

export default function ReportCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation(["feed", "reports"]);
  const payload = item.extra_fields as ReportPayload;

  const dateRange = `${formatDateShort(payload.period_start)} – ${formatDateShort(payload.period_end)}`;

  const featureLabels = payload.included_features
    .map((f) => t(`reports:reports.features.${f}`))
    .join(", ");

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onHide={onHide}
      typeIcon={
        <FileBarChart size={20} color={"#cbd5e1"} />
      }
      typeName={t("feed:feed.card.types.report")}
      statsContent={
        <View>
          <AppText
            className={`text-sm ${"text-slate-400"}`}
          >
            {dateRange}
          </AppText>
          <AppText
            className={`mt-1 ${"text-slate-300"}`}
          >
            {featureLabels}
          </AppText>
          <AppText>{" "}</AppText>
        </View>
      }
    />
  );
}
