"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useUserStore } from "@/lib/stores/useUserStore";
import { clearLocalStorage } from "@/utils/clearLocalStorage";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function SignOutButton() {
  const { t } = useTranslation("menu");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();

  const logOutUser = useUserStore((state) => state.logoutUser);

  const handleSignOut = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      toast.error(t("menu.logoutError"));
      setIsLoading(false);
      return;
    }

    // Clear TanStack Query cache
    queryClient.clear();

    logOutUser();

    //  Clear localStorage
    clearLocalStorage();

    router.replace("/");
  };

  return (
    <>
      <button
        aria-label={t("menu.logOut")}
        onClick={handleSignOut}
        className="btn-base"
      >
        <div className="flex items-center gap-2 justify-center">
          <LogOut />
          <p>{t("menu.logOut")}</p>
        </div>
      </button>
      {isLoading && <FullScreenLoader message={t("menu.loggingOut")} />}
    </>
  );
}
