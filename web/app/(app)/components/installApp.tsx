"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string; platform: string }>;
}

export default function InstallApp({
  promptEvent,
}: {
  promptEvent: BeforeInstallPromptEvent | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const pathname = usePathname();

  const handleInstallClick = async () => {
    if (promptEvent) {
      promptEvent.prompt();
    }
  };

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

  useEffect(() => {
    if (isIosSafari() && isInStandaloneMode()) {
      setShowIosPrompt(true);
    }
  }, []);

  return (
    <>
      {promptEvent && (
        <button
          className={`${
            pathname === "/menu"
              ? "w-full py-2 px-6 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-105"
              : "w-[183px] bg-gradient-to-tr from-slate-950  to-blue-700 py-2 px-4 rounded-xl border-2 border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200 cursor-pointer"
          } `}
          onClick={handleInstallClick}
        >
          <div className="flex gap-2 items-center justify-center">
            <Image src="/Mobile.png" alt="Mobile" width={23} height={23} />
            <p>Download app</p>
          </div>
        </button>
      )}

      {showIosPrompt && (
        <div className="relative inline-block">
          <button
            className="bg-gradient-to-tr from-slate-950  to-blue-700 py-2 px-4 rounded-xl border-2 border-blue-900 shadow-md shadow-blue-950 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200 cursor-pointer"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <div className="flex gap-2 items-center">
              <Image
                src="/Mobile.png"
                alt="Mobile"
                width={23}
                height={23}
                priority
              />
              <p>Download app</p>
            </div>
          </button>
          {expanded && (
            <div
              onClick={() => setExpanded(false)}
              className="absolute left-1/2 -translate-x-1/2 md:-left-10 bg-slate-800 p-4 rounded-lg mt-2 w-max shadow-lg"
            >
              <p className="text-gray-300 mb-2">
                Tap the <span className="">Share</span> button in Safari, then
                choose
              </p>
              <span className="text-gray-400">
                &quot;Add to Home Screen&quot;
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
