"use client";

import { useFormStatus } from "react-dom";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";

export default function ResetPasswordButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 w-full cursor-pointer text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-gradient-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200"
        disabled={pending}
      >
        Send Reset Link
      </button>
      {pending && <FullScreenLoader message="Sending reset link..." />}
    </>
  );
}
