"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/spinner";
import { createClient } from "@/utils/supabase/client";
import { russoOne } from "@/app/ui/fonts";

export default function SignOutButton({
  onSignOut,
}: {
  onSignOut?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    if (onSignOut) onSignOut();

    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();
    setIsLoading(false);

    if (error) {
      console.error("Error signing out:", error.message);
      return;
    }

    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className={`${russoOne.className} p-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 `}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 justify-center">
          <Spinner />
          <p>Singing out...</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
          <p>Sign out</p>
        </div>
      )}
    </button>
  );
}
