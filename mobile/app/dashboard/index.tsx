import SessionFeed from "@/features/feed/SessionFeed";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

export default function FeedScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { setModalPageConfig } = useModalPageConfig();
  const { reminderId } = useLocalSearchParams<{ reminderId?: string }>();

  useEffect(() => {
    setModalPageConfig({
      leftLabel: t("navbar.menu"),
      rightLabel: t("navbar.sessions"),
      onSwipeLeft: () => router.push("/sessions"),
      onSwipeRight: () => router.push("/menu"),
    });
  }, [router, setModalPageConfig, t]);

  return (
    <>
      <SessionFeed expandReminderId={reminderId} />
    </>
  );
}
