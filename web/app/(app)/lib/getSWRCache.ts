"use client";

import { useSWRConfig } from "swr";
import { useEffect } from "react";
import { getFeedKey } from "./feedKeys";
import { unstable_serialize } from "swr/infinite";

export function GetSWRCache() {
  const { cache } = useSWRConfig();

  useEffect(() => {
    const feedKey = unstable_serialize(getFeedKey); 
    const feedCache = cache.get(feedKey);

    console.log("SWR /api/feed cache key:", feedKey);
    console.log("SWR /api/feed cache value:", feedCache);
  }, [cache]);

  return null;
}
