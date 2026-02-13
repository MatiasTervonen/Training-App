"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/components/spinner";

export default function ResendButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 w-full cursor-pointer text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-linear-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition-all duration-200"
        disabled={pending}
      >
        {pending ? "Resending..." : "Resend Verification Email"}
        {pending && <Spinner />}
      </button>
    </>
  );
}
