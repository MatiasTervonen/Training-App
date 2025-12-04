"use client";

import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { guestLogin } from "./action";
import { useState, useTransition } from "react";

export default function GuestLogIn() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await guestLogin();
            if (!result.success) {
              setError(result.message ?? "Login failded");
            }
          })
        }
        className="flex items-center justify-center gap-2 px-10 text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-linear-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200 cursor-pointer"
        disabled={isPending}
      >
        <span>Log in as a Guest</span>
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
