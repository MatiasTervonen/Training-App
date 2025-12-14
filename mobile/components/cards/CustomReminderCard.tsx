import {
  Ellipsis,
  SquareArrowOutUpRight,
  Bell,
  Check,
} from "lucide-react-native";
import { formatDate, formatDateTime, formatNotifyTime } from "@/lib/formatDate";
import { View, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import DropdownMenu from "../DropdownMenu";
import { customReminders } from "@/types/models";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import GetFullCustomReminder from "@/database/reminders/get-full-custom-reminder";
import { full_reminder } from "@/types/session";

type Props = {
  item: customReminders;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function CustomReminderCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const queryClient = useQueryClient();
  const cached = queryClient.getQueryData(["fullCustomReminder", item.id]);

  const { data: fullCustomReminder } = useQuery<full_reminder>({
    queryKey: ["fullCustomReminder", item.id],
    queryFn: () => GetFullCustomReminder(item.id),
    enabled: !!cached,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const weekdays = fullCustomReminder?.weekdays;

  return (
    <View
      className={`
       border rounded-md flex-col justify-between transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200`
           : "bg-slate-700 border-gray-100"
       }`}
    >
      <View className="flex-col justify-between flex-1">
        <View className="flex-row justify-between items-center mt-2 mx-4">
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
            button={
              <Ellipsis size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
            }
            pinned={pinned}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
          />
        </View>

        <View className="ml-4 mr-5 flex-row items-center gap-2">
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            {item.notify_at_time
              ? formatNotifyTime(item.notify_at_time!)
              : formatDateTime(item.notify_date!)}
          </AppText>
          {item.delivered ? (
            <Check size={30} color="#4ade80" />
          ) : (
            <Bell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          )}
          {weekdays && weekdays.length > 0 && (
            <AppText
              className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {weekdays.map((dayNum) => days[dayNum - 1]).join(", ")}
            </AppText>
          )}
        </View>

        {item.updated_at ? (
          <AppText
            className={`text-sm ml-4 mb-1 ${
              pinned ? "text-slate-900" : "text-yellow-500"
            } `}
          >
            updated at: {formatDate(item.updated_at!)}
          </AppText>
        ) : (
          <View className="h-[17.8px]" />
        )}
      </View>
      <View className="flex-row justify-between items-center bg-black/40 rounded-b-md">
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
