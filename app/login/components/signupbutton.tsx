"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/app/(app)/components/spinner";
import { russoOne } from "@/app/ui/fonts";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";

export default function SingupButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        className={`${russoOne.className} flex items-center justify-center gap-2 text-gray-100 font-bold border-2 border-blue-500 p-2 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
        disabled={pending}
      >
        {pending && <Spinner />}
        {pending ? "Signing up..." : "Sing up"}
      </button>
      {pending && <FullScreenLoader message="Signing up..." />}
    </>
  );
}
