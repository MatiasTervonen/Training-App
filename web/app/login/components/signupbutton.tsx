"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/app/(app)/components/spinner";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";

export default function SingupButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-gradient-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200"
        disabled={pending}
      >
        {pending && <Spinner />}
        {pending ? "Signing up..." : "Sing up"}
      </button>
      {pending && <FullScreenLoader message="Signing up..." />}
    </>
  );
}
