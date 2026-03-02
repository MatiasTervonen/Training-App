import { useCallback } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { UserPlus, UserCheck, BellRing } from "lucide-react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useMarkAsRead } from "@/features/notifications/hooks/useMarkAsRead";
import { useMarkAllAsRead } from "@/features/notifications/hooks/useMarkAllAsRead";
import { useUnreadCount } from "@/features/notifications/hooks/useUnreadCount";
import { getTimeAgo } from "@/features/notifications/utils/timeAgo";
import { Notification } from "@/types/models";

const REFRESH_COLORS = ["#3b82f6"];

function getNotificationIcon(type: string) {
  switch (type) {
    case "friend_request":
      return <UserPlus size={20} color="#3b82f6" />;
    case "friend_accepted":
      return <UserCheck size={20} color="#22c55e" />;
    default:
      return <BellRing size={20} color="#9ca3af" />;
  }
}

function getNavigationTarget(type: string): string | null {
  switch (type) {
    case "friend_request":
    case "friend_accepted":
      return "/menu/friends";
    default:
      return null;
  }
}

function NotificationSeparator() {
  return <View className="h-px bg-slate-700/50 mx-4" />;
}

export default function NotificationsScreen() {
  const { t } = useTranslation("notifications");
  const router = useRouter();

  const { data: notifications, isLoading, refetch } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.is_read) {
        markAsRead.mutate(notification.id);
      }

      const target = getNavigationTarget(notification.type);
      if (target) {
        router.push(target as never);
      }
    },
    [markAsRead, router],
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <AnimatedButton
        onPress={() => handleNotificationPress(item)}
        className={`flex-row items-start gap-3 px-4 py-3 ${
          !item.is_read ? "bg-slate-800/50" : ""
        }`}
      >
        <View className="mt-0.5">{getNotificationIcon(item.type)}</View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <AppText className="text-sm font-bold flex-1">
              {item.title}
            </AppText>
            {!item.is_read && (
              <View className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </View>
          <AppText className="text-sm text-gray-400 mt-0.5">
            {item.body}
          </AppText>
          <AppText className="text-xs text-gray-500 mt-1">
            {getTimeAgo(item.created_at, t)}
          </AppText>
        </View>
      </AnimatedButton>
    ),
    [handleNotificationPress, t],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <BellRing size={48} color="#4b5563" />
        <AppText className="text-gray-500 mt-4 text-base">
          {t("notifications.empty")}
        </AppText>
      </View>
    );
  }, [isLoading, t]);

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-700">
        <AppText className="text-xl font-bold">
          {t("notifications.title")}
        </AppText>
        {unreadCount != null && unreadCount > 0 && (
          <AnimatedButton
            onPress={handleMarkAllAsRead}
            className="btn-neutral px-3 py-1.5"
          >
            <AppText className="text-sm text-blue-400">
              {t("notifications.markAllAsRead")}
            </AppText>
          </AnimatedButton>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#3b82f6"
            colors={REFRESH_COLORS}
          />
        }
        ItemSeparatorComponent={NotificationSeparator}
      />
    </View>
  );
}
