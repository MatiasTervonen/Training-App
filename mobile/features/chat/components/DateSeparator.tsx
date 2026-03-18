import { memo } from "react";
import { View } from "react-native";
import BodyText from "@/components/BodyText";
import { useTranslation } from "react-i18next";

type DateSeparatorProps = {
  dateString: string;
};

function formatDateLabel(dateString: string, t: (key: string) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const localDate = date.toLocaleDateString("en-CA");
  const todayStr = now.toLocaleDateString("en-CA");

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  if (localDate === todayStr) return t("chat.today");
  if (localDate === yesterdayStr) return t("chat.yesterday");

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function DateSeparator({ dateString }: DateSeparatorProps) {
  const { t } = useTranslation("chat");

  return (
    <View className="items-center py-3">
      <View className="bg-slate-800 rounded-full px-3 py-1">
        <BodyText className="text-xs text-slate-400">
          {formatDateLabel(dateString, t)}
        </BodyText>
      </View>
    </View>
  );
}

export default memo(DateSeparator);
