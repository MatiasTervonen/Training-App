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
  if (data.type === "feed_like") {
    return {
      pathname: "/dashboard",
      params: {
        feedMode: "friends",
        ...(data.feedItemId ? { feedItemId: data.feedItemId as string } : {}),
      },
    } as Href;
  }
  if (data.type === "feed_comment" || data.type === "feed_reply") {
    return {
      pathname: "/dashboard",
      params: {
        feedMode: "friends",
        ...(data.feedItemId
          ? {
              feedItemId: data.feedItemId as string,
              openComments: "true",
            }
          : {}),
      },
    } as Href;
  }
  return null;
}
