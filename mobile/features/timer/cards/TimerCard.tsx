import { formatDate, formatDurationLong } from "@/lib/formatDate";
import { timers } from "@/types/models";
import { View } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import EditButton from "@/components/buttons/EditButton";
import PageContainer from "@/components/PageContainer";
import { TimerIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type Props = {
  item: timers;
  onDelete: () => void;
  onEdit: () => void;
  onStarTimer: () => void;
};

export default function TimerCard({
  item,
  onDelete,
  onEdit,
  onStarTimer,
}: Props) {
  const { t } = useTranslation("common");

  return (
    <PageContainer className="justify-between">
      <View>
        <AppText className="text-sm text-gray-300  text-center">
          {t("common.created")} {formatDate(item.created_at)}
        </AppText>
        {item.updated_at && (
          <AppText className="text-sm text-gray-400 mt-2 text-center">
            {t("common.updated")} {formatDate(item.updated_at)}
          </AppText>
        )}
        <View className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
          <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
            {item.title}
          </AppText>
          <View className="bg-orange-900/50 border border-orange-500/30 px-6 py-2 rounded-md mx-auto flex-row items-center gap-4">
            <TimerIcon size={20} color="#fb923c" />
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
        <SaveButton onPress={onStarTimer} label={t("common.start")} />
        <EditButton onPress={onEdit} label={t("common.edit")} />
        <DeleteButton onPress={onDelete} label={t("common.delete")} />
      </View>
    </PageContainer>
  );
}
