"use client";

import { useSWRConfig } from "swr";
import { useEffect } from "react";

export function GetSWRCache() {
  const { cache } = useSWRConfig();

  useEffect(() => {
    const feedCache = cache.get("/api/feed");
    console.log(" SWR /api/feed cache:", feedCache);
  }, [cache]);

  return null;
}
