import { Activity, Ellipsis, SquareArrowOutUpRight } from "lucide-react-native";
import { View, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import DropdownMenu from "../DropdownMenu";
import { formatDate } from "@/lib/formatDate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { activity_session } from "@/types/models";
import { getFullActivitySession } from "@/database/activities/get-full-activity-session";

type Props = {
  item: activity_session;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function ActivityCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const queryClient = useQueryClient();
  const cached = queryClient.getQueryData(["fullActivitySession", item.id]);

  const { data } = useQuery<activity_session>({
    queryKey: ["fullActivitySession", item.id],
    queryFn: () => getFullActivitySession(item.id),
    enabled: !!cached,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return (
    <View
      className={`
       border rounded-md flex-col justify-between transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200`
           : "bg-slate-700 border-gray-100"
       }`}
    >
      <View className="flex-row justify-between items-center mt-2 mx-4">
        <AppText
          className={`flex-1 mr-8 underline text-lg  ${
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

      <View className="flex-row justify-between items-center mt-2 bg-black/40 rounded-b-md">
        <View className="flex-row items-center gap-4">
          <View className="pl-2">
            <Activity size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          </View>
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            Activity
          </AppText>

          <View>
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {formatDate(item.created_at)}
            </AppText>
          </View>
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            {formatDuration(item.duration!)}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => {
            onExpand();
          }}
          className="bg-blue-500 p-2 rounded-br-md"
        >
          <SquareArrowOutUpRight size={20} color="#f3f4f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
