"use client";

import { useModalPageConfig } from "../lib/stores/modalPageConfig";
import ModalPageWrapper from "./modalPageWrapper";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <ModalPageWrapper {...(modalPageConfig || {})}>
        {children}
      </ModalPageWrapper>
    </QueryClientProvider>
  );
}
