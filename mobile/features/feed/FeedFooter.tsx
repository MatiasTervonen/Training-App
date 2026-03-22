import { View, ActivityIndicator } from "react-native";
import BodyText from "@/components/BodyText";
import { FeedData } from "@/types/session";
import { useTranslation } from "react-i18next";

export default function FeedFooter({
  isFetchingNextPage,
  hasNextPage,
  data,
}: {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  data: FeedData;
}) {
  const { t } = useTranslation("feed");

  if (isFetchingNextPage) {
    return (
      <View className="items-center justify-center gap-2">
        <BodyText className="text-center text-lg">
          {t("feed.loadingMore")}
        </BodyText>
        <ActivityIndicator size="large" color="#193cb8" className="my-5" />
      </View>
    );
  }

  if (hasNextPage) {
    return <View className="h-20" />;
  }

  return null;
}
