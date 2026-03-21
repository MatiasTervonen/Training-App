"use client";

import { ReactNode } from "react";
import ModalPageWrapper from "@/components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { useTimerStore } from "@/lib/stores/timerStore";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function ClientModalWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation("gym");

  const { activeSession } = useTimerStore();

  return (
    <ModalPageWrapper
      onSwipeLeft={() => {
        if (activeSession) {
          toast.error(
            `${t("gym.activeSessionError")} ${t("gym.activeSessionErrorSub")}`
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
