import { formatDate } from "@/lib/formatDate";
import DropdownMenu from "@/components/DropdownMenu";
import { Dumbbell, Ellipsis } from "lucide-react-native";
import AppText from "../AppText";
import { View, Pressable } from "react-native";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
};

type Props = {
  item: templateSummary;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function TemplateCard({
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  return (
      <View className="border border-gray-700 rounded-md justify-center bg-slate-900 mb-10">
        <View className="flex-row justify-between items-center my-4 mx-4">
          <AppText
            className="mr-8 text-lg flex-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </AppText>
          <DropdownMenu
            button={<Ellipsis size={20} color="#f3f4f6" />}
            onEdit={onEdit}
            onDelete={onDelete}
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
