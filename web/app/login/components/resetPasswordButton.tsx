"use client";

import { useFormStatus } from "react-dom";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { useState, useEffect } from "react";

export default function ResetPasswordButton() {
  const { pending } = useFormStatus();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (pending) {
      setCooldown(60);
    }
  }, [pending]);

  return (
    <>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 w-full cursor-pointer text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-gradient-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition-all duration-200"
        disabled={pending || cooldown > 0}
      >
        {pending ? (
          "Sending..."
        ) : cooldown > 0 ? (
          <>
            Resend in
            <span className="inline-block w-8 text-center">{cooldown}</span>s
          </>
        ) : (
          "Send Reset Link"
        )}
      </button>
      {pending && <FullScreenLoader message="Sending reset link..." />}
    </>
  );
}
