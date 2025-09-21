"use client";

import { SWRConfig, SWRConfiguration } from "swr";

export default function SWRProvider({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: SWRConfiguration["fallback"];
}) {

  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}
