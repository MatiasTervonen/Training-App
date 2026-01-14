import { formatDate, formatDurationLong } from "@/lib/formatDate";
import { timers } from "@/types/models";
import { View } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import PageContainer from "@/components/PageContainer";
import { TimerIcon } from "lucide-react-native";

type Props = {
  item: timers;
  onDelete: () => void;
  onEdit: () => void;
  onStarTimer: () => void;
};

export default function TimerCard({ item, onDelete, onStarTimer }: Props) {
  return (
    <PageContainer className="justify-between pb-5">
      <View>
        <AppText className="text-sm text-gray-300  text-center">
          created: {formatDate(item.created_at)}
        </AppText>
        {item.updated_at && (
          <AppText className="text-sm text-yellow-500 mt-2 text-center">
            updated: {formatDate(item.updated_at)}
          </AppText>
        )}
        <View className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
          <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
            {item.title}
          </AppText>
          <View className="bg-blue-900 px-6 py-2 rounded-md mx-auto flex-row items-center gap-4">
            <TimerIcon size={20} color="#f3f4f6" />
            <AppText className="text-center text-lg">
              {formatDurationLong(item.time_seconds)}
            </AppText>
          </View>
          {item.notes && (
            <AppText className="text-lg text-left my-10">{item.notes}</AppText>
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
