"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import LinkButton from "@/app/(app)/ui/LinkButton";

export default function MenuContext() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const role = user.app_metadata?.role;
        if (role === "admin" || role === "super_admin") {
          setIsAdmin(true);
        }
      }
    };
    checkRole();
  }, [supabase.auth]);

  return <>{isAdmin && <LinkButton href={"/admin"}>Admin panel</LinkButton>}</>;
}
