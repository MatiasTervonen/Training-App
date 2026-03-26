import SessionFeed from "@/features/feed/SessionFeed";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

export default function FeedScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { setModalPageConfig } = useModalPageConfig();
  const { reminderId, feedMode, feedItemId, openComments } =
    useLocalSearchParams<{
      reminderId?: string;
      feedMode?: "my" | "friends";
      feedItemId?: string;
      openComments?: string;
    }>();

  useEffect(() => {
    setModalPageConfig({
      leftLabel: t("navbar.menu"),
      rightLabel: t("navbar.sessions"),
      onSwipeLeft: () => router.push("/sessions"),
      onSwipeRight: () => router.push("/menu"),
    });
    return () => setModalPageConfig(null);
  }, [router, setModalPageConfig, t]);

  return (
    <>
      <SessionFeed
        expandReminderId={reminderId}
        initialFeedMode={feedMode}
        initialCommentFeedItemId={
          openComments === "true" ? feedItemId : undefined
        }
      />
    </>
  );
}
