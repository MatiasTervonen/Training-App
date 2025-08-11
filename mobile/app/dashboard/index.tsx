import ModalPageWrapper from "@/components/ModalPageWrapper";
import { useRouter } from "expo-router";
import SessionFeed from "@/components/SessionFeed";

export default function FeedScreen() {
  const router = useRouter();

  return (
    <ModalPageWrapper
      onSwipeLeft={() => router.push("/sessions")}
      rightLabel="Sessions"
      onSwipeRight={() => router.push("/menu")}
      leftLabel="Menu"
    >
      <SessionFeed />
    </ModalPageWrapper>
  );
}
