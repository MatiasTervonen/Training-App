"use client";

import { useFormStatus } from "react-dom";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";

export default function SingupButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        className="cursor-pointer text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-gradient-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition-all duration-200"
        disabled={pending}
      >
        Sign up
      </button>
      {pending && <FullScreenLoader message="Signing up..." />}
    </>
  );
}
