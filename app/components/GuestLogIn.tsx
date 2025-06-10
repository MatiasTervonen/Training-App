"use client";

import { russoOne } from "../ui/fonts";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/spinner";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import FullScreenLoader from "./FullScreenLoader";

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
      router.push("/");
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={handleGuestLogin}
        className={`${russoOne.className} flex flex-col w-[250px] items-center justify-center gap-2 px-5 text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
        disabled={isLoading}
      >
        {isLoading && <Spinner />}
        <span className="inline-block text-center ">
          {isLoading ? "Logging in..." : "Explore as a Guest (limited access)"}
        </span>
      </button>
      {isLoading && <FullScreenLoader message="Logging in as guest..." />}
    </>
  );
}
