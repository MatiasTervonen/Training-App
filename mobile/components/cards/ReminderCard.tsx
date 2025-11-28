import {
  Ellipsis,
  SquareArrowOutUpRight,
  Bell,
  Check,
  Dot,
} from "lucide-react-native";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { View, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import DropdownMenu from "../DropdownMenu";
import { reminders } from "@/types/models";

type Props = {
  item: reminders;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function ReminderCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  return (
    <View
      className={`
       border rounded-md flex-col justify-between mb-10 transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200`
           : "bg-slate-700 border-gray-100"
       }`}
    >
      <View className="flex-row justify-between items-center mt-2 mb-4 mx-4">
        <AppText
          className={`flex-1 mr-8 underline text-lg ${
            pinned
              ? "text-slate-900 border-slate-900"
              : "text-gray-100 border-gray-100"
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </AppText>

        <DropdownMenu
          button={<Ellipsis size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />}
          pinned={pinned}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      </View>

      <View className="ml-4 mb-4 mr-5 flex-row items-center gap-2">
        <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
          {formatDateTime(item.notify_at!)}
        </AppText>
        {item.delivered ? (
          <Check size={30} color="#4ade80" />
        ) : (
          <Bell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
        )}
      </View>

      <View className="flex-row items-center ml-4 ">
        <AppText
          className={`text-sm  ${
            pinned ? "text-slate-900" : "text-yellow-500"
          } `}
        >
          updated at: {formatDate(item.updated_at!)}
        </AppText>
      </View>

      <View className="flex-row justify-between items-center mt-2 bg-black/40 rounded-b-md">
        <View className="flex-row items-center gap-4">
          <View className="pl-2">
            <Bell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          </View>
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            Reminder
          </AppText>

          <View>
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {formatDate(item.created_at)}
            </AppText>
          </View>
        </View>
        <TouchableOpacity
          onPress={onExpand}
          className="bg-blue-500 p-2 rounded-br-md"
        >
          <SquareArrowOutUpRight size={20} color="#f3f4f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
