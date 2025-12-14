import SessionFeed from "@/components/feed/SessionFeed";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function FeedScreen() {
  const router = useRouter();
  const { setModalPageConfig } = useModalPageConfig();

  const activeSession = useTimerStore((state) => state.activeSession);

  useEffect(() => {
    setModalPageConfig({
      leftLabel: "Menu",
      rightLabel: "Sessions",
      onSwipeLeft: () => router.push("/sessions"),
      onSwipeRight: () => router.push("/menu"),
    });
  }, [router, setModalPageConfig, activeSession]);

  return (
    <>
      <SessionFeed />
    </>
  );
}
