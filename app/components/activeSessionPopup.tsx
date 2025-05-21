"use client";

import { useEffect, useState } from "react";
import { russoOne } from "@/app/ui/fonts";
import Link from "next/link";
import Timer from "./timer";
import { SquareArrowRight } from "lucide-react";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
  sessionId: string;
};

export default function ActiveSessionPopup() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );

  useEffect(() => {
    const stored = localStorage.getItem("activeSession");

    console.log(
      "ActiveSession loaded from localStorage:",
      localStorage.getItem("activeSession")
    );

    if (!stored) return;

    const parsed = JSON.parse(stored);
    console.log("Setting activeSession:", parsed);
    setActiveSession(parsed);
  }, []);

  if (!activeSession) return null; // Don't render anything if there's no active session

  return (
    <div className="flex flex-row justify-between items-center text-center bg-gray-300 py-4 sticky top-0 z-10 border-2 border-green-500">
      <div className="ml-10">
        <p className={`${russoOne.className} pb-2 text-start ml-2`}>
          {activeSession.label}
        </p>
        <div className={`${russoOne.className} text-slate-900 text-start`}>
          <Timer sessionId={activeSession.type} />
        </div>
      </div>
      <div className="mr-5">
        <Link href={activeSession.path}>
          <SquareArrowRight size={40} />
        </Link>
      </div>
    </div>
  );
}
