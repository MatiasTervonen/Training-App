import {
  ListTodo,
  Ellipsis,
  SquareArrowOutUpRight,
  Check,
} from "lucide-react-native";
import DropdownMenu from "@/components/DropdownMenu";
import { formatDate } from "@/lib/formatDate";
import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { FeedCardProps } from "@/types/session";

type todoPayload = {
  completed: number;
  total: number;
};

export default function TodoCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const payload = item.extra_fields as todoPayload;

  return (
    <View
      className={`
       border rounded-md flex-col justify-between transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200 text-slate-900`
           : "bg-slate-700 border-gray-100"
       }`}
    >
      <View className="justify-between flex-1">
        <View className="flex-row justify-between items-center mt-2 mx-4">
          <AppText
            className={`flex-1 mr-8 underline text-lg ${
              pinned ? "text-slate-900 border-slate-900" : "text-gray-100"
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </AppText>
          <DropdownMenu
            button={
              <Ellipsis size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
            }
            pinned={pinned}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
          />
        </View>

        <View className="flex-row gap-2 items-center">
          <AppText
            className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
          >
            completed: {payload.completed} / {payload.total}
          </AppText>
          {payload.completed === payload.total && <Check color="#22c55e" />}
        </View>

        {item.updated_at ? (
          <AppText
            className={`text-sm ml-4 min-h-5 ${
              pinned ? "text-slate-900" : "text-yellow-500"
            } `}
          >
            updated: {formatDate(item.updated_at!)}
          </AppText>
        ) : (
          <AppText className="min-h-5 invisible"></AppText>
        )}
      </View>

      <View className="flex-row justify-between items-center mt-2 bg-black/40 rounded-b-md">
        <View className="flex-row items-center gap-4">
          <View className="pl-2">
            <ListTodo size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          </View>
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            Todo
          </AppText>

          <View>
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {formatDate(item.created_at)}
            </AppText>
          </View>
        </View>

        <AnimatedButton
          onPress={onExpand}
          className="bg-blue-500 p-2 rounded-br-md"
        >
          <SquareArrowOutUpRight size={20} color="#f3f4f6" />
        </AnimatedButton>
      </View>
    </View>
  );
}
