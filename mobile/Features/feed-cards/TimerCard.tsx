import { formatDate } from "@/lib/formatDate";
import { timers } from "@/types/models";
import { View } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import PageContainer from "@/components/PageContainer";

type Props = {
  item: timers;
  onDelete: () => void;
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
    <PageContainer className="w-full justify-between flex-1 pb-5">
      <View>
        <AppText className="text-sm text-gray-400  text-center">
          created: {formatDate(item.created_at)}
        </AppText>
        <AppText className="my-5 text-xl break-words text-center">
          {item.title}
        </AppText>
        <View className="whitespace-pre-wrap break-words overflow-hidden text-left bg-slate-900 p-4 rounded-md shadow-md mt-5">
          <AppText className="bg-slate-700 text-center px-6 py-2 rounded-md mx-auto text-lg">
            {formatSeconds(item.time_seconds)}
          </AppText>
          {item.notes && (
            <AppText className="mt-5 mb-2 text-center">{item.notes}</AppText>
          )}
        </View>
      </View>

      <View className="mt-10 gap-4">
        <SaveButton onPress={onStarTimer} label="Start" />
        <DeleteButton onPress={onDelete} label="Delete" />
      </View>
    </PageContainer>
  );
}
