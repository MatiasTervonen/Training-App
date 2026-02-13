"use client";

import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import ModalPageWrapper from "@/components/modalPageWrapper";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { modalPageConfig, setModalPageConfig } = useModalPageConfig();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (pathname !== "/dashboard") {
      setModalPageConfig(null);
    }
  }, [pathname, setModalPageConfig]);

  return (
    <ModalPageWrapper {...(modalPageConfig || {})}>{children}</ModalPageWrapper>
  );
}
