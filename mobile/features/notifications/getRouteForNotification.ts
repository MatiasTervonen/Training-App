import { Href } from "expo-router";

export function getRouteForNotification(
  data: Record<string, unknown> | undefined,
): Href | null {
  if (!data?.type) return null;
  if (data.type === "friend_request" || data.type === "friend_accepted") {
    return "/menu/friends";
  }
  if (data.type === "habit") {
    return "/habits";
  }
  if (
    data.type === "feed_like" ||
    data.type === "feed_comment" ||
    data.type === "feed_reply"
  ) {
    return "/";
  }
  return null;
}
