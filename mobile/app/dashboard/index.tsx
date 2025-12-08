import SessionFeed from "@/components/feed/SessionFeed";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

export default function FeedScreen() {
  console.log("FeedScreen mounted");

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
