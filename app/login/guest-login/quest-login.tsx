"use client";

import { russoOne } from "../../ui/fonts";
import Spinner from "@/app/(app)/components/spinner";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { useTransition } from "react";
import { guestLogin } from "./action";
import { useState } from "react";

export default function GuestLogIn() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className={`${russoOne.className} flex flex-col items-center justify-center`}
    >
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await guestLogin();
            if (!result.success) {
              setError(result.message);
            }
          })
        }
        className={`${russoOne.className} w-[250px] flex items-center justify-center  gap-2 px-5 text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
        disabled={isPending}
      >
        {isPending && <Spinner />}
        <span className="inline-block text-center ">
          {isPending ? "Logging in..." : "Log in as a Guest"}
        </span>
      </button>
      <div className="h-6">
        {error && (
          <p className="text-red-500 pt-5 text-center text-sm">{error}</p>
        )}
      </div>
      {isPending && <FullScreenLoader message="Logging in as guest..." />}
    </div>
  );
}
