import { formatDate } from "@/lib/formatDate";
import { timers } from "@/types/models";
import { View } from "react-native";
import AppText from "../AppText";
import SaveButton from "../SaveButton";
import DeleteButton from "../DeleteButton";
import { Delete, Save } from "lucide-react-native";

type Props = {
  item: timers;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
  onStarTimer: () => void;
};

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function TimerCard({ item, onDelete, onStarTimer }: Props) {
  return (
    <View className="pb-10 w-full">
      <AppText className="text-lg text-gray-400 mt-5 text-center">
        {formatDate(item.created_at)}
      </AppText>
      <AppText className="my-5 text-xl break-words text-center">
        {item.title}
      </AppText>
      <View className="whitespace-pre-wrap break-words overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-md mt-5">
        <AppText className="bg-slate-700 text-center px-6 py-2 rounded-md mx-auto text-lg">
          {formatSeconds(item.time_seconds)}
        </AppText>
        <AppText className="mt-5 mb-2 text-center">{item.notes}</AppText>
      </View>

      <View className="mt-10 gap-4">
        <SaveButton onPress={onStarTimer} label="Start"/>
        <DeleteButton onPress={onDelete} label="Delete" />
      </View>
    </View>
  );
}
