"use client";

import Link from "next/link";
import InstallApp from "@/app/components/installApp";
import { Menu, CircleX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useClickOutside } from "@/app/(app)/components/clickOutside";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string; platform: string }>;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

function isIosSafari(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari =
    /safari/.test(userAgent) && !/crios|fxios|chrome|edge/.test(userAgent);
  return isIos && isSafari;
}

function isInStandaloneMode(): boolean {
  return (
    "standalone" in navigator &&
    (navigator as NavigatorStandalone).standalone === true
  );
}

export default function Navbar() {
  const [deferredPromt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (isIosSafari() && isInStandaloneMode()) {
      setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const installRef = useRef<HTMLDivElement>(null);

  useClickOutside(installRef, () => setIsOpen(false));

  return (
    <nav className="flex justify-between items-center px-5 py-3 text-gray-100">
      <div className="text-3xl py-5">
        <Link href={"/"}>MyTrack</Link>
      </div>
      <div className="hidden md:flex items-center gap-4">
        <Link href={"/login"}>
          <button className="text-white bg-gradient-to-tr from-slate-950  to-blue-700 px-5 py-2 rounded-xl border-2 border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200">
            Log in / Sign up
          </button>
        </Link>
        <div>
          <InstallApp
            deferredPrompt={deferredPromt}
            showIosPrompt={showIosPrompt}
            setDeferredPrompt={setDeferredPrompt}
          />
        </div>
      </div>
      <div className="md:hidden">
        <div className="relative w-10 h-10">
          <button
            onClick={() => setIsOpen(true)}
            className={`absolute inset-0 ${isOpen ? "hidden" : "block"}`}
          >
            <Menu className="text-gray-100" size={40} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`absolute inset-0 z-50 ${isOpen ? "block" : "hidden"}`}
          >
            <CircleX className="text-gray-100" size={40} />
          </button>
        </div>
        {isOpen && (
          <div
            ref={installRef}
            className="absolute left-1/2 -translate-x-1/2 top-20 w-full bg-slate-950 p-4 shadow-lg text-gray-100 z-50 border-y-2 border-blue-500"
          >
            <div className="flex flex-col items-center gap-4 my-5">
              <Link href={"/login"}>
                <button className="text-white bg-gradient-to-tr from-slate-950  to-blue-700 px-5 py-2 rounded-xl border-2 border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200">
                  Log in / Sign up
                </button>
              </Link>
              <div>
                <InstallApp
                  deferredPrompt={deferredPromt}
                  showIosPrompt={showIosPrompt}
                  setDeferredPrompt={setDeferredPrompt}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
