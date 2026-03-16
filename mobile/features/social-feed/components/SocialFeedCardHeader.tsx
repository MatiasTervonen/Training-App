import { View, Image } from "react-native";
import AppText from "@/components/AppText";
import { SocialFeedItem } from "@/types/social-feed";
import { ReactNode } from "react";

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}w`;
}

type Props = {
  item: SocialFeedItem;
  typeIcon?: ReactNode;
};

export default function SocialFeedCardHeader({ item, typeIcon }: Props) {
  return (
    <View className="flex-row items-center gap-3 px-4 pt-4 pb-3">
      {item.author_profile_picture ? (
        <Image
          source={{ uri: item.author_profile_picture }}
          className="w-10 h-10 rounded-full bg-slate-600"
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-slate-600 items-center justify-center">
          <AppText className="text-base text-gray-300">
            {item.author_display_name?.charAt(0)?.toUpperCase() ?? "?"}
          </AppText>
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <AppText numberOfLines={1}>
          {item.author_display_name}
        </AppText>
        {typeIcon && (
          <View className="flex-row items-center gap-1.5">
            {typeIcon}
          </View>
        )}
      </View>
      <AppText className="text-gray-400 text-sm">
        {getRelativeTime(item.created_at)}
      </AppText>
    </View>
  );
}
