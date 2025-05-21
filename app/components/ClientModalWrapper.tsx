"use client";

import { ReactNode } from "react";
import ModalPageWrapper from "./modalPageWrapper";

export default function ClientModalWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <ModalPageWrapper>{children}</ModalPageWrapper>;
}