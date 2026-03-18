import { formatDate, formatDateShort } from "@/lib/formatDate";
import { Dumbbell, SquareArrowOutUpRight } from "lucide-react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { View } from "react-native";
import DropDownModal from "@/components/DropDownModal";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "@/components/buttons/animatedButton";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
};

type Props = {
  item: templateSummary;
  onDelete: (index: number) => void;
  onExpand: () => void;
  onEdit: (index: number) => void;
  index: number;
};

export default function TemplateCard({
  index,
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  const { t } = useTranslation(["gym", "common"]);

  return (
    <LinearGradient
      colors={["rgba(59,130,246,0.12)", "rgba(59,130,246,0.04)"]}
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
          {item.name}
        </AppText>
        <DropDownModal
          label={item.name}
          options={[
            { value: "edit", label: t("common:common.edit") },
            { value: "delete", label: t("common:common.delete") },
          ]}
          onChange={(value) => {
            switch (value) {
              case "edit":
                onEdit(index);
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

      {/* Updated timestamp */}
      <View className="px-4 pb-2">
        <BodyText className={`text-sm ${item.updated_at ? "text-slate-400" : "text-transparent"}`}>
          {item.updated_at
            ? `${t("common:common.updated")} ${formatDate(item.updated_at)}`
            : " "}
        </BodyText>
      </View>

      {/* Footer - type, date, details */}
      <View className="flex-row items-center justify-between bg-slate-900/40 px-4 py-2">
        <View className="flex-row items-center gap-2">
          <Dumbbell size={20} color="#cbd5e1" />
          <AppText className="text-slate-400 text-sm">
            {t("gym:gym.TemplatesScreen.templateType")}
          </AppText>
          <AppText className="text-slate-500 text-sm">·</AppText>
          <AppText className="text-slate-400 text-sm">
            {formatDateShort(item.created_at)}
          </AppText>
        </View>
        <AnimatedButton
          onPress={onExpand}
          className="flex-row items-center gap-2"
          hitSlop={15}
        >
          <SquareArrowOutUpRight size={18} color="#64748b" />
          <AppText className="text-slate-500 text-sm">
            {t("gym:gym.TemplatesScreen.details")}
          </AppText>
        </AnimatedButton>
      </View>
    </LinearGradient>
  );
}
