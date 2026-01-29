import { ListTodo, Check } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "./BaseFeedCard";

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
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<ListTodo size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />}
      typeName={"To-Do"}
      statsContent={
        <>
          <View className="flex-row gap-2 items-center">
            <AppText
              className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              completed: {payload.completed} / {payload.total}
            </AppText>
            {payload.completed === payload.total && <Check color="#22c55e" />}
          </View>
        </>
      }
      showUpdatedAt={true}
    />
  );
}
