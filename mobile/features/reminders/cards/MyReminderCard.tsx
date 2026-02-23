import {
  formatDateShort,
  formatDate,
  formatDateTime,
  formatNotifyTime,
} from "@/lib/formatDate";
import { Bell, SquareArrowOutUpRight } from "lucide-react-native";
import AppText from "@/components/AppText";
import { View, Pressable } from "react-native";
import DropDownModal from "@/components/DropDownModal";
import { full_reminder } from "@/types/session";
import { useTranslation } from "react-i18next";

type Props = {
  item: full_reminder;
  onDelete: (index: number) => void;
  onExpand: () => void;
  onEdit: (index: number) => void;
  index: number;
};

export default function MyReminderCard({
  index,
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  const { t } = useTranslation("reminders");

  const days = [
    t("reminders.days.sun"),
    t("reminders.days.mon"),
    t("reminders.days.tue"),
    t("reminders.days.wed"),
    t("reminders.days.thu"),
    t("reminders.days.fri"),
    t("reminders.days.sat"),
  ];

  return (
    <View className="border border-gray-700 rounded-md justify-between bg-slate-900 mb-10 h-[129.5px]">
      <View className="flex-col justify-between flex-1">
        <View className="flex-row justify-between items-center  mt-2 mx-4">
          <AppText
            className="mr-8 text-lg flex-1 underline"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </AppText>
          <DropDownModal
            label={`${item.title}`}
            options={[
              { value: "edit", label: t("reminders.edit") },
              { value: "delete", label: t("reminders.delete") },
            ]}
            onChange={(value) => {
              switch (value) {
                case "edit":
                  onEdit(index);
                  break;
                case "delete":
                  onDelete(index);
                  break;
                default:
                  break;
              }
            }}
          />
        </View>

        <View className="flex-row items-center gap-2 ml-4">
          {item.type === "one-time" ? (
            <AppText className="text-center">
              {formatDateTime(item.notify_date!)}
            </AppText>
          ) : item.type === "global" ? (
            <AppText className="text-center">
              {formatDateTime(item.notify_at!)}
            </AppText>
          ) : (
            <AppText className="text-center">
              {formatNotifyTime(item.notify_at_time!)}
            </AppText>
          )}
          <Bell size={18} color="#f3f4f6" />
          {item.weekdays && item.weekdays.length > 0 && (
            <AppText className="text-center ml-2">
              {item.weekdays.map((day) => days[day - 1]).join(", ")}
            </AppText>
          )}
        </View>

        {item.updated_at ? (
          <AppText className="ml-4 text-yellow-500 text-sm mb-1">
            {t("common:updated")} {formatDate(item.updated_at!)}
          </AppText>
        ) : (
          <View className="h-[17.8px]" />
        )}
      </View>
      <Pressable
        aria-label="Expand reminder"
        onPress={onExpand}
        className="flex-row items-center gap-5 justify-between px-5 bg-blue-600 p-2 rounded-b-md "
      >
        <AppText className="text-gray-100 text-sm">
          {formatDateShort(item.created_at)}
        </AppText>
        <SquareArrowOutUpRight size={20} color="#f3f4f6" />
      </Pressable>
    </View>
  );
}
