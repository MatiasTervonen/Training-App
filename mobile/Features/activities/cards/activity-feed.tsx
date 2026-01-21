import { Activity, Ellipsis, SquareArrowOutUpRight } from "lucide-react-native";
import { View, TouchableOpacity } from "react-native";
import AppText from "@/components/AppText";
import DropdownMenu from "@/components/DropdownMenu";
import { formatDate, formatMeters, formatDuration } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";

type activityPayload = {
  duration: number;
  distance: number;
};
export default function ActivityCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const payload = item.extra_fields as activityPayload;

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

      {payload.distance > 0 && (
        <View>
          <AppText
            className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
          >
            {formatMeters(payload.distance)}
          </AppText>
        </View>
      )}

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
            {formatDuration(payload.duration)}
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
