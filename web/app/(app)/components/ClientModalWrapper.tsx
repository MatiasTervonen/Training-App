"use client";

import { ReactNode } from "react";
import ModalPageWrapper from "./modalPageWrapper";
import { useRouter } from "next/navigation";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import toast from "react-hot-toast";

export default function ClientModalWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const { activeSession } = useTimerStore();

  return (
    <ModalPageWrapper
      onSwipeLeft={() => {
        if (activeSession) {
          toast.error(
            "You already have an active session. Finish it before starting a new one."
          );
          return;
        }
        router.push("/sessions");
      }}
      rightLabel="Sessions"
      onSwipeRight={() => router.push("/menu")}
      leftLabel="Menu"
    >
      {children}
    </ModalPageWrapper>
  );
}
