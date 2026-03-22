"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getClaims().then(({ data }) => {
      const sub = data?.claims?.sub;
      if (typeof sub === "string") setUserId(sub);
    });
  }, []);

  return userId;
}
