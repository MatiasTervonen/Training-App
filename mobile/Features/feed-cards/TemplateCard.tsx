import { formatDate } from "@/lib/formatDate";
import { Dumbbell } from "lucide-react-native";
import AppText from "@/components/AppText";
import { View, Pressable } from "react-native";
import DropDownModal from "@/components/DropDownModal";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");

  return (
    <View className="border border-gray-700 rounded-md justify-center bg-slate-900 mb-10">
      <View className="flex-row justify-between items-center my-2 mx-4">
        <AppText
          className="mr-8 text-lg flex-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </AppText>
        <DropDownModal
          label={`${item.name}`}
          options={[
            { value: "edit", label: t("common.edit") },
            { value: "delete", label: t("common.delete") },
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

      {item.updated_at ? (
        <AppText className=" text-yellow-500 text-sm ml-4 mb-2">
          {t("common.updated")} {formatDate(item.updated_at)}
        </AppText>
      ) : (
        <View className="h-[17.8px]" />
      )}

      <Pressable
        onPress={onExpand}
        className="flex-row items-center justify-between px-5 bg-blue-600 py-2 rounded-br-md rounded-bl-md "
      >
        <AppText className=" text-gray-200">
          {formatDate(item.created_at)}
        </AppText>

        <View className="flex-row items-center gap-5">
          <AppText>{t("common.start")}</AppText>
          <Dumbbell size={20} color="#f3f4f6" />
        </View>
      </Pressable>
    </View>
  );
}
