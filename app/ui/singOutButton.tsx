"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/spinner";
import { createClient } from "@/utils/supabase/client";
import { russoOne } from "@/app/ui/fonts";
import { LogOut } from "lucide-react";

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
          <LogOut />
          <p>Sign out</p>
        </div>
      )}
    </button>
  );
}
