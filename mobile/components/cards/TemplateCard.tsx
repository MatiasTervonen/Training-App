import { formatDate } from "@/lib/formatDate";
import { Dumbbell } from "lucide-react-native";
import AppText from "../AppText";
import { View, Pressable } from "react-native";
import DropDownModal from "../DropDownModal";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
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
  return (
    <View className="border border-gray-700 rounded-md justify-center bg-slate-900 mb-10">
      <View className="flex-row justify-between items-center mb-4 mt-2 mx-4">
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
      <AppText className="ml-4 mb-2 text-gray-400 text-sm">
        created at {formatDate(item.created_at)}
      </AppText>
      <Pressable
        aria-label="Expand gym session"
        onPress={onExpand}
        className="flex-row items-center gap-5 justify-center  px-5 bg-blue-600 text-gray-100 p-2 rounded-br-md rounded-bl-md "
      >
        <AppText>start</AppText>
        <Dumbbell size={20} color="#f3f4f6" />
      </Pressable>
    </View>
  );
}
