"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LinkButton from "../(app)/ui/LinkButton";

export default function EmailVerified() {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(10);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (cooldown <= 0) {
      if (isMobile) {
        window.location.href = "mytrack://";
      } else {
        router.replace("/login");
      }
      return;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [router, cooldown]);

  return (
    <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 text-gray-100 text-lg px-2">
      <div className="flex flex-col items-center justify-center gap-10 max-w-xl border-2 py-10 px-5 sm:px-10 rounded-xl bg-slate-900 shadow-lg">
        <h1 className="text-2xl ">MyTrack</h1>
        <h2 className="text-green-400">Email Verified Successfully</h2>
        <p className="text-center">
          Your email has been successfully verified. Redirection to login page
          in<span className="inline-block w-10 text-center">{cooldown}</span>
          seconds...
        </p>
        <LinkButton href="/login">Log in</LinkButton>
      </div>
    </div>
  );
}
