import { formatDate } from "@/lib/formatDate";
import { Activity } from "lucide-react-native";
import AppText from "@/components/AppText";
import { View, Pressable } from "react-native";
import DropDownModal from "@/components/DropDownModal";
import { templateSummary } from "@/types/session";

type Props = {
  item: templateSummary;
  onDelete: (index: number) => void;
  onExpand: () => void;
  onEdit: (index: number) => void;
  index: number;
};

export default function ActivityTemplateCard({
  index,
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  return (
    <View className="border border-gray-700 rounded-md justify-center bg-slate-900 mb-10">
      <View className="flex-row justify-between items-center my-2 mx-4">
        <AppText
          className="mr-8 text-lg flex-1 underline"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.template.name}
        </AppText>
        <DropDownModal
          label={`${item.template.name}`}
          options={[
            { value: "edit", label: "Edit" },
            { value: "delete", label: "Delete" },
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
      {item.activity.name && (
        <AppText className="ml-4 ">{item.activity.name}</AppText>
      )}

      {item.template.updated_at ? (
        <AppText className=" text-yellow-500 text-sm ml-4 my-2">
          updated: {formatDate(item.template.updated_at)}
        </AppText>
      ) : (
        <View className="h-[17.8px]" />
      )}

      <Pressable
        onPress={onExpand}
        className="flex-row items-center justify-between px-5 bg-blue-600 py-2 rounded-br-md rounded-bl-md "
      >
        <AppText className=" text-gray-200">
          {formatDate(item.template.created_at)}
        </AppText>

        <View className="flex-row items-center gap-5">
          <AppText>start</AppText>
          <Activity size={20} color="#f3f4f6" />
        </View>
      </Pressable>
    </View>
  );
}
