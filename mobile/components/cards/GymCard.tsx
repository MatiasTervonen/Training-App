import { Dumbbell, Ellipsis, SquareArrowOutUpRight } from "lucide-react-native";
import { View, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import DropdownMenu from "../DropdownMenu";
import { formatDate } from "@/lib/formatDate";
import { gym_sessions, full_gym_session } from "../../types/models";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";

type Props = {
  item: gym_sessions;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function GymCard({
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
  const cached = queryClient.getQueryData(["fullGymSession", item.id]);

  const { data: fullGym } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", item.id],
    queryFn: () => getFullGymSession(item.id),
    enabled: !!cached,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const totalExercises = fullGym ? fullGym.gym_session_exercises.length : 0;

  const totalSets = fullGym
    ? fullGym.gym_session_exercises.reduce(
        (sum, exercise) => sum + exercise.gym_sets.length,
        0,
      )
    : 0;

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

      {fullGym && (
        <View className="flex-row">
          <AppText
            className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
          >
            Exercises: {totalExercises}
          </AppText>
          <AppText
            className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
          >
            Sets: {totalSets}
          </AppText>
        </View>
      )}

      <View className="flex-row justify-between items-center mt-2 bg-black/40 rounded-b-md">
        <View className="flex-row items-center gap-4">
          <View className="pl-2">
            <Dumbbell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          </View>
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            Gym
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
