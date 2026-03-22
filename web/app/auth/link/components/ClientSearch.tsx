"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SaveButtonSpinner from "@/components/buttons/save-button-spinner";
import { APP_NAME } from "@/lib/app-config";

const TYPE_CONFIG = {
  recovery: {
    message: "To keep your account secure, please click the button below to reset your password.",
    title: "Reset Your Password",
    buttonText: "Continue to reset password",
  },
  email: {
    message: "To complete your sign-in, please click the button below to verify your email address.",
    title: "Verify Your Email Address",
    buttonText: "Continue to verify email",
  },
} as const;

export default function ClientSearch() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const type = searchParams.get("type");
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!type || !redirectUrl || !(type in TYPE_CONFIG)) {
      router.replace("/error");
    }
  }, [type, redirectUrl, router]);

  const config = type && type in TYPE_CONFIG ? TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] : null;

  if (!config || !redirectUrl) return null;

  const { message, title, buttonText } = config;

  const handleClick = () => {
    setLoading(true);
    router.replace(redirectUrl);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-10 max-w-xl border-[1.5px] py-10 px-5 sm:px-10 rounded-xl bg-slate-900 shadow-lg w-full">
        <h1 className="text-2xl ">{APP_NAME}</h1>
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
