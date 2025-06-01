"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/app/components/spinner";
import { russoOne } from "@/app/ui/fonts";
import FullScreenLoader from "@/app/components/FullScreenLoader";

export default function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        className={`${russoOne.className} flex items-center justify-center gap-2 text-gray-100 font-bold border-2 border-blue-500 p-2 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
        disabled={pending}
      >
        {pending && <Spinner />}
        {pending ? "Logging in..." : "Log in"}
      </button>
      {pending && <FullScreenLoader message="Logging in..." />}
    </>
  );
}
