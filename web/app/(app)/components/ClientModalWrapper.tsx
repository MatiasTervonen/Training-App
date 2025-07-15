"use client";

import { ReactNode } from "react";
import ModalPageWrapper from "./modalPageWrapper";
import { useRouter } from "next/navigation";

export default function ClientModalWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <ModalPageWrapper
      onSwipeLeft={() => router.push("/sessions")}
      rightLabel="Sessions"
      onSwipeRight={() => router.push("/menu")}
      leftLabel="Menu"
    >
      {children}
    </ModalPageWrapper>
  );
}
