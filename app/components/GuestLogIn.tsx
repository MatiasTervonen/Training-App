"use client";

import { russoOne } from "../ui/fonts";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/spinner";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function GuestLogIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    const supabase = createClient();

    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "guest@example.com",
      password: "guest12345",
    });

    if (error && !data) {
      console.error("Guest login failed:", error);
    } else {
      console.log("Guest login successful");
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div
      className={`${russoOne.className} flex flex-col rounded-xl border bg-slate-900 p-5 h-full relative text-gray-100`}
    >
      <h1 className="text-xl text-center mb-4">Guest Login</h1>
      <p className="text-center mb-6">
        Use this account to explore the app without signing up.
      </p>
      <button
        onClick={handleGuestLogin}
        className="flex items-center justify-center gap-2 text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95"
        disabled={isLoading}
      >
        {isLoading && <Spinner />}
        {isLoading ? "Logging in..." : "Log in"}
      </button>
    </div>
  );
}
