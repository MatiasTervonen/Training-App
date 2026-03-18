import { useState, useCallback, useMemo } from "react";
import {
  View,
  Pressable,
  Modal,
  SectionList,
  Dimensions,
} from "react-native";
import {
  Bell,
  UserPlus,
  UserCheck,
  BellRing,
  Heart,
  MessageCircle,
  Reply,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useUnreadCount } from "@/features/notifications/hooks/useUnreadCount";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useMarkAsRead } from "@/features/notifications/hooks/useMarkAsRead";
import { useMarkAllAsRead } from "@/features/notifications/hooks/useMarkAllAsRead";
import { getTimeAgo } from "@/features/notifications/utils/timeAgo";
import { groupByTimePeriod } from "@/features/notifications/utils/groupByTimePeriod";
import { Notification } from "@/types/models";
import BodyText from "@/components/BodyText";

function getNotificationIcon(type: string) {
  switch (type) {
    case "friend_request":
      return <UserPlus size={18} color="#3b82f6" />;
    case "friend_accepted":
      return <UserCheck size={18} color="#22c55e" />;
    case "feed_like":
      return <Heart size={18} color="#ef4444" />;
    case "feed_comment":
      return <MessageCircle size={18} color="#3b82f6" />;
    case "feed_reply":
      return <Reply size={18} color="#8b5cf6" />;
    default:
      return <BellRing size={18} color="#9ca3af" />;
  }
}

function getNavigationTarget(
  notification: Notification,
): { pathname: string; params?: Record<string, string> } | null {
  switch (notification.type) {
    case "friend_request":
    case "friend_accepted":
      return { pathname: "/menu/friends" };
    case "feed_like":
      return {
        pathname: "/dashboard",
        params: {
          feedMode: "friends",
          ...(notification.data?.feedItemId
            ? { feedItemId: notification.data.feedItemId as string }
            : {}),
        },
      };
    case "feed_comment":
    case "feed_reply":
      return {
        pathname: "/dashboard",
        params: {
          feedMode: "friends",
          ...(notification.data?.feedItemId
            ? {
                feedItemId: notification.data.feedItemId as string,
                openComments: "true",
              }
            : {}),
        },
      };
    default:
      return null;
  }
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation("notifications");
  const router = useRouter();

  const { data: unreadCount } = useUnreadCount();
  const { data: notifications } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const screenWidth = Math.min(Dimensions.get("window").width, 768);

  const sections = useMemo(
    () => groupByTimePeriod(notifications ?? [], t),
    [notifications, t],
  );

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.is_read) {
        markAsRead.mutate(notification.id);
      }
      setIsOpen(false);

      const target = getNavigationTarget(notification);
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
        className={`mb-2 p-2 bg-gray-800 rounded-md ${
          !item.is_read ? "border border-blue-500/30" : ""
        }`}
      >
        <AppText className="text-gray-400 text-sm mb-1">
          {getTimeAgo(item.created_at, t)}
        </AppText>
        <View className="flex-row items-center gap-2 text-sm">
          {getNotificationIcon(item.type)}
          <BodyText className="text-gray-100 text-sm flex-1">
            {item.body}
          </BodyText>
          {!item.is_read && (
            <View className="w-2 h-2 rounded-full bg-blue-500" />
          )}
        </View>
      </AnimatedButton>
    ),
    [handleNotificationPress, t],
  );

  const renderEmpty = useCallback(
    () => (
      <AppText className="text-gray-400 text-center py-4">
        {t("notifications.empty")}
      </AppText>
    ),
    [t],
  );

  return (
    <View>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="w-[40px] h-[40px] rounded-full border-2 border-blue-500 items-center justify-center"
      >
        <Bell size={20} color="white" />
        {unreadCount != null && unreadCount > 0 && (
          <View className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center z-50">
            <AppText className="text-gray-100 text-[10px] font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </AppText>
          </View>
        )}
      </Pressable>

      <Modal
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
        transparent
        animationType="fade"
      >
        <Pressable
          className="flex-1"
          onPress={() => setIsOpen(false)}
        >
          <View
            className="mt-28 self-end mr-4 border-2 border-blue-500 rounded-md bg-slate-950 shadow-lg"
            style={{ width: screenWidth * 0.85, maxHeight: 450 }}
          >
            <Pressable onPress={() => {}}>
              <View className="p-4">
                <View className="flex-row items-center gap-2 mb-4 justify-center">
                  <AppText className="text-gray-100 text-lg">
                    {t("notifications.title")}
                  </AppText>
                  <Bell size={20} color="#f3f4f6" />
                </View>
                {unreadCount != null && unreadCount > 0 && (
                  <AnimatedButton
                    onPress={handleMarkAllAsRead}
                    className="mb-3"
                  >
                    <AppText className="text-blue-400 text-sm text-center">
                      {t("notifications.markAllAsRead")}
                    </AppText>
                  </AnimatedButton>
                )}
                <SectionList
                  sections={sections}
                  keyExtractor={(item) => item.id}
                  renderItem={renderNotification}
                  renderSectionHeader={({ section }) => (
                    <View className="py-1.5">
                      <AppText className="text-xs font-bold text-gray-400 uppercase">
                        {section.title}
                      </AppText>
                    </View>
                  )}
                  ListEmptyComponent={renderEmpty}
                  style={{ maxHeight: 340 }}
                />
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
