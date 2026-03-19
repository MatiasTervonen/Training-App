import { formatDate, formatDateShort } from "@/lib/formatDate";
import { Activity, SquareArrowOutUpRight } from "lucide-react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { View } from "react-native";
import DropDownModal from "@/components/DropDownModal";
import { templateSummary } from "@/types/session";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "@/components/buttons/animatedButton";
import BodyTextNC from "@/components/BodyTextNC";

type Props = {
  item: templateSummary;
  onDelete: (index: number) => void;
  onExpand: () => void;
  onEdit: (index: number) => void;
  onHistory: () => void;
  index: number;
};

export default function ActivityTemplateCard({
  index,
  item,
  onDelete,
  onExpand,
  onEdit,
  onHistory,
}: Props) {
  const { t } = useTranslation(["activities", "common"]);

  const translatedActivityName = item.activity.slug
    ? t(`activities:activities.activityNames.${item.activity.slug}`, { defaultValue: "" }) || item.activity.name
    : item.activity.name;

  return (
    <LinearGradient
      colors={["rgba(34,197,94,0.12)", "rgba(34,197,94,0.04)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="border border-slate-700 rounded-md overflow-hidden"
    >
      {/* Header - title + menu */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-1">
        <AppText
          className="flex-1 mr-4 text-lg"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.template.name}
        </AppText>
        <DropDownModal
          label={item.template.name}
          options={[
            { value: "edit", label: t("activities:activities.templatesScreen.edit") },
            { value: "history", label: t("activities:activities.templatesScreen.history") },
            { value: "delete", label: t("activities:activities.templatesScreen.delete") },
          ]}
          onChange={(value) => {
            switch (value) {
              case "edit":
                onEdit(index);
                break;
              case "history":
                onHistory();
                break;
              case "delete":
                onDelete(index);
                break;
              default:
                break;
            }
          }}
        />
      </View>

      {/* Activity name + updated timestamp */}
      <View className="px-4 pb-2">
        {item.activity.name && (
          <BodyTextNC className="text-sm text-slate-400">
            {translatedActivityName}
          </BodyTextNC>
        )}
        <BodyTextNC className={`text-sm ${item.template.updated_at ? "text-slate-400" : "text-transparent"}`}>
          {item.template.updated_at
            ? `${t("common:common.updated")} ${formatDate(item.template.updated_at)}`
            : " "}
        </BodyTextNC>
      </View>

      {/* Footer - type, date, details */}
      <View className="flex-row items-center justify-between bg-slate-900/40 px-4 py-2">
        <View className="flex-row items-center gap-2">
          <Activity size={20} color="#cbd5e1" />
          <AppText className="text-slate-400 text-sm">
            {translatedActivityName}
          </AppText>
          <AppText className="text-slate-500 text-sm">·</AppText>
          <AppText className="text-slate-400 text-sm">
            {formatDateShort(item.template.created_at)}
          </AppText>
        </View>
        <AnimatedButton
          onPress={onExpand}
          className="flex-row items-center gap-2"
          hitSlop={15}
        >
          <SquareArrowOutUpRight size={18} color="#64748b" />
          <AppText className="text-slate-500 text-sm">
            {t("activities:activities.templatesScreen.start")}
          </AppText>
        </AnimatedButton>
      </View>
    </LinearGradient>
  );
}
