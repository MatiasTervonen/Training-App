"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SaveButtonSpinner from "@/app/(app)/ui/save-button-spinner";

export default function ClientSearch() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const type = searchParams.get("type");

  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!type || !redirectUrl) {
      router.replace("/error");
      return;
    }

    switch (type) {
      case "recovery":
        setMessage(
          "To keep your account secure, please click the button below to reset your password."
        );
        setTitle("Reset Your Password");
        setButtonText("Continue to reset password");
        break;
      case "email":
        setMessage(
          "To complete your sign-in, please click the button below to verify your email address."
        );
        setTitle("Verify Your Email Address");
        setButtonText("Continue to verify email");
        break;
      default:
        router.replace("/error");
        return;
    }

    setIsReady(true);
  }, [type, redirectUrl, router]);

  const handleClick = () => {
    setLoading(true);
    router.replace(redirectUrl!);
  };

  if (!isReady) return null;

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-10 max-w-xl border-2 py-10 px-5 sm:px-10 rounded-xl bg-slate-900 shadow-lg w-full">
        <h1 className="text-2xl ">MyTrack</h1>
        <h2 className="text-green-400">{title}</h2>
        <p className="text-center">{message}</p>
        <SaveButtonSpinner
          onClick={handleClick}
          label={loading ? "Redirecting..." : buttonText}
          loading={loading}
        />
      </div>
    </>
  );
}
