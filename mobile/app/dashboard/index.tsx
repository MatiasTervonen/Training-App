import SessionFeed from "@/components/SessionFeed";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import ActiveSessionPopup from "@/components/ActiveSessionPopup";

export default function FeedScreen() {
  const router = useRouter();
  const { setModalPageConfig } = useModalPageConfig();
  const { activeSession } = useTimerStore();

  useEffect(() => {
    setModalPageConfig({
      leftLabel: "Menu",
      rightLabel: "Sessions",
      onSwipeLeft: () => {
        if (activeSession) {
          Alert.alert(
            "You already have an active session. Finish it before starting a new one."
          );
          return;
        }
        router.push("/sessions");
      },
      onSwipeRight: () => router.push("/menu"),
    });
  }, [router, setModalPageConfig, activeSession]);

  return (
    <>
      <ActiveSessionPopup />
      <SessionFeed />
    </>
  );
}
